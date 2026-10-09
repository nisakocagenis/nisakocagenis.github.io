const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Typing effect ---------- */
const roles = ["Full-Stack Developer", "React & Vue.js Lover", ".NET 8 API Builder", "AI-Assisted Creator", "Computer Engineer-to-be"];
const typed = document.getElementById("typed");
let roleIndex = 0, charIndex = roles[0].length, deleting = true;
function type() {
  const word = roles[roleIndex];
  typed.textContent = word.slice(0, charIndex);
  if (deleting) {
    charIndex--;
    if (charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; }
  } else {
    charIndex++;
    if (charIndex > roles[roleIndex].length) { deleting = true; setTimeout(type, 1800); return; }
  }
  setTimeout(type, deleting ? 45 : 85);
}
if (!reduceMotion) setTimeout(type, 2200);

/* ---------- Scroll reveal + counters ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    entry.target.querySelectorAll(".count").forEach(countUp);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  observer.observe(el);
});

function countUp(el) {
  const target = +el.dataset.to;
  let n = 0;
  const step = () => { el.textContent = n; if (n++ < target) setTimeout(step, 220); };
  step();
}

/* ---------- Scroll progress, active nav link, back-to-top ---------- */
const progress = document.getElementById("progress");
const toTop = document.getElementById("toTop");
const links = [...document.querySelectorAll(".nav nav a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${(scrollY / max) * 100}%`;
  toTop.classList.toggle("show", scrollY > 600);
  let current = 0;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight / 3) current = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === current && scrollY > 300));
}, { passive: true });

/* ---------- Mobile menu ---------- */
const menu = document.getElementById("menu");
document.getElementById("burger").addEventListener("click", () => menu.classList.toggle("open"));
links.forEach((a) => a.addEventListener("click", () => menu.classList.remove("open")));

/* ---------- Mouse spotlight ---------- */
const spotlight = document.getElementById("spotlight");
window.addEventListener("pointermove", (e) => {
  spotlight.style.setProperty("--x", `${e.clientX}px`);
  spotlight.style.setProperty("--y", `${e.clientY}px`);
});

/* ---------- 3D tilt cards (mouse only) ---------- */
if (!reduceMotion && matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* ---------- Project videos: show only if the file exists ---------- */
document.querySelectorAll(".auto-video").forEach((video) => {
  video.addEventListener("loadeddata", () => {
    video.classList.add("ready");
    video.parentElement.querySelector(".art-emoji")?.remove();
    video.play().catch(() => {});
  });
  video.addEventListener("error", () => video.remove());
});

/* ---------- Copy email + toast ---------- */
const toast = document.getElementById("toast");
document.getElementById("copyEmail").addEventListener("click", async (e) => {
  const email = e.currentTarget.dataset.email;
  try { await navigator.clipboard.writeText(email); toast.textContent = "Email copied! 🎉"; }
  catch { toast.textContent = email; }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
});

/* ---------- Confetti ---------- */
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
const colors = ["#ff4fd8", "#8b5cff", "#22d3ee", "#ff9f43", "#ffd93d", "#4ade80"];
let pieces = [];
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
window.addEventListener("resize", resize);

function burst(x, y) {
  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    pieces.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5,
      size: 5 + Math.random() * 6, rot: Math.random() * 6, vr: Math.random() * 0.3 - 0.15,
      color: colors[i % colors.length], life: 90 + Math.random() * 40,
    });
  }
  if (pieces.length === 90) requestAnimationFrame(draw);
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((p) => {
    p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(p.life / 60, 0);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  pieces = pieces.filter((p) => p.life > 0 && p.y < canvas.height + 20);
  if (pieces.length) requestAnimationFrame(draw);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}
if (!reduceMotion) {
  document.querySelectorAll(".confetti-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => burst(e.clientX, e.clientY)));
}
