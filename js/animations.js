(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Scroll reveals — plain IntersectionObserver. Deliberately independent
     of GSAP so section fades still work even if the CDN script fails.
     --------------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------------------
     Key figure count-up — the one stat with a real number.
     --------------------------------------------------------------------- */
  const counter = document.querySelector('[data-count-to]');

  if (counter) {
    const target = Number(counter.dataset.countTo);
    const suffix = counter.dataset.countSuffix || '';

    if (prefersReduced || !('IntersectionObserver' in window)) {
      counter.textContent = target + suffix;
    } else {
      const countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            countObserver.unobserve(entry.target);

            const duration = 1400;
            const start = performance.now();

            const tick = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              counter.textContent = Math.round(eased * target) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.6 }
      );
      countObserver.observe(counter);
    }
  }

  /* ---------------------------------------------------------------------
     Everything below is the one orchestrated moment this page spends its
     motion budget on: the hero load sequence + a quiet parallax drift on
     the strata panel. Requires GSAP; degrades to the CSS-visible default
     (nothing hidden) if the CDN script didn't load.
     --------------------------------------------------------------------- */
  if (!window.gsap) return;

  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  const heroItems = document.querySelectorAll('[data-hero-item]');
  const heroPanel = document.querySelector('[data-hero-panel]');
  const scrollCue = document.querySelector('.hero__scroll-cue');

  if (prefersReduced) {
    // Elements are visible by default in CSS — nothing further to do.
  } else {
    gsap.set(heroItems, { opacity: 0, y: 28 });
    if (heroPanel) gsap.set(heroPanel, { opacity: 0, scale: 1.06 });
    if (scrollCue) gsap.set(scrollCue, { opacity: 0 });

    const ready = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    ready.then(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (heroPanel) {
        tl.to(heroPanel, { opacity: 1, scale: 1, duration: 1.4 }, 0.1);
      }
      tl.to(heroItems, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.35);
      if (scrollCue) {
        tl.to(scrollCue, { opacity: 1, duration: 0.6 }, '-=0.3');
      }
    });
  }

  /* Quiet parallax — the strata panel drifts slower than scroll, giving
     the signature motif a sense of depth without calling attention to itself. */
  if (window.ScrollTrigger && heroPanel && !prefersReduced) {
    gsap.to(heroPanel, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  /* Keep ScrollTrigger in sync with Lenis' virtual scroll position. */
  if (window.ScrollTrigger && window.__lenis) {
    window.__lenis.on('scroll', window.ScrollTrigger.update);
  }
})();
