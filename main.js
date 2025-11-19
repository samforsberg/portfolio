// ===== Loader =====
window.addEventListener('load', () => {
  const loader = document.querySelector('.loader');
  if (!loader) return;
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
});

// ===== Navbar hide/show + active link highlight =====
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

  // Active section highlighting
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = '#' + entry.target.id;
      const link = links.find(a => a.getAttribute('href') === id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-45% 0px -45% 0px',
    threshold: 0.1
  });

  sections.forEach(sec => observer.observe(sec));
  window.addEventListener('scroll', onScrollNav, { passive: true });
})();

// ===== Smooth scroll for in-page anchors =====
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

// ===== Scroll reveal =====
(() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('in-view');
    });
    return;
  }

  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // simple stagger within groups
      const group = el.parentElement
        ? Array.from(el.parentElement.querySelectorAll('.reveal'))
        : [el];
      const idx = group.indexOf(el);
      el.style.setProperty('--d', `${idx * 90}ms`);

      el.classList.add('in-view');
      observer.unobserve(el);
    });
  }, {
    threshold: 0.16,
    rootMargin: '0px 0px -5% 0px'
  });

  revealEls.forEach(el => observer.observe(el));
})();

// ===== Hero parallax =====
(() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const wrap = document.querySelector('.hero');
  if (!wrap) return;
  const layers = wrap.querySelectorAll('.parallax');
  if (!layers.length) return;

  let ticking = false;

  function applyParallax() {
    const rect = wrap.getBoundingClientRect();
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const center = rect.top + rect.height / 2;
    const norm = (center - viewH / 2) / viewH; // -1 .. 1

    layers.forEach(layer => {
      const depth = Number(layer.dataset.depth || 1); // 1..3
      const shift = norm * depth * -18; // px
      layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });

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

// ===== Interactive Background Canvas (technical grid)
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  const GRID_SPACING = 80;
  const SUB_SPACING = 20;

  function tick(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    // base dark
    ctx.fillStyle = 'rgba(2,1,4,1)';
    ctx.fillRect(0, 0, w, h);

    // subtle vignette
    const vignette = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) / 10,
      w / 2, h / 2, Math.max(w, h) / 1.1
    );
    vignette.addColorStop(0, 'rgba(14,6,18,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // warm corner glows
    const glowTL = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, Math.max(w, h) * 0.8
    );
    glowTL.addColorStop(0, 'rgba(255,138,60,0.12)');
    glowTL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowTL;
    ctx.fillRect(0, 0, w, h);

    const glowBR = ctx.createRadialGradient(
      w, h, 0,
      w, h, Math.max(w, h) * 0.7
    );
    glowBR.addColorStop(0, 'rgba(255,79,182,0.12)');
    glowBR.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowBR;
    ctx.fillRect(0, 0, w, h);

    // main grid
    ctx.save();
    ctx.strokeStyle = 'rgba(120,100,140,0.23)';
    ctx.lineWidth = 1;

    const offset = (t * 0.018) % GRID_SPACING;

    for (let x = -GRID_SPACING; x < w + GRID_SPACING; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset, h);
      ctx.stroke();
    }
    for (let y = -GRID_SPACING; y < h + GRID_SPACING; y += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(w, y + offset);
      ctx.stroke();
    }

    // sub grid
    ctx.strokeStyle = 'rgba(110,90,130,0.13)';
    ctx.lineWidth = 0.7;

    const subOffset = (t * 0.03) % SUB_SPACING;
    for (let x = -SUB_SPACING; x < w + SUB_SPACING; x += SUB_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x + subOffset, 0);
      ctx.lineTo(x + subOffset, h);
      ctx.stroke();
    }
    for (let y = -SUB_SPACING; y < h + SUB_SPACING; y += SUB_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y + subOffset);
      ctx.lineTo(w, y + subOffset);
      ctx.stroke();
    }
    ctx.restore();

    // subtle "nodes" near center (slow pulse)
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.45;
    const time = t * 0.0012;

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const r = radius * 0.4 + Math.sin(time + i) * radius * 0.12;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      const a = 0.3 + 0.25 * Math.sin(time * 1.5 + i * 0.7);
      ctx.fillStyle = `rgba(255,214,190,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ===== Page transitions (less glitchy, no intro, safe with back button) =====
(() => {
  const transition = document.querySelector('.page-transition');
  if (!transition) return;

  let navigating = false;

  const resetOverlay = () => {
    navigating = false;
    transition.classList.remove('page-transition--active', 'page-transition--intro');
  };

  // Clean state on initial load and when coming back via back/forward cache
  resetOverlay();
  window.addEventListener('pageshow', resetOverlay);

  // Global helper for smooth navigation
  window.__pageTransitionNavigate = function (url, newTab = false) {
    if (!url || navigating) {
      if (!navigating && url) {
        // fallback if something is weird with the overlay
        if (newTab) window.open(url, '_blank');
        else window.location.href = url;
      }
      return;
    }

    // If no transition element for some reason, just go
    if (!transition) {
      if (newTab) window.open(url, '_blank');
      else window.location.href = url;
      return;
    }

    navigating = true;

    // Make sure intro class is gone and trigger the "out" animation
    transition.classList.remove('page-transition--intro');
    transition.classList.add('page-transition--active');

    const handleOutEnd = () => {
      transition.removeEventListener('animationend', handleOutEnd);
      if (newTab) window.open(url, '_blank');
      else window.location.href = url;
    };

    transition.addEventListener('animationend', handleOutEnd);
  };
})();

// ===== Project cards: click to open with transition =====
(() => {
  const cards = document.querySelectorAll('.project-card[data-href]');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const url = card.dataset.href;
      if (!url) return;

      const newTab = e.ctrlKey || e.metaKey;
      if (typeof window.__pageTransitionNavigate === 'function') {
        e.preventDefault();
        window.__pageTransitionNavigate(url, newTab);
      } else {
        if (newTab) window.open(url, '_blank');
        else window.location.href = url;
      }
    });
  });
})();

// ===== Keyboard navigation on project pages (← / →) =====
(() => {
  const nav = document.querySelector('.proj-nav');
  if (!nav) return; // only on project pages

  const prevLink = nav.querySelector('[data-nav="prev"]');
  const nextLink = nav.querySelector('[data-nav="next"]');

  const canUseNav = () => {
    const el = document.activeElement;
    if (!el) return true;
    const tag = el.tagName;
    return !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !el.isContentEditable;
  };

  document.addEventListener('keydown', (e) => {
    if (!canUseNav()) return;

    if (e.key === 'ArrowLeft' && prevLink) {
      e.preventDefault();
      const url = prevLink.getAttribute('href');
      if (!url) return;
      if (typeof window.__pageTransitionNavigate === 'function') {
        window.__pageTransitionNavigate(url, false);
      } else {
        window.location.href = url;
      }
    }

    if (e.key === 'ArrowRight' && nextLink) {
      e.preventDefault();
      const url = nextLink.getAttribute('href');
      if (!url) return;
      if (typeof window.__pageTransitionNavigate === 'function') {
        window.__pageTransitionNavigate(url, false);
      } else {
        window.location.href = url;
      }
    }
  });
})();
