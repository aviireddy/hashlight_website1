// ============================================================
// HASHLIGHT — shared interactions
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- desktop-only preload upgrade: the 6 background reel tiles ship
     as preload="none" in the markup so mobile page loads fetch 0MB of video
     up front; non-touch (mouse/trackpad) devices get preload bumped to
     "metadata" here so the hover-thumbnail frame is ready immediately,
     matching the original desktop experience ---------- */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.reel-tile-video').forEach(v => {
      v.preload = 'metadata';
      v.load();
    });
  }

  /* ---------- group each dial section (+ the page content around it) into
     an independent panel, so pages no longer flow into each other via
     scroll — only one panel is ever in the document at a time ---------- */
  const pagePanels = (() => {
    const sections = Array.from(document.querySelectorAll('body > [data-dial]'));
    if (sections.length < 2) return [];
    return sections.map(startSec => {
      const panel = document.createElement('div');
      panel.className = 'page-panel';
      panel.dataset.pageId = startSec.id || '';
      startSec.parentNode.insertBefore(panel, startSec);
      let node = startSec;
      while (node) {
        const isBoundary = node !== startSec && node.nodeType === 1 &&
          (node.hasAttribute('data-dial') || node.tagName === 'FOOTER');
        if (isBoundary) break;
        const next = node.nextSibling;
        panel.appendChild(node);
        node = next;
      }
      return panel;
    });
  })();

  /* ---------- nav scroll state ---------- */
  const nav = document.querySelector('.site-nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 30);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  /* ---------- mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
      document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold:0.15, rootMargin:'0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- flash cursor spotlight ---------- */
  const spot = document.querySelector('.flash-spot');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (spot && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let raf = null, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      spot.classList.add('active');
      if (!raf) raf = requestAnimationFrame(() => {
        spot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
        raf = null;
      });
    });
    document.addEventListener('mouseleave', () => spot.classList.remove('active'));
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const animateCount = (el) => {
      const target = el.getAttribute('data-count');
      const numMatch = target.match(/[\d.]+/);
      if (!numMatch) { el.textContent = target; return; }
      const num = parseFloat(numMatch[0]);
      const suffix = target.replace(numMatch[0], '');
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = (num * eased);
        el.textContent = (num % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold:0.4 });
      counters.forEach(el => cio.observe(el));
    } else {
      counters.forEach(el => el.textContent = el.getAttribute('data-count'));
    }
  }

  /* ---------- hero reel video ---------- */
  const reelVideo = document.getElementById('hero-reel-video');
  const reelPlay = document.getElementById('hero-reel-play');
  if (reelVideo && reelPlay) {
    const toggle = () => { reelVideo.paused ? reelVideo.play() : reelVideo.pause(); };
    reelPlay.addEventListener('click', toggle);
    reelVideo.addEventListener('click', toggle);
    reelVideo.addEventListener('play', () => reelPlay.classList.add('is-playing'));
    reelVideo.addEventListener('pause', () => reelPlay.classList.remove('is-playing'));
  }

  /* ---------- "Start a project" intake modal ---------- */
  (() => {
    const triggers = document.querySelectorAll('.js-start-project');
    if (!triggers.length) return;

    const TIME_SLOTS = [
      { value: 'morning', label: 'Morning — 10:00 AM to 1:00 PM' },
      { value: 'afternoon', label: 'Afternoon — 1:00 PM to 4:00 PM' },
      { value: 'evening', label: 'Evening — 4:00 PM to 6:00 PM' },
    ];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <button type="button" class="modal-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="modal-body">
          <p class="eyebrow" id="project-modal-title" style="justify-content:flex-start">Start a project</p>
          <h3 class="modal-title">Tell us who<br>you are.</h3>
          <form id="project-form" novalidate>
            <div class="field">
              <label for="pf-name">Your name</label>
              <input type="text" id="pf-name" name="name" placeholder="Full name" required>
            </div>
            <div class="field">
              <label for="pf-business">Business name</label>
              <input type="text" id="pf-business" name="business" placeholder="Your brand or company" required>
            </div>
            <div class="field">
              <label for="pf-contact">Phone or email</label>
              <input type="text" id="pf-contact" name="contact" placeholder="Where we can reach you" required>
            </div>
            <div class="field">
              <label for="pf-time">Best time to call</label>
              <select id="pf-time" name="time" required>
                ${TIME_SLOTS.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Send
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H9M17 7V15"/></svg>
            </button>
            <p class="form-note">We'll open WhatsApp with these details pre-filled so nothing gets lost.</p>
          </form>
          <div class="modal-confirm" id="project-confirm" hidden>
            <div class="modal-confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <p class="modal-confirm-text"></p>
            <button type="button" class="btn btn-ghost modal-done">Done</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const card = overlay.querySelector('.modal-card');
    const form = overlay.querySelector('#project-form');
    const confirmBox = overlay.querySelector('#project-confirm');
    const confirmText = overlay.querySelector('.modal-confirm-text');
    const nameInput = overlay.querySelector('#pf-name');

    const openModal = () => {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      form.hidden = false;
      confirmBox.hidden = true;
      form.reset();
      setTimeout(() => nameInput.focus(), 50);
    };
    const closeModal = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    triggers.forEach(t => t.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.querySelector('.modal-done').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const business = (data.get('business') || '').toString().trim();
      const contact = (data.get('contact') || '').toString().trim();
      const slot = TIME_SLOTS.find(s => s.value === data.get('time')) || TIME_SLOTS[0];

      const waText = `Hi Hashlight, I'd like to start a project.\nName: ${name}\nBusiness: ${business}\nContact: ${contact}\nBest time to call: ${slot.label}`;
      window.open('https://wa.me/918096177746?text=' + encodeURIComponent(waText), '_blank', 'noopener');

      confirmText.textContent = `We will contact Mr. ${name} at ${slot.label}. Thank you!`;
      form.hidden = true;
      confirmBox.hidden = false;
    });
  })();

  /* ---------- social reels: muted <video> tiles, wired to video/reel-*.mp4
     — swap real exports in at those paths. preload="metadata" makes the
     browser paint the first frame as a thumbnail as soon as the page opens,
     without downloading the whole clip. On devices that can hover (mouse),
     that thumbnail just sits still until hovered, then plays; leaving
     pauses it and resets back to the thumbnail frame. Touch devices have
     no hover, so reels there play automatically once the page opens. ---------- */
  (() => {
    const tiles = document.querySelectorAll('.reel-tile');
    if (!tiles.length) return;

    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      tiles.forEach(tile => {
        const video = tile.querySelector('.reel-tile-video');
        if (!video) return;
        // preload="metadata" alone doesn't reliably paint a visible frame in
        // every browser — nudging currentTime forces an actual frame decode,
        // so the thumbnail is genuinely visible at rest instead of black
        const paintFirstFrame = () => { if (video.currentTime === 0) video.currentTime = 0.05; };
        if (video.readyState >= 1) paintFirstFrame();
        else video.addEventListener('loadedmetadata', paintFirstFrame, { once: true });

        tile.addEventListener('mouseenter', () => { video.play?.().catch(() => {}); });
        tile.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; paintFirstFrame(); });
      });
    } else {
      const tileVideos = document.querySelectorAll('.reel-tile-video');
      document.addEventListener('hashlight:page-show', (e) => {
        const isActive = e.detail.id === 'social-media';
        tileVideos.forEach(v => { isActive ? v.play?.().catch(() => {}) : v.pause?.(); });
      });
    }
  })();

  /* ---------- video editors: preview embeddable portfolios in place, no
     new tab. Only sites that actually allow being framed can do this —
     Saketh's Canva site sends X-Frame-Options and refuses to be embedded,
     so it keeps opening in a new tab; Varun's does not, so it's marked
     data-inline-portfolio and opens inline instead. ---------- */
  (() => {
    const triggers = document.querySelectorAll('a[data-inline-portfolio]');
    if (!triggers.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay portfolio-modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card portfolio-modal-card" role="dialog" aria-modal="true">
        <button type="button" class="modal-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="portfolio-embed-wrap"><iframe title="Portfolio" loading="lazy"></iframe></div>
        <a class="reel-embed-fallback form-note" target="_blank" rel="noopener">Trouble viewing? Open in a new tab →</a>
      </div>`;
    document.body.appendChild(overlay);

    const iframe = overlay.querySelector('iframe');
    const fallbackLink = overlay.querySelector('.reel-embed-fallback');

    const closePortfolio = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      iframe.src = 'about:blank';
    };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePortfolio(); });
    overlay.querySelector('.modal-close').addEventListener('click', closePortfolio);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closePortfolio(); });

    triggers.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        fallbackLink.href = a.href;
        iframe.src = a.href;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
  })();

  /* ---------- current year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- telephone-dial section navigator: real drag-to-rotate ---------- */
  (() => {
    const sections = Array.from(document.querySelectorAll('[data-dial]'));
    if (sections.length < 2) return;
    const N = sections.length;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => window.matchMedia('(max-width:920px)').matches;
    // where a hole must land to count as "selected" — screen-angle convention
    // (atan2: 0=east, 90=south, 180/-180=west, -90=north)
    const pointerAngle = () => isMobile() ? -90 : 180;

    const dial = document.createElement('div');
    dial.className = 'tel-dial';

    const face = document.createElement('div');
    face.className = 'tel-dial-face';
    face.setAttribute('aria-label', 'Section navigator — drag to rotate between pages');

    const ring = document.createElement('div');
    ring.className = 'tel-dial-ring';
    const hub = document.createElement('div');
    hub.className = 'tel-dial-hub';
    const stop = document.createElement('div');
    stop.className = 'tel-dial-stop';

    face.appendChild(ring);
    face.appendChild(hub);
    face.appendChild(stop);
    dial.appendChild(face);
    document.body.appendChild(dial);

    // each hole's home angle around the disc — fixed, evenly spaced. Desktop
    // numbers run anticlockwise (negative step); mobile deliberately mirrors
    // that (positive step), so its numbering — and the physical drag
    // direction that advances pages — is the opposite of desktop's. The
    // ring's own CSS rotation is what moves (and tilts) them, like a real
    // spinning disc.
    const holes = [];
    const computeHolesBase = () => sections.map((_, i) => (isMobile() ? 1 : -1) * i * (360 / N));
    let holesBase = computeHolesBase();

    sections.forEach((sec, i) => {
      const label = sec.getAttribute('data-dial') || ('Section ' + (i + 1));
      const hole = document.createElement('div');
      hole.className = 'tel-dial-hole';
      hole.setAttribute('aria-label', label);
      hole.textContent = String(i + 1);
      ring.appendChild(hole);
      holes.push(hole);
    });

    const layoutHoles = () => {
      const rect = face.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      const R = rect.width * 0.345;
      holes.forEach((hole, i) => {
        const a = holesBase[i] * Math.PI / 180;
        hole.style.left = (cx + R * Math.cos(a)).toFixed(2) + 'px';
        hole.style.top = (cy + R * Math.sin(a)).toFixed(2) + 'px';
      });
    };
    layoutHoles();

    // nav-links are in the same Home/About/Social/Video/Contact order as sections
    const navLinks = document.querySelectorAll('.nav-links a');
    const idToIndex = {};
    sections.forEach((sec, i) => { if (sec.id) idToIndex['#' + sec.id] = i; });

    const norm360 = (d) => { d %= 360; return d < 0 ? d + 360 : d; };
    // shortest signed difference a-b, result in [-180,180]
    const shortestDiff = (a, b) => { let d = norm360(a - b); if (d > 180) d -= 360; return d; };
    // the angle nearest `current` (not wrapped to 0-360) that is equivalent to targetMod (mod 360)
    const nearestEquivalent = (current, targetMod) => current + shortestDiff(norm360(targetMod), norm360(current));

    let theta = 0;       // current ring rotation, degrees (continuous, can exceed 360)
    let activeIndex = -1;

    const thetaForIndex = (i, current) => nearestEquivalent(current, pointerAngle() - holesBase[i]);

    // ring rotation moves each hole's position around the disc; holes are
    // counter-rotated by the same amount so the digits themselves always stay
    // upright and readable, no matter where they land on the circle
    const setRingTransform = (animate) => {
      const t = animate ? 'transform .6s cubic-bezier(.34,1.15,.4,1)' : 'none';
      ring.style.transition = t;
      ring.style.transform = `rotate(${theta}deg)`;
      holes.forEach(h => {
        h.style.transition = t;
        h.style.transform = `rotate(${-theta}deg)`;
      });
    };

    // only the active panel is ever in the document flow — showing one
    // hides the rest, so pages never scroll into each other
    const showPanel = (i) => {
      pagePanels.forEach((p, idx) => p.classList.toggle('active', idx === i));
      document.dispatchEvent(new CustomEvent('hashlight:page-show', { detail: { id: sections[i].id, index: i } }));
    };

    const setActive = (i, animate = true) => {
      if (i !== activeIndex) {
        activeIndex = i;
        holes.forEach((h, idx) => h.classList.toggle('active', idx === i));
        navLinks.forEach((a, idx) => a.classList.toggle('active', idx === i));
      }
      theta = thetaForIndex(i, theta);
      setRingTransform(animate);
    };

    // land on whatever page the URL hash points at (e.g. the old about.html/
    // contact.html/etc. redirect stubs land here via index.html#about), else Home
    const initialIndex = idToIndex[window.location.hash] ?? 0;
    showPanel(initialIndex);
    setActive(initialIndex, false);

    // a thin veil that briefly covers the page while we jump — so navigating
    // via the dial/nav "opens" the target page instead of scrolling to it.
    const veil = document.createElement('div');
    veil.className = 'page-transition-veil';
    document.body.appendChild(veil);
    const VEIL_MS = 260;

    const goTo = (i) => {
      if (i === activeIndex) { setActive(i); return; }
      window.history.replaceState(null, null, `#${sections[i].id}`);
      setActive(i); // ring starts rotating immediately, visible through the veil
      if (reduceMotion) { showPanel(i); window.scrollTo({ top: 0, left: 0 }); return; }
      veil.classList.add('show');
      setTimeout(() => {
        showPanel(i);
        window.scrollTo({ top: 0, left: 0 });
        requestAnimationFrame(() => veil.classList.remove('show'));
      }, VEIL_MS);
    };

    window.addEventListener('hashchange', () => {
      const idx = idToIndex[window.location.hash];
      if (idx !== undefined) goTo(idx);
    });

    // any in-page link pointing at one of the 5 sections (nav, pillars, footer
    // sitemap, hero "see the work") jumps via the same mechanism
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('js-start-project')) return;
      const idx = idToIndex[a.getAttribute('href')];
      if (idx === undefined) return;
      e.preventDefault();
      goTo(idx);
    });

    /* ---------- drag-to-rotate (pointer events cover mouse + touch/pen) ---------- */
    let dragging = false, lastAngle = 0;

    const angleAt = (clientX, clientY) => {
      const rect = face.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
    };

    /* ---------- live single-step page preview, tracking the drag ----------
       As the dial turns from the active number toward a neighbour, that
       neighbouring panel is temporarily pinned over the page (position:fixed)
       and slid into view in direct proportion to how far the drag has gone —
       so the page visibly scrolls toward the next section instead of only
       reacting once you let go. Releasing before the drag reaches the full
       step springs it back; reaching the neighbour's own position before
       release commits it, with no veil needed since the slide itself is
       the transition. Spinning further than one step in a single drag
       falls back to the existing
       instant veil-swap via goTo, since a multi-panel slide isn't this. */
    let dragStartTheta = 0;
    let previewIndex = null;
    let previewDir = 0;

    const setPreview = (panel, pct) => {
      panel.style.position = 'fixed';
      panel.style.inset = '0';
      panel.style.zIndex = '43';
      panel.style.overflow = 'hidden';
      panel.style.display = 'block';
      panel.style.transition = 'none';
      panel.style.transform = `translateY(${pct}%)`;
    };
    const clearPreview = (panel) => {
      panel.style.position = '';
      panel.style.inset = '';
      panel.style.zIndex = '';
      panel.style.overflow = '';
      panel.style.display = '';
      panel.style.transition = '';
      panel.style.transform = '';
    };
    const releasePreview = () => {
      if (previewIndex === null) return;
      clearPreview(pagePanels[previewIndex]);
      previewIndex = null;
    };

    face.addEventListener('pointerdown', (e) => {
      dragging = true;
      face.setPointerCapture(e.pointerId);
      lastAngle = angleAt(e.clientX, e.clientY);
      dragStartTheta = theta;
      releasePreview();
      ring.style.transition = 'none';
      holes.forEach(h => { h.style.transition = 'none'; });
    });

    face.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const a = angleAt(e.clientX, e.clientY);
      const step = shortestDiff(a, lastAngle); // small incremental delta, wrap-safe
      theta += step;
      lastAngle = a;
      ring.style.transform = `rotate(${theta}deg)`;
      holes.forEach(h => { h.style.transform = `rotate(${-theta}deg)`; });

      if (reduceMotion) return;
      const stepDeg = 360 / N;
      const delta = theta - dragStartTheta;
      const dir = delta >= 0 ? 1 : -1;
      const targetIdx = (activeIndex + dir + N) % N;
      const frac = Math.max(0, Math.min(Math.abs(delta) / stepDeg, 1));

      if (targetIdx !== previewIndex) {
        releasePreview();
        previewIndex = targetIdx;
        previewDir = dir;
      }
      if (frac > 0) {
        const restPct = previewDir === 1 ? 100 : -100;
        setPreview(pagePanels[previewIndex], restPct * (1 - frac));
      } else {
        releasePreview();
      }
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      const pa = pointerAngle();
      let bestI = activeIndex, bestDist = Infinity;
      holesBase.forEach((base, i) => {
        const dist = Math.abs(shortestDiff(base + theta, pa));
        if (dist < bestDist) { bestDist = dist; bestI = i; }
      });

      if (previewIndex !== null && bestI === previewIndex) {
        // dragged all the way across — finish the slide into place, the
        // motion itself is the transition, no veil needed
        const panel = pagePanels[previewIndex];
        const committedIndex = previewIndex;
        panel.style.transition = 'transform .32s cubic-bezier(.22,.9,.36,1)';
        panel.style.transform = 'translateY(0%)';
        const finish = () => {
          panel.removeEventListener('transitionend', finish);
          clearPreview(panel);
          window.scrollTo({ top: 0, left: 0 });
          window.history.replaceState(null, null, `#${sections[committedIndex].id}`);
          showPanel(committedIndex);
          setActive(committedIndex);
        };
        panel.addEventListener('transitionend', finish, { once: true });
        previewIndex = null;
      } else if (previewIndex !== null) {
        // released before crossing (or spun past the immediate neighbour) —
        // spring the peeked panel back, and let goTo handle wherever the
        // dial actually landed (a no-op if that's still the active page)
        const panel = pagePanels[previewIndex];
        const restPct = previewDir === 1 ? 100 : -100;
        panel.style.transition = 'transform .28s cubic-bezier(.22,.9,.36,1)';
        panel.style.transform = `translateY(${restPct}%)`;
        const cleanup = () => { panel.removeEventListener('transitionend', cleanup); clearPreview(panel); };
        panel.addEventListener('transitionend', cleanup, { once: true });
        previewIndex = null;
        goTo(bestI);
      } else {
        goTo(bestI);
      }
    };
    face.addEventListener('pointerup', endDrag);
    face.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', () => {
      holesBase = computeHolesBase(); // numbering direction flips at the mobile breakpoint
      layoutHoles();
      theta = thetaForIndex(activeIndex, theta);
      setRingTransform(false);
    });

    /* ---------- tutorial hint: "rotate to move between pages" — shows on
       every load/reload (not just first-ever visit), fading out on the
       first interaction or after a few seconds if nobody touches it. The
       arc is computed from the dial's actual live position/size (not
       hardcoded offsets), so it always hugs the real dial correctly even
       if the dial's own CSS changes later. ---------- */
    if (!reduceMotion) {
      const tut = document.createElement('div');
      tut.className = 'tutorial-overlay';

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'tutorial-arc-svg');
      svg.setAttribute('aria-hidden', 'true');
      const arcPath = document.createElementNS(svgNS, 'path');
      arcPath.setAttribute('class', 'tutorial-arc-path');
      const arcHead = document.createElementNS(svgNS, 'path');
      arcHead.setAttribute('class', 'tutorial-arc-head');
      svg.appendChild(arcPath);
      svg.appendChild(arcHead);

      const caption = document.createElement('p');
      caption.className = 'tutorial-caption';
      caption.innerHTML = 'Rotate to move<br>between pages';

      tut.appendChild(svg);
      tut.appendChild(caption);
      document.body.appendChild(tut);

      const layoutTutorialArc = () => {
        svg.setAttribute('width', window.innerWidth);
        svg.setAttribute('height', window.innerHeight);
        const rect = face.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const R = rect.width / 2 * 1.18; // just outside the rim
        // arc sweeps in whichever direction actually advances pages on this
        // breakpoint — clockwise (increasing) on desktop, anticlockwise
        // (decreasing) on mobile, since mobile's numbering is mirrored
        const [startDeg, endDeg] = isMobile() ? [350, 190] : [100, 260];
        const steps = 32, pts = [];
        for (let i = 0; i <= steps; i++) {
          const deg = startDeg + (endDeg - startDeg) * (i / steps);
          const rad = deg * Math.PI / 180;
          pts.push([cx + R * Math.cos(rad), cy + R * Math.sin(rad)]);
        }
        arcPath.setAttribute('d', 'M ' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L '));

        const [ex, ey] = pts[pts.length - 1];
        const [px, py] = pts[pts.length - 2];
        const dir = Math.atan2(ey - py, ex - px);
        const headLen = 12, spread = 0.55;
        const a1 = dir + Math.PI - spread, a2 = dir + Math.PI + spread;
        arcHead.setAttribute('d',
          `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${(ex + headLen * Math.cos(a1)).toFixed(1)} ${(ey + headLen * Math.sin(a1)).toFixed(1)} ` +
          `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${(ex + headLen * Math.cos(a2)).toFixed(1)} ${(ey + headLen * Math.sin(a2)).toFixed(1)}`);

        const midDeg = (startDeg + endDeg) / 2;
        const midRad = midDeg * Math.PI / 180;
        const capR = rect.width / 2 * 1.75;
        caption.style.left = (cx + capR * Math.cos(midRad)).toFixed(1) + 'px';
        caption.style.top = (cy + capR * Math.sin(midRad)).toFixed(1) + 'px';
      };
      layoutTutorialArc();
      window.addEventListener('resize', layoutTutorialArc);

      const dismissTutorial = () => {
        tut.classList.remove('show');
        setTimeout(() => tut.remove(), 500);
        window.removeEventListener('resize', layoutTutorialArc);
        document.removeEventListener('click', dismissTutorial);
        document.removeEventListener('keydown', dismissTutorial);
        window.removeEventListener('scroll', dismissTutorial);
      };
      setTimeout(() => { layoutTutorialArc(); tut.classList.add('show'); }, 500);
      setTimeout(dismissTutorial, 6500); // auto-dismiss if nobody interacts
      document.addEventListener('click', dismissTutorial);
      document.addEventListener('keydown', dismissTutorial);
      window.addEventListener('scroll', dismissTutorial, { passive: true, once: true });
    }
  })();

});
