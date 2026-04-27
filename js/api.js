/**
 * Macarti Gadgets — API Client
 * Thin wrapper around fetch. Handles CSRF, sessions, and JSON.
 */

const Api = (() => {
  let _csrfToken = null;

  function getCsrfFromCookie() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  }

  async function request(method, path, body = null, options = {}) {
    const url = CONFIG.apiUrl(path);
    const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (isUnsafe) {
      const csrf = _csrfToken || getCsrfFromCookie();
      if (csrf) headers["X-CSRFToken"] = csrf;
    }

    const init = {
      method: method.toUpperCase(),
      headers,
      credentials: "include",
    };

    if (body !== null && !(body instanceof FormData)) {
      init.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      delete headers["Content-Type"]; // let browser set multipart boundary
      init.body = body;
    }

    const res = await fetch(url, init);

    // Store CSRF if returned
    const newCsrf = res.headers.get("X-CSRFToken");
    if (newCsrf) _csrfToken = newCsrf;

    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.detail || data.message || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  return {
    get:    (path, opts)        => request("GET",    path, null, opts),
    post:   (path, body, opts)  => request("POST",   path, body, opts),
    put:    (path, body, opts)  => request("PUT",    path, body, opts),
    patch:  (path, body, opts)  => request("PATCH",  path, body, opts),
    delete: (path, opts)        => request("DELETE", path, null, opts),
    upload: (path, formData)    => request("POST",   path, formData),
  };
})();

// ── Auth helpers ────────────────────────────────────────────
const Auth = {
  async register(payload) { return Api.post("/users/register", payload); },
  async login(email, password) { return Api.post("/users/login", { email, password }); },
  async logout() { return Api.post("/users/logout", {}); },
  async getAccount() { return Api.get("/users/account-info"); },
  async updateAccount(payload) { return Api.patch("/users/manage-account", payload); },
  async deleteAccount(password) { return Api.post("/users/delete", { password }); },
  async verifyEmail(uid, token) { return Api.get(`/users/verify-email?uid=${uid}&token=${token}`); },
  async resendVerification(email) { return Api.post("/users/resend-email-verify", { email }); },
  async googleLogin(token) { return Api.post("/users/google", { token }); },
  async facebookLogin(token) { return Api.post("/users/facebook", { token }); },

  // Check if user is logged in (tries account-info)
  async isLoggedIn() {
    try { await Api.get("/users/account-info"); return true; }
    catch { return false; }
  },
};

// ── Catalog helpers ─────────────────────────────────────────
const Catalog = {
  listProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/products${q ? "?" + q : ""}`);
  },
  getProduct(id) { return Api.get(`/products/products/${id}`); },
  listCategories(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/categories${q ? "?" + q : ""}`);
  },
  getCategory(id) { return Api.get(`/products/categories/${id}`); },
  listVariants(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/product-variants${q ? "?" + q : ""}`);
  },
  getVariant(id) { return Api.get(`/products/product-variants/${id}`); },
  listSpecifications(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/specifications${q ? "?" + q : ""}`);
  },
  listImages(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/product-images${q ? "?" + q : ""}`);
  },
};

// ── Cart helpers ─────────────────────────────────────────────
const Cart = {
  getCart() { return Api.get("/carts/carts"); },
  clearCart(cartId) { return Api.delete(`/carts/carts/${cartId}`); },
  listItems(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/carts/cart-items${q ? "?" + q : ""}`);
  },
  addItem(product_variant, quantity) { return Api.post("/carts/cart-items", { product_variant, quantity }); },
  updateItem(id, quantity) { return Api.patch(`/carts/cart-items/${id}`, { quantity }); },
  removeItem(id) { return Api.delete(`/carts/cart-items/${id}`); },
};

// ── Wishlist helpers ─────────────────────────────────────────
const Wishlist = {
  listWishlists(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/wishlists/wishlists${q ? "?" + q : ""}`);
  },
  createWishlist(name, is_public = false) { return Api.post("/wishlists/wishlists", { name, is_public }); },
  getWishlist(id) { return Api.get(`/wishlists/wishlists/${id}`); },
  deleteWishlist(id) { return Api.delete(`/wishlists/wishlists/${id}`); },
  addItem(wishlist, product_variant) { return Api.post("/wishlists/wishlist-items", { wishlist, product_variant }); },
  removeItem(id) { return Api.delete(`/wishlists/wishlist-items/${id}`); },
};

// ── Orders helpers ───────────────────────────────────────────
const Orders = {
  listOrders(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/orders/checkout${q ? "?" + q : ""}`);
  },
  getOrder(id) { return Api.get(`/orders/checkout/${id}`); },
  checkout(email, phone_number) { return Api.post("/orders/checkout", { email, phone_number }); },
};

// ── Payments helpers ─────────────────────────────────────────
const Payments = {
  listPayments(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/payments${q ? "?" + q : ""}`);
  },
  initializePayment(order_id, provider) {
    return Api.post("/payments/initialize", { order_id, provider });
  },
};

// ── Staff / Inventory helpers ────────────────────────────────
const Inventory = {
  setStock(variant_id, quantity) {
    return Api.post("/inventories/set-stock-quantity", { variant_id, quantity });
  },
  adjustStock(variant_id, quantity, action) {
    return Api.post("/inventories/adjust-stock-quantity", { variant_id, quantity, action });
  },
  bulkSetStock(updates) {
    return Api.post("/inventories/bulk-stock-quantity-update", { updates });
  },
  listLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/inventories/inventory-log${q ? "?" + q : ""}`);
  },
};
