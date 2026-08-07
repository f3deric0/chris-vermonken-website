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
     Intro film — plays once, then hands off to the hero below. Skip and
     Replay are the only controls; there is no play/pause/scrub chrome,
     and the video never loops. No-ops on pages without [data-film].
     --------------------------------------------------------------------- */
  const film = document.querySelector('[data-film]');
  const filmVideo = document.querySelector('[data-film-video]');
  const filmSkip = document.querySelector('[data-film-skip]');
  const filmReplay = document.querySelector('[data-film-replay]');

  if (film && filmVideo) {
    const nextSection = film.nextElementSibling;
    let handedOff = false;
    let userTookOver = false;
    let stallTimer = null;

    const markUserTookOver = () => {
      userTookOver = true;
    };
    window.addEventListener('wheel', markUserTookOver, { once: true, passive: true });
    window.addEventListener('touchmove', markUserTookOver, { once: true, passive: true });
    window.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key)) markUserTookOver();
    }, { once: true });

    const scrollToNext = () => {
      if (!nextSection) return;
      if (prefersReduced) {
        nextSection.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else if (lenis) {
        lenis.scrollTo(nextSection, { duration: 1.6 });
      } else {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Fires on natural end or stall timeout — respects a reader who has
    // already started scrolling on their own so it never fights them.
    const autoHandOff = () => {
      if (handedOff || userTookOver) return;
      handedOff = true;
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
      scrollToNext();
    };

    const showReplay = () => {
      if (filmReplay) filmReplay.hidden = false;
    };

    if (prefersReduced) {
      // No autoplay under reduced motion: show the poster, let the reader
      // opt in via Replay, and any hand-off jumps instead of animating.
      filmVideo.removeAttribute('autoplay');
      showReplay();
    } else {
      filmVideo.addEventListener('loadedmetadata', () => {
        const durationMs = (Number.isFinite(filmVideo.duration) ? filmVideo.duration : 20) * 1000;
        // Buffer stalls can swallow 'ended' on mobile — this is the safety net.
        stallTimer = window.setTimeout(autoHandOff, durationMs + 1200);
      });

      const playPromise = filmVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        // Autoplay can be refused (Low Power Mode, data saver, etc.) —
        // fall back to the poster frame plus an explicit Replay affordance.
        playPromise.catch(showReplay);
      }
    }

    filmVideo.addEventListener('ended', () => {
      showReplay();
      autoHandOff();
    });

    // A missing/broken source fires 'error' on the element rather than
    // rejecting the play() promise — cover both so a 404'd video still
    // degrades to poster + Replay instead of sitting silently forever.
    filmVideo.addEventListener('error', showReplay);

    // Belt-and-braces: when every <source> 404s, some browsers set
    // networkState to NETWORK_NO_SOURCE without ever firing 'error' on
    // the element, which would otherwise leave Replay hidden forever.
    window.setTimeout(() => {
      if (filmVideo.readyState === 0 && filmVideo.networkState === 3) {
        showReplay();
      }
    }, 5000);

    if (filmSkip) {
      filmSkip.addEventListener('click', () => {
        handedOff = true;
        if (stallTimer) {
          clearTimeout(stallTimer);
          stallTimer = null;
        }
        scrollToNext();
      });
    }

    if (filmReplay) {
      filmReplay.addEventListener('click', () => {
        filmReplay.hidden = true;
        filmVideo.currentTime = 0;
        const replayPromise = filmVideo.play();
        if (replayPromise && typeof replayPromise.catch === 'function') {
          replayPromise.catch(showReplay);
        }
      });
    }
  }

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
