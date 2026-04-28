/**
 * Macarti Gadgets — Shared Layout (Navbar + Footer)
 * Call Layout.init() on every page.
 */

const Layout = {
  navHTML() {
    return `
    <nav class="navbar" id="main-nav">
      <div class="container navbar__inner">
        <a href="/index.html" class="navbar__logo">
          <div class="logo-mark">
            <!-- BRAND LOGO: replace with <img src="/assets/logo.svg" alt="Macarti"> -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <span class="logo-text">Macarti<span>.</span></span>
        </a>

        <div class="navbar__search">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" id="nav-search" placeholder="Search products, brands…" autocomplete="off">
          <span class="search-clear" id="nav-search-clear" title="Clear">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </span>
        </div>

        <nav class="navbar__nav" id="nav-links">
          <a href="/index.html" class="nav-link" data-nav="home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </a>
          <a href="/pages/catalog.html" class="nav-link" data-nav="catalog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            Products
          </a>

          <div class="nav-divider"></div>

          <!-- Wishlist -->
          <a href="/pages/wishlist.html" class="nav-icon-btn" title="Wishlist" data-nav="wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </a>

          <!-- Cart -->
          <a href="/pages/cart.html" class="nav-icon-btn" title="Cart" data-nav="cart" style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="cart-badge" style="display:none">0</span>
          </a>

          <div class="nav-divider"></div>

          <!-- Guest links -->
          <div data-auth-show="guest" style="display:flex;align-items:center;gap:4px">
            <a href="/pages/login.html" class="btn btn--outline btn--sm">Sign in</a>
            <a href="/pages/register.html" class="btn btn--primary btn--sm">Sign up</a>
          </div>

          <!-- Logged-in user -->
          <div class="nav-user" data-auth-show="loggedIn" style="display:none">
            <div class="nav-user__trigger">
              <div class="nav-user__avatar" id="nav-avatar">U</div>
              <span class="nav-username">Account</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="nav-user__dropdown">
              <a href="/pages/account.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                My Account
              </a>
              <a href="/pages/orders.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                My Orders
              </a>
              <a href="/pages/wishlist.html" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                Wishlist
              </a>
              <div data-nav-divider style="height:1px;background:var(--gray-100);margin:4px 0;"></div>
              <div class="dropdown-item danger" id="nav-logout-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </div>
            </div>
          </div>
        </nav>

        <button class="nav-mobile-toggle" id="nav-toggle" aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </nav>`;
  },

  footerHTML() {
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a href="/index.html" class="navbar__logo">
              <div class="logo-mark">
                <!-- BRAND LOGO: replace with <img src="/assets/logo.svg"> -->
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <span class="logo-text">Macarti<span>.</span></span>
            </a>
            <p>Your destination for premium tech gadgets. Fast delivery across Nigeria and West Africa.</p>
          </div>
          <div class="footer__col">
            <h5>Shop</h5>
            <a href="/pages/catalog.html">All Products</a>
            <a href="/pages/catalog.html?category=phones">Smartphones</a>
            <a href="/pages/catalog.html?category=laptops">Laptops</a>
            <a href="/pages/catalog.html?category=accessories">Accessories</a>
            <a href="/pages/catalog.html?category=audio">Audio</a>
          </div>
          <div class="footer__col">
            <h5>Account</h5>
            <a href="/pages/account.html">My Profile</a>
            <a href="/pages/orders.html">Orders</a>
            <a href="/pages/wishlist.html">Wishlist</a>
            <a href="/pages/cart.html">Cart</a>
          </div>
          <div class="footer__col">
            <h5>Support</h5>
            <!-- SUGGESTION: link to actual support/FAQ pages or a helpdesk tool like Freshdesk/Crisp -->
            <a href="#">Help Center</a>
            <a href="#">Track Order</a>
            <a href="#">Returns & Refunds</a>
            <a href="#">Contact Us</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
        <div class="footer__bottom">
          <span>© ${new Date().getFullYear()} Macarti Gadgets. All rights reserved.</span>
          <div class="footer__socials">
            <!-- SUGGESTION: replace hrefs with real social links -->
            <a href="#" title="Instagram" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" title="Twitter / X" aria-label="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" title="Facebook" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>`;
  },

  async init() {
    // Inject navbar
    const navTarget = document.getElementById("nav-root");
    if (navTarget) navTarget.innerHTML = this.navHTML();

    // Inject footer
    const footTarget = document.getElementById("footer-root");
    if (footTarget) footTarget.innerHTML = this.footerHTML();

    // Scroll shadow
    window.addEventListener("scroll", () => {
      const nav = document.getElementById("main-nav");
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });

    // Active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll("[data-nav]").forEach(link => {
      const key = link.dataset.nav;
      if (
        (key === "home"    && (currentPath === "/" || currentPath.endsWith("index.html"))) ||
        (key === "catalog" && currentPath.includes("catalog")) ||
        (key === "cart"    && currentPath.includes("cart")) ||
        (key === "wishlist"&& currentPath.includes("wishlist"))
      ) link.classList.add("active");
    });

    // Mobile toggle
    const toggle = document.getElementById("nav-toggle");
    const links  = document.getElementById("nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
    }

    // Search
    const searchInput = document.getElementById("nav-search");
    const searchClear = document.getElementById("nav-search-clear");
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && searchInput.value.trim()) {
          window.location.href = `/pages/catalog.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }
    if (searchClear && searchInput) {
      searchClear.addEventListener("click", () => { searchInput.value = ""; searchInput.focus(); });
    }

    // Logout
    document.addEventListener("click", async (e) => {
      if (e.target.closest("#nav-logout-btn")) {
        try {
          await Auth.logout();
        } catch {}
        window.location.href = "/pages/login.html";
      }
    });

    // Auth state + cart badge
    await AuthState.load();

    // Set avatar initial
    if (AuthState.isLoggedIn && AuthState.user) {
      const av = document.getElementById("nav-avatar");
      if (av) av.textContent = (AuthState.user.first_name || "U")[0].toUpperCase();
    }

    await CartBadge.refresh();
  },
};
