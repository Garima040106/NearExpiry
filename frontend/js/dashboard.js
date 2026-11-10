
document.addEventListener("DOMContentLoaded", async () => {
    const user = getCurrentUser();

    // Protect the dashboard from unauthenticated access.
    if (!getToken() || !user) {
        window.location.href = "/login.html";
        return;
    }

    const messageBox = document.getElementById("dashboardMessage");

    // Display the logged-in user's information.
    const userInfo = document.getElementById("userInfo");

    userInfo.textContent =
        `${user.name} | ${user.role}`;

    // Show the Admin link only to administrators.
    const adminNavItem = document.getElementById("adminNavItem");

    if (user.role !== "admin") {
        adminNavItem.style.display = "none";
    }

    // Logout.
    document.getElementById("logoutButton").addEventListener("click", () => {
        clearAuth(); window.location.href = "/login.html";
    });

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function updateCount(elementId, value) {
        document.getElementById(elementId).textContent =
            Number.isFinite(Number(value)) ? Number(value) : 0;
    }

    // Fetch live dashboard information.
    async function loadDashboard() {
        try {
            const response = await API.getDashboard();

            updateCount("nearExpiryCount", response.nearExpiry);
            updateCount("expiredCount", response.expired);
            updateCount("pendingCount", response.pending);
            updateCount("approvedCount", response.approved);

            document.getElementById("lastUpdated").textContent =
                `Last updated: ${new Date().toLocaleString()}`;

        } catch (error) {
            showMessage(
                error.message || "Unable to load dashboard information."
            );

            document.getElementById("lastUpdated").textContent =
                "Dashboard data could not be loaded.";
        }
    }

    await loadDashboard();
});
