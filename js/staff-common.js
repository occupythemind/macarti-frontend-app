/**
 * Macarti Gadgets — Staff Common JS
 * Shared helpers used across all staff pages.
 */

// ── Staff auth guard ─────────────────────────────────────────
async function staffGuard() {
  try {
    const user = await Auth.getAccount();
    return user;
  } catch {
    window.location.href = "/pages/login.html?next=" + encodeURIComponent(window.location.pathname);
    return null;
  }
}

// ── Highlight active staff nav link ─────────────────────────
function highlightStaffNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".staff-nav-item[data-page]").forEach(link => {
    const page = link.dataset.page;
    if (path.includes(page)) link.classList.add("active");
    else link.classList.remove("active");
  });
}

// ── Generic staff table pagination ──────────────────────────
function staffRenderPagination(container, data, onPage) {
  if (!container) return;
  container.innerHTML = "";
  if (!data.next && !data.previous) return;
  const wrap = document.createElement("div");
  wrap.className = "pagination";
  if (data.previous) {
    const b = document.createElement("button");
    b.className = "btn btn--outline btn--sm";
    b.textContent = "← Previous";
    b.onclick = () => onPage(data.previous);
    wrap.appendChild(b);
  }
  if (data.count) {
    const info = document.createElement("span");
    info.className = "text-muted";
    info.style.fontSize = ".8125rem";
    info.textContent = `${data.count} total`;
    wrap.appendChild(info);
  }
  if (data.next) {
    const b = document.createElement("button");
    b.className = "btn btn--outline btn--sm";
    b.textContent = "Next →";
    b.onclick = () => onPage(data.next);
    wrap.appendChild(b);
  }
  container.appendChild(wrap);
}

// ── Confirm delete helper ────────────────────────────────────
async function confirmDelete(message, onConfirm) {
  if (!confirm(message)) return;
  await onConfirm();
}

// ── Build staff page skeleton with sidebar active ────────────
document.addEventListener("DOMContentLoaded", () => {
  highlightStaffNav();
});
