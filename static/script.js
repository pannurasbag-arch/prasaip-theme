const button=document.querySelector('.menu');
const nav=document.querySelector('#nav');

button?.addEventListener('click',()=>{const open=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.nav-group>button').forEach(trigger=>trigger.addEventListener('click',event=>{event.stopPropagation();const group=trigger.parentElement;document.querySelectorAll('.nav-group.open').forEach(item=>{if(item!==group){item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')}});const open=group.classList.toggle('open');trigger.setAttribute('aria-expanded',String(open))}));
document.addEventListener('click',event=>{if(!event.target.closest('.nav-group'))document.querySelectorAll('.nav-group.open').forEach(item=>{item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')})});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape') return;
  document.querySelectorAll('.nav-group.open').forEach(item=>{item.classList.remove('open');item.querySelector('button')?.setAttribute('aria-expanded','false')});
  if(nav?.classList.contains('open')){nav.classList.remove('open');button?.setAttribute('aria-expanded','false');button?.focus()}
});

const pageName=(location.pathname.split('/').filter(Boolean).pop()||'index').replace(/\.html$/,'');
if(pageName!=='index'){
  const h1=document.querySelector('h1')?.textContent?.trim();
  const description=document.querySelector('meta[name="description"]')?.content;
  const serviceMap={
    'patent-services':'Patent drafting, prosecution, SEP analysis, claim chart, infringement and licensing services',
    'trademark-services':'Trademark search, registration, prosecution and opposition services',
    'international-patent-support':'US, EP, PCT and international patent support',
    'technology-sectors':'Technology-focused patent services',
    'additional-ip-services':'Copyright, industrial design, geographical indication, semiconductor layout-design and trade-secret services',
    'legal-business-services':'Legal advisory, immigration, incorporation, incubation and intellectual-property training services'
  };
  const graph=[{
    '@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem','position':1,'name':'Home','item':'https://www.prasaip.com/'},
      {'@type':'ListItem','position':2,'name':h1||document.title,'item':document.querySelector('link[rel="canonical"]')?.href||location.href}
    ]
  }];
  const hasServiceSchema=[...document.querySelectorAll('script[type="application/ld+json"]')].some(script=>/"@type"\s*:\s*"Service"/.test(script.textContent));
  if(serviceMap[pageName]&&!hasServiceSchema) graph.push({'@type':'Service','name':serviceMap[pageName],'description':description,'url':document.querySelector('link[rel="canonical"]')?.href||location.href,'provider':{'@type':'LegalService','name':'PRASA IP','url':'https://www.prasaip.com/','telephone':'+91-9113214395'},'areaServed':['India','United States','Europe','International']});
  const structured=document.createElement('script');structured.type='application/ld+json';structured.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});document.head.appendChild(structured);
}

// Measure contact intent without treating a click as a completed enquiry.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="mailto:"],a[href^="tel:"]');
  if(!link||typeof window.gtag!=='function') return;
  const method=link.protocol==='mailto:'?'email':'phone';
  window.gtag('event','contact_click',{contact_method:method,page_location:location.href});
});

// Calm, progressive motion as content enters the viewport.
// Content remains fully visible when JavaScript is unavailable or reduced motion is preferred.
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion&&'IntersectionObserver' in window){
  document.documentElement.classList.add('motion-ready');

  const revealGroups=[
    '.section-intro','.process-title','.seo-intro','.faq-heading','.recognition>div',
    '.cards article','.steps article','.service-list article','.testimonial-grid blockquote',
    '.founder-grid article','.experience-strip>div','.recognition-items>article',
    '.page-cards article','.evidence-grid article','.timeline article','.sector-grid article','.awards-grid article',
    '.blog-card','.key-points','.author-card','.technology-photo','.details>div',
    '.article>h2','.article>h3','.page-footer-cta'
  ];

  const elements=[...document.querySelectorAll(revealGroups.join(','))];
  document.querySelectorAll('.profile-grid').forEach((profile,index)=>{
    profile.classList.add(index%2===0?'reveal-left':'reveal-right');
    elements.push(profile);
  });

  const siblingCounts=new Map();
  elements.forEach(element=>{
    element.classList.add('reveal-on-scroll');
    const parent=element.parentElement;
    const position=siblingCounts.get(parent)||0;
    element.style.setProperty('--reveal-delay',`${Math.min(position,5)*70}ms`);
    siblingCounts.set(parent,position+1);
  });

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -7%'});

  elements.forEach(element=>observer.observe(element));
}

