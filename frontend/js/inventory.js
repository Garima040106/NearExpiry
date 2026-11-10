
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        window.location.href = "/login.html";
        return;
    }

    const tableBody = document.getElementById("inventoryTableBody");
    const messageBox = document.getElementById("inventoryMessage");
    const medicineForm = document.getElementById("medicineForm");
    const medicineModalElement = document.getElementById("medicineModal");

    const medicineModal = new bootstrap.Modal(medicineModalElement);

    const isStaff = user.role === "staff";

    // Display current user.
    document.getElementById("userInfo").textContent =
        `${user.name} | ${user.role}`;

    // Show admin navigation only to admins.
    if (user.role !== "admin") {
        document.getElementById("adminNavItem").style.display = "none";
    }

    // Only staff can add, update or delete inventory.
    if (!isStaff) {
        document.getElementById("addMedicineButton").style.display = "none";
        document.getElementById("actionsHeader").style.display = "none";
    }

    document.getElementById("logoutButton").addEventListener("click", () => {
        clearAuth(); window.location.href = "/login.html";
    });

    let medicines = [];

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "alert d-none";
    }

    function getExpiryStatus(expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            return "Expired";
        }

        const daysRemaining = Math.ceil(
            (expiry - today) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 90) {
            return "Near Expiry";
        }

        return "Safe";
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

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text ?? "N/A";
        return cell;
    }

    function createStatusBadge(status) {
        const badge = document.createElement("span");
        badge.className = "badge";

        if (status === "Expired") {
            badge.classList.add("text-bg-danger");
        } else if (status === "Near Expiry") {
            badge.classList.add("text-bg-warning");
        } else {
            badge.classList.add("text-bg-success");
        }

        badge.textContent = status;
        return badge;
    }

    function renderInventory(items) {
        tableBody.innerHTML = "";

        document.getElementById("medicineCount").textContent =
            `${items.length} batch${items.length === 1 ? "" : "es"}`;

        if (items.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.className = "text-center py-5 text-muted";
            cell.textContent = "No medicines found.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        items.forEach((medicine) => {
            const row = document.createElement("tr");

            const status = medicine.status || getExpiryStatus(medicine.expiryDate);

            row.appendChild(createCell(medicine.name));
            row.appendChild(createCell(medicine.batchNumber));
            row.appendChild(createCell(medicine.quantity));
            row.appendChild(createCell(medicine.surplusQuantity ?? 0));
            row.appendChild(createCell(formatDate(medicine.expiryDate)));

            const statusCell = document.createElement("td");
            statusCell.appendChild(createStatusBadge(status));
            row.appendChild(statusCell);

            if (isStaff) {
                const actionsCell = document.createElement("td");
                actionsCell.className = "text-nowrap";

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "btn btn-sm btn-outline-secondary me-2";
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => {
                    openEditModal(medicine);
                });

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "btn btn-sm btn-outline-danger";
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => {
                    deleteMedicine(medicine._id);
                });

                actionsCell.append(editButton, deleteButton);
                row.appendChild(actionsCell);
            }

            tableBody.appendChild(row);
        });
    }

    function getMedicineArray(response) {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response.medicines)) return response.medicines;
        if (Array.isArray(response.data)) return response.data;
        return [];
    }

    async function loadInventory() {
        clearMessage();

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    Loading inventory...
                </td>
            </tr>
        `;

        try {
            const response = await API.getMedicines();
            medicines = getMedicineArray(response);
            applyFilters();

        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-danger">
                        Unable to load inventory.
                    </td>
                </tr>
            `;

            showMessage(error.message || "Could not load medicines.");
        }
    }

    function applyFilters() {
        const search = document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

        const selectedStatus =
            document.getElementById("statusFilter").value;

        const filtered = medicines.filter((medicine) => {
            const name = (medicine.name || "").toLowerCase();
            const batch = (medicine.batchNumber || "").toLowerCase();

            const matchesSearch =
                name.includes(search) || batch.includes(search);

            const status =
                medicine.status || getExpiryStatus(medicine.expiryDate);

            const matchesStatus =
                !selectedStatus || status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderInventory(filtered);
    }

    function resetForm() {
        medicineForm.reset();
        document.getElementById("medicineId").value = "";
        document.getElementById("medicineModalLabel").textContent =
            "Add medicine";
        document.getElementById("saveMedicineButton").textContent =
            "Save medicine";
    }

    function openEditModal(medicine) {
        resetForm();

        document.getElementById("medicineId").value = medicine._id;
        document.getElementById("medicineName").value = medicine.name || "";
        document.getElementById("batchNumber").value =
            medicine.batchNumber || "";
        document.getElementById("quantity").value = medicine.quantity ?? 0;

        if (medicine.expiryDate) {
            document.getElementById("expiryDate").value =
                new Date(medicine.expiryDate).toISOString().slice(0, 10);
        }

        document.getElementById("medicineModalLabel").textContent =
            "Edit medicine";
        document.getElementById("saveMedicineButton").textContent =
            "Update medicine";

        medicineModal.show();
    }

    document.getElementById("addMedicineButton").addEventListener("click", () => {
        resetForm();
    });

    medicineForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!isStaff) {
            showMessage("Only staff members can modify inventory.");
            return;
        }

        const medicineId =
            document.getElementById("medicineId").value;

        const medicineData = {
            name: document.getElementById("medicineName").value.trim(),
            batchNumber: document.getElementById("batchNumber").value.trim(),
            quantity: Number(document.getElementById("quantity").value),
            expiryDate: document.getElementById("expiryDate").value
        };

        if (
            !medicineData.name ||
            !medicineData.batchNumber ||
            !medicineData.expiryDate ||
            !Number.isInteger(medicineData.quantity) ||
            medicineData.quantity < 0
        ) {
            showMessage("Please enter valid medicine details.");
            return;
        }

        const saveButton =
            document.getElementById("saveMedicineButton");

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            if (medicineId) {
                await API.updateMedicine(medicineId, medicineData);
                showMessage("Medicine updated successfully.", "success");
            } else {
                await API.addMedicine(medicineData);
                showMessage("Medicine added successfully.", "success");
            }

            medicineModal.hide();
            resetForm();
            await loadInventory();

        } catch (error) {
            showMessage(error.message || "Unable to save medicine.");

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = medicineId
                ? "Update medicine"
                : "Save medicine";
        }
    });

    async function deleteMedicine(medicineId) {
        if (!isStaff) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this medicine batch?"
        );

        if (!confirmed) return;

        try {
            await API.deleteMedicine(medicineId);
            showMessage("Medicine deleted successfully.", "success");
            await loadInventory();

        } catch (error) {
            showMessage(error.message || "Unable to delete medicine.");
        }
    }

    document.getElementById("filterForm").addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters();
    });

    document.getElementById("resetFilters").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("statusFilter").value = "";
        applyFilters();
    });

    loadInventory();
});
