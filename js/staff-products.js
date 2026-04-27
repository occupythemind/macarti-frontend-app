/**
 * Macarti Gadgets — Staff Products Page
 */
const StaffProducts = (() => {
  let editingId     = null;
  let variantProductId = null;
  let categories    = [];

  // ── Load categories for selects ──────────────────────────
  async function loadCategories() {
    try {
      const data = await Catalog.listCategories({ page_size: 100 });
      categories = data.results || [];
      // Fill filter + modal selects
      const filterSel = document.getElementById("product-category-filter");
      const modalSel  = document.getElementById("pm-category");
      categories.forEach(c => {
        [filterSel, modalSel].forEach(sel => {
          if (!sel) return;
          const opt = document.createElement("option");
          opt.value = c.id; opt.textContent = c.name;
          sel.appendChild(opt);
        });
      });
    } catch {}
  }

  // ── Load products ─────────────────────────────────────────
  async function loadProducts(params = {}, pageUrl = null) {
    const tbody   = document.getElementById("products-tbody");
    const countEl = document.getElementById("product-count");
    const pagEl   = document.getElementById("products-pagination");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="padding:28px;text-align:center"><span class="spinner" style="display:inline-block"></span></td></tr>`;

    try {
      const data = pageUrl
        ? await fetch(pageUrl, { credentials: "include" }).then(r => r.json())
        : await Catalog.listProducts({ page_size: 20, ordering: "-id", ...params });

      if (countEl) countEl.textContent = `${data.count || 0} products`;

      if (!data.results?.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:28px;text-align:center;color:var(--gray-400)">No products found.</td></tr>`;
        if (pagEl) pagEl.innerHTML = "";
        return;
      }

      tbody.innerHTML = data.results.map(p => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:38px;height:38px;border-radius:var(--radius-sm);background:var(--gray-100);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="17" height="17" style="color:var(--gray-400)"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <div>
                <div style="font-weight:600;color:var(--blue-900);font-size:.875rem">${p.name}</div>
                <div style="font-size:.75rem;color:var(--gray-500);font-family:monospace">${p.id.slice(0,12)}…</div>
              </div>
            </div>
          </td>
          <td>${p.brand || "—"}</td>
          <td>${p.category?.name || "—"}</td>
          <td style="font-weight:600">${formatPrice(p.base_price, p.currency)}</td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn--outline btn--sm edit-product-btn" data-id="${p.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="btn btn--ghost btn--sm variants-btn" data-id="${p.id}" data-name="${p.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                Variants
              </button>
              <button class="btn btn--danger btn--sm delete-product-btn" data-id="${p.id}" data-name="${p.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join("");

      // Bind actions
      tbody.querySelectorAll(".edit-product-btn").forEach(btn => {
        btn.addEventListener("click", () => openEditProduct(btn.dataset.id, data.results));
      });
      tbody.querySelectorAll(".variants-btn").forEach(btn => {
        btn.addEventListener("click", () => openVariantsModal(btn.dataset.id, btn.dataset.name));
      });
      tbody.querySelectorAll(".delete-product-btn").forEach(btn => {
        btn.addEventListener("click", () => deleteProduct(btn.dataset.id, btn.dataset.name));
      });

      staffRenderPagination(pagEl, data, (url) => loadProducts(currentFilters(), url));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--danger)">${err.message || "Failed to load products."}</td></tr>`;
    }
  }

  function currentFilters() {
    return {
      search:   document.getElementById("product-search")?.value.trim() || undefined,
      category: document.getElementById("product-category-filter")?.value || undefined,
    };
  }

  // ── Product form ──────────────────────────────────────────
  function openNewProduct() {
    editingId = null;
    document.getElementById("product-modal-title").textContent = "New Product";
    ["pm-name","pm-brand","pm-price","pm-slug","pm-desc"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = "";
    });
    document.getElementById("pm-currency").value = "NGN";
    document.getElementById("pm-category").value = "";
    document.getElementById("pm-error").style.display = "none";
    Modal.open("product-modal");
  }

  function openEditProduct(id, products) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById("product-modal-title").textContent = "Edit Product";
    document.getElementById("pm-name").value    = p.name || "";
    document.getElementById("pm-brand").value   = p.brand || "";
    document.getElementById("pm-price").value   = p.base_price || "";
    document.getElementById("pm-currency").value= p.currency || "NGN";
    document.getElementById("pm-category").value= p.category?.id || "";
    document.getElementById("pm-slug").value    = p.slug || "";
    document.getElementById("pm-desc").value    = p.description || "";
    document.getElementById("pm-error").style.display = "none";
    Modal.open("product-modal");
  }

  async function saveProduct() {
    const errEl = document.getElementById("pm-error");
    errEl.style.display = "none";
    const name    = document.getElementById("pm-name").value.trim();
    const brand   = document.getElementById("pm-brand").value.trim();
    const price   = document.getElementById("pm-price").value.trim();
    if (!name || !brand || !price) {
      errEl.textContent = "Name, brand, and price are required.";
      errEl.style.display = "block"; return;
    }
    const payload = {
      name, brand,
      base_price: price,
      currency:    document.getElementById("pm-currency").value,
      description: document.getElementById("pm-desc").value.trim() || undefined,
      slug:        document.getElementById("pm-slug").value.trim() || undefined,
      category:    document.getElementById("pm-category").value || null,
    };
    const btn = document.getElementById("pm-save-btn");
    btn.disabled = true; btn.innerHTML = `<span class="spinner" style="width:15px;height:15px;border-width:2px;display:inline-block"></span> Saving…`;
    try {
      if (editingId) {
        await Api.patch(`/products/products/${editingId}`, payload);
        Toast.success("Product updated.");
      } else {
        await Api.post("/products/products", payload);
        Toast.success("Product created.");
      }
      Modal.close("product-modal");
      await loadProducts(currentFilters());
    } catch (err) {
      const data = err.data || {};
      errEl.textContent = Object.values(data).flat().join(", ") || err.message || "Save failed.";
      errEl.style.display = "block";
    } finally {
      btn.disabled = false; btn.textContent = "Save Product";
    }
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await Api.delete(`/products/products/${id}`);
      Toast.success("Product deleted.");
      await loadProducts(currentFilters());
    } catch (err) { Toast.error(err.message || "Delete failed."); }
  }

  // ── Variants modal ────────────────────────────────────────
  async function openVariantsModal(productId, productName) {
    variantProductId = productId;
    document.getElementById("variants-product-name").textContent = productName;
    ["vf-color","vf-size","vf-price","vf-sku"].forEach(id => { const e = document.getElementById(id); if (e) e.value = ""; });
    document.getElementById("vf-stock").value = "0";
    document.getElementById("vf-error").style.display = "none";
    Modal.open("variants-modal");
    await loadVariants(productId);
  }

  async function loadVariants(productId) {
    const container = document.getElementById("variants-list");
    if (!container) return;
    container.innerHTML = `<div class="loader-wrap" style="padding:20px 0"><span class="spinner"></span></div>`;
    try {
      const data = await Catalog.listVariants({ product: productId, page_size: 50 });
      const variants = data.results || [];
      if (!variants.length) {
        container.innerHTML = `<p style="color:var(--gray-400);font-size:.875rem;text-align:center;padding:12px 0">No variants yet.</p>`;
        return;
      }
      container.innerHTML = `
        <table class="staff-table" style="font-size:.8125rem">
          <thead><tr><th>Color</th><th>Size</th><th>Price</th><th>Stock</th><th>SKU</th><th></th></tr></thead>
          <tbody>
            ${variants.map(v => {
              const avail = v.stock_quantity - v.reserved_stock;
              return `<tr>
                <td>${v.color}</td>
                <td>${v.storage_size || "—"}</td>
                <td>${formatPrice(v.price, v.currency)}</td>
                <td><span class="stock-indicator ${avail <= 0 ? "stock--out" : avail <= 5 ? "stock--low" : "stock--ok"}"><span class="stock-dot"></span>${avail}</span></td>
                <td class="text-mono">${v.sku_code || "—"}</td>
                <td>
                  <button class="btn btn--danger btn--sm del-variant-btn" data-id="${v.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`;
      container.querySelectorAll(".del-variant-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this variant?")) return;
          try {
            await Api.delete(`/products/product-variants/${btn.dataset.id}`);
            Toast.success("Variant deleted.");
            await loadVariants(productId);
          } catch (err) { Toast.error(err.message); }
        });
      });
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger);font-size:.875rem">${err.message}</p>`;
    }
  }

  async function addVariant() {
    const errEl = document.getElementById("vf-error");
    errEl.style.display = "none";
    const color = document.getElementById("vf-color").value.trim();
    const price = document.getElementById("vf-price").value.trim();
    if (!color || !price) {
      errEl.textContent = "Color and price are required."; errEl.style.display = "block"; return;
    }
    const payload = {
      product:        variantProductId,
      color,
      storage_size:   document.getElementById("vf-size").value.trim() || undefined,
      price,
      currency:       document.getElementById("vf-currency").value,
      stock_quantity: parseInt(document.getElementById("vf-stock").value) || 0,
      sku_code:       document.getElementById("vf-sku").value.trim() || undefined,
    };
    const btn = document.getElementById("vf-add-btn");
    btn.disabled = true;
    try {
      await Api.post("/products/product-variants", payload);
      Toast.success("Variant added.");
      ["vf-color","vf-size","vf-price","vf-sku"].forEach(id => { const e = document.getElementById(id); if (e) e.value = ""; });
      document.getElementById("vf-stock").value = "0";
      await loadVariants(variantProductId);
    } catch (err) {
      errEl.textContent = Object.values(err.data || {}).flat().join(", ") || err.message;
      errEl.style.display = "block";
    } finally { btn.disabled = false; }
  }

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    await Layout.init();
    const user = await staffGuard();
    if (!user) return;
    await loadCategories();
    await loadProducts();

    document.getElementById("new-product-btn")?.addEventListener("click", openNewProduct);
    document.getElementById("pm-save-btn")?.addEventListener("click", saveProduct);
    document.getElementById("vf-add-btn")?.addEventListener("click", addVariant);

    document.getElementById("product-search")?.addEventListener("input",
      debounce(() => loadProducts(currentFilters()), 350));
    document.getElementById("product-category-filter")?.addEventListener("change",
      () => loadProducts(currentFilters()));

    // Check URL for edit param
    const editId = getQueryParam("edit");
    if (editId) {
      try {
        const p = await Catalog.getProduct(editId);
        openEditProduct(editId, [p]);
      } catch {}
    }
  }

  return { init };
})();

StaffProducts.init();
