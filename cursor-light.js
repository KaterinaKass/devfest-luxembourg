// Cursor-following light for dark blocks marked with .cursor-light.
// Modelled on figmamakeathon.com: a soft, slightly lighter "liquid" blob with a dim
// coloured glow in its core. It lags behind the pointer, stretches into a comet
// in the direction of travel and relaxes back into a circle when the pointer stops.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GOOGLE = ["66,133,244", "52,168,83", "251,188,5", "234,67,53", "155,92,246"];
  var PINK = ["255,111,216", "249,83,198", "168,85,247", "236,72,153"];
  var active = null;
  var state = new WeakMap();
  var raf = 0;

  function setup(el) {
    var s = state.get(el);
    if (s) return s;
    var tail = document.createElement("div");
    var blob = document.createElement("div");
    tail.className = "cl-tail";
    blob.className = "cl-blob";
    tail.setAttribute("aria-hidden", "true");
    blob.setAttribute("aria-hidden", "true");
    el.insertBefore(blob, el.firstChild);
    el.insertBefore(tail, el.firstChild);
    var colors = el.classList.contains("cursor-light-pink") ? PINK : GOOGLE;
    s = { el: el, blob: blob, tail: tail, colors: colors, tx: 0, ty: 0,
          bx: 0, by: 0, bvx: 0, bvy: 0, lx: 0, ly: 0, lvx: 0, lvy: 0, hue: 0, init: false };
    state.set(el, s);
    return s;
  }

  function shape(node, x, y, vx, vy, k, max) {
    var speed = Math.sqrt(vx * vx + vy * vy);
    var st = Math.min(1 + speed * k, max);
    var ang = Math.atan2(vy, vx) * 180 / Math.PI;
    node.style.transform = "translate(" + x + "px," + y + "px) rotate(" + ang + "deg) scale(" + st + "," + (1 / Math.sqrt(st)) + ")";
  }

  function tick() {
    raf = 0;
    if (!active) return;
    var s = active;
    // spring-damped follow: the blob trails the pointer, the tail trails the blob
    s.bvx = s.bvx * 0.72 + (s.tx - s.bx) * 0.075;
    s.bvy = s.bvy * 0.72 + (s.ty - s.by) * 0.075;
    s.bx += s.bvx; s.by += s.bvy;
    s.lvx = s.lvx * 0.8 + (s.bx - s.lx) * 0.05;
    s.lvy = s.lvy * 0.8 + (s.by - s.ly) * 0.05;
    s.lx += s.lvx; s.ly += s.lvy;

    var C = s.colors;
    s.hue = (s.hue + 0.003) % C.length;
    var i = Math.floor(s.hue), f = s.hue - i;
    var a = C[i].split(","), b = C[(i + 1) % C.length].split(",");
    var rgb = [0, 1, 2].map(function (n) { return Math.round(+a[n] + (+b[n] - +a[n]) * f); }).join(",");
    s.blob.style.setProperty("--cl-rgb", rgb);

    shape(s.blob, s.bx, s.by, s.bvx, s.bvy, 0.035, 1.9);
    shape(s.tail, s.lx, s.ly, s.bx - s.lx, s.by - s.ly, 0.012, 2.8);
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
      active.bx = active.lx = active.tx;
      active.by = active.ly = active.ty;
      active.bvx = active.bvy = active.lvx = active.lvy = 0;
      active.init = true;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener("pointerleave", function () {
    if (active) active.el.classList.remove("cl-on");
    active = null;
  });
})();
