// ===== Loader
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  });
  
  // ===== Navbar Hide/Show on Scroll + Active Link Highlight
  (() => {
    const navbar = document.querySelector('.navbar');
    const links = Array.from(document.querySelectorAll('.nav-links a'));
    if (!navbar || !links.length) return;
  
    let lastScroll = 0;
    const thresholdHide = 100;
  
    function onScrollNav() {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > lastScroll && y > thresholdHide) {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
      lastScroll = y;
    }
  
    // Active link highlighting using IntersectionObserver
    const sections = links
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
  
    const secObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = `#${entry.target.id}`;
        const link = links.find(a => a.getAttribute('href') === id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });
  
    sections.forEach(sec => secObserver.observe(sec));
    window.addEventListener('scroll', onScrollNav, { passive: true });
  })();
  
  // ===== Smooth Scroll for anchor links (offset safe)
  (() => {
    const header = document.querySelector('.navbar');
    const headerHeight = () => (header ? header.offsetHeight : 0);
  
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetID = anchor.getAttribute('href');
        if (!targetID || targetID === '#') return;
        const target = document.querySelector(targetID);
        if (!target) return;
  
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - headerHeight() - 8;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  })();
  
  // ===== Scroll Reveal with Stagger & Direction
  (() => {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;
  
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target;
  
          // Compute a stagger based on sibling index unless --d is set inline
          if (!el.style.getPropertyValue('--d')) {
            const group = [...el.parentElement.querySelectorAll('.reveal')];
            const idx = group.indexOf(el);
            el.style.setProperty('--d', `${idx * 90}ms`);
          }
  
          el.classList.add('in-view');
          obs.unobserve(el); // reveal once
        }
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -5% 0px' });
  
    revealEls.forEach(el => observer.observe(el));
  })();
  
  // ===== Parallax (for hero layers)
  (() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
  
    const wrap = document.querySelector('.hero') || document.querySelector('.parallax-wrap');
    if (!wrap) return;
    const layers = wrap.querySelectorAll('.parallax');
    if (!layers.length) return;
  
    let ticking = false;
  
    function applyParallax() {
      const rect = wrap.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight;
  
      if (rect.bottom >= 0 && rect.top <= viewH) {
        const progress = 1 - Math.min(Math.max((rect.top + rect.height / 2) / (viewH + rect.height / 2), 0), 1);
        const maxShift = 40; // px max for deepest layer
  
        layers.forEach(layer => {
          const depth = Number(layer.dataset.depth || 1); // 1..3
          const shift = (depth / 3) * maxShift * (progress - 0.5); // centered around mid
          layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
        });
      }
  
      ticking = false;
    }
  
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }
  
    window.addEventListener('scroll', onScroll, { passive: true });
    applyParallax();
  })();

  (() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // ----- sizing -----
  const DPR = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf
  function resize() {
    const { innerWidth:w, innerHeight:h } = window;
    canvas.width  = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ----- particle system -----
  const P = [];
  const COUNT = Math.floor((window.innerWidth * window.innerHeight) / 19000) + 40; // responsive count
  const COLORS = ['#00ff88', '#00ccff', '#a0fff0', '#7fffd4'];

  function rand(a,b){ return a + Math.random()*(b-a); }

  for (let i=0;i<COUNT;i++){
    P.push({
      x: rand(0, innerWidth),
      y: rand(0, innerHeight),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.3, 0.3),
      r: rand(1.2, 2.6),
      c: COLORS[i % COLORS.length],
      life: rand(0, 1)
    });
  }

  // mouse influence
  const mouse = { x: -9999, y: -9999, down: false };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('mousedown', () => mouse.down = true);
  window.addEventListener('mouseup',   () => mouse.down = false);

  // ----- animation loop -----
  let last = performance.now();
  function tick(t){
    const dt = Math.min(33, t - last); last = t;

    // subtle glassy background wash
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const gx = (Math.sin(t*0.0002)+1)/2 * innerWidth;
    const gy = (Math.cos(t*0.00025)+1)/2 * innerHeight;
    const grad = ctx.createRadialGradient(gx, gy, 50, innerWidth/2, innerHeight/2, Math.max(innerWidth, innerHeight));
    grad.addColorStop(0, 'rgba(0,255,136,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,innerWidth,innerHeight);

    // draw links between close particles for “web” effect
    ctx.lineWidth = 1;
    for (let i=0;i<P.length;i++){
      const a = P[i];
      // physics
      a.x += a.vx * dt * 0.06;
      a.y += a.vy * dt * 0.06;

      // wrap edges
      if (a.x < -5) a.x = innerWidth + 5;
      if (a.x > innerWidth + 5) a.x = -5;
      if (a.y < -5) a.y = innerHeight + 5;
      if (a.y > innerHeight + 5) a.y = -5;

      // mouse repulsion / attraction
      const dx = a.x - mouse.x, dy = a.y - mouse.y;
      const d2 = dx*dx + dy*dy;
      const maxDist = 140;
      if (d2 < maxDist*maxDist){
        const d = Math.sqrt(d2) || 1;
        const f = (mouse.down ? -0.9 : 0.9) * (1 - d / maxDist); // hold mouse to attract
        a.vx += (dx/d) * f * 0.08;
        a.vy += (dy/d) * f * 0.08;
      }

      // draw particle
      ctx.beginPath();
      ctx.fillStyle = a.c;
      ctx.globalAlpha = 0.75;
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();

      // connect to neighbors (limit work)
      for (let j=i+1;j<i+20 && j<P.length;j++){
        const b = P[j];
        const ddx = a.x - b.x, ddy = a.y - b.y;
        const dist2 = ddx*ddx + ddy*ddy;
        if (dist2 < 95*95){
          const op = 1 - (Math.sqrt(dist2)/95);
          ctx.globalAlpha = op * 0.25;
          ctx.strokeStyle = '#9bfcd8';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
</script>
quick style swaps
A) “Liquid blobs” gradient (no particles, ultra-smooth)
Replace the animation loop body with this simpler blob render (keep the sizing + RAF wrapper):

js
Copy code
// inside tick(t):
ctx.clearRect(0,0,canvas.width,canvas.height);

// animated multi-radial gradient blobs
const w = innerWidth, h = innerHeight;
const t1 = t * 0.00025, t2 = t * 0.00018, t3 = t * 0.00021;

function blob(cx, cy, r, color) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();
}

// drifting centers
blob(w*(0.2 + 0.1*Math.sin(t1)), h*(0.4 + 0.1*Math.cos(t1*1.3)), Math.max(w,h)*0.45, 'rgba(0,255,136,0.24)');
blob(w*(0.75 + 0.08*Math.cos(t2)), h*(0.3 + 0.12*Math.sin(t2*1.2)), Math.max(w,h)*0.5,  'rgba(0,204,255,0.22)');
blob(w*(0.45 + 0.12*Math.cos(t3)), h*(0.85 + 0.08*Math.sin(t3)),   Math.max(w,h)*0.4,  'rgba
