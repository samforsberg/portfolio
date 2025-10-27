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
  