/**
 * Macarti Gadgets — API Client
 * Thin wrapper around fetch. Handles CSRF, sessions, and JSON.
 *
 * CSRF strategy:
 *   The backend exposes GET /users/get-csrf/ which returns:
 *     { "csrfToken": "<token>" }
 *   We call this once on the first unsafe request, cache the token,
 *   and send it as X-CSRFToken on every POST / PUT / PATCH / DELETE.
 *   The token is also refreshed from the X-CSRFToken response header
 *   on every reply, in case Django rotates it mid-session.
 *
 *   Required Django settings (cross-origin setup):
 *     CSRF_COOKIE_SAMESITE    = "None"
 *     CSRF_COOKIE_SECURE      = True
 *     SESSION_COOKIE_SAMESITE = "None"
 *     SESSION_COOKIE_SECURE   = True
 *     CSRF_TRUSTED_ORIGINS    = ["https://your-frontend-domain.com"]
 *     CORS_ALLOW_CREDENTIALS  = True
 *     CORS_ALLOWED_ORIGINS    = ["https://your-frontend-domain.com"]
 */

const Api = (() => {
  let _csrfToken = null;
  let _csrfPromise = null;   // deduplicates concurrent bootstrap calls

  /**
   * Fetch the CSRF token from the dedicated endpoint exactly once.
   * Parallel callers all await the same promise so only one GET fires.
   */
  async function ensureCsrf() {
    if (_csrfToken) return _csrfToken;
    if (_csrfPromise) return _csrfPromise;

    _csrfPromise = fetch(CONFIG.apiUrl("/users/get-csrf"), {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    })
      .then(res => {
        if (!res.ok) throw new Error(`CSRF endpoint returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        _csrfToken = data.csrfToken || data.csrf_token || data.token || null;
        if (!_csrfToken) throw new Error("CSRF response had no token field");
        return _csrfToken;
      })
      .catch(err => {
        console.error("[Macarti] Could not fetch CSRF token:", err.message);
        return null;
      })
      .finally(() => {
        _csrfPromise = null; // allow retry on next call if it failed
      });

    return _csrfPromise;
  }

  async function request(method, path, body = null, options = {}) {
    const url      = CONFIG.apiUrl(path);
    const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (isUnsafe) {
      const csrf = await ensureCsrf();
      if (csrf) {
        headers["X-CSRFToken"] = csrf;
      } else {
        console.warn("[Macarti] Proceeding without CSRF token for", method, path);
      }
    }

    const init = {
      method: method.toUpperCase(),
      headers,
      credentials: "include",
    };

    if (body !== null && !(body instanceof FormData)) {
      init.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      delete headers["Content-Type"]; // browser sets multipart boundary
      init.body = body;
    }

    const res = await fetch(url, init);

    // Refresh token if Django rotates it (sent back in response header)
    const rotated = res.headers.get("X-CSRFToken");
    if (rotated) _csrfToken = rotated;

    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.detail || data.message || "Request failed");
      err.status = res.status;
      err.data   = data;
      throw err;
    }

    return data;
  }

  return {
    get:    (path, opts)       => request("GET",    path, null, opts),
    post:   (path, body, opts) => request("POST",   path, body, opts),
    put:    (path, body, opts) => request("PUT",    path, body, opts),
    patch:  (path, body, opts) => request("PATCH",  path, body, opts),
    delete: (path, opts)       => request("DELETE", path, null, opts),
    upload: (path, formData)   => request("POST",   path, formData),
  };
})();

// ── Auth helpers ─────────────────────────────────────────────
const Auth = {
  async register(payload)          { return Api.post("/users/register", payload); },
  async login(email, password)     { return Api.post("/users/login", { email, password }); },
  async logout()                   { return Api.post("/users/logout", {}); },
  async getAccount()               { return Api.get("/users/account-info"); },
  async updateAccount(payload)     { return Api.patch("/users/manage-account", payload); },
  async deleteAccount(password)    { return Api.post("/users/delete", { password }); },
  async verifyEmail(uid, token)    { return Api.get(`/users/verify-email?uid=${uid}&token=${token}`); },
  async resendVerification(email)  { return Api.post("/users/resend-email-verify", { email }); },
  async googleLogin(token)         { return Api.post("/users/google", { token }); },
  async facebookLogin(token)       { return Api.post("/users/facebook", { token }); },
  async appleLogin(token)          { return Api.post("/users/apple", { token }); },
};

// ── Catalog helpers ───────────────────────────────────────────
const Catalog = {
  listProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/products${q ? "?" + q : ""}`);
  },
  getProduct(id)   { return Api.get(`/products/products/${id}`); },
  listCategories(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/categories${q ? "?" + q : ""}`);
  },
  getCategory(id)  { return Api.get(`/products/categories/${id}`); },
  listVariants(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/product-variants${q ? "?" + q : ""}`);
  },
  getVariant(id)   { return Api.get(`/products/product-variants/${id}`); },
  listSpecifications(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/specifications${q ? "?" + q : ""}`);
  },
  listImages(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/products/product-images${q ? "?" + q : ""}`);
  },
};

// ── Cart helpers ──────────────────────────────────────────────
const Cart = {
  getCart()                              { return Api.get("/carts/carts"); },
  clearCart(cartId)                      { return Api.delete(`/carts/carts/${cartId}`); },
  listItems(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/carts/cart-items${q ? "?" + q : ""}`);
  },
  addItem(product_variant, quantity)     { return Api.post("/carts/cart-items", { product_variant, quantity }); },
  updateItem(id, quantity)               { return Api.patch(`/carts/cart-items/${id}`, { quantity }); },
  removeItem(id)                         { return Api.delete(`/carts/cart-items/${id}`); },
};

// ── Wishlist helpers ──────────────────────────────────────────
const Wishlist = {
  listWishlists(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/wishlists/wishlists${q ? "?" + q : ""}`);
  },
  createWishlist(name, is_public = false) { return Api.post("/wishlists/wishlists", { name, is_public }); },
  getWishlist(id)                          { return Api.get(`/wishlists/wishlists/${id}`); },
  deleteWishlist(id)                       { return Api.delete(`/wishlists/wishlists/${id}`); },
  addItem(wishlist, product_variant)       { return Api.post("/wishlists/wishlist-items", { wishlist, product_variant }); },
  removeItem(id)                           { return Api.delete(`/wishlists/wishlist-items/${id}`); },
};

// ── Orders helpers ────────────────────────────────────────────
const Orders = {
  listOrders(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/orders/checkout${q ? "?" + q : ""}`);
  },
  getOrder(id)                           { return Api.get(`/orders/checkout/${id}`); },
  checkout(email, phone_number)          { return Api.post("/orders/checkout", { email, phone_number }); },
};

// ── Payments helpers ──────────────────────────────────────────
const Payments = {
  listPayments(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/payments${q ? "?" + q : ""}`);
  },
  initializePayment(order_id, provider)  { return Api.post("/payments/initialize", { order_id, provider }); },
};

// ── Inventory helpers (staff only) ────────────────────────────
const Inventory = {
  setStock(variant_id, quantity)         { return Api.post("/inventories/set-stock-quantity",      { variant_id, quantity }); },
  adjustStock(variant_id, quantity, action) { return Api.post("/inventories/adjust-stock-quantity", { variant_id, quantity, action }); },
  bulkSetStock(updates)                  { return Api.post("/inventories/bulk-stock-quantity-update", { updates }); },
  listLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return Api.get(`/inventories/inventory-log${q ? "?" + q : ""}`);
  },
};
