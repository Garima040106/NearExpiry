
/* =========================================
   NEAREXPIRY - ADMINISTRATION
========================================= */

// DOM elements
const userInfo = document.getElementById("userInfo");
const logoutButton = document.getElementById("logoutButton");
const adminMessage = document.getElementById("adminMessage");

const userTotal = document.getElementById("userTotal");
const facilityTotal = document.getElementById("facilityTotal");

const usersTableBody = document.getElementById("usersTableBody");
const facilitiesTableBody = document.getElementById("facilitiesTableBody");

const userSearch = document.getElementById("userSearch");

const userForm = document.getElementById("userForm");
const facilityForm = document.getElementById("facilityForm");

const userModalElement = document.getElementById("userModal");
const facilityModalElement = document.getElementById("facilityModal");

const userModal = new bootstrap.Modal(userModalElement);
const facilityModal = new bootstrap.Modal(facilityModalElement);

// Current user and application data
const currentUser = getCurrentUser();

let users = [];
let facilities = [];

// Escape HTML before displaying database values
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

// Show success or error messages
function showMessage(message, type = "success") {
    adminMessage.textContent = message;

    adminMessage.className = `alert alert-${type}`;
    adminMessage.classList.remove("d-none");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    setTimeout(() => {
        adminMessage.classList.add("d-none");
    }, 5000);
}

