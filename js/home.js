/**
 * Macarti Gadgets — Home Page
 */

// Shared product card renderer (used across home + catalog)
function buildProductCard(product, variants = []) {
  const mainVariant = variants[0] || null;
  const stock = mainVariant ? (mainVariant.stock_quantity - mainVariant.reserved_stock) : null;
  const isOut = stock !== null && stock <= 0;
  const isLow = stock !== null && stock > 0 && stock <= 5;
  const price = mainVariant ? formatPrice(mainVariant.price, mainVariant.currency) : formatPrice(product.base_price, product.currency);

  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.id = product.id;

  card.innerHTML = `
    <div class="product-card__img ${!product._mainImage ? 'product-card__img--placeholder' : ''}">
      ${product._mainImage
        ? `<img src="${product._mainImage}" alt="${product.name}" loading="lazy">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`
      }
      ${isOut ? '<span class="product-card__badge badge--out">Out of Stock</span>' : ''}
      ${isLow && !isOut ? `<span class="product-card__badge badge--low">Only ${stock} left</span>` : ''}
      <button class="product-card__wishlist" data-wishlist-product="${product.id}" title="Save to wishlist" aria-label="Add to wishlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
    <div class="product-card__body">
      <div class="product-card__brand">${product.brand || ''}</div>
      <div class="product-card__name">${product.name}</div>
      <div class="product-card__price">${price}</div>
    </div>
    <div class="product-card__footer">
      ${isOut
        ? `<button class="btn btn--outline btn--sm" onclick="handleWishlistFromCard('${product.id}')">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
             Save to Wishlist
           </button>`
        : `<button class="btn btn--outline btn--sm" onclick="quickAddToCart('${mainVariant ? mainVariant.id : ''}', '${product.id}')">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
             Add to Cart
           </button>`
      }
      <a href="/pages/product.html?id=${product.id}" class="btn btn--primary btn--sm">View</a>
    </div>
  `;

  // Wishlist heart button
  card.querySelector(".product-card__wishlist")?.addEventListener("click", (e) => {
    e.stopPropagation();
    handleWishlistFromCard(product.id);
  });

  // Click card to navigate
  card.addEventListener("click", (e) => {
    if (!e.target.closest("button") && !e.target.closest("a")) {
      window.location.href = `/pages/product.html?id=${product.id}`;
    }
  });

  return card;
}

async function quickAddToCart(variantId, productId) {
  if (!variantId) {
    window.location.href = `/pages/product.html?id=${productId}`;
    return;
  }
  try {
    await Cart.addItem(variantId, 1);
    Toast.success("Added to cart!");
    CartBadge.refresh();
  } catch (err) {
    if (err.status === 401) {
      Toast.info("Sign in to add items to your cart.");
      window.location.href = "/pages/login.html";
    } else {
      Toast.error(err.message || "Couldn't add to cart.");
    }
  }
}

async function handleWishlistFromCard(productId) {
  if (!AuthState.isLoggedIn) {
    Toast.info("Sign in to save items to your wishlist.");
    return;
  }
  // Load wishlists and show picker
  try {
    const data = await Wishlist.listWishlists();
    const lists = data.results || [];
    const body = document.getElementById("wishlist-modal-body");

    if (lists.length === 0) {
      body.innerHTML = `
        <p class="text-muted" style="font-size:.875rem">You don't have any wishlists yet.</p>
        <div class="form-group">
          <label class="form-label">Create one</label>
          <input type="text" class="form-input" id="new-wishlist-name" placeholder="e.g. Birthday ideas">
        </div>
        <div class="modal__footer" style="padding:0">
          <button class="btn btn--primary btn--full" onclick="createAndAddToWishlist('${productId}')">Create &amp; Save</button>
        </div>`;
    } else {
      body.innerHTML = `
        <p class="text-muted" style="font-size:.875rem">Choose a wishlist:</p>
        <div style="display:flex;flex-direction:column;gap:6px" id="wishlist-picker">
          ${lists.map(l => `
            <button class="btn btn--outline btn--full" onclick="addToWishlistFromModal('${l.id}', '${productId}')">
              ${l.name}
            </button>`).join('')}
        </div>
        <div style="height:1px;background:var(--gray-100);margin:8px 0;"></div>
        <div class="form-group">
          <label class="form-label">Or create new</label>
          <input type="text" class="form-input" id="new-wishlist-name" placeholder="Wishlist name">
        </div>
        <button class="btn btn--ghost btn--full" onclick="createAndAddToWishlist('${productId}')">
          + Create new wishlist &amp; save
        </button>`;
    }

    Modal.open("wishlist-modal");
    window._wishlistTargetProductId = productId;
  } catch {
    Toast.error("Couldn't load wishlists.");
  }
}

