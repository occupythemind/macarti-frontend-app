/**
 * Macarti Gadgets — Catalog Page
 */
const CatalogPage = (() => {
  let state = {
    category: null,
    brand: null,
    search: "",
    ordering: "-id",
    view: "grid",
    brands: new Set(),
  };

  function getUrlParams() {
    const p = new URLSearchParams(window.location.search);
    if (p.get("category")) state.category = p.get("category");
    if (p.get("brand"))    state.brand    = p.get("brand");
    if (p.get("search"))   state.search   = p.get("search");
  }

  async function loadCategories() {
    try {
      const data = await Catalog.listCategories({ page_size: 50 });
      const container = document.getElementById("filter-categories");
      if (!container) return;
      container.innerHTML = `
        <label class="filter-check">
          <input type="checkbox" name="cat" value="" ${!state.category ? "checked" : ""}> All
        </label>
        ${data.results.map(c => `
          <label class="filter-check">
            <input type="checkbox" name="cat" value="${c.id}" ${state.category === c.id ? "checked" : ""}> ${c.name}
          </label>`).join("")}`;

      container.querySelectorAll("input[name='cat']").forEach(cb => {
        cb.addEventListener("change", () => {
          if (cb.value === "") {
            container.querySelectorAll("input[name='cat']").forEach(x => x.checked = (x === cb));
            state.category = null;
          } else {
            container.querySelector("input[value='']").checked = false;
            state.category = cb.checked ? cb.value : null;
          }
          loadProducts();
          updateActiveFilters();
        });
      });
    } catch {}
  }

  function renderBrands(brands) {
    const container = document.getElementById("filter-brands");
    const group = document.getElementById("filter-brands-group");
    if (!container || !brands.size) { if (group) group.style.display = "none"; return; }
    if (group) group.style.display = "";
    container.innerHTML = [...brands].map(b => `
      <label class="filter-check">
        <input type="checkbox" name="brand" value="${b}" ${state.brand === b ? "checked" : ""}> ${b}
      </label>`).join("");
    container.querySelectorAll("input[name='brand']").forEach(cb => {
      cb.addEventListener("change", () => {
        state.brand = cb.checked ? cb.value : null;
        container.querySelectorAll("input[name='brand']").forEach(x => { if (x !== cb) x.checked = false; });
        loadProducts();
        updateActiveFilters();
      });
    });
  }

  function updateActiveFilters() {
    const container = document.getElementById("active-filters");
    if (!container) return;
    const tags = [];
    if (state.category) tags.push({ label: "Category filter", key: "category" });
    if (state.brand)    tags.push({ label: `Brand: ${state.brand}`, key: "brand" });
    if (state.search)   tags.push({ label: `"${state.search}"`, key: "search" });

    if (tags.length === 0) { container.style.display = "none"; return; }
    container.style.display = "flex";
    container.innerHTML = tags.map(t => `
      <span class="filter-tag" data-remove="${t.key}">
        ${t.label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </span>`).join("");
    container.querySelectorAll(".filter-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const key = tag.dataset.remove;
        if (key === "category") { state.category = null; document.querySelectorAll("input[name='cat']").forEach(x => x.checked = x.value === ""); }
        if (key === "brand")    { state.brand = null; document.querySelectorAll("input[name='brand']").forEach(x => x.checked = false); }
        if (key === "search")   { state.search = ""; const si = document.getElementById("catalog-search-input"); if (si) si.value = ""; }
        loadProducts();
        updateActiveFilters();
      });
    });
  }

  async function loadProducts(pageUrl = null) {
    const container = document.getElementById("catalog-products");
    const paginationEl = document.getElementById("catalog-pagination");
    const countEl = document.getElementById("catalog-count");
    if (!container) return;

    Loader.show(container, "Loading…");

    try {
      let data;
      if (pageUrl) {
        data = await fetch(pageUrl, { credentials: "include" }).then(r => r.json());
      } else {
        const params = {
          page_size: CONFIG.PAGE_SIZE_PRODUCTS,
          ordering: state.ordering,
        };
        if (state.category) params.category = state.category;
        if (state.brand)    params.brand    = state.brand;
        if (state.search)   params.search   = state.search;
        data = await Catalog.listProducts(params);
      }

      if (countEl) countEl.textContent = `${data.count || 0} product${data.count !== 1 ? "s" : ""}`;

      if (!data.results || data.results.length === 0) {
        Loader.empty(container, "No products match your filters.", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`);
        if (paginationEl) paginationEl.innerHTML = "";
        return;
      }

      container.innerHTML = "";

      // Collect brands
      data.results.forEach(p => { if (p.brand) state.brands.add(p.brand); });
      renderBrands(state.brands);

      for (const product of data.results) {
        const vData = await Catalog.listVariants({ product: product.id, page_size: 1 });
        const variant = vData.results?.[0] || null;
        let image = null;
        if (variant) {
          const imgData = await Catalog.listImages({ product_variant: variant.id, is_main: true, page_size: 1 });
          image = imgData.results?.[0]?.image || null;
        }
        product._mainImage = image;
        const card = buildProductCard(product, variant ? [variant] : []);
        container.appendChild(card);
      }

      renderPagination(paginationEl, data, (url) => loadProducts(url));

    } catch (err) {
      Loader.error(container, "Failed to load products.");
      console.error(err);
    }
  }

  function initSortListeners() {
    document.querySelectorAll("input[name='sort']").forEach(r => {
      r.addEventListener("change", () => {
        state.ordering = r.value;
        loadProducts();
      });
    });
  }

  function initSearch() {
    const input = document.getElementById("catalog-search-input");
    if (!input) return;
    if (state.search) input.value = state.search;
    input.addEventListener("input", debounce(() => {
      state.search = input.value.trim();
      loadProducts();
      updateActiveFilters();
    }, 400));
  }

  function initViewToggle() {
    const main = document.querySelector(".catalog-main");
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.view = btn.dataset.view;
        if (main) main.classList.toggle("list-view", state.view === "list");
      });
    });
  }

  function initMobileSidebar() {
    const toggle = document.getElementById("sidebar-toggle-mobile");
    const sidebar = document.getElementById("catalog-sidebar");
    if (!toggle || !sidebar) return;
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove("open");
    });
  }

  function initClearFilters() {
    const btn = document.getElementById("clear-filters-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      state.category = null; state.brand = null; state.search = "";
      state.ordering = "-id";
      document.querySelectorAll("input[name='cat']").forEach(x => x.checked = x.value === "");
      document.querySelectorAll("input[name='brand']").forEach(x => x.checked = false);
      document.querySelectorAll("input[name='sort']").forEach(x => x.checked = x.value === "-id");
      const si = document.getElementById("catalog-search-input"); if (si) si.value = "";
      loadProducts();
      updateActiveFilters();
    });
  }

  async function init() {
    await Layout.init();
    getUrlParams();
    await loadCategories();
    initSearch();
    initSortListeners();
    initViewToggle();
    initMobileSidebar();
    initClearFilters();
    await loadProducts();
    updateActiveFilters();

    // Pre-fill search input from URL
    const si = document.getElementById("catalog-search-input");
    if (si && state.search) si.value = state.search;
  }

  return { init };
})();

CatalogPage.init();