// Format dates
function formatDate(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Get user ID regardless of whether API returns id or _id
function getUserId(user) {
    return user._id || user.id;
}

// Get facility ID
function getFacilityId(facility) {
    if (!facility) return "";

    return typeof facility === "object"
        ? facility._id || facility.id || ""
        : facility;
}

// Check admin access before loading data
function checkAdminAccess() {
    if (!getToken() || !currentUser) {
        window.location.href = "/login.html";
        return false;
    }

    if (currentUser.role !== "admin") {
        showMessage(
            "Access denied. Only administrators can access this page.",
            "danger"
        );

        setTimeout(() => {
            window.location.href = "/dashboard.html";
        }, 2000);

        return false;
    }

    userInfo.textContent =
        `${currentUser.name} · Administrator`;

    return true;
}

// Logout
logoutButton.addEventListener("click", logout);

// Load users and facilities
async function loadAdminData() {
    try {
        const [userResponse, facilityResponse] = await Promise.all([
            API.getUsers(),
            API.getAdminFacilities()
        ]);

        users = userResponse.users || [];
        facilities = facilityResponse.facilities || [];

        userTotal.textContent =
            userResponse.count ?? users.length;

        facilityTotal.textContent =
            facilityResponse.count ?? facilities.length;

        renderUsers(users);
        renderFacilities();

        populateFacilityDropdown();

    } catch (error) {
        showMessage(error.message, "danger");

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    Unable to load users.
                </td>
            </tr>
        `;

        facilitiesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-danger">
                    Unable to load facilities.
                </td>
            </tr>
        `;
    }
}

// Render users table
function renderUsers(userList) {
    if (!userList.length) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No users found.
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = userList.map(user => {
        const userId = getUserId(user);
        const currentUserId = getUserId(currentUser);

        const isCurrentUser =
            String(userId) === String(currentUserId);

        const facilityName =
            user.facility?.name || "Not assigned";

        const role = user.role || "staff";

        return `
            <tr>
                <td>${escapeHTML(user.name)}</td>

                <td>${escapeHTML(user.email)}</td>

                <td>
                    <span class="badge ${
                        role === "admin"
                            ? "text-bg-dark"
                            : role === "pharmacist"
                                ? "text-bg-success"
                                : "text-bg-secondary"
                    }">
                        ${escapeHTML(role)}
                    </span>
                </td>

                <td>${escapeHTML(facilityName)}</td>

                <td>${formatDate(user.createdAt)}</td>

                <td>
                    <div class="d-flex gap-2">

                        <button
                            class="btn btn-sm btn-outline-primary edit-user-button"
                            data-id="${escapeHTML(userId)}"
                        >
                            Edit
                        </button>

                        <button
                            class="btn btn-sm btn-outline-danger delete-user-button"
                            data-id="${escapeHTML(userId)}"
                            ${isCurrentUser ? "disabled" : ""}
                            title="${
                                isCurrentUser
                                    ? "You cannot delete your own account"
                                    : "Delete user"
                            }"
                        >
                            Delete
                        </button>

                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Populate facility dropdown in user edit form
function populateFacilityDropdown(selectedId = "") {
    const dropdown =
        document.getElementById("editUserFacility");

    dropdown.innerHTML = `
        <option value="">Select facility</option>
    `;

    facilities.forEach(facility => {
        const option = document.createElement("option");

        option.value = facility._id;
        option.textContent =
            `${facility.name} (${facility.city})`;

        if (String(facility._id) === String(selectedId)) {
            option.selected = true;
        }

        dropdown.appendChild(option);
    });
}

// Show or hide facility selection based on role
function updateFacilityVisibility() {
    const role =
        document.getElementById("editUserRole").value;

    const facilityGroup =
        document.getElementById("editFacilityGroup");

    const facilityDropdown =
        document.getElementById("editUserFacility");

    const requiresFacility =
        role === "staff" || role === "pharmacist";

    facilityGroup.classList.toggle(
        "d-none",
        !requiresFacility
    );

    facilityDropdown.required = requiresFacility;
}

document.getElementById("editUserRole")
    .addEventListener("change", updateFacilityVisibility);

// Open user edit modal
function openUserEditModal(userId) {
    const user = users.find(
        item => String(getUserId(item)) === String(userId)
    );

    if (!user) {
        showMessage("User not found.", "danger");
        return;
    }

    document.getElementById("editUserId").value =
        getUserId(user);

    document.getElementById("editUserName").value =
        user.name || "";

    document.getElementById("editUserEmail").value =
        user.email || "";

    document.getElementById("editUserRole").value =
        user.role || "staff";

    document.getElementById("editUserPassword").value = "";

    populateFacilityDropdown(
        getFacilityId(user.facility)
    );

    updateFacilityVisibility();

    userModal.show();
}

// Save user changes
userForm.addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton =
        document.getElementById("saveUserButton");

    const userId =
        document.getElementById("editUserId").value;

    const role =
        document.getElementById("editUserRole").value;

    const payload = {
        name: document.getElementById("editUserName").value.trim(),
        email: document.getElementById("editUserEmail").value.trim(),
        role
    };

    if (role === "staff" || role === "pharmacist") {
        payload.facility =
            document.getElementById("editUserFacility").value;

        if (!payload.facility) {
            showMessage(
                "Please select a facility for this user.",
                "warning"
            );
            return;
        }
    }

    const password =
        document.getElementById("editUserPassword").value;

    if (password) {
        if (password.length < 8) {
            showMessage(
                "Password must contain at least 8 characters.",
                "warning"
            );
            return;
        }

        payload.password = password;
    }

    try {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        await API.updateUser(userId, payload);

        userModal.hide();

        showMessage("User updated successfully.");

        await loadAdminData();

    } catch (error) {
        showMessage(error.message, "danger");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save changes";
    }
});

// Delete user
async function deleteUser(userId) {
    const user = users.find(
        item => String(getUserId(item)) === String(userId)
    );

    if (!user) return;

    const confirmed = confirm(
        `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    try {
        await API.deleteUser(userId);

        showMessage("User deleted successfully.");

        await loadAdminData();

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

// Search users
userSearch.addEventListener("input", () => {
    const searchTerm =
        userSearch.value.trim().toLowerCase();

    const filteredUsers = users.filter(user => {
        return (
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.role?.toLowerCase().includes(searchTerm) ||
            user.facility?.name?.toLowerCase().includes(searchTerm)
        );
    });

    renderUsers(filteredUsers);
});

// Render facilities table
function renderFacilities() {
    if (!facilities.length) {
        facilitiesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                    No facilities found.
                </td>
            </tr>
        `;
        return;
    }

    facilitiesTableBody.innerHTML = facilities.map(facility => `
        <tr>
            <td>${escapeHTML(facility.name)}</td>

            <td>${escapeHTML(facility.city)}</td>

            <td>
                <small class="text-muted">
                    ${escapeHTML(facility._id)}
                </small>
            </td>

            <td>
                <div class="d-flex gap-2">

                    <button
                        class="btn btn-sm btn-outline-primary edit-facility-button"
                        data-id="${escapeHTML(facility._id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger delete-facility-button"
                        data-id="${escapeHTML(facility._id)}"
                    >
                        Delete
                    </button>

                </div>
            </td>
        </tr>
    `).join("");
}

// Reset facility form for adding a new facility
document.getElementById("addFacilityButton")
    .addEventListener("click", () => {
        facilityForm.reset();

        document.getElementById("editFacilityId").value = "";

        document.getElementById("facilityModalLabel")
            .textContent = "Add facility";

        document.getElementById("saveFacilityButton")
            .textContent = "Save facility";
    });

// Open facility edit modal
function openFacilityEditModal(facilityId) {
    const facility = facilities.find(
        item => String(item._id) === String(facilityId)
    );

    if (!facility) {
        showMessage("Facility not found.", "danger");
        return;
    }

    document.getElementById("editFacilityId").value =
        facility._id;

    document.getElementById("facilityName").value =
        facility.name || "";

    document.getElementById("facilityCity").value =
        facility.city || "";

    document.getElementById("facilityModalLabel")
        .textContent = "Edit facility";

    document.getElementById("saveFacilityButton")
        .textContent = "Save changes";

    facilityModal.show();
}

// Create or update facility
facilityForm.addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton =
        document.getElementById("saveFacilityButton");

    const facilityId =
        document.getElementById("editFacilityId").value;

    const payload = {
        name: document.getElementById("facilityName").value.trim(),
        city: document.getElementById("facilityCity").value.trim()
    };

    try {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        if (facilityId) {
            await API.updateFacility(facilityId, payload);

            showMessage("Facility updated successfully.");

        } else {
            await API.createFacility(payload);

            showMessage("Facility created successfully.");
        }

        facilityModal.hide();

        await loadAdminData();

    } catch (error) {
        showMessage(error.message, "danger");

    } finally {
        saveButton.disabled = false;

        saveButton.textContent = facilityId
            ? "Save changes"
            : "Save facility";
    }
});

// Delete facility
async function deleteFacility(facilityId) {
    const facility = facilities.find(
        item => String(item._id) === String(facilityId)
    );

    if (!facility) return;

    const confirmed = confirm(
        `Are you sure you want to delete ${facility.name}?`
    );

    if (!confirmed) return;

    try {
        await API.deleteFacility(facilityId);

        showMessage("Facility deleted successfully.");

        await loadAdminData();

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

// Handle user and facility table buttons
document.addEventListener("click", event => {
    const editUserButton =
        event.target.closest(".edit-user-button");

    const deleteUserButton =
        event.target.closest(".delete-user-button");

    const editFacilityButton =
        event.target.closest(".edit-facility-button");

    const deleteFacilityButton =
        event.target.closest(".delete-facility-button");

    if (editUserButton) {
        openUserEditModal(editUserButton.dataset.id);
    }

    if (deleteUserButton) {
        deleteUser(deleteUserButton.dataset.id);
    }

    if (editFacilityButton) {
        openFacilityEditModal(editFacilityButton.dataset.id);
    }

    if (deleteFacilityButton) {
        deleteFacility(deleteFacilityButton.dataset.id);
    }
});

// Initial page setup
if (checkAdminAccess()) {
    loadAdminData();
}