window.addToWishlistFromModal = async function(wishlistId, productId) {
  // Need a variant id; fetch variants for this product
  try {
    const vData = await Catalog.listVariants({ product: productId, page_size: 1 });
    const variant = vData.results?.[0];
    if (!variant) { Toast.warning("No variant available."); return; }
    await Wishlist.addItem(wishlistId, variant.id);
    Toast.success("Saved to wishlist!");
    Modal.close("wishlist-modal");
  } catch (err) {
    Toast.error(err.message || "Couldn't add to wishlist.");
  }
};

window.createAndAddToWishlist = async function(productId) {
  const nameEl = document.getElementById("new-wishlist-name");
  const name = nameEl?.value.trim();
  if (!name) { nameEl?.classList.add("error"); return; }
  try {
    const list = await Wishlist.createWishlist(name);
    await window.addToWishlistFromModal(list.id, productId);
  } catch (err) {
    Toast.error(err.message || "Couldn't create wishlist.");
  }
};

// ── Home page init ───────────────────────────────────────────
async function loadCategories() {
  try {
    const data = await Catalog.listCategories({ page_size: 20 });
    const pills = document.getElementById("category-pills");
    if (!pills) return;
    data.results.forEach(cat => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.dataset.cat = cat.id;
      chip.textContent = cat.name;
      chip.addEventListener("click", () => {
        document.querySelectorAll(".cat-pills .chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        loadFeaturedProducts(chip.dataset.cat || null);
      });
      pills.appendChild(chip);
    });
  } catch {}
}

async function loadFeaturedProducts(categoryId = null, page = null) {
  const container = document.getElementById("featured-products");
  const paginationContainer = document.getElementById("featured-pagination");
  if (!container) return;

  Loader.show(container, "Loading products…");

  try {
    const params = {
      page_size: CONFIG.PAGE_SIZE_PRODUCTS,
      ordering: "-id",
    };
    if (categoryId) params.category = categoryId;
    if (page) params.page = page;

    const data = page
      ? await fetch(page).then(r => r.json())
      : await Catalog.listProducts(params);

    if (!data.results || data.results.length === 0) {
      Loader.empty(container, "No products found in this category.", `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>`);
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    container.innerHTML = "";

    // Fetch main images for products in bulk
    const productIds = data.results.map(p => p.id);
    const imageMap = {};
    try {
      // Fetch images for each product's variants; use first main image found
      for (const product of data.results) {
        const vData = await Catalog.listVariants({ product: product.id, page_size: 1 });
        if (vData.results?.[0]) {
          const imgData = await Catalog.listImages({ product_variant: vData.results[0].id, is_main: true, page_size: 1 });
          if (imgData.results?.[0]) imageMap[product.id] = { image: imgData.results[0].image, variant: vData.results[0] };
          else imageMap[product.id] = { variant: vData.results[0] };
        }
      }
    } catch {}

    for (const product of data.results) {
      const extra = imageMap[product.id] || {};
      product._mainImage = extra.image || null;
      const variants = extra.variant ? [extra.variant] : [];
      const card = buildProductCard(product, variants);
      container.appendChild(card);
    }

    // Brands strip (collect unique brands)
    const brandsStrip = document.getElementById("brands-strip");
    if (brandsStrip && !brandsStrip.hasChildNodes()) {
      const brands = [...new Set(data.results.map(p => p.brand).filter(Boolean))];
      brands.forEach(b => {
        const pill = document.createElement("div");
        pill.className = "brand-pill";
        pill.textContent = b;
        pill.style.cursor = "pointer";
        pill.onclick = () => { window.location.href = `/pages/catalog.html?brand=${encodeURIComponent(b)}`; };
        brandsStrip.appendChild(pill);
      });
    }

    renderPagination(paginationContainer, data, (url) => loadFeaturedProducts(categoryId, url));

  } catch (err) {
    Loader.error(container, "Failed to load products. Please try again.");
    console.error(err);
  }
}

// Init
(async () => {
  await Layout.init();
  await loadCategories();
  await loadFeaturedProducts();
})();
