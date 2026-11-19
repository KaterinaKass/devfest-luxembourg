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

