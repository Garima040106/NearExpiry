
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const messageBox = document.getElementById("authMessage");

    // Redirect users who are already logged in.
    if (getToken() && (loginForm || registerForm)) {
        window.location.href = "/dashboard.html";
        return;
    }

    // Display success and error messages.
    function showMessage(message, type = "danger") {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    // Disable button while an API request is running.
    function setButtonLoading(button, loading, originalText) {
        button.disabled = loading;
        button.textContent = loading ? "Please wait..." : originalText;
    }

    // --------------------------------
    // LOGIN
    // --------------------------------

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const button = document.getElementById("loginButton");

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showMessage("Please enter your email and password.");
                return;
            }

            setButtonLoading(button, true, "Sign in");

            try {
                const response = await API.login({
                    email,
                    password
                });

                if (!response.token || !response.user) {
                    throw new Error("Invalid login response from server.");
                }

                // Save JWT token and user information.
                saveAuth(response.token, response.user);

                showMessage("Login successful. Redirecting...", "success");

                window.location.href = "/dashboard.html";

            } catch (error) {
                showMessage(error.message || "Unable to log in.");
                setButtonLoading(button, false, "Sign in");
            }
        });
    }

    // --------------------------------
    // REGISTRATION
    // --------------------------------

    if (registerForm) {
        const facilitySelect = document.getElementById("facility");

        // Load facilities from the backend.
        async function loadFacilities() {
            try {
                const response = await API.getFacilities();

                // Backend returns an array directly.
                const facilities = Array.isArray(response)
                    ? response
                    : (response.facilities || []);

                facilitySelect.innerHTML =
                    '<option value="">Select your facility</option>';

                if (facilities.length === 0) {
                    showMessage("No facilities are currently available.");
                    return;
                }

                facilities.forEach((facility) => {
                    const option = document.createElement("option");

                    option.value = facility._id;
                    option.textContent =
                        `${facility.name} - ${facility.city}`;

                    facilitySelect.appendChild(option);
                });

            } catch (error) {
                facilitySelect.innerHTML =
                    '<option value="">Unable to load facilities</option>';

                showMessage(
                    error.message || "Could not load facilities."
                );
            }
        }

        // Fetch facilities as soon as the page loads.
        loadFacilities();

        // Handle registration form submission.
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const button = document.getElementById("registerButton");

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const role = document.getElementById("role").value;
            const facility = facilitySelect.value;

            if (!name || !email || !password || !role || !facility) {
                showMessage("Please complete all fields.");
                return;
            }

            if (password.length < 6) {
                showMessage(
                    "Password must contain at least 6 characters."
                );
                return;
            }

            setButtonLoading(button, true, "Create account");

            try {
                await API.register({
                    name,
                    email,
                    password,
                    role,
                    facility
                });

                showMessage(
                    "Account created successfully. Redirecting to login...",
                    "success"
                );

                registerForm.reset();

                setTimeout(() => {
                    window.location.href = "/login.html";
                }, 1500);

            } catch (error) {
                showMessage(error.message || "Registration failed.");

                setButtonLoading(
                    button,
                    false,
                    "Create account"
                );
            }
        });
    }
});
