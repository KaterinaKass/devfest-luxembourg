// After-Party photo galleries: easier navigation on top of the React sliders.
// - tap/click the left or right part of the photo to go back/forward
// - mouse drag on the compact (fade) slider, which only had touch swipe
// - horizontal trackpad swipe
// - keyboard arrows for the gallery that is on screen
// - autoplay pauses while the pointer is over a gallery ([data-gal-hover] is read by the app)
(function () {
  function arrow(stage, dir) { return stage.querySelector('.gal-arrow[data-dir="' + dir + '"]'); }
  function go(stage, dir) { var b = arrow(stage, dir); if (b) b.click(); }

  function bind(stage) {
    if (stage.dataset.galFx) return;
    stage.dataset.galFx = "1";
    var fade = stage.classList.contains("gal-stage-fade");
    var down = null, lastWheel = 0;

    stage.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") stage.setAttribute("data-gal-hover", ""); });
    stage.addEventListener("pointerleave", function () { stage.removeAttribute("data-gal-hover"); });

    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest("button")) { down = null; return; }
      down = { x: e.clientX, y: e.clientY, t: Date.now(), type: e.pointerType };
    });
    window.addEventListener("pointerup", function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y, d = down; down = null;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Date.now() - d.t < 500) {
        // a tap: left 40% goes back, right 60% goes forward
        var r = stage.getBoundingClientRect();
        go(stage, (e.clientX - r.left) < r.width * 0.4 ? "prev" : "next");
      } else if (fade && d.type === "mouse" && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        go(stage, dx < 0 ? "next" : "prev");
      }
    });

    stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) < 20 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.2) return;
      e.preventDefault();
      var now = Date.now();
      if (now - lastWheel < 550) return;
      lastWheel = now;
      go(stage, e.deltaX > 0 ? "next" : "prev");
    }, { passive: false });
  }

  function visibleStage() {
    var best = null, bestArea = 0;
    [].forEach.call(document.querySelectorAll(".gal-stage"), function (s) {
      var r = s.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      var h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      var a = (w * h) / (r.width * r.height);
      if (a > 0.5 && a > bestArea) { best = s; bestArea = a; }
    });
    return best;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('[role="dialog"]')) return;
    var s = visibleStage();
    if (!s) return;
    e.preventDefault();
    go(s, e.key === "ArrowLeft" ? "prev" : "next");
  });

  function scan() { [].forEach.call(document.querySelectorAll(".gal-stage"), bind); }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scan);
  scan();
})();
