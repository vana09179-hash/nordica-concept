/* =========================================================
   «Фішки» сайту:
   - плавний інерційний скрол (Lenis)
   - власний курсор з підписом над кнопками
   - магнітні кнопки
   - смужка прогресу скролу
   - біжучий рядок, що прискорюється від швидкості скролу
   - лічильники цифр
   - анімація заголовків по літерах
   ========================================================= */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Плавний скрол ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // якорі меню — плавно
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    }));
    // не скролити сторінку під відкритою модалкою/меню
    const obs = new MutationObserver(() => {
      const locked = document.querySelector('.modal.is-open') || document.body.classList.contains('menu-open');
      locked ? lenis.stop() : lenis.start();
    });
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* ---------- 2. Власний курсор ---------- */
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  const label = document.getElementById('cursor-label');
  if (finePointer && !reduced) {
    document.documentElement.classList.add('has-cursor');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringX = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', e => {
      pos.x = e.clientX; pos.y = e.clientY;
      ringX(pos.x); ringY(pos.y);
      gsap.set(dot, { x: pos.x, y: pos.y });
    });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('a, button, input, label, [data-cursor]');
      if (!t) return;
      const text = t.dataset.cursor || '';
      label.textContent = text;
      cursor.classList.add(text ? 'is-label' : 'is-hover');
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('a, button, input, label, [data-cursor]');
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      cursor.classList.remove('is-label', 'is-hover');
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => gsap.to([cursor, dot], { opacity: 0, duration: 0.2 }));
    document.addEventListener('mouseenter', () => gsap.to([cursor, dot], { opacity: 1, duration: 0.2 }));

    /* ---------- 3. Магнітні кнопки ---------- */
    document.querySelectorAll('.magnetic').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- 4. Прогрес скролу ---------- */
  const bar = document.getElementById('progress');
  gsap.to(bar, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ---------- 5. Біжучий рядок ---------- */
  const track = document.getElementById('marquee');
  if (track) {
    track.innerHTML += track.innerHTML; // дублюємо для безшовного циклу
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    if (reduced) loop.pause();
    let boost = gsap.to({}, {});
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        // швидкість та напрям залежать від скролу
        const v = self.getVelocity() / 300;
        const dir = self.direction;
        boost.kill();
        loop.timeScale(dir * Math.max(1, Math.min(6, Math.abs(v))));
        boost = gsap.to(loop, { timeScale: dir, duration: 1, ease: 'power2.out', delay: 0.1 });
      }
    });
  }

  /* ---------- 6. Лічильники ---------- */
  document.querySelectorAll('.count').forEach(el => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: reduced ? 0 : 2, ease: 'power2.out',
      onUpdate: () => { const d = +(el.dataset.dec || 0); el.textContent = o.v.toFixed(d).replace('.', ','); },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
  gsap.from('.fact', {
    y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.facts', start: 'top 75%', once: true }
  });

  /* ---------- 7. Заголовок по літерах ---------- */
  document.querySelectorAll('.cta__title').forEach(h => {
    const lines = h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = lines.map(l => `<span class="line">${[...l.trim()].map(c => c === ' ' ? ' ' : `<span class="ch">${c}</span>`).join('')}</span>`).join('');
    gsap.from(h.querySelectorAll('.ch'), {
      yPercent: 110, rotate: 8, opacity: 0, duration: 0.9, stagger: 0.025, ease: 'power4.out',
      scrollTrigger: { trigger: h, start: 'top 80%', once: true }
    });
  });

  // шрифти з Google Fonts змінюють розміри — перераховуємо тригери
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
