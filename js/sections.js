/* =========================================================
   Nordica — анімації нових блоків
   ========================================================= */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth > 760;
  const lenisStop = () => window.lenis && window.lenis.stop();
  const lenisStart = () => window.lenis && window.lenis.start();

  /* ---------- Заголовки секцій: рядки виїжджають з-під маски ---------- */
  document.querySelectorAll('.sec-title.split').forEach(h => {
    h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i)
      .map(l => `<span class="line"><span>${l.trim()}</span></span>`).join('');
    gsap.from(h.querySelectorAll('.line > span'), {
      yPercent: 115, rotate: 3, duration: 1.1, ease: 'power4.out', stagger: 0.1,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true }
    });
  });
  gsap.utils.toArray('.sec-num').forEach(n => gsap.from(n, {
    width: 0, opacity: 0, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: n, start: 'top 85%', once: true }
  }));

  /* ---------- 01 Концепція: рамки фасаду малюються скролом ---------- */
  const frames = document.querySelectorAll('.frames path');
  frames.forEach(p => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
  gsap.to(frames, {
    strokeDashoffset: 0, ease: 'none', stagger: 0.15,
    scrollTrigger: { trigger: '.concept__figure', start: 'top 80%', end: 'bottom 35%', scrub: 0.6 }
  });
  gsap.to('.concept__figure img', {
    scale: 1, yPercent: -4, ease: 'none',
    scrollTrigger: { trigger: '.concept__figure', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.from('.ticks li', {
    x: -30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.ticks', start: 'top 85%', once: true }
  });

  /* ---------- 02 Локація: маршрут, піни, синхронізація зі списком ---------- */
  const route = document.getElementById('map-route');
  if (route) {
    const len = route.getTotalLength();
    gsap.fromTo(route, { strokeDashoffset: len, strokeDasharray: `6 7` }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '#map', start: 'top 75%', end: 'center 40%', scrub: 0.6 }
    });
  }
  gsap.from('.map__pin', {
    scale: 0, transformOrigin: 'center', opacity: 0, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.1,
    scrollTrigger: { trigger: '#map', start: 'top 70%', once: true }
  });
  gsap.from(['.map__river', '.map__park'], {
    opacity: 0, scale: 0.9, transformOrigin: 'center', duration: 1.2, ease: 'power3.out', stagger: 0.15,
    scrollTrigger: { trigger: '#map', start: 'top 80%', once: true }
  });
  gsap.from('.places li', {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.places', start: 'top 80%', once: true }
  });
  const setActive = id => {
    document.querySelectorAll('.places li, .map__pin').forEach(el => el.classList.toggle('is-active', el.dataset.id === id));
  };
  document.querySelectorAll('.places li, .map__pin').forEach(el => {
    el.addEventListener('pointerenter', () => setActive(el.dataset.id));
    el.addEventListener('pointerleave', () => setActive(null));
  });

  /* ---------- 03 Інфраструктура: горизонтальна стрічка ---------- */
  const track = document.getElementById('infra-track');
  const cards = track ? track.querySelectorAll('.card') : [];
  ScrollTrigger.matchMedia({
    '(min-width: 761px)': () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.5, ease: 'power3' });
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.infra', start: 'top top', end: () => '+=' + dist(),
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => skewTo(gsap.utils.clamp(-6, 6, self.getVelocity() / -400))
        }
      });
      return () => { tween.kill(); gsap.set(cards, { skewX: 0 }); };
    }
  });
  gsap.from(cards, {
    y: 80, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out',
    scrollTrigger: { trigger: '.infra', start: 'top 70%', once: true }
  });

  /* ---------- 04 Планування ---------- */
  // Умовні схеми: [x, y, w, h, назва, площа]; вікна — [x1,y1,x2,y2]
  const PLANS = [
    {
      area: [42, 69], desc: 'Компактна квартира з кухнею-вітальнею, де вистачає місця і на диван, і на великий стіл.',
      rooms: [[20, 20, 210, 150, 'Кухня-вітальня', '≈ 28 м²'], [230, 20, 150, 150, 'Спальня', '≈ 14 м²'], [20, 170, 120, 110, 'Передпокій', '≈ 7 м²'], [140, 170, 90, 110, 'Санвузол', '≈ 5 м²'], [230, 170, 150, 110, 'Гардероб', '≈ 4 м²']],
      wins: [[50, 20, 190, 20], [260, 20, 350, 20]]
    },
    {
      area: [61, 86], desc: 'Дві окремі кімнати й простора кухня-вітальня — зручно для пари або сім\'ї з дитиною.',
      rooms: [[20, 20, 180, 140, 'Кухня-вітальня', '≈ 26 м²'], [200, 20, 180, 140, 'Спальня', '≈ 16 м²'], [20, 160, 130, 120, 'Дитяча', '≈ 12 м²'], [150, 160, 120, 120, 'Передпокій', '≈ 9 м²'], [270, 160, 110, 120, 'Санвузол', '≈ 6 м²']],
      wins: [[40, 20, 170, 20], [220, 20, 360, 20], [20, 190, 20, 260]]
    },
    {
      area: [79, 106], desc: 'Три кімнати, два санвузли і кухня-вітальня з вікнами в підлогу — для великої родини.',
      rooms: [[20, 20, 200, 130, 'Кухня-вітальня', '≈ 30 м²'], [220, 20, 160, 130, 'Майстер-спальня', '≈ 18 м²'], [20, 150, 120, 130, 'Кімната', '≈ 13 м²'], [140, 150, 110, 130, 'Кімната', '≈ 12 м²'], [250, 150, 70, 130, 'С/в', '≈ 5 м²'], [320, 150, 60, 130, 'С/в', '≈ 4 м²']],
      wins: [[40, 20, 200, 20], [240, 20, 360, 20], [20, 170, 20, 260], [380, 40, 380, 130]]
    }
  ];
  const svg = document.getElementById('plan-svg');
  const areaEl = document.getElementById('plan-area');
  const descEl = document.getElementById('plan-desc');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  let current = -1;
  function renderPlan(i) {
    if (i === current) return;
    current = i;
    const p = PLANS[i];
    svg.innerHTML = '';
    p.rooms.forEach(([x, y, w, h, name, a], k) => {
      svg.appendChild(mk('rect', { x, y, width: w, height: h, class: k === 0 ? 'inner' : 'inner', pathLength: 1 }));
      const t = mk('text', { x: x + w / 2, y: y + h / 2, 'text-anchor': 'middle', class: 'room' }); t.textContent = name; svg.appendChild(t);
      const s = mk('text', { x: x + w / 2, y: y + h / 2 + 16, 'text-anchor': 'middle', class: 'area' }); s.textContent = a; svg.appendChild(s);
    });
    svg.appendChild(mk('rect', { x: 20, y: 20, width: 360, height: 260, class: 'wall', pathLength: 1 }));
    p.wins.forEach(([x1, y1, x2, y2]) => svg.appendChild(mk('line', { x1, y1, x2, y2, class: 'win' })));

    const lines = svg.querySelectorAll('rect');
    gsap.fromTo(lines, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: reduced ? 0 : 1.2, ease: 'power2.inOut', stagger: 0.06 });
    gsap.fromTo(svg.querySelectorAll('text'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.5, stagger: 0.03 });
    gsap.fromTo(svg.querySelectorAll('.win'), { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.9 });

    const o = { a: +areaEl.dataset.a || 0, b: +areaEl.dataset.b || 0 };
    gsap.to(o, {
      a: p.area[0], b: p.area[1], duration: 0.8, ease: 'power2.out',
      onUpdate: () => { areaEl.textContent = `${Math.round(o.a)}–${Math.round(o.b)}`; }
    });
    areaEl.dataset.a = p.area[0]; areaEl.dataset.b = p.area[1];
    gsap.fromTo(descEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
    descEl.textContent = p.desc;
  }
  document.querySelectorAll('.plans__tabs .tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.plans__tabs .tab').forEach(t => t.classList.toggle('is-active', t === tab));
    renderPlan(+tab.dataset.plan);
  }));
  ScrollTrigger.create({ trigger: '.plans', start: 'top 70%', once: true, onEnter: () => renderPlan(0) });

  /* ---------- 05 Галерея: перетягування з інерцією + лайтбокс ---------- */
  const vp = document.getElementById('gallery-viewport');
  const gTrack = document.getElementById('gallery-track');
  const gBar = document.getElementById('gallery-bar');
  const shots = gsap.utils.toArray('.shot');
  const pos = { x: 0 };
  const maxX = () => Math.max(0, gTrack.scrollWidth - vp.clientWidth);
  function applyGallery() {
    gsap.set(gTrack, { x: pos.x });
    const m = maxX();
    gsap.set(gBar, { scaleX: m ? -pos.x / m : 1 });
    // паралакс усередині кадрів
    const c = window.innerWidth / 2;
    shots.forEach(s => {
      const r = s.getBoundingClientRect();
      const off = ((r.left + r.width / 2) - c) / window.innerWidth;
      s.querySelector('img').style.transform = `translateX(${off * -8}%)`;
    });
  }
  let down = false, moved = 0, startX = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0, glide;
  vp.addEventListener('pointerdown', e => {
    down = true; moved = 0; startX = lastX = e.clientX; startPos = pos.x; lastT = performance.now(); vel = 0;
    glide && glide.kill();
    vp.classList.add('is-drag');
  });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
    let x = startPos + dx;
    const m = maxX();
    if (x > 0) x *= 0.35; if (x < -m) x = -m + (x + m) * 0.35;  // гумовий край
    pos.x = x; applyGallery();
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; vp.classList.remove('is-drag');
    const target = gsap.utils.clamp(-maxX(), 0, pos.x + vel * 420);
    glide = gsap.to(pos, { x: target, duration: 1.1, ease: 'power3.out', onUpdate: applyGallery });
  });
  vp.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const step = vp.clientWidth * 0.6 * (e.key === 'ArrowRight' ? -1 : 1);
    glide && glide.kill();
    glide = gsap.to(pos, { x: gsap.utils.clamp(-maxX(), 0, pos.x + step), duration: 0.8, ease: 'power3.out', onUpdate: applyGallery });
  });
  vp.tabIndex = 0;
  window.addEventListener('resize', () => { pos.x = gsap.utils.clamp(-maxX(), 0, pos.x); applyGallery(); });
  applyGallery();
  // кадри «відкриваються» шторкою знизу вгору
  gsap.to('.shot__img', {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut', stagger: 0.12,
    scrollTrigger: { trigger: vp, start: 'top 80%', once: true }
  });
  // невеликий дрейф стрічки від вертикального скролу
  ScrollTrigger.create({
    trigger: '.gallery', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      if (down || (glide && glide.isActive())) return;
      const d = self.getVelocity() / 60;
      if (Math.abs(d) < 1) return;
      pos.x = gsap.utils.clamp(-maxX(), 0, pos.x - d * 0.5);
      applyGallery();
    }
  });

  // Лайтбокс
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-cap');
  let lbIndex = 0;
  function openLb(i) {
    lbIndex = (i + shots.length) % shots.length;
    const s = shots[lbIndex];
    lbImg.src = s.dataset.full;
    lbImg.alt = s.querySelector('img').alt;
    lbCap.textContent = s.querySelector('figcaption').textContent;
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    gsap.fromTo(lbImg, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
    lenisStop();
  }
  function closeLb() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lenisStart(); }
  shots.forEach((s, i) => s.addEventListener('click', () => { if (moved < 6) openLb(i); }));
  lb.querySelector('.lightbox__close').addEventListener('click', closeLb);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', () => openLb(lbIndex - 1));
  lb.querySelector('.lightbox__nav--next').addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  window.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
  });

  /* ---------- 06 Хід будівництва ---------- */
  document.querySelectorAll('.stage__bar i').forEach((bar, k) => {
    gsap.to(bar, {
      width: bar.dataset.w + '%', duration: 1.6, ease: 'power3.inOut', delay: k * 0.15,
      scrollTrigger: { trigger: '.stages', start: 'top 75%', once: true }
    });
  });
  gsap.from('.stage', {
    y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.stages', start: 'top 80%', once: true }
  });

  /* ---------- 07 Умови ---------- */
  gsap.from('.term', {
    y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.terms__grid', start: 'top 80%', once: true }
  });

  /* ---------- FAQ: плавне відкриття ---------- */
  document.querySelectorAll('.faq details').forEach(d => {
    const sum = d.querySelector('summary');
    const body = d.querySelector('div');
    sum.addEventListener('click', e => {
      e.preventDefault();
      gsap.killTweensOf(body); gsap.set(body, { clearProps: 'height' });
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.45, ease: 'power2.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.from(body, { height: 0, duration: 0.5, ease: 'power2.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
  gsap.from('.faq details', {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
    scrollTrigger: { trigger: '.faq__list', start: 'top 85%', once: true }
  });

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
})();
