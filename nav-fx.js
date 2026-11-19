// Header menu: a soft pill that glides under the hovered link and rests on the current
// section, plus a Google-colour underline on the active link.
// The app marks the active link with inline styles (blue text, bold); we read that.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  function links(nav) {
    return [].filter.call(nav.children, function (el) {
      return (el.tagName === "A" || el.tagName === "BUTTON") && !el.classList.contains("grad-flow");
    });
  }
  function isActive(el) {
    var fw = el.style.fontWeight;
    return fw === "700" || fw === "bold";
  }

  function setup(nav) {
    if (nav.dataset.navFx) return;
    nav.dataset.navFx = "1";
    nav.classList.add("nav-fx");
    var pill = document.createElement("span");
    pill.className = "nav-pill";
    pill.setAttribute("aria-hidden", "true");
    nav.insertBefore(pill, nav.firstChild);
    var hovered = null;

    function place(el, mode) {
      if (!el) { pill.style.opacity = "0"; return; }
      pill.style.opacity = "1";
      pill.style.width = el.offsetWidth + "px";
      pill.style.height = el.offsetHeight + "px";
      pill.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)";
      pill.dataset.mode = mode;
    }
    function active() {
      var a = null;
      links(nav).forEach(function (el) {
        var on = isActive(el);
        el.classList.toggle("is-active", on);
        if (on) a = el;
      });
      return a;
    }
    function refresh() { place(hovered || active(), hovered ? "hover" : "active"); }

    nav.addEventListener("pointerover", function (e) {
      var el = e.target.closest("a,button");
      if (!el || el.parentElement !== nav || el.classList.contains("grad-flow")) return;
      hovered = el; refresh();
    });
    nav.addEventListener("pointerleave", function () { hovered = null; refresh(); });
    new MutationObserver(function (muts) {
      // ignore our own pill updates, react only to the app restyling links
      if (!muts.some(function (m) { return m.target !== pill; })) return;
      if (!hovered) refresh(); else active();
    })
      .observe(nav, { subtree: true, attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", refresh);
    // first paint: no slide-in animation
    pill.classList.add("no-anim");
    refresh();
    requestAnimationFrame(function () { pill.classList.remove("no-anim"); });
  }

  function scan() {
    var nav = document.querySelector(".nav-desktop");
    if (nav) setup(nav);
  }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", scan);
  scan();
})();
