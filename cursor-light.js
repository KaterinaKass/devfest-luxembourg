// Cursor-following light for dark blocks marked with .cursor-light.
// A soft white spot follows the pointer; a larger colour halo trails behind it.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GOOGLE = ["66,133,244", "234,67,53", "251,188,5", "52,168,83", "249,83,198"];
  var PINK = ["249,83,198", "236,72,153", "255,111,216", "168,85,247", "185,29,115"];
  var active = null;
  var state = new WeakMap();
  var raf = 0;

  function setup(el) {
    var s = state.get(el);
    if (s) return s;
    var halo = document.createElement("div");
    var spot = document.createElement("div");
    halo.className = "cl-halo";
    spot.className = "cl-spot";
    halo.setAttribute("aria-hidden", "true");
    spot.setAttribute("aria-hidden", "true");
    el.insertBefore(halo, el.firstChild);
    el.insertBefore(spot, el.firstChild);
    var colors = el.classList.contains("cursor-light-pink") ? PINK : GOOGLE;
    s = { el: el, spot: spot, halo: halo, colors: colors, tx: 0, ty: 0, sx: 0, sy: 0, hx: 0, hy: 0, hue: 0, init: false };
    state.set(el, s);
    return s;
  }

  function tick() {
    raf = 0;
    if (!active) return;
    var s = active;
    s.sx += (s.tx - s.sx) * 0.28;
    s.sy += (s.ty - s.sy) * 0.28;
    s.hx += (s.tx - s.hx) * 0.07;
    s.hy += (s.ty - s.hy) * 0.07;
    var C = s.colors;
    s.hue = (s.hue + 0.004) % C.length;
    var i = Math.floor(s.hue), f = s.hue - i;
    var a = C[i].split(","), b = C[(i + 1) % C.length].split(",");
    var rgb = [0, 1, 2].map(function (k) { return Math.round(+a[k] + (+b[k] - +a[k]) * f); }).join(",");
    s.spot.style.transform = "translate(" + s.sx + "px," + s.sy + "px)";
    s.halo.style.transform = "translate(" + s.hx + "px," + s.hy + "px)";
    s.halo.style.setProperty("--cl-rgb", rgb);
    raf = requestAnimationFrame(tick);
  }

  document.addEventListener("pointermove", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".cursor-light") : null;
    if (el !== (active && active.el)) {
      if (active) active.el.classList.remove("cl-on");
      active = el ? setup(el) : null;
      if (active) {
        active.init = false;
        active.el.classList.add("cl-on");
      }
    }
    if (!active) return;
    var r = active.el.getBoundingClientRect();
    active.tx = e.clientX - r.left;
    active.ty = e.clientY - r.top;
    if (!active.init) {
      active.sx = active.hx = active.tx;
      active.sy = active.hy = active.ty;
      active.init = true;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener("pointerleave", function () {
    if (active) active.el.classList.remove("cl-on");
    active = null;
  });
})();
