/* ============================
   Mount AAAH — Site Controller
   ============================ */

const CONFIG = (window.SITE_CONFIG || {
  links: {
    roblox: "#",
    discord: "#",
    donate: "#",
    trailer: "#",
  },
  robloxPlaceId: "",
});

/* ----- Link Hydration ----- */
function hydrateLinks() {
  const els = document.querySelectorAll("[data-link]");
  els.forEach((el) => {
    const key = el.getAttribute("data-link");
    const url = CONFIG.links[key];
    if (!url) return;

    el.setAttribute("href", url);

    if (el.hasAttribute("data-external")) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noreferrer");
    }
  });
}

/* ----- Footer Year ----- */
function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* =========================
   Mobile Menu (NEW)
   ========================= */
function initMobileMenu() {
  const nav = document.querySelector("header.nav");
  if (!nav) return;

  const toggle = nav.querySelector("[data-nav-toggle]");
  const drawer = nav.querySelector("[data-nav-drawer]");
  const overlay = document.querySelector("[data-nav-overlay]");

  if (!toggle || !drawer || !overlay) return;

  // copy desktop links into drawer (single source of truth)
  const desktopLinks = nav.querySelector(".nav__links");
  if (desktopLinks && drawer.childElementCount === 0) {
    const links = Array.from(desktopLinks.querySelectorAll("a")).map(a => {
      const clone = a.cloneNode(true);
      // ensure readable tap style
      clone.removeAttribute("class");
      return clone;
    });

    links.forEach((a) => drawer.appendChild(a));
  }

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const isOpen = () => nav.classList.contains("is-open");

  toggle.addEventListener("click", () => {
    if (isOpen()) close();
    else open();
  });

  overlay.addEventListener("click", close);

  // auto close when click any drawer link
  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    close();
  });

  // escape closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // close on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) close();
  });
}

/* =========================
   Assets filter + search UI
   ========================= */
function initAssetsUI() {
  const tabs = document.querySelectorAll(".tab");
  const cards = Array.from(document.querySelectorAll("#assetGrid .product"));
  const search = document.getElementById("assetSearch");

  if (!tabs.length || !cards.length) return;

  function applyFilter(filter) {
    const q = (search?.value || "").trim().toLowerCase();

    cards.forEach((c) => {
      const cat = c.dataset.cat;
      const name = (c.dataset.name || "").toLowerCase();
      const text = c.textContent.toLowerCase();

      const matchCat = (filter === "all") || (cat === filter);
      const matchQ = !q || name.includes(q) || text.includes(q);

      const show = matchCat && matchQ;
      c.style.display = show ? "" : "none";
    });

    const empty = document.getElementById("assetEmpty");
    const anyVisible = cards.some((c) => c.style.display !== "none");
    if (empty) empty.style.display = anyVisible ? "none" : "block";

    const note = document.querySelector(".assetsNote");
    if (note) note.style.display = anyVisible ? "" : "none";
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => {
        x.classList.remove("is-active");
        x.setAttribute("aria-selected", "false");
      });
      t.classList.add("is-active");
      t.setAttribute("aria-selected", "true");
      applyFilter(t.dataset.filter);
    });
  });

  if (search) {
    search.addEventListener("input", () => {
      const active = document.querySelector(".tab.is-active");
      applyFilter(active ? active.dataset.filter : "all");
    });
  }

  const active = document.querySelector(".tab.is-active");
  applyFilter(active ? active.dataset.filter : "all");
}

/* ==================================
   Realtime Roblox "Players Online"
   ================================== */
async function getUniverseIdFromPlaceId(placeId) {
  const url = `https://apis.roblox.com/universes/v1/places/${placeId}/universe`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Universe lookup failed: ${res.status}`);
  const data = await res.json();
  return data.universeId;
}

async function getPlayingFromUniverseId(universeId) {
  const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Games lookup failed: ${res.status}`);
  const data = await res.json();
  const game = data?.data?.[0];

  const playing = game?.playing;
  return Number.isFinite(playing) ? playing : 0;
}

function formatNumber(n) {
  if (typeof n !== "number") return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

async function startRealtimePlayers() {
  const numEl = document.getElementById("livePlayers");
  const labelEl = document.getElementById("livePlayersLabel");
  if (!numEl || !labelEl) return;
  if (!CONFIG.robloxPlaceId) return;

  try {
    numEl.textContent = "…";
    labelEl.textContent = "Players Online";

    const universeId = await getUniverseIdFromPlaceId(CONFIG.robloxPlaceId);

    const tick = async () => {
      try {
        const playing = await getPlayingFromUniverseId(universeId);

        numEl.textContent = formatNumber(playing);
        labelEl.textContent = "Players Online";

        if (playing > 0) numEl.classList.add("is-online");
        else numEl.classList.remove("is-online");
      } catch {
        numEl.textContent = "—";
        labelEl.textContent = "Unavailable";
        numEl.classList.remove("is-online");
      }
    };

    await tick();
    setInterval(tick, 30000);
  } catch {
    numEl.textContent = "—";
    labelEl.textContent = "Unavailable";
    numEl.classList.remove("is-online");
  }
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  hydrateLinks();
  setYear();
  initMobileMenu();
  initAssetsUI();
  startRealtimePlayers();
});
