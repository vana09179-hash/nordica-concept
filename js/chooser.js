/* =========================================================
   Вибір квартири на фасаді + проліт дрона в квартиру
   ---------------------------------------------------------
   НАЛАШТУВАННЯ (заготовка — підправте під реальні дані):
   - BUILDINGS: межі веж на фото facade.webp (1850×1040 px)
   - квартири зараз генеруються випадково-стабільно (заглушка);
     замініть getApartments() на реальний список з CRM/таблиці
   - відео прольоту: список FLYIN_VIDEOS нижче (зараз одне спільне)
     можна додати окремі ролики для 1/2/3-кімнатних
   ========================================================= */
(function () {
  const IMG_W = 1850, IMG_H = 1040;
  const BUILDINGS = [
    { id: 'b2', name: 'Будинок 2', x0: 478, x1: 852, top: 152, bottom: 762, floors: 25, from: 2 },
    { id: 'b3', name: 'Будинок 3', x0: 1068, x1: 1326, top: 122, bottom: 832, floors: 26, from: 2 }
  ];
  const AREAS = { 1: [42, 69], 2: [61, 86], 3: [79, 106] };
  const STATUS = { free: 'Вільна', booked: 'Заброньована', sold: 'Продана' };

  const svg = document.getElementById('choose-svg');
  if (!svg) return;
  const stage = document.getElementById('choose-stage');
  const tip = document.getElementById('choose-tip');
  const tabsEl = document.getElementById('choose-tabs');
  const floorEl = document.getElementById('choose-floor');
  const hintEl = document.getElementById('choose-hint');
  const list = document.getElementById('apts');
  const detail = document.getElementById('apt-detail');
  const NS = 'http://www.w3.org/2000/svg';

  const state = { b: 1, floor: null, apt: null };

  /* ---------- дані-заглушка ---------- */
  function rng(seed) { let a = seed; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
  function getApartments(b, floor) {
    const r = rng((b + 1) * 1000 + floor * 7);
    const n = 4 + Math.floor(r() * 3);
    return Array.from({ length: n }, (_, i) => {
      const rooms = r() < 0.4 ? 1 : r() < 0.7 ? 2 : 3;
      const [a0, a1] = AREAS[rooms];
      const s = r();
      return {
        id: `${BUILDINGS[b].id}-${floor}-${i + 1}`,
        num: floor * 10 + i + 1,
        rooms,
        area: +(a0 + r() * (a1 - a0)).toFixed(1),
        status: s < 0.68 ? 'free' : s < 0.84 ? 'booked' : 'sold',
        slot: (i + 0.5) / n   // положення на поверсі (0..1) — для точки прольоту
      };
    });
  }
  const floorY = (B, f) => {
    const h = (B.bottom - B.top) / (B.floors - B.from + 1);
    const y = B.bottom - (f - B.from + 1) * h;
    return { y, h };
  };

  /* ---------- фасад ---------- */
  function drawFloors() {
    svg.innerHTML = '';
    BUILDINGS.forEach((B, bi) => {
      for (let f = B.from; f <= B.floors; f++) {
        const { y, h } = floorY(B, f);
        const apts = getApartments(bi, f);
        const free = apts.filter(a => a.status === 'free').length;
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', B.x0); rect.setAttribute('y', y);
        rect.setAttribute('width', B.x1 - B.x0); rect.setAttribute('height', h - 1);
        rect.setAttribute('class', 'floor' + (free ? '' : ' is-sold'));
        rect.dataset.b = bi; rect.dataset.f = f; rect.dataset.free = free;
        svg.appendChild(rect);
      }
    });
  }

  function syncActive() {
    svg.querySelectorAll('.floor').forEach(r =>
      r.classList.toggle('is-active', +r.dataset.b === state.b && +r.dataset.f === state.floor));
    tabsEl.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('is-active', i === state.b));
  }

  function selectFloor(b, f) {
    const B = BUILDINGS[b];
    f = Math.max(B.from, Math.min(B.floors, f));
    state.b = b; state.floor = f; state.apt = null;
    floorEl.textContent = f;
    hintEl.textContent = `${B.name} · оберіть квартиру`;
    detail.hidden = true;
    syncActive();
    renderList();
  }

  function renderList() {
    const apts = getApartments(state.b, state.floor);
    list.innerHTML = apts.map(a => `
      <li class="apt apt--${a.status}" data-id="${a.id}" tabindex="${a.status === 'sold' ? -1 : 0}">
        <span class="apt__rooms">${a.rooms}-кімн. · №${a.num}</span>
        <span class="apt__area">${String(a.area).replace('.', ',')} м²</span>
        <span class="apt__st">${STATUS[a.status]}</span>
      </li>`).join('');
    gsap.from(list.children, { y: 16, opacity: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' });
    list.querySelectorAll('.apt').forEach((li, i) => {
      const a = apts[i];
      if (a.status === 'sold') return;
      const pick = () => {
        state.apt = a;
        list.querySelectorAll('.apt').forEach(x => x.classList.toggle('is-active', x === li));
        document.getElementById('apt-name').textContent = `Квартира №${a.num}`;
        document.getElementById('apt-meta').textContent =
          `${a.rooms}-кімнатна · ${String(a.area).replace('.', ',')} м² · ${state.floor} поверх · ${BUILDINGS[state.b].name} · ${STATUS[a.status].toLowerCase()}`;
        detail.hidden = false;
        gsap.from(detail, { y: 14, opacity: 0, duration: 0.4 });
      };
      li.addEventListener('click', pick);
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  // вкладки будинків
  tabsEl.innerHTML = BUILDINGS.map((B, i) => `<button class="tab" data-b="${i}">${B.name}</button>`).join('');
  tabsEl.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    const b = +t.dataset.b;
    selectFloor(b, state.floor || Math.round(BUILDINGS[b].floors / 2));
  }));
  document.querySelectorAll('.choose__step').forEach(s => s.addEventListener('click', () => {
    if (state.floor == null) return selectFloor(state.b, BUILDINGS[state.b].from);
    selectFloor(state.b, state.floor + +s.dataset.step);
  }));

  // наведення / клік по поверху
  svg.addEventListener('pointermove', e => {
    const r = e.target.closest('.floor');
    if (!r) { tip.classList.remove('is-on'); return; }
    const box = stage.getBoundingClientRect();
    tip.style.left = (e.clientX - box.left) + 'px';
    tip.style.top = (e.clientY - box.top) + 'px';
    const free = +r.dataset.free;
    tip.innerHTML = `<b>${BUILDINGS[r.dataset.b].name} · ${r.dataset.f} поверх</b>${free ? `Вільних квартир: ${free}` : 'Усі квартири продано'}`;
    tip.classList.add('is-on');
  });
  svg.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
  svg.addEventListener('click', e => {
    const r = e.target.closest('.floor');
    if (!r || r.classList.contains('is-sold')) return;
    selectFloor(+r.dataset.b, +r.dataset.f);
  });

  drawFloors();
  syncActive();

  // поява блоку
  gsap.from('.choose__panel > *', {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.choose', start: 'top 70%', once: true }
  });
  // підказка-«хвиля» по поверхах, щоб було видно, що фасад клікабельний
  ScrollTrigger.create({
    trigger: '.choose', start: 'top 60%', once: true,
    onEnter: () => {
      const floors = [...svg.querySelectorAll('.floor')].filter(r => +r.dataset.b === 1).reverse();
      floors.forEach((r, i) => setTimeout(() => {
        r.classList.add('is-hover');
        setTimeout(() => r.classList.remove('is-hover'), 260);
      }, 400 + i * 45));
    }
  });

  /* =========================================================
     ПРОЛІТ У КВАРТИРУ
     ========================================================= */
  const fly = document.getElementById('flyin');
  const zoomBox = document.getElementById('flyin-zoom');
  const zoomImg = zoomBox.querySelector('img');
  const video = document.getElementById('flyin-video');
  const ph = document.getElementById('flyin-ph');
  const label = document.getElementById('flyin-label');

  // Відео прольоту. Додали окремі ролики для 1/2/3 кімнат — впишіть їх сюди:
  // наприклад { 1: 'media/flyin/1k.mp4', 2: 'media/flyin/2k.mp4', default: ... }
  const FLYIN_VIDEOS = { default: 'media/flyin/apartment.mp4' };
  async function findVideo(rooms) {
    return FLYIN_VIDEOS[rooms] || FLYIN_VIDEOS.default || null;
  }

  async function flyIn() {
    const a = state.apt;
    if (!a) return;
    const B = BUILDINGS[state.b];
    const { y, h } = floorY(B, state.floor);
    const cx = B.x0 + (B.x1 - B.x0) * a.slot, cy = y + h / 2;
    // точка на екрані (img — object-fit: cover)
    const W = innerWidth, H = innerHeight;
    const s = Math.max(W / IMG_W, H / IMG_H);
    const px = (W - IMG_W * s) / 2 + cx * s, py = (H - IMG_H * s) / 2 + cy * s;

    label.textContent = `Квартира №${a.num} · ${state.floor} поверх`;
    fly.classList.add('is-open'); fly.setAttribute('aria-hidden', 'false');
    window.lenis && window.lenis.stop();
    gsap.set([video, ph, label], { opacity: 0 });
    gsap.set(zoomBox, { opacity: 1 });

    const src = await findVideo(a.rooms);

    if (src) {
      // Відео саме починається з фасаду: показуємо його перший кадр,
      // легкий «вдих» камери до точки квартири — і запускаємо проліт
      zoomImg.src = src.replace(/\.mp4$/, '-first.webp');
      zoomImg.onerror = () => { zoomImg.onerror = null; zoomImg.src = 'media/photos/facade.webp'; };
      video.src = src;
      video.currentTime = 0;
      const ready = new Promise(res => {
        if (video.readyState >= 3) return res();
        video.addEventListener('canplay', res, { once: true });
        setTimeout(res, 2500);
      });
      gsap.fromTo(zoomBox, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      await gsap.fromTo(zoomImg, { scale: 1, transformOrigin: `${px}px ${py}px` },
        { scale: 1.12, duration: 0.9, ease: 'power2.inOut' });
      await ready;
      gsap.set(zoomImg, { scale: 1 });
      try { await video.play(); } catch (e) { /* автоплей заборонено — залишиться перший кадр */ }
      gsap.to(video, { opacity: 1, duration: 0.35 });
      gsap.to(zoomBox, { opacity: 0, duration: 0.35, delay: 0.1 });
    } else {
      zoomImg.src = 'media/photos/facade.webp';
      await gsap.fromTo(zoomImg, { scale: 1, transformOrigin: `${px}px ${py}px`, filter: 'blur(0px)' },
        { scale: 7, filter: 'blur(6px)', duration: 1.8, ease: 'power3.in' });
      gsap.to(ph, { opacity: 1, duration: 0.6 });
      gsap.to(zoomBox, { opacity: 0, duration: 0.6 });
    }
    gsap.to(label, { opacity: 1, duration: 0.6, delay: 0.3 });
  }

  // підвантажуємо відео заздалегідь, щойно квартиру обрано
  document.getElementById('apts').addEventListener('click', () => {
    if (state.apt && !video.getAttribute('src')) {
      findVideo(state.apt.rooms).then(s => { if (s) { video.preload = 'auto'; video.src = s; } });
    }
  });

  function closeFly() {
    video.pause(); video.removeAttribute('src'); video.load();
    gsap.to(fly, {
      opacity: 0, duration: 0.4, onComplete: () => {
        fly.classList.remove('is-open'); fly.setAttribute('aria-hidden', 'true');
        gsap.set(fly, { clearProps: 'opacity' });
        gsap.set(zoomImg, { scale: 1, filter: 'none' });
        window.lenis && window.lenis.start();
      }
    });
  }
  document.getElementById('fly-btn').addEventListener('click', flyIn);
  document.getElementById('flyin-close').addEventListener('click', closeFly);
  video.addEventListener('ended', () => gsap.to(label, { opacity: 1 }));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && fly.classList.contains('is-open')) closeFly(); });
})();
