
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        window.location.href = "/login.html";
        return;
    }

    const surplusList = document.getElementById("surplusList");
    const messageBox = document.getElementById("surplusMessage");
    const requestForm = document.getElementById("requestForm");

    const requestModal = new bootstrap.Modal(
        document.getElementById("requestModal")
    );

    const canRequest = user.role === "staff";

    document.getElementById("userInfo").textContent =
        `${user.name} | ${user.role}`;

    if (user.role !== "admin") {
        document.getElementById("adminNavItem").style.display = "none";
    }

    document.getElementById("logoutButton").addEventListener("click", () => {
        clearAuth(); window.location.href = "/login.html";
    });

    let surplusMedicines = [];

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "alert d-none";
    }

    function formatDate(dateValue) {
        if (!dateValue) return "N/A";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getFacilityName(medicine) {
        const facility = medicine.facility;

        if (!facility) return "Other facility";

        if (typeof facility === "string") {
            return "Other facility";
        }

        return `${facility.name || "Healthcare facility"}${
            facility.city ? `, ${facility.city}` : ""
        }`;
    }

    function getMedicineArray(response) {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.medicines)) return response.medicines;
        if (Array.isArray(response.data)) return response.data;
        return [];
    }

    function createTextElement(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text ?? "";
        return element;
    }

    function renderSurplus(items) {
        surplusList.innerHTML = "";

        document.getElementById("surplusCount").textContent =
            `${items.length} available batch${items.length === 1 ? "" : "es"}`;

        if (items.length === 0) {
            const column = document.createElement("div");
            column.className = "col-12";

            const card = document.createElement("div");
            card.className = "card border-0 shadow-sm";

            const body = document.createElement("div");
            body.className = "card-body text-center py-5";

            body.appendChild(
                createTextElement(
                    "h3",
                    "h5 mb-2",
                    "No surplus medicines available"
                )
            );

            body.appendChild(
                createTextElement(
                    "p",
                    "text-muted mb-0",
                    "There are currently no matching surplus batches at other facilities."
                )
            );

            card.appendChild(body);
            column.appendChild(card);
            surplusList.appendChild(column);

            return;
        }

        items.forEach((medicine) => {
            const column = document.createElement("div");
            column.className = "col-12 col-md-6 col-xl-4";

            const card = document.createElement("div");
            card.className = "card h-100 border-0 shadow-sm";

            const body = document.createElement("div");
            body.className = "card-body p-4";

            body.appendChild(
                createTextElement("h3", "h5 mb-1", medicine.name)
            );

            body.appendChild(
                createTextElement(
                    "small",
                    "text-muted d-block mb-3",
                    `Batch: ${medicine.batchNumber || "N/A"}`
                )
            );

            const facility = document.createElement("div");
            facility.className = "mb-3";

            facility.appendChild(
                createTextElement("small", "text-muted d-block", "Supplying facility")
            );

            facility.appendChild(
                createTextElement("p", "mb-0 fw-medium", getFacilityName(medicine))
            );

            body.appendChild(facility);

            const details = document.createElement("div");
            details.className = "row g-3 mb-3";

            const quantityColumn = document.createElement("div");
            quantityColumn.className = "col-6";

            quantityColumn.appendChild(
                createTextElement("small", "text-muted d-block", "Available surplus")
            );

            quantityColumn.appendChild(
                createTextElement(
                    "p",
                    "h4 mb-0",
                    String(medicine.surplusQuantity ?? 0)
                )
            );

            const expiryColumn = document.createElement("div");
            expiryColumn.className = "col-6";

            expiryColumn.appendChild(
                createTextElement("small", "text-muted d-block", "Expiry date")
            );

            expiryColumn.appendChild(
                createTextElement(
                    "p",
                    "fw-semibold mb-0",
                    formatDate(medicine.expiryDate)
                )
            );

            details.append(quantityColumn, expiryColumn);
            body.appendChild(details);

            const divider = document.createElement("hr");
            divider.className = "my-3";
            body.appendChild(divider);

            if (canRequest) {
                const requestButton = document.createElement("button");

                requestButton.type = "button";
                requestButton.className = "btn btn-primary-custom w-100";
                requestButton.textContent = "Request medicine";

                requestButton.addEventListener("click", () => {
                    openRequestModal(medicine);
                });

                body.appendChild(requestButton);
            } else {
                body.appendChild(
                    createTextElement(
                        "p",
                        "small text-muted mb-0",
                        "Only staff accounts can submit medicine requests."
                    )
                );
            }

            card.appendChild(body);
            column.appendChild(card);
            surplusList.appendChild(column);
        });
    }

    async function loadSurplus() {
        clearMessage();

        surplusList.innerHTML = `
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        Loading available medicines...
                    </div>
                </div>
            </div>
        `;

        try {
            const search = document
                .getElementById("searchInput")
                .value
                .trim();

            const days = document.getElementById("daysFilter").value;

            const filters = {};

            if (search) filters.q = search;
            if (days) filters.days = days;

            const response = await API.getSurplus(filters);

            surplusMedicines = getMedicineArray(response);

            renderSurplus(surplusMedicines);

        } catch (error) {
            surplusList.innerHTML = `
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center py-5 text-danger">
                            Unable to load surplus medicines.
                        </div>
                    </div>
                </div>
            `;

            showMessage(error.message || "Could not load surplus medicines.");
        }
    }

    function openRequestModal(medicine) {
        document.getElementById("requestMedicineId").value =
            medicine._id;

        document.getElementById("selectedMedicineName").textContent =
            `${medicine.name} (${medicine.batchNumber})`;

        document.getElementById("selectedFacilityName").textContent =
            getFacilityName(medicine);

        document.getElementById("selectedSurplus").textContent =
            String(medicine.surplusQuantity ?? 0);

        const quantityInput = document.getElementById("requestQuantity");

        quantityInput.value = "";
        quantityInput.max = medicine.surplusQuantity;

        document.getElementById("requestReason").value = "";

        requestModal.show();
    }

    requestForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!canRequest) {
            showMessage("Only staff members can submit medicine requests.");
            return;
        }

        const medicineId =
            document.getElementById("requestMedicineId").value;

        const quantity = Number(
            document.getElementById("requestQuantity").value
        );

        const reason = document
            .getElementById("requestReason")
            .value
            .trim();

        const medicine = surplusMedicines.find(
            (item) => item._id === medicineId
        );

        if (!medicine) {
            showMessage("Selected medicine could not be found.");
            return;
        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            quantity > Number(medicine.surplusQuantity)
        ) {
            showMessage(
                "Enter a valid quantity within the available surplus."
            );
            return;
        }

        const button = document.getElementById("submitRequestButton");

        button.disabled = true;
        button.textContent = "Submitting...";

        try {
            await API.createRequest({
                medicineId,
                quantity,
                reason
            });

            requestModal.hide();

            showMessage(
                "Medicine request submitted successfully.",
                "success"
            );

            requestForm.reset();

            await loadSurplus();

        } catch (error) {
            showMessage(error.message || "Unable to submit request.");

        } finally {
            button.disabled = false;
            button.textContent = "Submit request";
        }
    });

    document.getElementById("filterForm").addEventListener("submit", (event) => {
        event.preventDefault();
        loadSurplus();
    });

    document.getElementById("resetFilters").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("daysFilter").value = "";
        loadSurplus();
    });

    loadSurplus();
});
