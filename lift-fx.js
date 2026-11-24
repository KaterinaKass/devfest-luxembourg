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
    // the user's own chick drawing: an open-eye frame and a wink frame stacked on top of each other
    '<img class="eb-chick" src="/images/early-bird/chick.webp" alt="" width="192" height="260" decoding="async">' +
    '<img class="eb-chick eb-chick-wink" src="/images/early-bird/chick-wink.webp?v=3" alt="" width="192" height="260" decoding="async">';

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

// "What to Expect" artwork: drawn as inline vector SVG, like the "Who is it for?" images —
// a clean stroked shape, the photo clipped inside it (zooms gently on hover), vector icons.
(function () {
  var K = ' fill="none" stroke="#202124" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  var ART = {
    "technical-content": {
      shape: "M346,1.5 H444 Q462.5,1.5 462.5,19 V146 Q462.5,164 444,164 H346 Q328,164 328,182 V248 Q328,266.5 310,266.5 H19 Q1.5,266.5 1.5,248 V86 Q1.5,68 19,68 H310 Q328,68 328,50 V19 Q328,1.5 346,1.5 Z",
      icons: '<path d="M38,36 A17.6,22 0 0 1 73.2,36 A17.6,22 0 0 1 108.4,36 A17.6,22 0 0 1 143.6,36 A17.6,22 0 0 1 178.8,36"' + K + '/>' +
             '<path d="M209,24 H295 M281,11 Q287,24 295,24 Q287,24 281,37"' + K + '/>' +
             '<path d="M379,189 H368 V251 H379 M419,189 H430 V251 H419 M399,198 V240 M378,219 H420 M384,204 L414,234 M414,204 L384,234"' + K + '/>'
    },
    "community-connections": {
      shape: "M19,1.5 H321 Q339,1.5 339,19 V91 Q339,109 357,109 H444 Q462.5,109 462.5,127 V248 Q462.5,266.5 444,266.5 H19 Q1.5,266.5 1.5,248 V19 Q1.5,1.5 19,1.5 Z",
      icons: '<path d="M388,6 H414 L394,78 H368 Z M420,6 H446 L426,78 H400 Z"' + K + '/>'
    },
    "hands-on-learning": {
      shape: "M108,1.5 H444 Q462.5,1.5 462.5,19 V127 Q462.5,145 444,145 H304 Q286,145 286,163 V248 Q286,266.5 268,266.5 H19 Q1.5,266.5 1.5,248 V207 Q1.5,189 19,189 H72 Q90,189 90,171 V19 Q90,1.5 108,1.5 Z",
      icons: '<circle cx="42" cy="56" r="15"' + K + '/>' +
             '<path d="M33,86 Q58,80 57,104 Q56,124 33,142 L28,136 Q42,122 40,110 Q28,108 28,96 Q28,88 33,86 Z"' + K + '/>' +
             '<path d="M360.5,199.2 A21,21 0 0 1 399.5,199.2 A21,21 0 1 1 399.5,214.8 A21,21 0 0 1 360.5,214.8 A21,21 0 1 1 360.5,199.2 Z"' + K + '/>'
    }
  };
  var n = 0;
  function setup() {
    [].forEach.call(document.querySelectorAll(".devfest-expect-artwork > img"), function (img) {
      var src = img.getAttribute("src") || "";
      var name = Object.keys(ART).filter(function (k) { return src.indexOf("/" + k) !== -1; })[0];
      var box = img.parentElement;
      if (!name || box.dataset.exZoom) return;
      box.dataset.exZoom = "1";
      var a = ART[name], id = "exc" + (++n);
      var html =
        '<svg class="aud-svg ex-svg" viewBox="0 0 464 268" role="img" aria-label="' + (img.alt || "") + '">' +
          '<defs><clipPath id="' + id + '"><path d="' + a.shape + '"/></clipPath></defs>' +
          '<g clip-path="url(#' + id + ')"><image href="/images/devfest-global/' + name + '-photo.webp?v=4" x="0" y="0" width="464" height="268" preserveAspectRatio="xMidYMid slice"/></g>' +
          '<path d="' + a.shape + '"' + K + '/>' + a.icons +
        '</svg>';
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      img.style.display = "none";
      box.classList.add("aud-zoom", "ex-vector");
      box.insertBefore(tmp.firstChild, img);
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

// Smooth scrolling: while the page is actively scrolling, pause looping decorative
// animations (sparkles, glows, gradient flows). Several of them sit inside drop-shadow
// filters (ticket cards), which forces a full repaint of the filtered block every frame.
// They resume ~180ms after scrolling stops, so the effect is invisible.
(function () {
  var root = document.documentElement, t = 0, on = false;
  window.addEventListener("scroll", function () {
    if (!on) { on = true; root.classList.add("is-scrolling"); }
    clearTimeout(t);
    t = setTimeout(function () { on = false; root.classList.remove("is-scrolling"); }, 180);
  }, { passive: true });
})();

// Focus rings only for keyboard navigation (touch/mouse focus never shows them).
(function () {
  var root = document.documentElement;
  document.addEventListener("keydown", function (e) { if (e.key === "Tab") root.classList.add("kbd-nav"); });
  document.addEventListener("pointerdown", function () { root.classList.remove("kbd-nav"); }, { passive: true });
})();

/* Expose the fixed header's current height as --hdr-h so sticky bars can sit right below it */
(function () {
  var root = document.documentElement, raf = 0, last = -1;
  function upd() {
    raf = 0;
    var h = document.querySelector("header.fixed");
    if (!h) return;
    var v = Math.round(h.getBoundingClientRect().height);
    if (v !== last) { last = v; root.style.setProperty("--hdr-h", v + "px"); }
  }
  function q() { if (!raf) raf = requestAnimationFrame(upd); }
  window.addEventListener("resize", q, { passive: true });
  window.addEventListener("scroll", q, { passive: true });
  new MutationObserver(q).observe(document.body, { childList: true, subtree: true });
  q();
})();

/* Spotlight hover for partner tiles and the venue photo: the pointer position drives
   --mx/--my (spotlight + border light) and --rx/--ry (gentle 3D tilt). Mouse/trackpad only. */
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var SEL = ".partner-link > div:first-child, .venue-photo";
  var TILT = { "venue-photo": 3.5 };
  var cur = null, raf = 0, ev = null;
  function paint() {
    raf = 0;
    if (!cur || !ev) return;
    var r = cur.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    var max = cur.classList.contains("venue-photo") ? TILT["venue-photo"] : 7;
    cur.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    cur.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    cur.style.setProperty("--rx", ((0.5 - y) * max).toFixed(2) + "deg");
    cur.style.setProperty("--ry", ((x - 0.5) * max).toFixed(2) + "deg");
  }
  document.addEventListener("pointermove", function (e) {
    var t = e.target.closest && e.target.closest(SEL);
    if (t !== cur) {
      if (cur) { cur.classList.remove("is-spot"); cur.style.removeProperty("--rx"); cur.style.removeProperty("--ry"); }
      cur = t;
      if (cur) cur.classList.add("is-spot");
    }
    ev = e;
    if (cur && !raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener("pointerleave", function () {
    if (cur) { cur.classList.remove("is-spot"); cur.style.removeProperty("--rx"); cur.style.removeProperty("--ry"); cur = null; }
  });
})();
