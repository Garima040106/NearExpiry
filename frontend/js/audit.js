
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        window.location.href = "/login.html";
        return;
    }

    const tableBody = document.getElementById("auditTableBody");
    const messageBox = document.getElementById("auditMessage");

    document.getElementById("userInfo").textContent =
        `${user.name} | ${user.role}`;

    if (user.role !== "admin") {
        document.getElementById("adminNavItem").style.display = "none";
    }

    document.getElementById("logoutButton").addEventListener("click", () => {
        clearAuth();
        window.location.href = "/login.html";
    });

    let auditLogs = [];

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "alert d-none";
    }

    function getLogArray(response) {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.logs)) return response.logs;
        if (Array.isArray(response.auditLogs)) return response.auditLogs;
        if (Array.isArray(response.data)) return response.data;
        return [];
    }

    function getPersonName(person) {
        if (!person) return "N/A";
        if (typeof person === "string") return "User";
        return person.name || person.email || "User";
    }

    function getFacilityName(facility) {
        if (!facility) return "N/A";
        if (typeof facility === "string") return "Facility";
        return facility.name || "Facility";
    }

    function formatDate(value) {
        if (!value) return "N/A";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value ?? "N/A";
        return cell;
    }

    function createActionBadge(action) {
        const badge = document.createElement("span");
        badge.className = "badge";

        if (action === "Approved") {
            badge.classList.add("text-bg-success");
            badge.textContent = "Approved";
        } else if (action === "Rejected") {
            badge.classList.add("text-bg-danger");
            badge.textContent = "Rejected";
        } else {
            badge.classList.add("text-bg-primary");
            badge.textContent = "Created";
        }

        return badge;
    }

    function updateSummary(items) {
        const created = items.filter(
            (log) => log.action === "Created"
        ).length;

        const decisions = items.filter(
            (log) =>
                log.action === "Approved" ||
                log.action === "Rejected"
        ).length;

        document.getElementById("totalLogs").textContent = items.length;
        document.getElementById("createdLogs").textContent = created;
        document.getElementById("decisionLogs").textContent = decisions;
    }

    function renderLogs(items) {
        tableBody.innerHTML = "";

        document.getElementById("logCount").textContent =
            `${items.length} activit${items.length === 1 ? "y" : "ies"}`;

        updateSummary(auditLogs);

        if (items.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.className = "text-center py-5 text-muted";
            cell.textContent = "No audit records found.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        items.forEach((log) => {
            const row = document.createElement("tr");

            const actionCell = document.createElement("td");
            actionCell.appendChild(createActionBadge(log.action));
            row.appendChild(actionCell);

            const medicine = log.request?.medicine || {};

            row.appendChild(
                createCell(medicine.name || "Medicine")
            );

            row.appendChild(
                createCell(
                    log.request?._id
                        ? String(log.request._id).slice(-8)
                        : "N/A"
                )
            );

            row.appendChild(
                createCell(getPersonName(log.performedBy))
            );

            const facility =
                log.performedBy?.facility ||
                log.request?.supplyingFacility ||
                log.request?.requestingFacility;

            row.appendChild(
                createCell(getFacilityName(facility))
            );

            row.appendChild(
                createCell(log.note || "No additional details")
            );

            row.appendChild(
                createCell(formatDate(log.createdAt))
            );

            tableBody.appendChild(row);
        });
    }

    function applyFilters() {
        const search = document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

        const action =
            document.getElementById("actionFilter").value;

        const filtered = auditLogs.filter((log) => {
            const medicineName =
                (log.request?.medicine?.name || "").toLowerCase();

            const userName =
                getPersonName(log.performedBy).toLowerCase();

            const requestId =
                String(log.request?._id || "").toLowerCase();

            const note =
                (log.note || "").toLowerCase();

            const matchesSearch =
                medicineName.includes(search) ||
                userName.includes(search) ||
                requestId.includes(search) ||
                note.includes(search);

            const matchesAction =
                !action || log.action === action;

            return matchesSearch && matchesAction;
        });

        renderLogs(filtered);
    }

    async function loadAuditLogs() {
        clearMessage();

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    Loading audit logs...
                </td>
            </tr>
        `;

        try {
            const response = await API.getAuditLogs();

            auditLogs = getLogArray(response);

            applyFilters();

        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-danger">
                        Unable to load audit records.
                    </td>
                </tr>
            `;

            showMessage(error.message || "Could not load audit logs.");
        }
    }

    document.getElementById("filterForm").addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters();
    });

    document.getElementById("resetFilters").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("actionFilter").value = "";
        applyFilters();
    });

    loadAuditLogs();
});
