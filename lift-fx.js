// Lift cards on hover without edge flicker: hover is decided from the card's resting
// position (not the lifted one), so the card never "escapes" the pointer.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var SELECTOR = ".pkg-card";
  var LIFT = 6;
  var raf = 0, lastX = -1, lastY = -1;

  function update() {
    raf = 0;
    [].forEach.call(document.querySelectorAll(SELECTOR), function (c) {
      var r = c.getBoundingClientRect();
      var lifted = c.classList.contains("is-lifted");
      var top = r.top + (lifted ? LIFT : 0), bottom = r.bottom + (lifted ? LIFT : 0);
      var inside = lastX >= r.left && lastX <= r.right && lastY >= top && lastY <= bottom;
      if (inside !== lifted) c.classList.toggle("is-lifted", inside);
    });
  }
  document.addEventListener("pointermove", function (e) {
    lastX = e.clientX; lastY = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  document.addEventListener("pointerleave", function () {
    lastX = lastY = -1;
    if (!raf) raf = requestAnimationFrame(update);
  });
  window.addEventListener("scroll", function () { if (lastX >= 0 && !raf) raf = requestAnimationFrame(update); }, { passive: true });
})();

// Venue heading: a warm pink-orange glow follows the pointer through the letters.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.addEventListener("pointermove", function (e) {
    var h = e.target && e.target.closest ? e.target.closest(".venue-heading") : null;
    if (!h) return;
    h.style.setProperty("--hx", e.clientX + "px");
    h.style.setProperty("--hy", e.clientY + "px");
  }, { passive: true });
})();

// Early Bird ticket: a little morning bird peeks over the top-right corner on hover.
(function () {
  var BIRD =
    '<svg viewBox="0 0 64 60" width="64" height="60" aria-hidden="true">' +
      '<g class="eb-bird-body" stroke="#1e1e1e" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M14 40c0-14 9-24 21-24s19 9 19 20c0 11-9 19-22 19-10 0-18-6-18-15z" fill="#fbbc05"/>' +
        '<path d="M24 44c3 5 9 7 15 6" fill="none"/>' +
        '<path class="eb-bird-wing" d="M30 36c5-1 11 2 12 8-6 2-11 0-12-8z" fill="#f9a800"/>' +
        '<path d="M53 30l9 3-9 4z" fill="#ea4335"/>' +
        '<path d="M33 16c-1-5 2-9 6-10-1 4 1 7 3 9" fill="none"/>' +
      '</g>' +
      '<circle class="eb-bird-eye" cx="45" cy="28" r="2.6" fill="#1e1e1e"/>' +
      '<circle cx="45.9" cy="27.1" r="0.8" fill="#fff"/>' +
    '</svg>' +
    '<span class="eb-note eb-note-1">♪</span><span class="eb-note eb-note-2">♫</span>';

  function setup() {
    [].forEach.call(document.querySelectorAll(".ticket-wrap"), function (w) {
      if (w.dataset.ebBird) return;
      var head = w.querySelector(".ticket-head span, .ticket-head p");
      if (!head || !/early\s*bird|lève-tôt|early/i.test(w.textContent.slice(0, 40))) return;
      w.dataset.ebBird = "1";
      w.classList.add("eb-ticket");
      var b = document.createElement("span");
      b.className = "eb-bird";
      b.innerHTML = BIRD;
      w.insertBefore(b, w.firstChild);
    });
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();

// "Join us in Luxembourg" (blue register block): a field of code glyphs that wakes up
// around the pointer — glyphs near the cursor light up in Google colours, grow and
// scramble like a terminal, then settle back into a faint grid.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var GLYPHS = "{}<>/;=()[]#*+-&|!?:01".split("");
  var COLORS = ["#ffffff", "#fbbc05", "#34a853", "#ea4335", "#8ab4f8"];
  var STEP = 30, RADIUS = 150;

  function setup(box) {
    if (box.dataset.codeFx) return;
    box.dataset.codeFx = "1";
    box.classList.add("code-fx");
    var c = document.createElement("canvas");
    c.className = "code-fx-canvas";
    c.setAttribute("aria-hidden", "true");
    box.insertBefore(c, box.firstChild);
    var ctx = c.getContext("2d"), cells = [], W = 0, H = 0, mx = -9999, my = -9999, on = false, energy = 0, raf = 0;

    function build() {
      var r = box.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      for (var y = STEP / 2; y < H; y += STEP) for (var x = STEP / 2; x < W; x += STEP) {
        cells.push({ x: x, y: y, g: GLYPHS[(Math.random() * GLYPHS.length) | 0], heat: 0, col: COLORS[(Math.random() * COLORS.length) | 0] });
      }
    }
    function frame() {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var alive = false;
      energy += ((on ? 1 : 0) - energy) * 0.08;
      for (var i = 0; i < cells.length; i++) {
        var k = cells[i], dx = k.x - mx, dy = k.y - my, d = Math.sqrt(dx * dx + dy * dy);
        var target = on ? Math.max(0, 1 - d / RADIUS) : 0;
        k.heat += (target - k.heat) * 0.18;
        if (k.heat > 0.02) {
          alive = true;
          if (Math.random() < k.heat * 0.18) k.g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          if (Math.random() < 0.01) k.col = COLORS[(Math.random() * COLORS.length) | 0];
        }
        var a = 0.07 * energy + k.heat * 0.85;
        if (a < 0.01) continue;
        var size = 13 + k.heat * 9;
        // glyphs drift slightly away from the cursor, like a magnetic field
        var push = k.heat * 8, ox = d ? (dx / d) * push : 0, oy = d ? (dy / d) * push : 0;
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = k.heat > 0.15 ? k.col : "#ffffff";
        ctx.font = "700 " + size.toFixed(1) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(k.g, k.x + ox, k.y + oy);
      }
      ctx.globalAlpha = 1;
      if (alive || energy > 0.01) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    box.addEventListener("pointerenter", function () { if (!cells.length) build(); on = true; kick(); });
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; kick();
    });
    box.addEventListener("pointerleave", function () { on = false; mx = my = -9999; kick(); });
    window.addEventListener("resize", function () { cells = []; });
  }
  function scan() {
    var sec = document.getElementById("register");
    var box = sec && sec.querySelector(".rounded-3xl");
    if (box) setup(box);
  }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scan);
  scan();
})();
