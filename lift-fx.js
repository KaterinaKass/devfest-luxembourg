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
  // an original round cartoon bird (our own design): pops up grumpy, stares at you, then winks
  var BIRD =
    // original DevFest bird: red round body, Google-colour crest, a "</>" on the tummy
    '<svg viewBox="0 0 72 66" width="72" height="66" aria-hidden="true">' +
      '<g class="eb-bird-body" stroke="#1e1e1e" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M31 13c-3-4-3-8 0-10 3 2 3 6 0 10z" fill="#4285f4"/>' +
        '<path d="M36 12c0-5 2-9 5-10 2 3 0 7-5 10z" fill="#fbbc05"/>' +
        '<path d="M40 14c2-4 6-6 9-5 0 3-4 5-9 5z" fill="#34a853"/>' +
        '<circle cx="36" cy="38" r="24" fill="#ea4335"/>' +
        '<ellipse cx="37" cy="51" rx="13" ry="8" fill="#ffe3dc"/>' +
        '<path class="eb-bird-wing" d="M13 36c-5 2-6 10-1 14 3-3 4-9 1-14z" fill="#c5221f"/>' +
        '<circle cx="28" cy="31" r="7.5" fill="#fff"/>' +
        '<path class="eb-beak-top" d="M30 40c4-3 10-3 14 0l-7 5z" fill="#fbbc05"/>' +
        '<path class="eb-beak-bottom" d="M31 43c4 3 9 3 12 0l-6 5z" fill="#f29900"/>' +
      '</g>' +
      '<path d="M33.5 50.5l-2.5 2 2.5 2M36 55.5l2-6M40.5 50.5l2.5 2-2.5 2" fill="none" stroke="#c5221f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="28.5" cy="32" r="3.4" fill="#1e1e1e"/><circle cx="29.5" cy="31" r="1" fill="#fff"/>' +
      '<g class="eb-eye-r">' +
        '<circle cx="45" cy="31" r="7.5" fill="#fff" stroke="#1e1e1e" stroke-width="2.4"/>' +
        '<circle cx="44.5" cy="32" r="3.4" fill="#1e1e1e"/><circle cx="45.5" cy="31" r="1" fill="#fff"/>' +
      '</g>' +
      '<path class="eb-wink" d="M38.5 32q6.5 4 13 0" fill="none" stroke="#1e1e1e" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path class="eb-brow eb-brow-l" d="M22 22.5l10 3.5" fill="none" stroke="#1e1e1e" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path class="eb-brow eb-brow-r" d="M51 22.5l-10 3.5" fill="none" stroke="#1e1e1e" stroke-width="3.2" stroke-linecap="round"/>' +
      '<ellipse cx="21" cy="41" rx="3.5" ry="2.2" fill="#ff8fb1" opacity="0.85"/>' +
      '<ellipse cx="52" cy="41" rx="3.5" ry="2.2" fill="#ff8fb1" opacity="0.85"/>' +
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
        '<div class="ex-photo-wrap" style="-webkit-mask-image:url(' + base + '-mask.png?v=3);mask-image:url(' + base + '-mask.png?v=3)">' +
          '<img class="ex-photo" src="' + base + '-photo.webp?v=4" alt="" decoding="async">' +
        '</div>' +
        '<img class="ex-frame" src="' + base + '-frame.png?v=2" alt="" decoding="async">';
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

