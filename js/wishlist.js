/**
 * Macarti Gadgets — Wishlist Page
 */
const WishlistPage = (() => {
  let wishlists = [];
  let activeId  = null;

  async function loadWishlists() {
    const tabsList = document.getElementById("wishlist-tabs-list");
    if (!tabsList) return;

    try {
      const data = await Wishlist.listWishlists();
      wishlists = data.results || [];

      if (!wishlists.length) {
        tabsList.innerHTML = `<div style="padding:12px 8px;font-size:.875rem;color:var(--gray-400)">No wishlists yet.</div>`;
        document.getElementById("wishlist-main").innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <p>Create your first wishlist to save products.</p>
            <button class="btn btn--primary" onclick="document.getElementById('new-wishlist-btn').click()">Create Wishlist</button>
          </div>`;
        return;
      }

      renderTabs();
      if (!activeId || !wishlists.find(w => w.id === activeId)) {
        activeId = wishlists[0].id;
      }
      await loadItems(activeId);
    } catch (err) {
      if (err.status === 401) {
        tabsList.innerHTML = `<div style="padding:12px 8px;font-size:.875rem">
          <a href="/pages/login.html" class="btn btn--primary btn--full btn--sm">Sign in to view wishlist</a>
        </div>`;
      } else {
        Loader.error(tabsList, "Couldn't load wishlists.");
      }
    }
  }

  function renderTabs() {
    const tabsList = document.getElementById("wishlist-tabs-list");
    tabsList.innerHTML = wishlists.map(w => `
      <button class="wishlist-tab ${w.id === activeId ? "active" : ""}" data-id="${w.id}">
        <svg viewBox="0 0 24 24" fill="${w.id === activeId ? "var(--blue-500)" : "none"}" stroke="${w.id === activeId ? "var(--blue-500)" : "currentColor"}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.name}</span>
        <span class="tab-count">${w.items?.length || 0}</span>
      </button>`).join("");

    tabsList.querySelectorAll(".wishlist-tab").forEach(tab => {
      tab.addEventListener("click", async () => {
        activeId = tab.dataset.id;
        renderTabs();
        await loadItems(activeId);
      });
    });
  }

  async function loadItems(wishlistId) {
    const main = document.getElementById("wishlist-main");
    if (!main) return;

    const wl = wishlists.find(w => w.id === wishlistId);
    Loader.show(main, "Loading items…");

    try {
      const data = await Wishlist.getWishlist(wishlistId);
      const items = data.items || [];

      if (!items.length) {
        main.innerHTML = `
          <div class="card">
            <div class="card__body" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--gray-100)">
              <div>
                <h3 style="margin:0">${wl?.name || "Wishlist"}</h3>
                <span class="badge ${data.is_public ? "badge--blue" : "badge--gray"}" style="margin-top:6px">${data.is_public ? "Public" : "Private"}</span>
              </div>
              <button class="btn btn--danger btn--sm" data-delete-wl="${wishlistId}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete
              </button>
            </div>
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <p>This wishlist is empty.</p>
              <a href="/pages/catalog.html" class="btn btn--outline btn--sm">Browse products</a>
            </div>
          </div>`;
        bindDeleteWishlist();
        return;
      }

      // Enrich items with product data
      const enriched = await Promise.all(items.map(async (item) => {
        try {
          const variant = await Catalog.getVariant(item.product_variant);
          const product = await Catalog.getProduct(typeof variant.product === "string" ? variant.product : variant.product?.id);
          const imgData = await Catalog.listImages({ product_variant: variant.id, is_main: true, page_size: 1 });
          return { ...item, _variant: variant, _product: product, _image: imgData.results?.[0]?.image || null };
        } catch { return item; }
      }));

      main.innerHTML = `
        <div class="card" style="padding:0">
          <div style="padding:16px 20px;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <h3 style="margin:0">${wl?.name || "Wishlist"}</h3>
              <span class="badge ${data.is_public ? "badge--blue" : "badge--gray"}" style="margin-top:6px">${data.is_public ? "Public" : "Private"}</span>
            </div>
            <div style="display:flex;gap:8px">
              ${data.is_public ? `<button class="btn btn--outline btn--sm" id="copy-link-btn" data-link="${window.location.origin}/pages/wishlist.html?shared=${wishlistId}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share link</button>` : ""}
              <button class="btn btn--danger btn--sm" data-delete-wl="${wishlistId}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete list</button>
            </div>
          </div>
          <div id="wl-items-list">
            ${enriched.map(item => `
              <div class="wl-item" data-item-id="${item.id}">
                <a href="/pages/product.html?id=${item._product?.id || ''}" class="wl-item__img">
                  ${item._image ? `<img src="${item._image}" alt="${item._product?.name || ''}">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gray-300);margin:auto;display:block"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`}
                </a>
                <div class="wl-item__info">
                  <a href="/pages/product.html?id=${item._product?.id || ''}" class="wl-item__name">${item._product?.name || "Product"}</a>
                  <div class="wl-item__meta">${item._variant ? [item._variant.color, item._variant.storage_size].filter(Boolean).join(" / ") : ""}</div>
                  <div class="wl-item__price">${item._variant ? formatPrice(item._variant.price, item._variant.currency) : ""}</div>
                </div>
                <div class="wl-item__actions">
                  <button class="btn btn--primary btn--sm add-to-cart-wl" data-variant="${item.product_variant}" title="Add to cart">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  </button>
                  <button class="btn btn--ghost btn--sm remove-wl-item" data-id="${item.id}" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>`).join("")}
          </div>
        </div>`;

      // Add to cart
      main.querySelectorAll(".add-to-cart-wl").forEach(btn => {
        btn.addEventListener("click", async () => {
          const variantId = btn.dataset.variant;
          try {
            await Cart.addItem(variantId, 1);
            Toast.success("Added to cart!");
            CartBadge.refresh();
          } catch (err) {
            if (err.status === 401) { Toast.info("Sign in to add to cart."); return; }
            Toast.error(err.message || "Couldn't add to cart.");
          }
        });
      });

      // Remove item
      main.querySelectorAll(".remove-wl-item").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          try {
            await Wishlist.removeItem(id);
            Toast.info("Removed from wishlist.");
            await loadWishlists();
          } catch (err) { Toast.error(err.message); }
        });
      });

      // Copy share link
      main.querySelector("#copy-link-btn")?.addEventListener("click", (e) => {
        navigator.clipboard?.writeText(e.currentTarget.dataset.link).then(() => Toast.success("Link copied!"));
      });

      bindDeleteWishlist();

    } catch (err) {
      Loader.error(main, "Couldn't load wishlist items.");
    }
  }

  function bindDeleteWishlist() {
    document.querySelectorAll("[data-delete-wl]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteWl;
        if (!confirm("Delete this wishlist and all its items?")) return;
        try {
          await Wishlist.deleteWishlist(id);
          Toast.info("Wishlist deleted.");
          activeId = null;
          await loadWishlists();
        } catch (err) { Toast.error(err.message); }
      });
    });
  }

  async function init() {
    await Layout.init();
    await loadWishlists();

    // New wishlist modal
    document.getElementById("new-wishlist-btn")?.addEventListener("click", () => {
      Modal.open("new-wishlist-modal");
    });
    document.getElementById("create-wl-btn")?.addEventListener("click", async () => {
      const name = document.getElementById("new-wl-name")?.value.trim();
      const pub  = document.getElementById("new-wl-public")?.checked;
      if (!name) { document.getElementById("new-wl-name")?.classList.add("error"); return; }
      try {
        const wl = await Wishlist.createWishlist(name, pub);
        Modal.close("new-wishlist-modal");
        Toast.success("Wishlist created!");
        activeId = wl.id;
        await loadWishlists();
        document.getElementById("new-wl-name").value = "";
        document.getElementById("new-wl-public").checked = false;
      } catch (err) { Toast.error(err.message); }
    });
  }

  return { init };
})();

WishlistPage.init();
