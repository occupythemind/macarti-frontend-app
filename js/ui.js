/**
 * Macarti Gadgets — UI Utilities
 */

// ── Toast notifications ──────────────────────────────────────
const Toast = (() => {
  let container;

  function init() {
    if (document.getElementById("toast-container")) return;
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  function show(message, type = "info", duration = 3500) {
    init();
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    };

    toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span class="toast__msg">${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast--visible"));

    setTimeout(() => {
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  return {
    success: (msg, d) => show(msg, "success", d),
    error:   (msg, d) => show(msg, "error", d),
    info:    (msg, d) => show(msg, "info", d),
    warning: (msg, d) => show(msg, "warning", d),
  };
})();

// ── Modal ────────────────────────────────────────────────────
const Modal = (() => {
  function open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add("modal--open"); document.body.style.overflow = "hidden"; }
  }
  function close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("modal--open"); document.body.style.overflow = ""; }
  }
  function closeAll() {
    document.querySelectorAll(".modal--open").forEach(m => m.classList.remove("modal--open"));
    document.body.style.overflow = "";
  }

  // Click backdrop to close
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) closeAll();
  });

  return { open, close, closeAll };
})();

// ── Loader ───────────────────────────────────────────────────
const Loader = {
  show(container, msg = "Loading…") {
    if (typeof container === "string") container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = `
      <div class="loader-wrap">
        <span class="spinner"></span>
        <span class="loader-msg">${msg}</span>
      </div>`;
  },
  error(container, msg = "Something went wrong.") {
    if (typeof container === "string") container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = `<div class="empty-state empty-state--error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <p>${msg}</p></div>`;
  },
  empty(container, msg = "Nothing here yet.", icon = "") {
    if (typeof container === "string") container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = `<div class="empty-state">
      ${icon}
      <p>${msg}</p></div>`;
  },
};

// ── Cart badge counter ───────────────────────────────────────
const CartBadge = {
  async refresh() {
    try {
      const cart = await Cart.getCart();
      const count = cart.items ? cart.items.length : 0;
      document.querySelectorAll(".cart-badge").forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? "flex" : "none";
      });
      return cart;
    } catch { /* not logged in / guest */ }
  },
};

// ── Auth state ───────────────────────────────────────────────
const AuthState = {
  _user: null,

  async load() {
    try {
      this._user = await Auth.getAccount();
    } catch {
      this._user = null;
    }
    this._applyToNav();
    return this._user;
  },

  get user() { return this._user; },
  get isLoggedIn() { return !!this._user; },

  _applyToNav() {
    const loggedIn = this.isLoggedIn;
    document.querySelectorAll("[data-auth-show]").forEach(el => {
      const show = el.dataset.authShow;
      el.style.display = (show === "loggedIn" && loggedIn) || (show === "guest" && !loggedIn) ? "" : "none";
    });
    if (loggedIn && this._user) {
      document.querySelectorAll(".nav-username").forEach(el => {
        el.textContent = this._user.first_name || this._user.username || "Account";
      });
    }
  },
};

// ── Pagination helper ────────────────────────────────────────
function renderPagination(container, data, onPageChange) {
  if (!container) return;
  container.innerHTML = "";
  if (!data.next && !data.previous) return;

  const wrap = document.createElement("div");
  wrap.className = "pagination";

  if (data.previous) {
    const btn = document.createElement("button");
    btn.className = "btn btn--outline";
    btn.textContent = "← Previous";
    btn.onclick = () => onPageChange(data.previous);
    wrap.appendChild(btn);
  }
  if (data.next) {
    const btn = document.createElement("button");
    btn.className = "btn btn--outline";
    btn.textContent = "Next →";
    btn.onclick = () => onPageChange(data.next);
    wrap.appendChild(btn);
  }
  container.appendChild(wrap);
}

// ── Debounce ─────────────────────────────────────────────────
function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Query params ─────────────────────────────────────────────
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
