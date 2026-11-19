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
  // an original, round "hungry" cartoon bird: googly eyes and a beak that chomps
  var BIRD =
    '<svg viewBox="0 0 72 66" width="72" height="66" aria-hidden="true">' +
      '<g class="eb-bird-body" stroke="#1e1e1e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M30 10c-2-6 2-9 6-8-2 3 0 5 2 6 1-4 5-6 8-4-3 2-3 4-2 6" fill="#f9a800"/>' +
        '<circle cx="36" cy="38" r="24" fill="#fbbc05"/>' +
        '<path d="M20 50c5 6 12 8 19 7" fill="none" stroke-width="2"/>' +
        '<ellipse class="eb-bird-wing" cx="15" cy="42" rx="6" ry="9" fill="#f9a800"/>' +
        '<circle cx="28" cy="31" r="7.5" fill="#fff"/>' +
        '<circle cx="45" cy="31" r="7.5" fill="#fff"/>' +
        '<path class="eb-beak-top" d="M30 41c4-3 10-3 14 0l-7 5z" fill="#ea4335"/>' +
        '<path class="eb-beak-bottom" d="M31 44c4 3 9 3 12 0l-6 5z" fill="#c5221f"/>' +
      '</g>' +
      '<g class="eb-pupils" fill="#1e1e1e">' +
        '<circle cx="30" cy="32" r="3.4"/><circle cx="47" cy="32" r="3.4"/>' +
      '</g>' +
      '<circle cx="31" cy="31" r="1" fill="#fff"/><circle cx="48" cy="31" r="1" fill="#fff"/>' +
      '<ellipse cx="22" cy="42" rx="3.5" ry="2.2" fill="#ff8fb1" opacity="0.8"/>' +
      '<ellipse cx="51" cy="42" rx="3.5" ry="2.2" fill="#ff8fb1" opacity="0.8"/>' +
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

// "What to Expect" artwork: split into photo + frame layers so the photo can zoom gently
// inside its shape on hover while the outline and line icons stay still.
(function () {
  var NAMES = ["technical-content", "community-connections", "hands-on-learning"];
  function setup() {
    [].forEach.call(document.querySelectorAll(".devfest-expect-artwork > img"), function (img) {
      var src = img.getAttribute("src") || "";
      var name = NAMES.filter(function (n) { return src.indexOf("/" + n + ".png") !== -1 || src.indexOf("/" + n + "-frame.png") !== -1; })[0];
      var box = img.parentElement;
      if (!name || box.dataset.exZoom) return;
      box.dataset.exZoom = "1";
      box.classList.add("ex-zoom");
      var base = "/images/devfest-global/" + name;
      var wrap = document.createElement("div");
      wrap.className = "ex-layers";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML =
        '<div class="ex-photo-wrap" style="-webkit-mask-image:url(' + base + '-mask.png);mask-image:url(' + base + '-mask.png)">' +
          '<img class="ex-photo" src="' + base + '-photo.webp" alt="" decoding="async">' +
        '</div>' +
        '<img class="ex-frame" src="' + base + '-frame.png" alt="" decoding="async">';
      box.appendChild(wrap);
    });
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();

// Venue photo: zoom + a warm yellow-orange light that follows the pointer.
(function () {
  function setup() {
    var img = document.querySelector('img[src*="venue-chamber-of-commerce"]');
    var box = img && img.parentElement;
    if (!box || box.dataset.venueFx) return;
    box.dataset.venueFx = "1";
    box.classList.add("venue-photo");
    box.addEventListener("pointermove", function (e) {
      var r = box.getBoundingClientRect();
      box.style.setProperty("--vx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      box.style.setProperty("--vy", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();
