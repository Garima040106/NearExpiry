
/* =========================================
   NEAREXPIRY - API SERVICE
========================================= */

const API_BASE_URL = "/api";

const TOKEN_KEY = "nearexpiry_token";
const USER_KEY = "nearexpiry_user";

// Retrieve the saved JWT token
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Save login information
function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Retrieve logged-in user
function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;
}

// Clear authentication information
function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Main reusable API request function
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    const contentType = response.headers.get("content-type");

    const data = contentType &&
        contentType.includes("application/json")
        ? await response.json()
        : null;

    if (response.status === 401) {
        clearAuth();

        if (
            !window.location.pathname.endsWith("/login.html") &&
            !window.location.pathname.endsWith("/register.html")
        ) {
            window.location.href = "/login.html";
        }

        throw new Error(
            data?.message || "Session expired. Please log in again."
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message || "Something went wrong."
        );
    }

    return data;
}

// API methods
const API = {

    // Authentication
    register: (payload) =>
        apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload)
        }),

    login: (payload) =>
        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload)
        }),

    getFacilities: () =>
        apiRequest("/facilities"),

    // Dashboard
    getDashboard: () =>
        apiRequest("/dashboard"),

    // Medicine inventory
    getMedicines: (params = {}) => {
        const query = new URLSearchParams(params).toString();

        return apiRequest(
            `/medicines${query ? `?${query}` : ""}`
        );
    },

    addMedicine: (payload) =>
        apiRequest("/medicines", {
            method: "POST",
            body: JSON.stringify(payload)
        }),

    updateMedicine: (id, payload) =>
        apiRequest(`/medicines/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        }),

    deleteMedicine: (id) =>
        apiRequest(`/medicines/${id}`, {
            method: "DELETE"
        }),

    setSurplus: (id, surplusQuantity) =>
        apiRequest(`/medicines/${id}/surplus`, {
            method: "PATCH",
            body: JSON.stringify({ surplusQuantity })
        }),

    // Surplus marketplace
    getSurplus: (params = {}) => {
        const query = new URLSearchParams(params).toString();

        return apiRequest(
            `/surplus${query ? `?${query}` : ""}`
        );
    },

    // Requests
    createRequest: (payload) =>
        apiRequest("/requests", {
            method: "POST",
            body: JSON.stringify(payload)
        }),

    getRequests: () =>
        apiRequest("/requests"),

    decideRequest: (id, decision, reason) =>
        apiRequest(`/requests/${id}/decision`, {
            method: "PATCH",
            body: JSON.stringify({ decision, reason })
        }),

    // Audit
    getAuditLogs: () =>
        apiRequest("/audit"),

    // Admin
    getUsers: () =>
        apiRequest("/admin/users"),

    updateUser: (id, payload) =>
        apiRequest(`/admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        }),

    deleteUser: (id) =>
        apiRequest(`/admin/users/${id}`, {
            method: "DELETE"
        }),

    getAdminFacilities: () =>
        apiRequest("/admin/facilities"),

    createFacility: (payload) =>
        apiRequest("/admin/facilities", {
            method: "POST",
            body: JSON.stringify(payload)
        }),

    updateFacility: (id, payload) =>
        apiRequest(`/admin/facilities/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        }),

    deleteFacility: (id) =>
        apiRequest(`/admin/facilities/${id}`, {
            method: "DELETE"
        })
};

// Logout helper
function logout() {
    clearAuth();
    window.location.href = "/login.html";
}
