/* photo3d.js: drives the 3D depth layers styled in photo3d.css.
   Desktop fine pointers with motion allowed only. Sets three custom properties:
   --p3d-mx / --p3d-my (pointer parallax, eased) on visible hosts, and --p3d-k
   (scroll progress) only when CSS scroll-driven animations are unsupported.
   One passive, rAF-throttled scroll listener (fallback only); IntersectionObserver
   limits work to hosts that are on screen. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.requestAnimationFrame) return;
  var mq = window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference) and (min-width:761px)');
  if (!mq.matches) return;

  var nativeScroll = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  var hosts = [];
  function add(el, mode) { if (el) hosts.push({ el: el, mode: mode, on: mode === 'page' }); }

  var home = document.querySelector('.hero--spec');
  document.querySelectorAll('main > .page-hero').forEach(function (el) { add(el, el === el.parentNode.firstElementChild ? 'exit' : 'cover'); });
  add(home, 'exit');
  if (home) {
    add(document.querySelector('main > .seo-intro'), 'cover');
    // The full-page photo + grid live on body::before/::after for no-JS and phones.
    // Here they become two small fixed elements so pointer updates restyle only them.
    ['p3d-page-photo', 'p3d-page-grid'].forEach(function (c) {
      var d = document.createElement('div'); d.className = c; d.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(d, document.body.firstChild); add(d, 'page');
    });
    document.documentElement.classList.add('p3d-split');
  }
  if (!hosts.length) return;
  hosts.forEach(function (h) { h.el.classList.add('p3d-live'); });

  // Only visible hosts are updated.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < hosts.length; i++) if (hosts[i].el === e.target) hosts[i].on = e.isIntersecting;
      });
      request();
    }, { rootMargin: '80px 0px' });
    hosts.forEach(function (h) { if (h.mode !== 'page') io.observe(h.el); });
  } else {
    hosts.forEach(function (h) { h.on = true; });
  }

  var tx = 0, ty = 0, cx = 0, cy = 0, scrollDirty = !nativeScroll, ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function progress(h, vh) {
    if (h.mode === 'page') {
      var max = document.documentElement.scrollHeight - vh;
      return max > 0 ? clamp(window.scrollY / max) : 0;
    }
    var r = h.el.getBoundingClientRect();
    if (h.mode === 'exit') return clamp(-r.top / (r.height || 1));
    return clamp((vh - r.top) / (vh + r.height));
  }

  function frame() {
    ticking = false;
    // Ease the pointer so the photo glides rather than jumps.
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    var moving = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001;
    var vh = window.innerHeight;
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i];
      if (!h.on) continue;
      var s = h.el.style;
      s.setProperty('--p3d-mx', cx.toFixed(4));
      s.setProperty('--p3d-my', cy.toFixed(4));
      if (scrollDirty) s.setProperty('--p3d-k', progress(h, vh).toFixed(4));
    }
    scrollDirty = false;
    if (moving) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('mousemove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
    request();
  }, { passive: true });
  document.addEventListener('mouseleave', function () { tx = 0; ty = 0; request(); });

  if (!nativeScroll) {
    window.addEventListener('scroll', function () { scrollDirty = true; request(); }, { passive: true });
    window.addEventListener('resize', function () { scrollDirty = true; request(); }, { passive: true });
  }
  request();
})();
