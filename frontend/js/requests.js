
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        window.location.href = "/login.html";
        return;
    }

    const tableBody = document.getElementById("requestsTableBody");
    const messageBox = document.getElementById("requestsMessage");

    const decisionModal = new bootstrap.Modal(
        document.getElementById("decisionModal")
    );

    const canDecide = user.role === "pharmacist";

    document.getElementById("userInfo").textContent =
        `${user.name} | ${user.role}`;

    if (user.role !== "admin") {
        document.getElementById("adminNavItem").style.display = "none";
    }

    if (!canDecide) {
        document.getElementById("actionHeader").style.display = "none";
    }

    document.getElementById("logoutButton").addEventListener("click", () => {
        clearAuth(); window.location.href = "/login.html";
    });

    let requests = [];

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "alert d-none";
    }

    function getRequestArray(response) {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.requests)) return response.requests;
        if (Array.isArray(response.data)) return response.data;
        return [];
    }

    function getFacilityName(facility) {
        if (!facility) return "N/A";
        if (typeof facility === "string") return "Facility";
        return facility.name || "Facility";
    }

    function getUserName(person) {
        if (!person) return "N/A";
        if (typeof person === "string") return "User";
        return person.name || person.email || "User";
    }

    function formatDate(value) {
        if (!value) return "N/A";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value ?? "N/A";
        return cell;
    }

    function createStatusBadge(status) {
        const badge = document.createElement("span");
        badge.className = "badge";

        if (status === "Approved") {
            badge.classList.add("text-bg-success");
        } else if (status === "Rejected") {
            badge.classList.add("text-bg-danger");
        } else {
            badge.classList.add("text-bg-warning");
        }

        badge.textContent = status || "Pending";
        return badge;
    }

    function updateSummary(items) {
        const pending = items.filter(
            (request) => request.status === "Pending"
        ).length;

        const decided = items.filter(
            (request) =>
                request.status === "Approved" ||
                request.status === "Rejected"
        ).length;

        document.getElementById("totalCount").textContent = items.length;
        document.getElementById("pendingCount").textContent = pending;
        document.getElementById("decidedCount").textContent = decided;
    }

    function renderRequests(items) {
        tableBody.innerHTML = "";

        document.getElementById("requestCount").textContent =
            `${items.length} request${items.length === 1 ? "" : "s"}`;

        updateSummary(requests);

        if (items.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 9;
            cell.className = "text-center py-5 text-muted";
            cell.textContent = "No requests found.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        items.forEach((request) => {
            const row = document.createElement("tr");

            const medicine = request.medicine || {};

            row.appendChild(createCell(medicine.name || "Medicine"));
            row.appendChild(createCell(medicine.batchNumber || "N/A"));
            row.appendChild(createCell(request.quantity));

            row.appendChild(
                createCell(getFacilityName(request.requestingFacility))
            );

            row.appendChild(
                createCell(getFacilityName(request.supplyingFacility))
            );

            row.appendChild(
                createCell(getUserName(request.requestedBy))
            );

            row.appendChild(createCell(formatDate(request.createdAt)));

            const statusCell = document.createElement("td");
            statusCell.appendChild(createStatusBadge(request.status));
            row.appendChild(statusCell);

            if (canDecide) {
                const actionCell = document.createElement("td");

                if (request.status === "Pending") {
                    const reviewButton = document.createElement("button");

                    reviewButton.type = "button";
                    reviewButton.className = "btn btn-sm btn-primary-custom";
                    reviewButton.textContent = "Review";

                    reviewButton.addEventListener("click", () => {
                        openDecisionModal(request);
                    });

                    actionCell.appendChild(reviewButton);
                } else {
                    actionCell.textContent = "Completed";
                }

                row.appendChild(actionCell);
            }

            tableBody.appendChild(row);
        });
    }

    function applyFilters() {
        const search = document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

        const status = document.getElementById("statusFilter").value;

        const filtered = requests.filter((request) => {
            const medicineName =
                (request.medicine?.name || "").toLowerCase();

            const batchNumber =
                (request.medicine?.batchNumber || "").toLowerCase();

            const matchesSearch =
                medicineName.includes(search) ||
                batchNumber.includes(search);

            const matchesStatus =
                !status || request.status === status;

            return matchesSearch && matchesStatus;
        });

        renderRequests(filtered);
    }

    async function loadRequests() {
        clearMessage();

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    Loading requests...
                </td>
            </tr>
        `;

        try {
            const response = await API.getRequests();

            requests = getRequestArray(response);

            applyFilters();

        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 text-danger">
                        Unable to load requests.
                    </td>
                </tr>
            `;

            showMessage(error.message || "Could not load requests.");
        }
    }

    function openDecisionModal(request) {
        document.getElementById("decisionRequestId").value =
            request._id;

        document.getElementById("decisionRequestDetails").textContent =
            `${request.quantity} units of ${
                request.medicine?.name || "medicine"
            } requested by ${
                getFacilityName(request.requestingFacility)
            }.`;

        document.getElementById("decisionReason").value = "";

        decisionModal.show();
    }

    async function submitDecision(decision) {
        if (!canDecide) {
            showMessage("Only pharmacists can decide requests.");
            return;
        }

        const requestId =
            document.getElementById("decisionRequestId").value;

        const reason = document
            .getElementById("decisionReason")
            .value
            .trim();

        if (!reason) {
            showMessage("Please provide a reason for your decision.");
            return;
        }

        const approveButton = document.getElementById("approveButton");
        const rejectButton = document.getElementById("rejectButton");

        approveButton.disabled = true;
        rejectButton.disabled = true;

        try {
            await API.decideRequest(requestId, {
                decision,
                reason
            });

            decisionModal.hide();

            showMessage(
                `Request ${decision.toLowerCase()} successfully.`,
                "success"
            );

            await loadRequests();

        } catch (error) {
            showMessage(error.message || "Unable to update request.");

        } finally {
            approveButton.disabled = false;
            rejectButton.disabled = false;
        }
    }

    document.getElementById("approveButton").addEventListener("click", () => {
        submitDecision("Approved");
    });

    document.getElementById("rejectButton").addEventListener("click", () => {
        submitDecision("Rejected");
    });

    document.getElementById("filterForm").addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters();
    });

    document.getElementById("resetFilters").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("statusFilter").value = "";
        applyFilters();
    });

    loadRequests();
});
