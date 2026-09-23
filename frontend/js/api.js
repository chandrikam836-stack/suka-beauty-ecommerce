// ===================== Suka Beauty - Shared API Helper =====================
// Loaded on every page. Talks to the backend at the same origin ("/api/...").
// Handles JWT storage, auth headers, and wraps every backend endpoint.

const API_BASE = "/api";

const Auth = {
  getToken() { return localStorage.getItem("sb_token"); },
  setToken(t) { localStorage.setItem("sb_token", t); },
  clearToken() { localStorage.removeItem("sb_token"); },
  getUser() {
    const raw = localStorage.getItem("sb_user");
    return raw ? JSON.parse(raw) : null;
  },
  setUser(u) { localStorage.setItem("sb_user", JSON.stringify(u)); },
  clearUser() { localStorage.removeItem("sb_user"); },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return u && u.role === "admin"; },
  logout() { this.clearToken(); this.clearUser(); window.location.href = "login.html"; },
};

async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  const token = Auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------------- AUTH ----------------
const AuthAPI = {
  register: (payload) => apiRequest("/auth/register", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: payload }),
  forgotPassword: (payload) => apiRequest("/auth/forgot-password", { method: "POST", body: payload }),
  resetPassword: (payload) => apiRequest("/auth/reset-password", { method: "POST", body: payload }),
  me: () => apiRequest("/auth/me"),
};

// ---------------- USERS / ADDRESSES ----------------
const UserAPI = {
  getProfile: () => apiRequest("/users/profile"),
  updateProfile: (payload) => apiRequest("/users/profile", { method: "PUT", body: payload }),
  changePassword: (payload) => apiRequest("/users/change-password", { method: "PUT", body: payload }),
  listAddresses: () => apiRequest("/users/addresses"),
  createAddress: (payload) => apiRequest("/users/addresses", { method: "POST", body: payload }),
  updateAddress: (id, payload) => apiRequest(`/users/addresses/${id}`, { method: "PUT", body: payload }),
  deleteAddress: (id) => apiRequest(`/users/addresses/${id}`, { method: "DELETE" }),
};

// ---------------- PRODUCTS ----------------
const ProductAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? "?" + qs : ""}`);
  },
  suggestions: (q) => apiRequest(`/products/search/suggestions?q=${encodeURIComponent(q)}`),
  getBySlug: (slug) => apiRequest(`/products/${slug}`),
  reviews: (id) => apiRequest(`/products/${id}/reviews`),
  addReview: (id, payload) => apiRequest(`/products/${id}/reviews`, { method: "POST", body: payload }),
  // admin
  adminList: () => apiRequest("/products/admin/all"),
  create: (formData) => apiRequest("/products", { method: "POST", body: formData, isForm: true }),
  update: (id, formData) => apiRequest(`/products/${id}`, { method: "PUT", body: formData, isForm: true }),
  remove: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
};

// ---------------- CATEGORIES ----------------
const CategoryAPI = {
  list: () => apiRequest("/categories"),
  create: (payload) => apiRequest("/categories", { method: "POST", body: payload }),
  remove: (id) => apiRequest(`/categories/${id}`, { method: "DELETE" }),
};

// ---------------- WISHLIST ----------------
const WishlistAPI = {
  list: () => apiRequest("/wishlist"),
  add: (productId) => apiRequest("/wishlist", { method: "POST", body: { productId } }),
  remove: (productId) => apiRequest(`/wishlist/${productId}`, { method: "DELETE" }),
};

// ---------------- CART ----------------
const CartAPI = {
  list: () => apiRequest("/cart"),
  add: (productId, quantity = 1) => apiRequest("/cart", { method: "POST", body: { productId, quantity } }),
  update: (id, quantity) => apiRequest(`/cart/${id}`, { method: "PUT", body: { quantity } }),
  remove: (id) => apiRequest(`/cart/${id}`, { method: "DELETE" }),
  clear: () => apiRequest("/cart", { method: "DELETE" }),
};

// ---------------- ORDERS ----------------
const OrderAPI = {
  create: (payload) => apiRequest("/orders", { method: "POST", body: payload }),
  verifyPayment: (payload) => apiRequest("/orders/verify-payment", { method: "POST", body: payload }),
  mine: () => apiRequest("/orders/mine"),
  get: (id) => apiRequest(`/orders/${id}`),
  invoiceUrl: (id) => `${API_BASE}/orders/${id}/invoice`,
  async downloadInvoice(id, filename) {
    const token = Auth.getToken();
    const res = await fetch(`${API_BASE}/orders/${id}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Could not download invoice');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  cancel: (id, reason) => apiRequest(`/orders/${id}/cancel`, { method: "POST", body: { reason } }),
  requestReturn: (id, reason) => apiRequest(`/orders/${id}/return`, { method: "POST", body: { reason } }),
  // admin
  adminList: (status) => apiRequest(`/orders/admin/all${status ? "?status=" + status : ""}`),
  adminUpdateStatus: (id, status) => apiRequest(`/orders/admin/${id}/status`, { method: "PUT", body: { status } }),
  adminReturnDecision: (id, decision) => apiRequest(`/orders/admin/${id}/return-decision`, { method: "PUT", body: { decision } }),
  adminCompleteRefund: (id) => apiRequest(`/orders/admin/${id}/complete-refund`, { method: "PUT" }),
};

// ---------------- ADMIN (dashboard/users) ----------------
const AdminAPI = {
  dashboard: () => apiRequest("/admin/dashboard"),
  listUsers: () => apiRequest("/admin/users"),
  toggleUserRole: (id) => apiRequest(`/admin/users/${id}/toggle-role`, { method: "PUT" }),
};

// ---------------- Small UI helper shared across pages ----------------
function sbToast(msg, isError = false) {
  let el = document.getElementById("sb-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "sb-toast";
    el.style.position = "fixed";
    el.style.bottom = "24px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "12px 22px";
    el.style.borderRadius = "8px";
    el.style.fontFamily = "'Nunito', sans-serif";
    el.style.fontWeight = "700";
    el.style.fontSize = "0.85rem";
    el.style.color = "#fff";
    el.style.zIndex = "9999";
    el.style.boxShadow = "0 4px 16px rgba(0,0,0,.2)";
    el.style.transition = "opacity .3s";
    document.body.appendChild(el);
  }
  el.style.background = isError ? "#e74c3c" : "#2ecc71";
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(window._sbToastTimer);
  window._sbToastTimer = setTimeout(() => { el.style.opacity = "0"; }, 2500);
}

// Redirect helper for pages that require login
function requireLogin(redirectTo) {
  if (!Auth.isLoggedIn()) {
    window.location.href = `login.html?next=${encodeURIComponent(redirectTo || window.location.pathname)}`;
    return false;
  }
  return true;
}
