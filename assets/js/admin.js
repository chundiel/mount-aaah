/* ============================
   Mount AAAH — Admin Controller
   Sync-safe with admin.data.js
   ============================ */

(function () {
  "use strict";

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[m]));
  }

  function firstChar(name) {
    const s = String(name || "?").trim();
    return (s[0] || "?").toUpperCase();
  }

  function resolvePrimaryLink(admin) {
    // priority: explicit url > socials.discord > socials.roblox > null
    if (admin && admin.url) return admin.url;

    const socials = admin && admin.socials ? admin.socials : null;
    if (socials && socials.discord) return socials.discord;
    if (socials && socials.roblox) return socials.roblox;
    return null;
  }

  function getAdminsData() {
    // ✅ single source of truth
    const data = window.ADMIN_DATA;

    if (!Array.isArray(data)) {
      console.warn("[Admin] window.ADMIN_DATA not found or not an array. Check admin.data.js load order/path.");
      return [];
    }

    // normalize objects (avoid crash)
    return data.map((a) => ({
      name: a?.name ?? "Unknown",
      role: a?.role ?? "Staff",
      avatar: a?.avatar ?? "",  // relative path like assets/img/admin-abby.jpg
      url: a?.url ?? "",
      socials: a?.socials ?? {}
    }));
  }

  // ---------- render ----------
  function render(list) {
    const grid = $("adminGrid");
    const empty = $("adminEmpty");
    const q = ( $("adminSearch")?.value || "" ).trim().toLowerCase();

    if (!grid) return;

    const filtered = list.filter((p) => {
      if (!q) return true;
      const name = String(p.name || "").toLowerCase();
      const role = String(p.role || "").toLowerCase();
      return name.includes(q) || role.includes(q);
    });

    grid.innerHTML = filtered.map((p) => {
      const href = resolvePrimaryLink(p);
      const hasLink = !!href;

      const avatarStyle = p.avatar
        ? `style="background-image:url('${escapeHtml(p.avatar)}')"`
        : "";

      const cardInner = `
        <article class="adminCard glass">
          <div class="adminCard__avatar" ${avatarStyle}>${escapeHtml(firstChar(p.name))}</div>
          <div class="adminCard__meta">
            <div class="adminCard__name">${escapeHtml(p.name)}</div>
            <div class="adminCard__role">${escapeHtml(p.role)}</div>
          </div>
          ${hasLink ? `<span class="adminCard__chip">Link</span>` : `<span class="adminCard__chip">No Link</span>`}
        </article>
      `;

      // If link exists, wrap with <a>, else plain div wrapper
      if (hasLink) {
        return `
          <a class="adminCardLink" href="${escapeHtml(href)}" target="_blank" rel="noreferrer"
             aria-label="${escapeHtml(p.name)} link">
            ${cardInner}
          </a>
        `;
      }
      return `<div class="adminCardLink" aria-label="${escapeHtml(p.name)}">${cardInner}</div>`;
    }).join("");

    if (empty) empty.style.display = filtered.length ? "none" : "block";
  }

  // ---------- init (sync-safe) ----------
  function init() {
    const admins = getAdminsData();

    // hard fail UI message if truly empty
    if (!admins.length) {
      const empty = $("adminEmpty");
      if (empty) {
        empty.style.display = "block";
        const desc = empty.querySelector(".assetEmpty__desc");
        if (desc) desc.textContent = "ADMIN_DATA not loaded. Check admin.data.js path + load order.";
      }
    }

    const search = $("adminSearch");
    if (search) search.addEventListener("input", () => render(admins));

    render(admins);
  }

  // Defer-safe init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