// Hide the header while scrolling down; show it on scroll up, near the top, or when the pointer reaches the top edge.
(function () {
  var header = document.querySelector('.header');
  if (!header) return;
  var lastY = window.scrollY, ticking = false;
  function menuOpen() {
    return !!header.querySelector('nav.open, .nav-group.open') || header.matches(':hover') || header.contains(document.activeElement);
  }
  function update() {
    var y = window.scrollY;
    if (y < 140 || y < lastY - 4) header.classList.remove('header--hidden');
    else if (y > lastY + 4 && !menuOpen()) header.classList.add('header--hidden');
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  document.addEventListener('mousemove', function (e) {
    if (e.clientY < 90) header.classList.remove('header--hidden');
  }, { passive: true });
  header.addEventListener('focusin', function () { header.classList.remove('header--hidden'); });
})();


// ===== Site effects: patent-style 3D figures, card tilt, unfolding steps, reading progress, quick-contact buttons =====
(function () {
  var desktop = window.matchMedia('(min-width:1000px) and (hover:hover) and (prefers-reduced-motion:no-preference)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(parent, tag, attrs, t) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (tag !== 'text' && tag !== 'g') e.setAttribute('pathLength', '1');
    if (t != null) e.style.setProperty('--t', t + 's');
    parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, t, cls) {
    var e = el(parent, 'text', { x: x, y: y }, t);
    if (cls) e.setAttribute('class', cls);
    e.textContent = s;
    return e;
  }
  function gearPath(cx, cy, n, ro, ri, ph) {
    var d = '', st = Math.PI * 2 / n;
    for (var i = 0; i < n; i++) {
      var a = ph + i * st;
      [[ri, a - st * .5], [ri, a - st * .27], [ro, a - st * .15], [ro, a + st * .15], [ri, a + st * .27]].forEach(function (p, j) {
        d += (i || j ? 'L' : 'M') + (cx + p[0] * Math.cos(p[1])).toFixed(1) + ' ' + (cy + p[0] * Math.sin(p[1])).toFixed(1) + ' ';
      });
    }
    return d + 'Z';
  }
  function refs(front, list, figLabel) {
    list.forEach(function (r, j) {
      el(front, 'path', { d: 'M' + (r[0] + (r[0] < 220 ? 16 : -6)) + ' ' + (r[1] - 5) + ' Q ' + ((r[0] + r[3]) / 2) + ' ' + (r[1] + (r[1] < 220 ? -22 : 22)) + ' ' + r[3] + ' ' + r[4], class: 'thin' }, 1.6 + j * .15);
      txt(front, r[0], r[1], r[2], 1.9 + j * .15);
    });
    txt(front, 330, 452, figLabel || 'FIG. 1', 2.6, 'fig');
  }

  var FIG = {
    // AI chip with neural-network die and live circuit traces
    chip: function (back, mid, front) {
      var C = 220, H = 80, P = 10, pitch = 160 / (P + 1), sides = [[0, -1], [1, 0], [0, 1], [-1, 0]], k = 0;
      sides.forEach(function (s, si) {
        for (var i = 1; i <= P; i += 2) {
          var off = -H + i * pitch, sx = C + s[0] * (H + 14) + (s[0] === 0 ? off : 0), sy = C + s[1] * (H + 14) + (s[1] === 0 ? off : 0);
          var run = 30 + ((i * 37 + si * 19) % 50), bend = ((i + si) % 2 ? 1 : -1) * (18 + (i * 11) % 22);
          var mx = sx + s[0] * run, my = sy + s[1] * run, ex = mx + s[0] * 24 + (s[0] === 0 ? bend : 0), ey = my + s[1] * 24 + (s[1] === 0 ? bend : 0);
          ex = Math.max(18, Math.min(422, ex)); ey = Math.max(18, Math.min(442, ey));
          var d = 'M' + sx + ' ' + sy + ' L' + mx + ' ' + my + ' L' + ex.toFixed(1) + ' ' + ey.toFixed(1);
          el(back, 'path', { d: d, class: 'thin' }, .2 + k * .05);
          el(back, 'circle', { cx: ex, cy: ey, r: 4.5 }, .9 + k * .05);
          el(back, 'path', { d: d, class: 'pulse' }, (2.6 + ((k * .37) % 2.4)).toFixed(2));
          k++;
        }
      });
      el(mid, 'rect', { x: C - H, y: C - H, width: 2 * H, height: 2 * H, rx: 10 }, .3);
      el(mid, 'circle', { cx: C - H + 14, cy: C - H + 14, r: 4, class: 'thin' }, .8);
      sides.forEach(function (s) {
        for (var i = 1; i <= P; i++) {
          var off = -H + i * pitch, x = C + s[0] * H + (s[0] === 0 ? off : 0), y = C + s[1] * H + (s[1] === 0 ? off : 0);
          el(mid, 'line', { x1: x, y1: y, x2: x + s[0] * 14, y2: y + s[1] * 14 }, .5 + i * .03);
        }
      });
      el(mid, 'rect', { x: C - 50, y: C - 50, width: 100, height: 100, class: 'thin' }, .7);
      var nodes = [[C - 34, [-30, -10, 10, 30]], [C, [-36, -18, 0, 18, 36]], [C + 34, [-20, 0, 20]]].map(function (l) {
        return l[1].map(function (y) { return [l[0], C + y]; });
      });
      for (var a = 0; a < nodes.length - 1; a++) nodes[a].forEach(function (p) {
        nodes[a + 1].forEach(function (q) { el(mid, 'line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'syn' }, 1.1); });
      });
      var n = 0;
      nodes.forEach(function (l) { l.forEach(function (p) { el(mid, 'circle', { cx: p[0], cy: p[1], r: 4.2, class: 'node' }, 1.4).style.setProperty('--g', (n++ * .29 % 2.2).toFixed(2) + 's'); }); });
      refs(front, [[40, 70, '20', C - H + 8, C - H + 30], [392, 72, '22', C + 38, C - 40], [30, 300, '24', 62, 236], [396, 392, '26', 372, 350], [250, 440, '28', C + 20, C + H + 12]]);
    },
    // Globe with filing routes between offices
    globe: function (back, mid, front) {
      var C = 220, R = 150;
      el(back, 'circle', { cx: C, cy: C, r: R }, .2);
      [120, 80, 36].forEach(function (rx, i) { el(back, 'ellipse', { cx: C, cy: C, rx: rx, ry: R, class: 'thin' }, .4 + i * .15); });
      el(back, 'line', { x1: C, y1: C - R, x2: C, y2: C + R, class: 'thin' }, .9);
      [-100, -50, 0, 50, 100].forEach(function (dy, i) {
        var w = Math.sqrt(R * R - dy * dy);
        el(back, 'ellipse', { cx: C, cy: C + dy, rx: w, ry: w * .16, class: 'thin' }, .5 + i * .12);
      });
      var pts = { US: [128, 178], EP: [236, 142], IN: [300, 236], PCT: [214, 300] };
      var routes = [['IN', 'US'], ['IN', 'EP'], ['EP', 'US'], ['IN', 'PCT'], ['PCT', 'US'], ['PCT', 'EP']], k = 0;
      routes.forEach(function (r) {
        var a = pts[r[0]], b = pts[r[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 60;
        var d = 'M' + a[0] + ' ' + a[1] + ' Q ' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1];
        el(mid, 'path', { d: d }, 1 + k * .12);
        el(mid, 'path', { d: d, class: 'pulse' }, (2.8 + k * .45).toFixed(2));
        k++;
      });
      Object.keys(pts).forEach(function (key, i) {
        el(mid, 'circle', { cx: pts[key][0], cy: pts[key][1], r: 5, class: 'node' }, 1.6).style.setProperty('--g', (i * .5) + 's');
        txt(front, pts[key][0] + 10, pts[key][1] - 10, key, 2 + i * .1, 'tag');
      });
      refs(front, [[40, 64, '30', 120, 110], [396, 410, '32', 340, 330]]);
    },
    // Brand mark under a protective seal
    mark: function (back, mid, front) {
      var C = 220;
      el(back, 'circle', { cx: C, cy: C, r: 160, class: 'thin dash' }, .2);
      el(back, 'circle', { cx: C, cy: C, r: 140 }, .3);
      for (var i = 0; i < 36; i++) {
        var a = i * Math.PI / 18;
        el(back, 'line', { x1: C + 140 * Math.cos(a), y1: C + 140 * Math.sin(a), x2: C + 128 * Math.cos(a), y2: C + 128 * Math.sin(a), class: 'thin' }, .5 + i * .02);
      }
      el(mid, 'path', { d: 'M220 112 L300 142 L300 222 Q300 288 220 326 Q140 288 140 222 L140 142 Z' }, .8);
      el(mid, 'path', { d: 'M220 132 L282 155 L282 222 Q282 274 220 304 Q158 274 158 222 L158 155 Z', class: 'thin' }, 1);
      el(mid, 'path', { d: 'M196 270 L196 172 L230 172 Q258 172 258 198 Q258 224 230 224 L196 224' }, 1.2);
      el(mid, 'path', { d: 'M222 224 L256 270' }, 1.5);
      el(mid, 'path', { d: 'M220 112 L300 142 L300 222 Q300 288 220 326 Q140 288 140 222 L140 142 Z', class: 'pulse' }, 2.8);
      refs(front, [[40, 70, '40', 150, 150], [396, 80, '42', 296, 150], [40, 400, '44', 120, 330], [396, 400, '46', 248, 262]]);
    },
    // Molecule: fused aromatic rings with side groups
    molecule: function (back, mid, front) {
      function hex(cx, cy, r) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
      var A = hex(180, 220, 56), B = hex(277, 220, 56), atoms = [], k = 0;
      [A, B].forEach(function (h, hi) {
        for (var i = 0; i < 6; i++) { var p = h[i], q = h[(i + 1) % 6]; el(mid, 'line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }, .3 + k++ * .06); }
        el(mid, 'circle', { cx: hi ? 277 : 180, cy: 220, r: 32, class: 'thin' }, 1);
        h.forEach(function (p) { atoms.push(p); });
      });
      var subs = [[A[3], [70, 262]], [A[4], [140, 100]], [B[5], [318, 100]], [B[0], [386, 262]], [B[1], [300, 340]]];
      subs.forEach(function (s, i) {
        el(back, 'line', { x1: s[0][0], y1: s[0][1], x2: s[1][0], y2: s[1][1] }, 1 + i * .1);
        el(back, 'line', { x1: s[0][0], y1: s[0][1], x2: s[1][0], y2: s[1][1], class: 'pulse' }, (2.8 + i * .5).toFixed(2));
        el(back, 'circle', { cx: s[1][0], cy: s[1][1], r: 9 }, 1.3 + i * .1);
      });
      atoms.forEach(function (p, i) { el(mid, 'circle', { cx: p[0], cy: p[1], r: 4.5, class: 'node' }, 1.4).style.setProperty('--g', (i * .23 % 2).toFixed(2) + 's'); });
      refs(front, [[40, 60, '50', 136, 100], [396, 60, '52', 318, 98], [40, 400, '54', 160, 250], [396, 410, '56', 300, 340]]);
    },
    // Product design: front and side views with dimension lines
    product: function (back, mid, front) {
      el(mid, 'rect', { x: 120, y: 70, width: 150, height: 300, rx: 26 }, .2);
      el(mid, 'rect', { x: 132, y: 98, width: 126, height: 238, rx: 8, class: 'thin' }, .5);
      el(mid, 'circle', { cx: 195, cy: 84, r: 4 }, .8);
      el(mid, 'rect', { x: 175, y: 350, width: 40, height: 6, rx: 3, class: 'thin' }, .9);
      el(back, 'rect', { x: 316, y: 70, width: 22, height: 300, rx: 10 }, .6);
      el(back, 'line', { x1: 338, y1: 130, x2: 343, y2: 130 }, 1);
      el(back, 'line', { x1: 338, y1: 160, x2: 343, y2: 160 }, 1);
      el(front, 'path', { d: 'M100 70 L100 370 M94 76 L100 70 L106 76 M94 364 L100 370 L106 364', class: 'thin' }, 1.4);
      el(front, 'path', { d: 'M120 392 L270 392 M126 386 L120 392 L126 398 M264 386 L270 392 L264 398', class: 'thin' }, 1.6);
      el(mid, 'rect', { x: 120, y: 70, width: 150, height: 300, rx: 26, class: 'pulse' }, 2.8);
      txt(front, 330, 400, 'FIG. 2', 2.4, 'tag');
      refs(front, [[40, 60, '60', 128, 90], [396, 60, '62', 330, 110], [40, 230, '64', 140, 220]]);
    }
  };

  function setupFigure(root) {
    var back = root.querySelector('.l-back'), mid = root.querySelector('.l-mid'), front = root.querySelector('.l-front');
    (FIG[root.getAttribute('data-fig')] || FIG.chip)(back, mid, front);
    var tilt = root.querySelector('.draw3d__tilt'), area = root.parentElement, raf = 0, tx = 0, ty = 0;
    area.addEventListener('mousemove', function (e) {
      var r = root.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; tilt.style.transform = 'rotateX(' + (-ty * 12) + 'deg) rotateY(' + (tx * 16) + 'deg)'; });
    }, { passive: true });
    area.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  function setupGears(box) {
    var back = box.querySelector('.g-back'), front = box.querySelector('.g-front');
    function mk(p, tag, a) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
    var g1 = mk(back, 'g', { class: 'turn' }); g1.style.setProperty('--s', '40s'); g1.style.transformOrigin = '110px 140px';
    mk(g1, 'path', { d: gearPath(110, 140, 18, 86, 74, 0) }); mk(g1, 'circle', { cx: 110, cy: 140, r: 58, class: 'thin' }); mk(g1, 'circle', { cx: 110, cy: 140, r: 16 });
    for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; mk(g1, 'line', { x1: 110 + 16 * Math.cos(a), y1: 140 + 16 * Math.sin(a), x2: 110 + 58 * Math.cos(a), y2: 140 + 58 * Math.sin(a), class: 'thin' }); }
    var cx = 110 + 128 * Math.cos(-.55), cy = 140 + 128 * Math.sin(-.55);
    var g2 = mk(front, 'g', { class: 'turn rev' }); g2.style.setProperty('--s', '22.2s'); g2.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
    mk(g2, 'path', { d: gearPath(cx, cy, 10, 48, 38, Math.PI / 10) }); mk(g2, 'circle', { cx: cx, cy: cy, r: 11 }); mk(g2, 'circle', { cx: cx, cy: cy, r: 28, class: 'thin' });
    mk(front, 'text', { x: 268, y: 236 }).textContent = 'FIG. 2';
  }

  if (desktop) {
    var start = function () {
      document.querySelectorAll('.draw3d').forEach(setupFigure);
      document.querySelectorAll('.gears3d').forEach(setupGears);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 }); else setTimeout(start, 200);

    document.querySelectorAll('.cards article,.service-list article,.blog-grid .blog-card,.recognition-items article,.founder-grid article,.profile-photo').forEach(function (card) {
      card.classList.add('fx-tilt');
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      var sh = document.createElement('span'); sh.className = 'fx-shine'; sh.setAttribute('aria-hidden', 'true'); card.appendChild(sh);
      var raf = 0, ev;
      card.addEventListener('mousemove', function (e) {
        ev = e; if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.classList.add('is-tilting');
          card.style.transform = 'rotateX(' + ((.5 - y) * 9).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 11).toFixed(2) + 'deg) translateZ(14px)';
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      });
      card.addEventListener('mouseleave', function () { card.classList.remove('is-tilting'); card.style.transform = ''; });
    });

    var steps = document.querySelector('.steps');
    if (steps && 'IntersectionObserver' in window) {
      steps.classList.add('fx-fold');
      var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { steps.classList.add('is-open'); io.disconnect(); } }); }, { threshold: .25 });
      io.observe(steps);
    }
  }

  // Reading progress bar on articles
  var art = document.querySelector('article.article, .legacy-article');
  if (art && art.offsetHeight > 1200) {
    var bar = document.createElement('div'); bar.className = 'read-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    var ticking = false;
    var upd = function () {
      ticking = false;
      var r = art.getBoundingClientRect(), total = r.height - window.innerHeight * .6, done = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      bar.style.transform = 'scaleX(' + done.toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // Quick-contact buttons on phones and tablets
  var qc = document.createElement('div');
  qc.className = 'quick-contact';
  qc.innerHTML = '<a class="qc-wa" href="https://wa.me/919113214395?text=' + encodeURIComponent('Hello PRASA IP, I would like to discuss an IP matter.') + '" target="_blank" rel="noopener" aria-label="Message PRASA IP on WhatsApp"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg></a>' +
    '<a class="qc-call" href="tel:+919113214395" aria-label="Call PRASA IP"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg></a>';
  document.body.appendChild(qc);
})();
