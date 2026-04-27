/**
 * Macarti Gadgets — Account Page
 */
const AccountPage = (() => {
  const ORDER_STATUS_BADGE = {
    pending:   "badge--amber",
    paid:      "badge--blue",
    shipped:   "badge--blue",
    delivered: "badge--green",
    cancelled: "badge--gray",
    failed:    "badge--red",
  };
  const PAYMENT_STATUS_BADGE = {
    initialized: "badge--gray",
    pending:     "badge--amber",
    success:     "badge--green",
    failed:      "badge--red",
  };

  // ── Tabs ─────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll(".account-nav-item[data-tab]").forEach(btn => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".account-nav-item[data-tab]").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const panel = document.getElementById(`tab-${btn.dataset.tab}`);
        if (panel) panel.classList.add("active");

        if (btn.dataset.tab === "orders") await loadOrders();
        if (btn.dataset.tab === "payments") await loadPayments();
      });
    });
  }

  // ── Profile ───────────────────────────────────────────────
  async function loadProfile() {
    try {
      const user = await Auth.getAccount();
      const fill = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
      fill("pf-first", user.first_name);
      fill("pf-last",  user.last_name);
      fill("pf-username", user.username);

      const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
      const nameEl = document.getElementById("sidebar-name");
      if (nameEl) nameEl.textContent = name;

      const av = document.getElementById("sidebar-avatar");
      if (av) av.textContent = name[0].toUpperCase();

      const joined = document.getElementById("sidebar-joined");
      if (joined && user.date_joined) {
        joined.textContent = "Joined " + new Date(user.date_joined).toLocaleDateString("en-NG", { year: "numeric", month: "short" });
      }
    } catch (err) {
      if (err.status === 401) { window.location.href = "/pages/login.html?next=/pages/account.html"; }
    }
  }

  function initProfileForm() {
    document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("save-profile-btn");
      const errEl  = document.getElementById("profile-error");
      const succEl = document.getElementById("profile-success");
      errEl.style.display = "none";
      succEl.style.display = "none";

      const payload = {};
      const first = document.getElementById("pf-first")?.value.trim();
      const last  = document.getElementById("pf-last")?.value.trim();
      const uname = document.getElementById("pf-username")?.value.trim();
      const pwd   = document.getElementById("pf-password")?.value;
      if (first) payload.first_name = first;
      if (last)  payload.last_name  = last;
      if (uname) payload.username   = uname;
      if (pwd)   payload.password   = pwd;

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner" style="width:15px;height:15px;border-width:2px;display:inline-block"></span> Saving…`;

      try {
        await Auth.updateAccount(payload);
        succEl.textContent = "Profile updated successfully.";
        succEl.style.display = "block";
        document.getElementById("pf-password").value = "";
        await loadProfile();
      } catch (err) {
        const data = err.data || {};
        const msgs = Object.values(data).flat().join(", ");
        errEl.textContent = msgs || err.message || "Update failed.";
        errEl.style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });
  }

  // ── Orders ────────────────────────────────────────────────
  async function loadOrders(pageUrl = null) {
    const container  = document.getElementById("orders-list");
    const pagination = document.getElementById("orders-pagination");
    if (!container) return;
    Loader.show(container, "Loading orders…");

    try {
      const data = pageUrl
        ? await fetch(pageUrl, { credentials: "include" }).then(r => r.json())
        : await Orders.listOrders({ page_size: CONFIG.PAGE_SIZE_ORDERS, ordering: "-created_at" });

      if (!data.results?.length) {
        Loader.empty(container, "No orders yet.", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`);
        return;
      }

      container.innerHTML = data.results.map(order => `
        <div class="order-row">
          <div>
            <div class="order-row__id">#${order.id.slice(0,8).toUpperCase()}</div>
            <div class="order-row__meta">${new Date(order.created_at).toLocaleDateString("en-NG", { year:"numeric", month:"short", day:"numeric" })} · ${order.items?.length || 0} item${(order.items?.length || 0) !== 1 ? "s" : ""}</div>
          </div>
          <span class="badge ${ORDER_STATUS_BADGE[order.status] || "badge--gray"}">${order.status}</span>
          <div class="order-row__amount">${formatPrice(order.total_amount)}</div>
          <a href="/pages/order-detail.html?id=${order.id}" class="btn btn--outline btn--sm">View →</a>
        </div>`).join("");

      renderPagination(pagination, data, (url) => loadOrders(url));
    } catch { Loader.error(container, "Couldn't load orders."); }
  }

  // ── Payments ──────────────────────────────────────────────
  async function loadPayments(pageUrl = null) {
    const container  = document.getElementById("payments-list");
    const pagination = document.getElementById("payments-pagination");
    if (!container) return;
    Loader.show(container, "Loading payments…");

    try {
      const data = pageUrl
        ? await fetch(pageUrl, { credentials: "include" }).then(r => r.json())
        : await Payments.listPayments({ page_size: 10, ordering: "-created_at" });

      if (!data.results?.length) {
        Loader.empty(container, "No payment records yet.");
        return;
      }

      container.innerHTML = data.results.map(p => `
        <div class="payment-row">
          <div>
            <div style="font-weight:600;font-size:.875rem;color:var(--blue-900)">${p.reference_id || p.id.slice(0,8).toUpperCase()}</div>
            <div style="font-size:.78rem;color:var(--gray-500)">${p.provider} · ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
          <span class="badge ${PAYMENT_STATUS_BADGE[p.status] || "badge--gray"}">${p.status}</span>
          <div style="font-weight:700;color:var(--blue-700);margin-left:auto">${formatPrice(p.amount, p.currency)}</div>
          ${p.payment_link && p.status === "initialized" ? `<a href="${p.payment_link}" class="btn btn--primary btn--sm" target="_blank">Pay Now</a>` : ""}
        </div>`).join("");

      renderPagination(pagination, data, (url) => loadPayments(url));
    } catch { Loader.error(container, "Couldn't load payments."); }
  }

  // ── Delete account ────────────────────────────────────────
  function initDeleteAccount() {
    document.getElementById("delete-account-nav")?.addEventListener("click", () => Modal.open("delete-modal"));
    document.getElementById("confirm-delete-btn")?.addEventListener("click", async () => {
      const pwd = document.getElementById("delete-password")?.value;
      const err = document.getElementById("delete-error");
      if (!pwd) { err.textContent = "Password required."; err.style.display = "block"; return; }
      err.style.display = "none";
      try {
        await Auth.deleteAccount(pwd);
        Modal.close("delete-modal");
        Toast.info("Account scheduled for deletion. You have been signed out.");
        setTimeout(() => { window.location.href = "/index.html"; }, 2000);
      } catch (e) {
        err.textContent = e.data?.detail || e.message || "Deletion failed.";
        err.style.display = "block";
      }
    });
  }

  async function init() {
    await Layout.init();
    if (!AuthState.isLoggedIn) {
      window.location.href = "/pages/login.html?next=/pages/account.html";
      return;
    }
    await loadProfile();
    initTabs();
    initProfileForm();
    initDeleteAccount();
  }

  return { init };
})();

AccountPage.init();
