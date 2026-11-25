// About section stat cards (200+ / 25 / 2): count-up on reveal, 3D tilt with a glare
// that follows the pointer, and a shared spotlight across the grid so neighbouring
// cards light up their edges as the pointer moves near them.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // The digits get a fixed width (final digit count) and the suffix ("+") is shown from the
  // start, so nothing jumps while counting. Only one text node's data changes per frame
  // (a characterData change), which does not wake the page's childList MutationObservers.
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    var txt = el.textContent.trim(), m = txt.match(/^(\d+)(.*)$/);
    if (!m || reduce) return;
    var target = +m[1], suffix = m[2], t0 = 0, last = -1, dur = 1300 + Math.min(target, 200) * 3;
    var digits = document.createElement("span");
    digits.className = "stat-digits";
    var node = document.createTextNode(m[1]);
    digits.appendChild(node);
    el.textContent = "";
    el.appendChild(digits);
    // reserve exactly the width of the final number (measured, so tight tracking is respected)
    digits.style.minWidth = digits.getBoundingClientRect().width + "px";
    node.data = "0";
    if (suffix) {
      var s = document.createElement("span");
      s.className = "stat-suffix";
      s.textContent = suffix;
      el.appendChild(s);
    }
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      var v = Math.round(target * e);
      if (v !== last) { node.data = String(v); last = v; }
      if (p < 1) requestAnimationFrame(tick);
      else digits.style.minWidth = "";   // done: let the number size itself (rotation, resize)
    }
    requestAnimationFrame(tick);
  }

  function setup(grid) {
    if (grid.dataset.fx) return;
    grid.dataset.fx = "1";
    grid.classList.add("stat-fx");
    var cards = [].slice.call(grid.querySelectorAll(".devfest-stat-card"));
    cards.forEach(function (c, i) {
      if (!c.querySelector(".stat-aurora")) {
        var a = document.createElement("span");
        a.className = "stat-aurora";
        a.setAttribute("aria-hidden", "true");
        a.style.animationDelay = (-i * 2.7) + "s";
        c.insertBefore(a, c.firstChild);
        var g = document.createElement("span");
        g.className = "stat-glare";
        g.setAttribute("aria-hidden", "true");
        c.appendChild(g);
      }
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          [].forEach.call(grid.querySelectorAll(".devfest-stat-number"), function (n, i) {
            setTimeout(function () { countUp(n); }, i * 160);
          });
          grid.classList.add("stat-in");
          io.disconnect();
        });
      }, { threshold: 0.35 });
      io.observe(grid);
    }

    if (!fine || reduce) return;
    grid.addEventListener("pointermove", function (e) {
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty("--mx", x + "px");
        c.style.setProperty("--my", y + "px");
        var inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
        if (inside) {
          var rx = ((y / r.height) - 0.5) * -8, ry = ((x / r.width) - 0.5) * 10;
          c.style.setProperty("--rx", rx.toFixed(2) + "deg");
          c.style.setProperty("--ry", ry.toFixed(2) + "deg");
          c.classList.add("is-hot");
        } else {
          c.style.setProperty("--rx", "0deg");
          c.style.setProperty("--ry", "0deg");
          c.classList.remove("is-hot");
        }
      });
      grid.classList.add("is-tracking");
    });
    grid.addEventListener("pointerleave", function () {
      grid.classList.remove("is-tracking");
      cards.forEach(function (c) {
        c.classList.remove("is-hot");
        c.style.setProperty("--rx", "0deg");
        c.style.setProperty("--ry", "0deg");
      });
    });
  }

  function scan() {
    var g = document.querySelector(".devfest-stat-grid");
    // keep watching: the grid is re-created when you come back to the home page
    if (g && g.querySelector(".devfest-stat-card")) setup(g);
  }
  // the app renders after load; watch until the grid exists
  var mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scan);
  scan();
})();
