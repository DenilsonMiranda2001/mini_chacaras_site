const BANNER_STORAGE_KEY = "miniChacarasBanners";
const fallbackBanner = {
  id: "fallback-institucional",
  title: "Um lugar para viver, conviver e construir histórias.",
  kicker: "Portal oficial",
  text: "Portal institucional e central de comunicação do Condomínio Mini Chácaras do Lago Sul.",
  ctaLabel: "Saiba mais",
  ctaUrl: "#condominio",
  image: "assets/foto-portaria.jpg",
  mobileImage: "",
  alt: "Portaria do Condomínio Mini Chácaras do Lago Sul",
  status: "active",
  priority: "normal",
  order: 999,
  startDate: "",
  endDate: ""
};
const priorityWeight = { high: 3, medium: 2, normal: 1 };
const readBanners = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BANNER_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const todayKey = () => new Date().toISOString().slice(0, 10);
const isInDisplayPeriod = (banner, today = todayKey()) => {
  if (banner.status !== "active") return false;
  if (banner.startDate && banner.startDate > today) return false;
  if (banner.endDate && banner.endDate < today) return false;
  return true;
};
const getActiveBanners = () => {
  const active = readBanners().filter((banner) => isInDisplayPeriod(banner)).sort((a, b) => {
    const priorityDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    return priorityDiff || Number(a.order || 0) - Number(b.order || 0);
  });
  return active.length ? active : [fallbackBanner];
};

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });
menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});
nav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
  }
});

const links = [...document.querySelectorAll(".main-nav a")];
const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-35% 0px -55% 0px" });
sections.forEach((section) => activeObserver.observe(section));

const initPublicBanners = () => {
  const shell = document.querySelector("[data-banner-shell]");
  if (!shell) return;
  const banners = getActiveBanners();
  let index = 0;
  let paused = false;
  let timer = null;
  const image = shell.querySelector("[data-banner-image]");
  const kicker = shell.querySelector("[data-banner-kicker]");
  const title = shell.querySelector("[data-banner-title]");
  const text = shell.querySelector("[data-banner-text]");
  const cta = shell.querySelector("[data-banner-cta]");
  const controls = shell.querySelector("[data-banner-controls]");
  const dots = shell.querySelector("[data-banner-dots]");
  const pause = shell.querySelector("[data-banner-pause]");

  const renderDots = () => {
    dots.innerHTML = "";
    banners.forEach((banner, dotIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar banner ${dotIndex + 1}: ${banner.title}`);
      button.setAttribute("aria-current", String(dotIndex === index));
      button.addEventListener("click", () => { index = dotIndex; render(); });
      dots.append(button);
    });
  };
  const render = () => {
    const banner = banners[index];
    const useMobile = banner.mobileImage && window.matchMedia("(max-width: 640px)").matches;
    image.src = useMobile ? banner.mobileImage : banner.image || fallbackBanner.image;
    image.alt = banner.alt || banner.title || fallbackBanner.alt;
    kicker.textContent = banner.kicker || (banner.priority === "high" ? "Comunicado importante" : "Portal oficial");
    title.textContent = banner.title || fallbackBanner.title;
    text.textContent = banner.text || "";
    cta.hidden = !(banner.ctaLabel && banner.ctaUrl);
    cta.textContent = banner.ctaLabel || "";
    cta.href = banner.ctaUrl || "#";
    if (banners.length > 1) renderDots();
  };
  const go = (direction) => { index = (index + direction + banners.length) % banners.length; render(); };
  shell.querySelector("[data-banner-prev]")?.addEventListener("click", () => go(-1));
  shell.querySelector("[data-banner-next]")?.addEventListener("click", () => go(1));
  pause?.addEventListener("click", () => {
    paused = !paused;
    pause.textContent = paused ? "Retomar" : "Pausar";
    pause.setAttribute("aria-label", paused ? "Retomar rotação" : "Pausar rotação");
  });
  shell.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  });
  if (banners.length > 1) {
    controls.hidden = false;
    timer = window.setInterval(() => { if (!paused) go(1); }, 6500);
  }
  render();
  window.addEventListener("resize", render);
  window.addEventListener("pagehide", () => window.clearInterval(timer));
};
initPublicBanners();
