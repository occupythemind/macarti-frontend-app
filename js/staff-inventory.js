/**
 * Macarti Gadgets — Staff Inventory Page
 */
(async () => {
  await Layout.init();
  const user = await staffGuard();
  if (!user) return;

  // ── Load variants ─────────────────────────────────────────
  async function loadVariants(params = {}, pageUrl = null) {
    const tbody   = document.getElementById("inv-tbody");
    const countEl = document.getElementById("inv-count");
    const pagEl   = document.getElementById("inv-pagination");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="padding:28px;text-align:center"><span class="spinner" style="display:inline-block"></span></td></tr>`;

    try {
      const data = pageUrl
        ? await fetch(pageUrl, { credentials: "include" }).then(r => r.json())
        : await Catalog.listVariants({ page_size: 20, ...params });

      let results = data.results || [];

      // Client-side stock filter
      const stockFilter = document.getElementById("inv-stock-filter")?.value;
      if (stockFilter === "out") results = results.filter(v => (v.stock_quantity - v.reserved_stock) <= 0);
      else if (stockFilter === "low") results = results.filter(v => { const a = v.stock_quantity - v.reserved_stock; return a > 0 && a <= 5; });
      else if (stockFilter === "ok") results = results.filter(v => (v.stock_quantity - v.reserved_stock) > 5);

      if (countEl) countEl.textContent = `${data.count || 0} variants`;

      if (!results.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--gray-400)">No variants match.</td></tr>`;
        staffRenderPagination(pagEl, data, (url) => loadVariants(currentInvFilters(), url));
        return;
      }

      // Enrich with product name
      const productCache = {};
      for (const v of results) {
        const pid = typeof v.product === "string" ? v.product : v.product?.id;
        if (pid && !productCache[pid]) {
          try { productCache[pid] = await Catalog.getProduct(pid); } catch { productCache[pid] = { name: "—" }; }
        }
      }

      tbody.innerHTML = results.map(v => {
        const avail = v.stock_quantity - v.reserved_stock;
        const pid = typeof v.product === "string" ? v.product : v.product?.id;
        const pName = productCache[pid]?.name || "—";
        return `<tr>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--blue-900)">${pName}</td>
          <td>${[v.color, v.storage_size].filter(Boolean).join(" / ")}</td>
          <td class="text-mono">${v.sku_code || "—"}</td>
          <td>${v.stock_quantity}</td>
          <td>${v.reserved_stock}</td>
          <td><span class="stock-indicator ${avail <= 0 ? "stock--out" : avail <= 5 ? "stock--low" : "stock--ok"}"><span class="stock-dot"></span>${avail}</span></td>
          <td>
            <button class="btn btn--outline btn--sm quick-set-btn" data-id="${v.id}" data-stock="${v.stock_quantity}" title="Set stock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Set
            </button>
          </td>
        </tr>`;
      }).join("");

      // Quick set stock inline
      tbody.querySelectorAll(".quick-set-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const current = parseInt(btn.dataset.stock);
          const newQty = prompt(`Set stock for variant ${id.slice(0,8)}…\nCurrent: ${current}\nNew quantity:`, current);
          if (newQty === null) return;
          const qty = parseInt(newQty);
          if (isNaN(qty) || qty < 0) { Toast.error("Invalid quantity."); return; }
          Inventory.setStock(id, qty)
            .then(() => { Toast.success("Stock updated."); loadVariants(currentInvFilters()); })
            .catch(err => Toast.error(err.message));
        });
      });

      staffRenderPagination(pagEl, data, (url) => loadVariants(currentInvFilters(), url));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--danger)">${err.message}</td></tr>`;
    }
  }

  function currentInvFilters() {
    return { search: document.getElementById("inv-search")?.value.trim() || undefined };
  }

  // ── Inventory log ─────────────────────────────────────────
  async function loadLog(params = {}, pageUrl = null) {
    const tbody = document.getElementById("log-tbody");
    const pagEl = document.getElementById("log-pagination");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center"><span class="spinner" style="display:inline-block"></span></td></tr>`;
    try {
      const data = pageUrl
        ? await fetch(pageUrl, { credentials: "include" }).then(r => r.json())
        : await Inventory.listLogs({ page_size: 20, ordering: "-created_at", ...params });
      const logs = data.results || [];
      if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--gray-400)">No log entries.</td></tr>`;
        return;
      }
      tbody.innerHTML = logs.map(log => `
        <tr>
          <td><span class="inv-action inv-${log.action || 'SET'}">${log.action || "—"}</span></td>
          <td class="text-mono">${log.product_variant ? log.product_variant.slice(0,12) + "…" : "—"}</td>
          <td>${log.quantity ?? "—"}</td>
          <td class="text-mono">${log.performed_by ? log.performed_by.slice(0,12) + "…" : "System"}</td>
          <td>${log.created_at ? new Date(log.created_at).toLocaleString("en-NG", { dateStyle:"short", timeStyle:"short" }) : "—"}</td>
        </tr>`).join("");
      staffRenderPagination(pagEl, data, (url) => loadLog({ action: document.getElementById("log-action-filter")?.value || undefined }, url));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--gray-400)">Log requires staff permissions.</td></tr>`;
    }
  }

  // ── Adjust modal ──────────────────────────────────────────
  document.getElementById("adjust-stock-btn")?.addEventListener("click", () => {
    document.getElementById("adj-variant-id").value = "";
    document.getElementById("adj-qty").value = "";
    document.getElementById("adj-action").value = "SET";
    document.getElementById("adj-error").style.display = "none";
    Modal.open("adjust-modal");
  });

  document.getElementById("adj-save-btn")?.addEventListener("click", async () => {
    const varId   = document.getElementById("adj-variant-id").value.trim();
    const action  = document.getElementById("adj-action").value;
    const qty     = parseInt(document.getElementById("adj-qty").value);
    const errEl   = document.getElementById("adj-error");
    errEl.style.display = "none";
    if (!varId || isNaN(qty) || qty < 0) {
      errEl.textContent = "Valid variant ID and quantity required."; errEl.style.display = "block"; return;
    }
    const btn = document.getElementById("adj-save-btn");
    btn.disabled = true;
    try {
      if (action === "SET") await Inventory.setStock(varId, qty);
      else await Inventory.adjustStock(varId, qty, action);
      Toast.success("Stock updated.");
      Modal.close("adjust-modal");
      await Promise.all([loadVariants(currentInvFilters()), loadLog()]);
    } catch (err) {
      errEl.textContent = Object.values(err.data || {}).flat().join(", ") || err.message;
      errEl.style.display = "block";
    } finally { btn.disabled = false; }
  });

  // ── Bulk update modal ─────────────────────────────────────
  document.getElementById("bulk-update-btn")?.addEventListener("click", () => {
    document.getElementById("bulk-input").value = "";
    document.getElementById("bulk-error").style.display = "none";
    document.getElementById("bulk-success").style.display = "none";
    Modal.open("bulk-modal");
  });

  document.getElementById("bulk-save-btn")?.addEventListener("click", async () => {
    const raw    = document.getElementById("bulk-input").value.trim();
    const errEl  = document.getElementById("bulk-error");
    const succEl = document.getElementById("bulk-success");
    errEl.style.display = "none"; succEl.style.display = "none";

    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const updates = [];
    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 2) { errEl.textContent = `Invalid line: "${line}". Format: variant_id,quantity`; errEl.style.display = "block"; return; }
      const qty = parseInt(parts[1]);
      if (isNaN(qty) || qty < 0) { errEl.textContent = `Invalid qty on line: "${line}"`; errEl.style.display = "block"; return; }
      updates.push({ variant_id: parts[0], quantity: qty });
    }
    if (!updates.length) { errEl.textContent = "No updates provided."; errEl.style.display = "block"; return; }

    const btn = document.getElementById("bulk-save-btn");
    btn.disabled = true;
    try {
      await Inventory.bulkSetStock(updates);
      succEl.textContent = `${updates.length} variant${updates.length !== 1 ? "s" : ""} updated successfully.`;
      succEl.style.display = "block";
      await Promise.all([loadVariants(currentInvFilters()), loadLog()]);
    } catch (err) {
      errEl.textContent = Object.values(err.data || {}).flat().join(", ") || err.message;
      errEl.style.display = "block";
    } finally { btn.disabled = false; }
  });

  // ── Filters ───────────────────────────────────────────────
  document.getElementById("inv-search")?.addEventListener("input", debounce(() => loadVariants(currentInvFilters()), 350));
  document.getElementById("inv-stock-filter")?.addEventListener("change", () => loadVariants(currentInvFilters()));
  document.getElementById("log-action-filter")?.addEventListener("change", () => {
    loadLog({ action: document.getElementById("log-action-filter").value || undefined });
  });

  await Promise.all([loadVariants(), loadLog()]);
})();