// DevFest brand stickers: tucked into the empty space beside three centred section
// headings (desktop only), slightly tilted like real laptop stickers; they wobble on hover.
(function () {
  var SPOTS = [
    { sec: "speakers", img: "devfest-sticker-braces", side: "l" },
    { sec: "tickets", img: "devfest-sticker-badge", side: "r" },
    { sec: "organizers", img: "devfest-sticker-round", side: "r" },
    { sec: "speakers", img: "devfest-sticker-blue", side: "r", key: "speakers-r" }
  ];
  function setup() {
    SPOTS.forEach(function (s) {
      var h = document.querySelector("#" + s.sec + " h2");
      var box = h && h.parentElement;
      var cls = "site-sticker-" + (s.key || s.sec);
      if (!box || box.querySelector("." + cls)) return;
      box.classList.add("sticker-host");
      var im = document.createElement("img");
      im.className = "site-sticker " + cls + " is-" + s.side;
      im.src = "/images/stickers/" + s.img + ".webp";
      im.alt = "";
      im.setAttribute("aria-hidden", "true");
      im.decoding = "async";
      im.loading = "lazy";
      box.appendChild(im);
    });
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();

// Horizontal DevFest key art as a slow, endless ticker band between the hero and About.
(function () {
  var SRC = "/images/devfest-global/key-art-horizontal.webp";
  function setup() {
    var about = document.getElementById("about");
    if (!about || document.querySelector(".keyart-band")) return;
    var band = document.createElement("div");
    band.className = "keyart-band";
    band.setAttribute("aria-hidden", "true");
    var half = "";
    for (var i = 0; i < 4; i++) half += '<img src="' + SRC + '" alt="" width="2048" height="250" decoding="async">';
    // two identical halves: the track moves by exactly one half, so the loop is seamless
    band.innerHTML = '<div class="keyart-track">' + half + half + "</div>";
    about.parentNode.insertBefore(band, about);
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();

// "Who is it for?" artwork: inline the SVGs so the photo can zoom gently inside its
// shape on hover while the outline and line icons stay put.
(function () {
  var n = 0;
  function setup() {
    [].forEach.call(document.querySelectorAll('.devfest-expect-artwork > img[src*="/audience-"]'), function (img) {
      if (img.dataset.audFx) return;
      img.dataset.audFx = "1";
      fetch(img.getAttribute("src")).then(function (r) { return r.text(); }).then(function (txt) {
        if (!img.isConnected) return;
        var id = "audc" + (++n);
        // clip a wrapper group instead of the image itself, so scaling the image keeps the shape fixed
        txt = txt.replace('id="c"', 'id="' + id + '"')
          .replace(/(<image\b[^>]*?)\sclip-path="url\(#c\)"([^>]*\/>)/, '<g clip-path="url(#' + id + ')">$1$2</g>');
        var box = document.createElement("div");
        box.innerHTML = txt;
        var svg = box.querySelector("svg");
        if (!svg) return;
        svg.removeAttribute("width"); svg.removeAttribute("height");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", img.alt || "");
        svg.classList.add("aud-svg");
        img.style.display = "none";
        img.parentElement.classList.add("aud-zoom");
        img.parentElement.insertBefore(svg, img);
      }).catch(function () {});
    });
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();

// "Join Our Communities": the line-glyph row at the bottom becomes an inline SVG so each
// symbol can move on its own (waves sway, globe spins, arrow nudges, asterisk turns...).
// Animations run only while the row is on screen.
(function () {
  function arc(x0, w, y, dir, n) { // n half-circles, dir 0 = down (U), 1 = up (n)
    var d = "M" + x0 + " " + y, r = w / 2;
    for (var i = 0; i < n; i++) d += "A" + r + " " + (r * 1.22) + " 0 0 " + dir + " " + (x0 + w * (i + 1)) + " " + y;
    return d;
  }
  function arcs(x0, w, y, dir, n, cls) {
    var out = "", r = w / 2;
    for (var i = 0; i < n; i++) {
      var a = x0 + w * i;
      out += '<path class="' + cls + '" style="--i:' + i + '" d="M' + a + " " + y + "A" + r + " " + (r * 1.22) + " 0 0 " + dir + " " + (a + w) + " " + y + '"/>';
    }
    return out;
  }
  var SVG =
    '<svg class="cj-glyphs" viewBox="-4 -4 1090 74" aria-hidden="true" fill="none" stroke="#202020" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<g class="cj-waves">' + arcs(1, 51.25, 17, 0, 4, "cj-wave") + '</g>' +
      '<g class="cj-globe"><circle cx="291" cy="32" r="31"/><ellipse class="cj-meridian" cx="291" cy="32" rx="14" ry="31"/>' +
        '<path d="M260 32H322M264.5 17H317.5M264.5 47H317.5"/></g>' +
      '<g class="cj-arrow"><path d="M383 32H528M506 10Q512 29 529 32Q512 35 506 55"/></g>' +
      '<g class="cj-star"><path d="M612.5 0V65M580 32.5H645M589.5 9.5L635.5 55.5M635.5 9.5L589.5 55.5"/></g>' +
      '<g class="cj-bumps">' + arcs(697, 51.3, 49, 1, 3, "cj-bump") + '</g>' +
      '<g class="cj-parens"><path class="cj-pl" d="M924 3Q896 32 924 61"/><path class="cj-pr" d="M949 3Q977 32 949 61"/></g>' +
      '<g class="cj-heart"><path d="M1048 7L1021 33L1048 59M1061 4Q1081 4 1080 18Q1079 33 1063 33Q1080 33 1080 48Q1080 63 1061 63"/></g>' +
    '</svg>';
  function setup() {
    var img = document.querySelector('.community-join-decoration img[src*="faq-bottom"]');
    if (!img || img.dataset.cj) return;
    img.dataset.cj = "1";
    var box = document.createElement("div");
    box.innerHTML = SVG;
    var svg = box.firstChild;
    img.parentNode.insertBefore(svg, img);
    img.style.display = "none";
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { svg.classList.toggle("is-on", es[0].isIntersecting); }).observe(svg);
    } else svg.classList.add("is-on");
  }
  new MutationObserver(setup).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", setup);
  setup();
})();
