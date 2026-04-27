/**
 * Macarti Gadgets — Product Detail Page
 */

const ProductPage = (() => {
  let product = null;
  let allVariants = [];
  let selectedVariant = null;
  let allImages = [];
  let quantity = 1;

  // ── Gallery ──────────────────────────────────────────────
  function renderGallery(images) {
    const mainWrap = document.getElementById("gallery-main");
    const thumbsWrap = document.getElementById("gallery-thumbs");
    if (!mainWrap) return;

    if (!images.length) {
      mainWrap.innerHTML = `
        <div class="gallery__main gallery__main--placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        </div>`;
      if (thumbsWrap) thumbsWrap.innerHTML = "";
      return;
    }

    mainWrap.innerHTML = `
      <div class="gallery__main">
        <img id="gallery-main-img" src="${images[0].image}" alt="Product image" loading="eager">
      </div>`;

    if (thumbsWrap) {
      thumbsWrap.innerHTML = images.map((img, i) => `
        <div class="gallery__thumb ${i === 0 ? "active" : ""}" data-idx="${i}">
          <img src="${img.image}" alt="View ${i + 1}" loading="lazy">
        </div>`).join("");

      thumbsWrap.querySelectorAll(".gallery__thumb").forEach(thumb => {
        thumb.addEventListener("click", () => {
          const idx = parseInt(thumb.dataset.idx);
          const mainImg = document.getElementById("gallery-main-img");
          if (mainImg) {
            mainImg.style.opacity = "0";
            setTimeout(() => {
              mainImg.src = images[idx].image;
              mainImg.style.opacity = "1";
            }, 150);
          }
          thumbsWrap.querySelectorAll(".gallery__thumb").forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        });
      });
    }
  }

  // ── Variants ─────────────────────────────────────────────
  function getUniqueColors(variants) {
    return [...new Map(variants.map(v => [v.color, v])).values()];
  }
  function getUniqueSizes(variants, color) {
    return variants.filter(v => !color || v.color === color).map(v => v.storage_size).filter(Boolean);
  }

  function renderVariants() {
    const colorWrap = document.getElementById("variant-colors");
    const sizeWrap  = document.getElementById("variant-sizes");
    const sizeGroup = document.getElementById("variant-size-group");

    const colors = getUniqueColors(allVariants);
    const selectedColor = selectedVariant?.color;
    const selectedSize  = selectedVariant?.storage_size;

    if (colorWrap) {
      colorWrap.innerHTML = colors.map(v => {
        const stock = v.stock_quantity - v.reserved_stock;
        return `<button
          class="variant-chip ${v.color === selectedColor ? "active" : ""} ${stock <= 0 ? "out" : ""}"
          data-color="${v.color}"
          title="${stock <= 0 ? "Out of stock" : v.color}"
          ${stock <= 0 ? "disabled" : ""}>
          ${v.color}
        </button>`;
      }).join("");

      colorWrap.querySelectorAll(".variant-chip:not(.out)").forEach(btn => {
        btn.addEventListener("click", () => {
          const color = btn.dataset.color;
          // Pick the first in-stock variant of this color
          const match = allVariants.find(v => v.color === color && (v.stock_quantity - v.reserved_stock) > 0)
                     || allVariants.find(v => v.color === color);
          if (match) {
            selectedVariant = match;
            quantity = 1;
            renderVariants();
            updatePriceAndStock();
            loadImagesForVariant(match.id);
          }
        });
      });
    }

    const sizes = getUniqueSizes(allVariants, selectedColor);
    if (sizeGroup) sizeGroup.style.display = sizes.length ? "" : "none";
    if (sizeWrap && sizes.length) {
      sizeWrap.innerHTML = sizes.map(sz => {
        const v = allVariants.find(x => x.color === selectedColor && x.storage_size === sz);
        const stock = v ? v.stock_quantity - v.reserved_stock : 0;
        return `<button
          class="variant-chip ${selectedSize === sz ? "active" : ""} ${stock <= 0 ? "out" : ""}"
          data-size="${sz}"
          ${stock <= 0 ? "disabled" : ""}>
          ${sz}
        </button>`;
      }).join("");

      sizeWrap.querySelectorAll(".variant-chip:not(.out)").forEach(btn => {
        btn.addEventListener("click", () => {
          const sz = btn.dataset.size;
          const match = allVariants.find(v => v.color === selectedColor && v.storage_size === sz);
          if (match) {
            selectedVariant = match;
            quantity = 1;
            renderVariants();
            updatePriceAndStock();
          }
        });
      });
    }
  }

  function updatePriceAndStock() {
    const priceEl = document.getElementById("product-price");
    const stockEl = document.getElementById("product-stock");
    const qtyVal  = document.getElementById("qty-value");
    const atcBtn  = document.getElementById("atc-btn");
    const stickyPrice = document.getElementById("sticky-price");

    const v = selectedVariant;
    if (!v) return;

    const price = formatPrice(v.price, v.currency);
    const avail = v.stock_quantity - v.reserved_stock;

    if (priceEl) priceEl.textContent = price;
    if (stickyPrice) stickyPrice.textContent = price;

    if (stockEl) {
      if (avail <= 0) {
        stockEl.className = "stock-indicator stock--out";
        stockEl.innerHTML = `<span class="stock-dot"></span> Out of Stock`;
      } else if (avail <= 5) {
        stockEl.className = "stock-indicator stock--low";
        stockEl.innerHTML = `<span class="stock-dot"></span> Only ${avail} left`;
      } else {
        stockEl.className = "stock-indicator stock--ok";
        stockEl.innerHTML = `<span class="stock-dot"></span> In Stock (${avail} available)`;
      }
    }

    if (qtyVal) { quantity = Math.min(quantity, Math.max(avail, 1)); qtyVal.textContent = quantity; }

    if (atcBtn) {
      if (avail <= 0) {
        atcBtn.textContent = "Out of Stock";
        atcBtn.disabled = true;
        atcBtn.className = "btn btn--outline btn--lg";
      } else {
        atcBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg> Add to Cart`;
        atcBtn.disabled = false;
        atcBtn.className = "btn btn--primary btn--lg";
      }
    }
  }

  async function loadImagesForVariant(variantId) {
    try {
      const data = await Catalog.listImages({ product_variant: variantId, page_size: 20 });
      allImages = data.results || [];
      // Sort: main image first
      allImages.sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
      renderGallery(allImages);
    } catch { renderGallery([]); }
  }

  // ── Quantity stepper ─────────────────────────────────────
  function initQtyStepper() {
    const dec = document.getElementById("qty-dec");
    const inc = document.getElementById("qty-inc");
    const val = document.getElementById("qty-value");
    const err = document.getElementById("qty-error");

    if (dec) dec.addEventListener("click", () => {
      if (quantity > 1) { quantity--; if (val) val.textContent = quantity; if (err) err.classList.remove("visible"); }
    });
    if (inc) inc.addEventListener("click", () => {
      const avail = selectedVariant ? selectedVariant.stock_quantity - selectedVariant.reserved_stock : 0;
      if (quantity < avail) {
        quantity++;
        if (val) val.textContent = quantity;
        if (err) err.classList.remove("visible");
      } else {
        if (err) { err.textContent = `Only ${avail} unit${avail !== 1 ? "s" : ""} available.`; err.classList.add("visible"); }
      }
    });
  }

  // ── Add to cart ──────────────────────────────────────────
  function initAddToCart() {
    const btn = document.getElementById("atc-btn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      if (!selectedVariant) { Toast.warning("Please select a variant."); return; }
      const avail = selectedVariant.stock_quantity - selectedVariant.reserved_stock;
      if (avail <= 0) { Toast.error("This item is out of stock."); return; }
      if (quantity > avail) { Toast.error(`Only ${avail} available.`); return; }

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Adding…`;

      try {
        await Cart.addItem(selectedVariant.id, quantity);
        Toast.success("Added to cart!");
        CartBadge.refresh();
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M20 6L9 17l-5-5"/>
          </svg> Added!`;
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg> Add to Cart`;
        }, 2000);
      } catch (err) {
        btn.disabled = false;
        updatePriceAndStock();
        if (err.status === 401) {
          Toast.info("Sign in to add items to your cart.");
          window.location.href = "/pages/login.html";
        } else {
          Toast.error(err.message || "Couldn't add to cart.");
        }
      }
    });
  }

  // ── Tabs ─────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const panel = document.getElementById(`tab-${btn.dataset.tab}`);
        if (panel) panel.classList.add("active");
      });
    });
  }

  // ── Render full product page ─────────────────────────────
  function renderPage(productData, variants, specs) {
    product = productData;
    allVariants = variants;
    selectedVariant = variants.find(v => (v.stock_quantity - v.reserved_stock) > 0) || variants[0] || null;

    const container = document.getElementById("product-content");
    if (!container) return;

    // Breadcrumb
    const bcName = document.getElementById("breadcrumb-name");
    if (bcName) bcName.textContent = product.name;
    document.title = `${product.name} — Macarti Gadgets`;

    const avail = selectedVariant ? selectedVariant.stock_quantity - selectedVariant.reserved_stock : 0;
    const price = selectedVariant ? formatPrice(selectedVariant.price, selectedVariant.currency) : formatPrice(product.base_price, product.currency);

    const hasColors  = variants.some(v => v.color);
    const hasSizes   = variants.some(v => v.storage_size);

    container.innerHTML = `
      <div class="product-detail">

        <!-- Gallery -->
        <div class="gallery">
          <div id="gallery-main"></div>
          <div class="gallery__thumbs" id="gallery-thumbs"></div>
        </div>

        <!-- Info -->
        <div class="product-info">
          <div class="product-info__brand">${product.brand || ""}</div>
          <h1 class="product-info__name">${product.name}</h1>

          <div id="product-price" class="product-info__price">${price}</div>

          <div id="product-stock"></div>

          ${hasColors ? `
          <div class="variant-group">
            <div class="variant-group__label">
              Color <span id="selected-color-label"></span>
            </div>
            <div class="variant-options" id="variant-colors"></div>
          </div>` : ""}

          <div class="variant-group" id="variant-size-group" style="display:none">
            <div class="variant-group__label">Storage / Size</div>
            <div class="variant-options" id="variant-sizes"></div>
          </div>

          <!-- Tabs: Description + Specs -->
          <div class="product-tabs">
            <div class="tab-nav">
              <button class="tab-btn active" data-tab="desc">Description</button>
              ${specs.length ? `<button class="tab-btn" data-tab="specs">Specifications</button>` : ""}
            </div>
            <div class="tab-panel active" id="tab-desc">
              <p style="color:var(--gray-600);line-height:1.75;font-size:.9375rem">
                ${product.description || "<em style='color:var(--gray-400)'>No description available.</em>"}
              </p>
            </div>
            ${specs.length ? `
            <div class="tab-panel" id="tab-specs">
              <table class="specs-table">
                ${specs.map(s => `
                  <tr>
                    <td>${s.name.charAt(0).toUpperCase() + s.name.slice(1)}</td>
                    <td>${s.value}</td>
                  </tr>`).join("")}
              </table>
            </div>` : ""}
          </div>

          <!-- Add to cart -->
          <div class="atc-section">
            <div class="atc-row">
              <div class="qty-stepper">
                <span class="qty-stepper__btn" id="qty-dec">−</span>
                <span class="qty-stepper__val" id="qty-value">1</span>
                <span class="qty-stepper__btn" id="qty-inc">+</span>
              </div>
              <button class="btn btn--primary btn--lg" id="atc-btn" style="flex:1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Add to Cart
              </button>
            </div>
            <div class="atc-error" id="qty-error"></div>

            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn--outline" id="wishlist-btn" style="flex:1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Save to Wishlist
              </button>
              <a href="/pages/cart.html" class="btn btn--ghost" style="flex:1">
                View Cart →
              </a>
            </div>

            <!-- Trust badges -->
            <div class="product-trust">
              <div class="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secure payment
              </div>
              <div class="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Fast delivery
              </div>
              <div class="trust-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Easy returns
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews placeholder -->
      <div style="margin-top:48px">
        <h3 style="margin-bottom:16px">Customer Reviews</h3>
        <div class="reviews-placeholder">
          <!-- SUGGESTION: Integrate a reviews service (Judge.me, Stamped.io) or build a custom /products/reviews endpoint -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="margin-bottom:10px">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p>Reviews coming soon.</p>
        </div>
      </div>`;

    // Sticky bar (mobile)
    document.body.insertAdjacentHTML("beforeend", `
      <div class="sticky-atc" id="sticky-atc">
        <div class="sticky-atc__info">
          <div class="sticky-atc__name">${product.name}</div>
          <div class="sticky-atc__price" id="sticky-price">${price}</div>
        </div>
        <button class="btn btn--primary" id="sticky-atc-btn">Add to Cart</button>
      </div>`);

    document.getElementById("sticky-atc-btn")?.addEventListener("click", () => {
      document.getElementById("atc-btn")?.click();
    });

    renderVariants();
    updatePriceAndStock();
    initQtyStepper();
    initAddToCart();
    initTabs();

    // Wishlist button
    document.getElementById("wishlist-btn")?.addEventListener("click", () => {
      handleWishlistFromCard(product.id);
    });
  }

  // ── Load related products ────────────────────────────────
  async function loadRelated() {
    if (!product) return;
    try {
      const params = { page_size: 4 };
      if (product.category?.id) params.category = product.category.id;
      else if (product.brand) params.brand = product.brand;

      const data = await Catalog.listProducts(params);
      const related = (data.results || []).filter(p => p.id !== product.id).slice(0, 4);
      if (!related.length) return;

      const section = document.getElementById("related-section");
      const heading = document.getElementById("related-heading");
      const container = document.getElementById("related-products");
      if (!section || !container) return;

      if (heading) heading.textContent = product.category?.name ? `More in ${product.category.name}` : `More from ${product.brand}`;
      section.classList.remove("hidden");
      container.innerHTML = "";

      for (const p of related) {
        const vData = await Catalog.listVariants({ product: p.id, page_size: 1 });
        const variant = vData.results?.[0] || null;
        if (variant) {
          const imgData = await Catalog.listImages({ product_variant: variant.id, is_main: true, page_size: 1 });
          p._mainImage = imgData.results?.[0]?.image || null;
        }
        container.appendChild(buildProductCard(p, variant ? [variant] : []));
      }
    } catch {}
  }

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    await Layout.init();

    const productId = getQueryParam("id");
    if (!productId) {
      document.getElementById("product-content").innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No product specified.</p>
          <a href="/pages/catalog.html" class="btn btn--primary" style="margin-top:8px">Browse products</a>
        </div>`;
      return;
    }

    const contentEl = document.getElementById("product-content");
    Loader.show(contentEl, "Loading product…");

    try {
      // Parallel: product + variants
      const [productData, variantsData] = await Promise.all([
        Catalog.getProduct(productId),
        Catalog.listVariants({ product: productId, page_size: 50 }),
      ]);

      const variants = variantsData.results || [];

      // Specs for first variant
      let specs = [];
      if (variants[0]) {
        const specsData = await Catalog.listSpecifications({ product_variant: variants[0].id, page_size: 50 });
        specs = specsData.results || [];
      }

      renderPage(productData, variants, specs);

      // Load images for selected variant
      if (selectedVariant) {
        await loadImagesForVariant(selectedVariant.id);
      }

      await loadRelated();

    } catch (err) {
      Loader.error(contentEl, "Failed to load product. Please try again.");
      console.error(err);
    }
  }

  // expose selectedVariant for loadImagesForVariant closure
  function getSelectedVariant() { return selectedVariant; }

  return { init, getSelectedVariant };
})();

ProductPage.init();
