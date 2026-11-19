// Thermal cursor trail for dark blocks marked with .cursor-light.
// Same technique and tuning as the figmamakeathon.com background (re-implemented in
// plain WebGL2): a 256x256 float "draw map" is ping-ponged every frame. The pointer
// writes its motion into RG and heat into B; the previous frame is re-sampled along the
// motion (so the trail smears and swirls) and faded. A display pass maps heat to a
// 7-stop thermal palette; low heat is transparent so the trail sits cleanly on the block.
(function () {
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var CFG = { effectIntensity: 1.2, colorSaturation: 1.5, heatSensitivity: 0.8, heatDecay: 0.96, interactionRadius: 1.5, fadeDamping: 0.98 };
  var PALETTES = {
    thermal: ["#000000", "#202020", "#53d5fd", "#fefcdd", "#ffec6a", "#f9d400", "#a61904"],
    pink: ["#000000", "#26101f", "#a855f7", "#ffe3f5", "#ff9ad8", "#f953c6", "#9c1260"]
  };
  var SIM = 256;

  var VERT = "#version 300 es\nin vec2 aPos; out vec2 vUv;\nvoid main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }";

  var DRAW_FRAG = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D uPrev; uniform vec2 uPos; uniform vec2 uMove; uniform float uAspect;",
    "uniform float uRadius; uniform float uHeat; uniform float uFade;",
    "in vec2 vUv; out vec4 outColor;",
    "void main(){",
    "  vec2 p = vec2(uPos.x, uPos.y / uAspect);",
    "  vec2 q = vec2(vUv.x, vUv.y / uAspect);",
    "  float falloff = 1.0 - smoothstep(-8.0, 0.9, distance(p, q) / uRadius);",
    "  vec2 push = vec2(-uMove.x, uMove.y) * falloff;",
    "  vec4 c = texture(uPrev, vUv + push * 0.01) * uFade;",
    "  c.r += push.x; c.g += push.y;",
    "  c.rg = clamp(c.rg, -1.0, 1.0);",
    "  c.b += uHeat * falloff;",
    "  outColor = vec4(c.rgb, 1.0);",
    "}"
  ].join("\n");

  var SHOW_FRAG = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D uDraw; uniform vec3 uC[7]; uniform float uSize; uniform float uSat; uniform float uIntensity;",
    "in vec2 vUv; out vec4 outColor;",
    "float band(float at, float width, float t){ return smoothstep(at - width * 0.5, at + width * 0.5, t); }",
    "void main(){",
    "  float t = clamp(texture(uDraw, vUv).b * uSize * 1.25, 0.0, 1.0);",
    "  vec3 col = uC[0];",
    "  col = mix(col, uC[1], band(0.40, 1.00, t));",
    "  col = mix(col, uC[2], band(0.70, 1.00, t));",
    "  col = mix(col, uC[3], band(0.81, 0.72, t));",
    "  col = mix(col, uC[4], band(0.91, 0.52, t));",
    "  col = mix(col, uC[5], band(0.80, 0.50, t));",
    "  col = mix(col, uC[6], band(0.87, 0.27, t));",
    "  float lum = dot(col, vec3(0.2126729, 0.7151522, 0.0721750));",
    "  col = clamp(mix(vec3(lum), col, uSat) * uIntensity, 0.0, 1.0);",
    "  // low heat (the reference's black/grey stage) becomes transparent instead of a grey halo",
    "  float a = smoothstep(0.32, 0.64, t);",
    "  outColor = vec4(col * a, a);",
    "}"
  ].join("\n");

  function hex(h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; }

  function program(gl, fs) {
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i), nm = info.name.replace("[0]", ""); u[nm] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }

  function target(gl) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex: tex, fb: fb };
  }

  var sims = [], active = null, raf = 0, last = 0;

  function create(el) {
    for (var i = 0; i < sims.length; i++) if (sims[i].el === el) return sims[i];
    var c = document.createElement("canvas");
    c.className = "cl-canvas";
    c.setAttribute("aria-hidden", "true");
    var gl = c.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
    el.insertBefore(c, el.firstChild);
    var s = { el: el, canvas: c, gl: gl, pos: [0.5, 0.5], prev: [0.5, 0.5], heat: 0, inside: false, idle: 0,
              colors: [].concat.apply([], PALETTES[el.classList.contains("cursor-light-pink") ? "pink" : "thermal"].map(hex)) };
    s.draw = program(gl, DRAW_FRAG);
    s.show = program(gl, SHOW_FRAG);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    s.a = target(gl); s.b = target(gl);
    resize(s);
    sims.push(s);
    return s;
  }

  function resize(s) {
    // the glow is soft, so 1x resolution looks the same and keeps the page responsive
    var r = s.el.getBoundingClientRect(), dpr = 1;
    s.w = r.width; s.h = r.height;
    var W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (s.canvas.width !== W || s.canvas.height !== H) { s.canvas.width = W; s.canvas.height = H; }
    // radius scales with block height like the reference (150px per 500px of height)
    // short blocks get a reasonable minimum so the trail stays visible
    s.radiusPx = 150 * (Math.max(r.height, 460) / 500);
  }

  function frame(s, dt) {
    var gl = s.gl;
    var dx = s.pos[0] - s.prev[0], dy = s.pos[1] - s.prev[1];
    var moving = Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001;
    if (s.inside && moving) s.heat = Math.min(s.heat + CFG.heatSensitivity * dt * 60, 1.3);
    var heatNow = s.heat;
    s.heat *= CFG.heatDecay; if (s.heat < 0.001) s.heat = 0;

    // draw pass: prev (a) -> next (b)
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.b.fb);
    gl.viewport(0, 0, SIM, SIM);
    gl.useProgram(s.draw.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.a.tex);
    gl.uniform1i(s.draw.u.uPrev, 0);
    gl.uniform2f(s.draw.u.uPos, s.pos[0], s.pos[1]);
    gl.uniform2f(s.draw.u.uMove, dx * 10000, dy * 10000);
    gl.uniform1f(s.draw.u.uAspect, s.w / s.h);
    gl.uniform1f(s.draw.u.uRadius, s.radiusPx / s.w);
    gl.uniform1f(s.draw.u.uHeat, heatNow);
    gl.uniform1f(s.draw.u.uFade, CFG.fadeDamping);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    var t = s.a; s.a = s.b; s.b = t;

    // display pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, s.canvas.width, s.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(s.show.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.a.tex);
    gl.uniform1i(s.show.u.uDraw, 0);
    gl.uniform3fv(s.show.u.uC, s.colors);
    gl.uniform1f(s.show.u.uSize, CFG.interactionRadius);
    gl.uniform1f(s.show.u.uSat, CFG.colorSaturation);
    gl.uniform1f(s.show.u.uIntensity, CFG.effectIntensity);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    s.prev[0] = s.pos[0]; s.prev[1] = s.pos[1];
    // keep running ~6s after the pointer leaves so the trail can fade out
    s.idle = s.inside ? 0 : s.idle + dt;
  }

  function loop(now) {
    raf = 0;
    var dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now;
    var running = false;
    for (var i = 0; i < sims.length; i++) {
      var s = sims[i];
      if (s.inside || s.idle < 6) { frame(s, dt); running = true; }
    }
    if (running) raf = requestAnimationFrame(loop); else last = 0;
  }

  document.addEventListener("pointermove", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".cursor-light") : null;
    if (active && active.el !== el) { active.inside = false; active = null; }
    if (!el) return;
    if (!active) {
      active = create(el);
      if (!active) return;
      resize(active);
      active.inside = true; active.idle = 0;
      var r0 = el.getBoundingClientRect();
      active.prev[0] = active.pos[0] = (e.clientX - r0.left) / r0.width;
      active.prev[1] = active.pos[1] = 1 - (e.clientY - r0.top) / r0.height;
    }
    var r = el.getBoundingClientRect();
    active.pos[0] = (e.clientX - r.left) / r.width;
    active.pos[1] = 1 - (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.addEventListener("pointerleave", function () {
    if (active) active.inside = false;
    active = null;
  });

  window.addEventListener("resize", function () { for (var i = 0; i < sims.length; i++) resize(sims[i]); });
})();
