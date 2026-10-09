/* =========================================================
   Pixel Nisa: a tiny game character that walks around the site.
   Controls: ← → (or A / D) walk, ↑ / W / Space jump,
   click or tap anywhere empty to send her there, click her to say hi.
   ========================================================= */
(() => {
  // Outfit from the photo: light blue crop tee with navy striped sleeves,
  // light-wash wide-leg jeans, black shoulder bag, white & brown sneakers
  const PALETTE = {
    O: "#2e2130", // outline
    H: "#7b5338", // hair
    h: "#b88a5e", // hair highlights / lighter ends
    S: "#f6d3b6", // skin
    s: "#e6b394", // skin shadow
    E: "#2e2130", // eyes
    M: "#f4a6a6", // blush
    R: "#d0707a", // smile
    T: "#e4edfb", // light blue tee
    t: "#c6d4ee", // tee shadow
    N: "#26315e", // navy sleeves
    w: "#ffffff", // white sleeve stripes
    L: "#232129", // black bag and strap
    J: "#a9c5e2", // light-wash jeans
    j: "#87a6ca", // jeans shadow
    X: "#f7f4ee", // sneaker white
    Z: "#5b3a2e", // sneaker brown
  };

  // 16 x 26 sprite, facing right. "." = transparent.
  const BODY = [
    ".....OOOOOO.....",
    "...OOHHHHHHOO...",
    "..OHHHHHHHHHHO..",
    ".OHHHHhhHHHHHHO.",
    ".OHHHHSSSSSHHHO.",
    ".OHHHSSSSSSSHHO.",
    ".OHHSSESSSESSHO.",
    ".OHSSSESSSESSHO.",
    ".OHSSMSSSSSMSHO.",
    ".OHSSSSSRRSSSHO.",
    ".OHhsSSSSSSshHO.",
    ".OhHHsSSSSsHHhO.",
    ".ONwhhTTTThhwNO.",
    ".ONwhTTTTTThwNO.",
    ".OSLTTTTTTTtOSO.",
    ".OSLTTTTTTttOSO.",
    ".LLLSSSSSSSSOSO.",
    ".LLLJJJJJJJJOsO.",
    ".OOOJJJJJJJJO...",
    "...OJJJJJJJJO...",
    "...OJJJjjJJJO...",
  ];
  const LEGS = {
    stand: ["...OJJJOOJJJO...", "...OJJjOOjJJO...", "...OJJJOOJJJO...", "...OXZXOOXZXO...", "...OOOO..OOOO..."],
    stride: ["...OJJJOOJJJO...", "..OJJJO..OJJJO..", "..OJJjO..OjJJO..", ".OXZXO....OXZXO.", ".OOOO......OOOO."],
    liftR: ["...OJJJOOJJJO...", "...OJJJOOJJJO...", "...OJJjOOXZXO...", "...OXZXO.OOOO...", "...OOOO........."],
  };
  LEGS.liftL = LEGS.liftR.map((row) => [...row].reverse().join(""));
  LEGS.jump = ["...OJJJOOJJJO...", "...OJJjOOjJJO...", "...OXZXOOXZXO...", "...OOOOOOOOOO...", "................"];

  const W = 16, H = 26;
  const scale = innerWidth < 600 ? 3 : 4;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const player = document.getElementById("player");
  const canvas = document.getElementById("sprite");
  const shadow = document.getElementById("shadow");
  const bubble = document.getElementById("bubble");
  const hint = document.getElementById("gameHint");
  const toggle = document.getElementById("gameToggle");
  const ctx = canvas.getContext("2d");
  canvas.width = W * scale;
  canvas.height = H * scale;

  function draw(legs, facing, blink) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rows = BODY.concat(legs);
    rows.forEach((row, y) => {
      for (let x = 0; x < W; x++) {
        let c = row[x];
        if (c === ".") continue;
        if (blink && c === "E") c = "s";
        ctx.fillStyle = PALETTE[c];
        const dx = facing === 1 ? x : W - 1 - x;
        ctx.fillRect(dx * scale, y * scale, scale, scale);
      }
    });
  }

  // ---------- State ----------
  const SPEED = 170, JUMP = 430, GRAVITY = 1500;
  const spriteW = W * scale;
  let x = Math.max(20, innerWidth * 0.08), y = 0, vy = 0, facing = 1;
  let target = null, keys = new Set(), walkClock = 0, lastInput = performance.now();
  let blinkUntil = 0, nextBlink = performance.now() + 2500, idleSince = performance.now();

  // ---------- Speech bubble ----------
  let bubbleTimer;
  function say(text, ms = 3200) {
    bubble.textContent = text;
    bubble.classList.add("show");
    placeBubble();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("show"), ms);
  }
  function placeBubble() {
    // keep the bubble inside the screen
    const bw = bubble.offsetWidth;
    const center = x + spriteW / 2;
    let shift = 0;
    if (center - bw / 2 < 10) shift = 10 - (center - bw / 2);
    if (center + bw / 2 > innerWidth - 10) shift = innerWidth - 10 - (center + bw / 2);
    bubble.style.marginLeft = `${shift}px`;
    bubble.style.setProperty("--tail", `${50 - (shift / bw) * 100}%`);
  }

  const lines = {
    home: "Hi, I'm Nisa! Walk me with ← →",
    about: "That's me! 4th-year CE student",
    experience: "3 internships and counting!",
    work: "Hover the screenshots ✨",
    skills: "My toolbox 🧰",
    education: "Two programs at once ☕",
    contact: "Say hi, I'd love to hear from you!",
  };
  const clickLines = ["Hey there! 👋", "Wheee!", "Need a full-stack dev?", "Thanks for visiting!", "Check out UniRide!"];
  let lastSaid = 0;
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && performance.now() - lastSaid > 2500 && lines[e.target.id]) {
        lastSaid = performance.now();
        say(lines[e.target.id]);
      }
    });
  }, { threshold: 0.35 });
  Object.keys(lines).forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  // ---------- Input ----------
  const isTyping = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  addEventListener("keydown", (e) => {
    if (isTyping(e) || document.body.classList.contains("game-hidden")) return;
    const k = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "a", "d"].includes(k)) { keys.add(k); target = null; lastInput = performance.now(); }
    if (["arrowup", "w", " "].includes(k)) { e.preventDefault(); jump(); lastInput = performance.now(); }
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  function jump() { if (y === 0) vy = JUMP; }

  // Click/tap on empty space: walk there
  document.addEventListener("click", (e) => {
    if (document.body.classList.contains("game-hidden")) return;
    if (e.target.closest("a, button, input, textarea, video, .game-hint, canvas, .p-media")) return;
    if (getSelection().toString()) return;
    target = Math.min(Math.max(e.clientX - spriteW / 2, 0), innerWidth - spriteW);
    lastInput = performance.now();
  });

  canvas.addEventListener("click", (e) => {
    e.stopPropagation();
    jump();
    say(clickLines[Math.floor(Math.random() * clickLines.length)], 2200);
    lastInput = performance.now();
  });

  // Show/hide toggle (remembered per browser)
  function setHidden(hidden) {
    document.body.classList.toggle("game-hidden", hidden);
    toggle.textContent = hidden ? "Show pixel me" : "Hide me";
    try { localStorage.setItem("pixelHidden", hidden ? "1" : "0"); } catch {}
  }
  toggle.addEventListener("click", () => setHidden(!document.body.classList.contains("game-hidden")));
  try { if (localStorage.getItem("pixelHidden") === "1") setHidden(true); } catch {}
  if (matchMedia("(hover: none)").matches) document.getElementById("hintText").textContent = "Tap to walk me · tap me to jump";

  // ---------- Autopilot: wander when nobody is playing ----------
  function autopilot(now) {
    if (reduceMotion || target !== null || keys.size || now - lastInput < 8000) return;
    if (now - idleSince > 2500 + Math.random() * 4000) {
      target = Math.random() * (innerWidth - spriteW);
      if (Math.random() < 0.25) setTimeout(jump, 400);
    }
  }

  // ---------- Game loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    let dir = 0;
    if (keys.has("arrowleft") || keys.has("a")) dir = -1;
    if (keys.has("arrowright") || keys.has("d")) dir = 1;
    if (!dir && target !== null) {
      if (Math.abs(target - x) < 4) target = null;
      else dir = target > x ? 1 : -1;
    }

    if (dir) {
      facing = dir;
      x += dir * SPEED * dt;
      walkClock += dt;
      idleSince = now;
    } else {
      walkClock = 0;
    }
    x = Math.min(Math.max(x, 0), innerWidth - spriteW);

    // jumping
    if (y > 0 || vy > 0) {
      vy -= GRAVITY * dt;
      y = Math.max(0, y + vy * dt);
      if (y === 0) vy = 0;
    }

    // blinking
    if (now > nextBlink) { blinkUntil = now + 140; nextBlink = now + 2500 + Math.random() * 3000; }

    // pick the frame
    let legs = LEGS.stand, bob = 0;
    if (y > 0) legs = LEGS.jump;
    else if (dir) {
      const f = Math.floor(walkClock * 9) % 4;
      legs = [LEGS.stride, LEGS.liftR, LEGS.stride, LEGS.liftL][f];
      bob = f % 2 ? scale : 0;
    } else if (Math.floor(now / 600) % 2) bob = scale / 2; // gentle breathing

    draw(legs, facing, now < blinkUntil);
    player.style.transform = `translate3d(${x}px, ${-y - bob}px, 0)`;
    shadow.style.transform = `translateX(-50%) translateY(${y + bob}px) scale(${1 - Math.min(y, 120) / 200})`;
    if (bubble.classList.contains("show")) placeBubble();

    autopilot(now);
    requestAnimationFrame(loop);
  }

  setTimeout(() => hint.classList.add("collapsed"), 9000);
  hint.addEventListener("mouseenter", () => hint.classList.remove("collapsed"));

  draw(LEGS.stand, 1, false);
  requestAnimationFrame(loop);
  setTimeout(() => say(matchMedia("(hover: none)").matches ? "Hi, I'm Nisa! Tap to move me" : lines.home, 4200), 1200);
})();
