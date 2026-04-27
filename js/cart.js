/**
 * Macarti Gadgets — Cart Page
 */
const CartPage = (() => {
  let cartData = null;
  let pendingOrderId = null;

  function stockClass(qty) {
    if (qty <= 0) return "stock--out";
    if (qty <= 5) return "stock--low";
    return "stock--ok";
  }

  function renderCartItem(item) {
    const total = formatPrice(item.total_price || (parseFloat(item.price) * item.quantity));
    const el = document.createElement("div");
    el.className = "cart-item";
    el.dataset.id = item.id;

    el.innerHTML = `
      <div class="cart-item__img">
        ${item._image
          ? `<img src="${item._image}" alt="Product" loading="lazy">`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="color:var(--gray-300);margin:auto;display:block"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`
        }
      </div>
      <div class="cart-item__info">
        <div class="cart-item__name">${item._productName || "Product"}</div>
        <div class="cart-item__meta">${item._variantLabel || ""}</div>
        <div class="cart-item__price">${formatPrice(item.price)} × ${item.quantity} = <strong>${total}</strong></div>
        <div class="cart-item__actions">
          <div class="qty-stepper">
            <span class="qty-stepper__btn cart-dec" data-id="${item.id}">−</span>
            <span class="qty-stepper__val">${item.quantity}</span>
            <span class="qty-stepper__btn cart-inc" data-id="${item.id}" data-max="${item._stock || 99}">+</span>
          </div>
          <button class="btn btn--ghost btn--sm cart-remove" data-id="${item.id}" title="Remove item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Remove
          </button>
        </div>
      </div>`;

    // Qty stepper events
    el.querySelector(".cart-dec").addEventListener("click", () => updateItemQty(item.id, item.quantity - 1));
    el.querySelector(".cart-inc").addEventListener("click", () => {
      const max = parseInt(el.querySelector(".cart-inc").dataset.max);
      if (item.quantity >= max) {
        Toast.warning(`Only ${max} unit${max !== 1 ? "s" : ""} available.`);
        return;
      }
      updateItemQty(item.id, item.quantity + 1);
    });
    el.querySelector(".cart-remove").addEventListener("click", () => removeItem(item.id));

    return el;
  }

  async function enrichItems(items) {
    for (const item of items) {
      try {
        const variant = await Catalog.getVariant(item.product_variant);
        item._variantLabel = [variant.color, variant.storage_size].filter(Boolean).join(" / ");
        item._stock = variant.stock_quantity - variant.reserved_stock;

        const product = await Catalog.getProduct(variant.product.id || variant.product);
        item._productName = product.name;

        const imgData = await Catalog.listImages({ product_variant: variant.id, is_main: true, page_size: 1 });
        item._image = imgData.results?.[0]?.image || null;
      } catch {}
    }
    return items;
  }

  function renderCart(cart) {
    cartData = cart;
    const layout = document.getElementById("cart-layout");
    if (!layout) return;

    const items = cart.items || [];

    if (!items.length) {
      layout.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="72" height="72">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <a href="/pages/catalog.html" class="btn btn--primary">Start Shopping →</a>
        </div>`;
      return;
    }

    layout.innerHTML = `
      <div>
        <div class="card" style="padding:0">
          <div style="padding:18px 20px;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0">Cart Items (${items.length})</h3>
            <button class="btn btn--ghost btn--sm" id="clear-cart-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Clear all
            </button>
          </div>
          <div id="cart-items-list"></div>
        </div>
      </div>

      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span id="summary-subtotal">${formatPrice(cart.full_total_price)}</span></div>
        <div class="summary-row"><span>Delivery</span><span style="color:var(--success);font-weight:600">Calculated at checkout</span></div>
        <div class="summary-total"><span>Total</span><span id="summary-total">${formatPrice(cart.full_total_price)}</span></div>
        <button class="btn btn--primary btn--full btn--lg" id="checkout-btn" style="margin-top:20px">
          Proceed to Checkout →
        </button>
        <a href="/pages/catalog.html" class="btn btn--ghost btn--full" style="margin-top:8px">← Continue Shopping</a>

        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
          <div class="trust-item" style="font-size:.8rem;color:var(--gray-500)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Secure 256-bit SSL checkout
          </div>
          <div class="trust-item" style="font-size:.8rem;color:var(--gray-500)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Pay with Flutterwave or Paystack
          </div>
        </div>
      </div>`;

    // Render items
    const listEl = document.getElementById("cart-items-list");
    items.forEach(item => listEl.appendChild(renderCartItem(item)));

    // Clear cart
    document.getElementById("clear-cart-btn")?.addEventListener("click", async () => {
      if (!confirm("Remove all items from cart?")) return;
      try {
        await Cart.clearCart(cart.id);
        Toast.info("Cart cleared.");
        await loadCart();
        CartBadge.refresh();
      } catch (err) { Toast.error(err.message); }
    });

    // Checkout
    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      // Pre-fill email if logged in
      const emailInput = document.getElementById("checkout-email");
      if (emailInput && AuthState.user?.email) emailInput.value = AuthState.user.email;
      Modal.open("checkout-modal");
    });
  }

  async function updateItemQty(itemId, newQty) {
    if (newQty < 1) { await removeItem(itemId); return; }
    try {
      await Cart.updateItem(itemId, newQty);
      await loadCart();
    } catch (err) { Toast.error(err.message || "Couldn't update quantity."); }
  }

  async function removeItem(itemId) {
    try {
      await Cart.removeItem(itemId);
      Toast.info("Item removed.");
      await loadCart();
      CartBadge.refresh();
    } catch (err) { Toast.error(err.message || "Couldn't remove item."); }
  }

  async function loadCart() {
    const layout = document.getElementById("cart-layout");
    if (!layout) return;
    Loader.show(layout, "Loading your cart…");
    try {
      const cart = await Cart.getCart();
      const enriched = await enrichItems(cart.items || []);
      cart.items = enriched;
      renderCart(cart);
    } catch (err) {
      if (err.status === 401) {
        // Guest cart still works, try again
        try {
          const cart = await Cart.getCart();
          const enriched = await enrichItems(cart.items || []);
          cart.items = enriched;
          renderCart(cart);
        } catch { Loader.error(layout, "Couldn't load cart."); }
      } else {
        Loader.error(layout, "Couldn't load cart.");
      }
    }
  }

  function initCheckout() {
    const submitBtn = document.getElementById("checkout-submit-btn");
    const errEl = document.getElementById("checkout-error");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", async () => {
      const email = document.getElementById("checkout-email")?.value.trim();
      const phone = document.getElementById("checkout-phone")?.value.trim();
      if (!email) {
        if (errEl) { errEl.textContent = "Email is required."; errEl.style.display = "block"; }
        return;
      }
      if (errEl) errEl.style.display = "none";

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Placing…`;

      try {
        const order = await Orders.checkout(email, phone || undefined);
        pendingOrderId = order.id;
        Modal.close("checkout-modal");

        // Show changes if any
        const changes = order.changes;
        if (changes && (changes.price_changes?.length || changes.stock_changes?.length)) {
          let msg = "<strong>Some items were adjusted:</strong><br>";
          changes.price_changes?.forEach(c => { msg += `• ${c.product}: price changed to ${formatPrice(c.new_price)}<br>`; });
          changes.stock_changes?.forEach(c => { msg += `• ${c.product}: qty reduced to ${c.available} (requested ${c.requested})<br>`; });
          const warn = document.createElement("div");
          warn.className = "changes-warning";
          warn.innerHTML = msg;
          document.querySelector(".cart-layout")?.prepend(warn);
        }

        // Fill payment modal summary
        const summaryEl = document.getElementById("payment-order-summary");
        if (summaryEl && cartData) {
          summaryEl.innerHTML = `
            <div style="font-size:.875rem;color:var(--gray-600)">Order <strong>#${order.id.slice(0,8).toUpperCase()}</strong></div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--blue-700);margin-top:4px">${formatPrice(cartData.full_total_price)}</div>`;
        }

        Modal.open("payment-modal");
        CartBadge.refresh();
        await loadCart();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Place Order →";
        const msg = err.data?.error === "OUT_OF_STOCK"
          ? "Some items are out of stock. Please review your cart."
          : err.data?.detail || err.message || "Order failed. Please try again.";
        if (errEl) { errEl.textContent = msg; errEl.style.display = "block"; }
      }
    });
  }

  function initPayment() {
    async function pay(provider) {
      if (!pendingOrderId) { Toast.error("No order to pay for."); return; }
      const errEl = document.getElementById("payment-error");
      const btn = document.getElementById(`pay-${provider}`);
      if (btn) { btn.disabled = true; btn.style.opacity = ".6"; }

      try {
        const result = await Payments.initializePayment(pendingOrderId, provider);
        const link = result.payment_link;
        if (link) {
          Modal.close("payment-modal");
          Toast.success("Redirecting to payment…");
          setTimeout(() => { window.location.href = link; }, 600);
        } else {
          Toast.error("No payment link received.");
          if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
        }
      } catch (err) {
        if (errEl) { errEl.textContent = err.message || "Payment initialization failed."; errEl.style.display = "block"; }
        if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
      }
    }

    document.getElementById("pay-flutterwave")?.addEventListener("click", () => pay("flutterwave"));
    document.getElementById("pay-paystack")?.addEventListener("click", () => pay("paystack"));
  }

  async function init() {
    await Layout.init();
    await loadCart();
    initCheckout();
    initPayment();
  }

  return { init };
})();

CartPage.init();
