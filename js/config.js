/**
 * Macarti Gadgets — Global Config
 * Edit API_ORIGIN to point to your backend.
 */
const CONFIG = {
  // ─── API ───────────────────────────────────────────────────
  API_ORIGIN: "https://api-sellaris.gleeze.com", // change to http://localhost:8000 for local dev
  API_PREFIX: "/api/v1",

  // ─── App ───────────────────────────────────────────────────
  APP_NAME: "Macarti Gadgets",
  APP_TAGLINE: "Next-Level Tech, Delivered.",
  CURRENCY_DEFAULT: "NGN",

  // ─── Pagination ────────────────────────────────────────────
  PAGE_SIZE_PRODUCTS: 20,
  PAGE_SIZE_ORDERS: 10,
  PAGE_SIZE_CART: 50,

  // ─── Feature flags ─────────────────────────────────────────
  ENABLE_GOOGLE_OAUTH: true,
  ENABLE_FACEBOOK_OAUTH: true,
  ENABLE_APPLE_OAUTH: false,

  // ─── Helpers ───────────────────────────────────────────────
  apiUrl(path) {
    return `${this.API_ORIGIN}${this.API_PREFIX}${path}`;
  },
};

// Currency symbols map
const CURRENCY_SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", CAD: "CA$",
  JPY: "¥", NGN: "₦", GHS: "₵", KES: "KSh",
  ZAR: "R", TZS: "TSh", UGX: "USh", RWF: "RF",
  XAF: "FCFA", XOF: "CFA",
};

function formatPrice(amount, currency = CONFIG.CURRENCY_DEFAULT) {
  const sym = CURRENCY_SYMBOLS[currency] || currency + " ";
  const num = parseFloat(amount);
  if (isNaN(num)) return `${sym}—`;
  return `${sym}${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Payment callback URL ──────────────────────────────────
// Set this as your redirect/callback URL in Flutterwave and Paystack dashboards.
// Flutterwave: Dashboard → Settings → API Keys → Add Redirect URL
// Paystack:    Dashboard → Settings → API Keys & Webhooks → Callback URL
CONFIG.PAYMENT_CALLBACK_URL = "https://your-frontend-domain.com/pages/payment-callback.html";
// For local dev: "http://localhost:3000/pages/payment-callback.html"
