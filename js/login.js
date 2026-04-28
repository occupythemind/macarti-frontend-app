/**
 * Macarti Gadgets — Login Page JS
 */
(async () => {
  // Redirect if already logged in
  try { await Auth.getAccount(); window.location.href = "/index.html"; return; } catch {}

  // Password toggle
  document.getElementById("toggle-pwd")?.addEventListener("click", () => {
    const pwd = document.getElementById("login-password");
    const icon = document.getElementById("eye-icon");
    if (pwd.type === "password") {
      pwd.type = "text";
      icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    } else {
      pwd.type = "password";
      icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });

  // Login form submit
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn      = document.getElementById("login-btn");
    const errEl    = document.getElementById("login-error");

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block"></span> Signing in…`;
    errEl.style.display = "none";

    try {
      await Auth.login(email, password);
      const redirect = new URLSearchParams(window.location.search).get("next") || "/index.html";
      window.location.href = redirect;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Sign In";
      let msg = err.data?.detail || err.message || "Login failed.";
      if (err.status === 403) {
        const enc = encodeURIComponent(email);
        msg = `Email not verified. <a href="/pages/resend-verify.html?email=${enc}" style="color:var(--blue-500);font-weight:600">Resend verification email →</a>`;
      }
      errEl.innerHTML = msg;
      errEl.style.display = "block";
    }
  });

  // OAuth
  document.getElementById("google-btn")?.addEventListener("click", () => {
    // SUGGESTION: Load Google Identity Services:
    //   <script src="https://accounts.google.com/gsi/client">
    //   google.accounts.id.initialize({ client_id: "YOUR_GOOGLE_CLIENT_ID", callback: async ({credential}) => { await Auth.googleLogin(credential); } });
    //   google.accounts.id.prompt();
    alert("Google OAuth: Integrate Google Identity Services SDK. See comment in login.js.");
  });

  document.getElementById("facebook-btn")?.addEventListener("click", () => {
    // SUGGESTION: Initialize Facebook SDK:
    //   FB.init({ appId: 'YOUR_FB_APP_ID', version: 'v18.0' });
    //   FB.login(response => { if (response.authResponse) Auth.facebookLogin(response.authResponse.accessToken); }, { scope: 'email' });
    alert("Facebook OAuth: Integrate Facebook JavaScript SDK. See comment in login.js.");
  });
})();
