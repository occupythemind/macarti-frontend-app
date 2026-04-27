/**
 * Macarti Gadgets — Staff Dashboard JS
 */
(async () => {
  await Layout.init();
  const user = await staffGuard();
  if (!user) return;

  // ── Load stats in parallel ────────────────────────────────
  async function loadStats() {
    try {
      const [products, categories, variants] = await Promise.all([
        Catalog.listProducts({ page_size: 1 }),
        Catalog.listCategories({ page_size: 1 }),
        Catalog.listVariants({ page_size: 1 }),
      ]);

      document.getElementById("stat-products").textContent   = products.count  ?? "—";
      document.getElementById("stat-categories").textContent = categories.count ?? "—";
      document.getElementById("stat-variants").textContent   = variants.count   ?? "—";

      // Count out-of-stock: fetch all variants and count those with stock_quantity <= reserved_stock
      // We approximate with a higher page_size fetch
      try {
        const allVars = await Catalog.listVariants({ page_size: 200 });
        const oos = (allVars.results || []).filter(v => (v.stock_quantity - v.reserved_stock) <= 0).length;
        document.getElementById("stat-oos").textContent = oos;
      } catch {
        document.getElementById("stat-oos").textContent = "—";
      }
    } catch {
      ["stat-products","stat-categories","stat-variants","stat-oos"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "Err";
      });
    }
  }

  // ── Recent products table ─────────────────────────────────
  async function loadRecentProducts() {
    const tbody = document.getElementById("recent-products-body");
    if (!tbody) return;
    try {
      const data = await Catalog.listProducts({ page_size: 8, ordering: "-id" });
      if (!data.results?.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--gray-400)">No products yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.results.map(p => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18" style="color:var(--gray-400)"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <div>
                <div class="product-name">${p.name}</div>
                <div class="text-mono">${p.slug || p.id.slice(0,12)}</div>
              </div>
            </div>
          </td>
          <td>${p.brand || "—"}</td>
          <td>${formatPrice(p.base_price, p.currency)}</td>
          <td>${p.category?.name || "—"}</td>
          <td>
            <a href="/pages/staff/products.html?edit=${p.id}" class="btn btn--ghost btn--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </a>
          </td>
        </tr>`).join("");
    } catch {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--danger)">Failed to load products.</td></tr>`;
    }
  }

  // ── Inventory log preview ─────────────────────────────────
  async function loadInventoryPreview() {
    const container = document.getElementById("inventory-preview");
    if (!container) return;
    try {
      const data = await Inventory.listLogs({ page_size: 5, ordering: "-created_at" });
      const logs = data.results || [];
      if (!logs.length) {
        container.innerHTML = `<div class="empty-state" style="padding:32px"><p>No inventory activity yet.</p></div>`;
        return;
      }
      container.innerHTML = `
        <div class="staff-table-wrap">
          <table class="staff-table">
            <thead><tr><th>Action</th><th>Variant</th><th>Qty</th><th>By</th><th>Date</th></tr></thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td><span class="inv-action inv-${log.action || 'SET'}">${log.action || "—"}</span></td>
                  <td class="text-mono">${log.product_variant ? log.product_variant.slice(0,12) + "…" : "—"}</td>
                  <td>${log.quantity ?? "—"}</td>
                  <td>${log.performed_by ? log.performed_by.slice(0,8) + "…" : "—"}</td>
                  <td>${log.created_at ? new Date(log.created_at).toLocaleDateString() : "—"}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    } catch {
      container.innerHTML = `<div style="padding:20px;color:var(--gray-400);font-size:.875rem;text-align:center">Inventory log requires staff permissions.</div>`;
    }
  }

  await Promise.all([loadStats(), loadRecentProducts(), loadInventoryPreview()]);
})();
