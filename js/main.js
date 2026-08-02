(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------------------
     Smooth scroll (Lenis) — desktop only. Skipped under reduced-motion
     and on touch devices, where native inertial scrolling is already
     tuned by the platform and a JS-driven scroll loop only costs battery
     and adds input lag. Every other module below degrades gracefully
     because it only reacts to scroll position, not to Lenis itself.
     --------------------------------------------------------------------- */
  let lenis = null;

  if (!prefersReduced && !isTouch && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  window.__lenis = lenis;

  /* ---------------------------------------------------------------------
     Anchor navigation — routes through Lenis when active so in-page
     links share the same easing as scroll-driven animation.
     --------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();

      if (lenis) {
        lenis.scrollTo(target, { offset: -72, duration: 1.3 });
      } else {
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  /* ---------------------------------------------------------------------
     Nav — solidifies once the hero has scrolled past.
     --------------------------------------------------------------------- */
  const nav = document.querySelector('[data-nav]');

  if (nav) {
    const setNavState = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    setNavState();
    window.addEventListener('scroll', setNavState, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Mobile nav — fullscreen overlay toggled from the header button below
     the breakpoint where the inline link row no longer fits.
     --------------------------------------------------------------------- */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (navToggle && mobileNav) {
    const closeMobileNav = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    const openMobileNav = () => {
      navToggle.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMobileNav(); else openMobileNav();
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileNav();
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic buttons — nudge toward the cursor, ease back on leave.
     Skipped for touch input and reduced motion.
     --------------------------------------------------------------------- */
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (supportsHover && !prefersReduced) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.35;

      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }
})();
