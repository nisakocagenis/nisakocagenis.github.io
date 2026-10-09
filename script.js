/* ---------- Scroll reveal + counters ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    entry.target.querySelectorAll(".count").forEach(countUp);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 0.08}s`;
  observer.observe(el);
});

function countUp(el) {
  const target = +el.dataset.to;
  let n = 0;
  const step = () => { el.textContent = n; if (n++ < target) setTimeout(step, 180); };
  step();
}

/* ---------- Nav: background on scroll + active link ---------- */
const nav = document.getElementById("nav");
const links = [...document.querySelectorAll(".nav nav a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
function onScroll() {
  nav.classList.toggle("scrolled", scrollY > 30);
  let current = -1;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === current));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const menu = document.getElementById("menu");
const burger = document.getElementById("burger");
burger.addEventListener("click", () => {
  menu.classList.toggle("open");
  burger.classList.toggle("open");
});
links.forEach((a) => a.addEventListener("click", () => {
  menu.classList.remove("open");
  burger.classList.remove("open");
}));

/* ---------- Project videos: shown only if the file exists ---------- */
document.querySelectorAll(".auto-video").forEach((video) => {
  video.addEventListener("loadeddata", () => {
    video.classList.add("ready");
    video.play().catch(() => {});
  });
  video.addEventListener("error", () => video.remove());
});

/* ---------- Copy email ---------- */
const toast = document.getElementById("toast");
document.getElementById("copyEmail").addEventListener("click", async (e) => {
  const email = e.currentTarget.dataset.email;
  try { await navigator.clipboard.writeText(email); toast.textContent = "Email copied"; }
  catch { toast.textContent = email; }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
});
