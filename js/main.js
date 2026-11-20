/* =========================================================
   Smereka — прототип скролл-анімацій
   1) Обліт камерою (процедурна сцена на canvas)
   2) Перехід у «гравюру» з вертикальних штрихів
   3) Пролог: слова збираються в цитату
   4) Бахрома + птахи
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

const INK = '#17358a';
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- утиліти ---------- */
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed) {
  const r = mulberry(seed);
  const v = Array.from({ length: 512 }, r);
  return x => {
    const i = Math.floor(x), f = x - i;
    const a = v[i & 511], b = v[(i + 1) & 511];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}
const fbm = (n, x) => n(x) * 0.6 + n(x * 2.3 + 17) * 0.3 + n(x * 5.1 + 33) * 0.1;
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);

function drawPine(ctx, x, y, h, color) {
  ctx.fillStyle = color;
  const w = h * 0.4;
  for (let k = 0; k < 4; k++) {
    const yy = y - h * k * 0.2;
    const ww = w * (1 - k * 0.2);
    ctx.beginPath();
    ctx.moveTo(x - ww / 2, yy);
    ctx.lineTo(x + ww / 2, yy);
    ctx.lineTo(x, yy - h * 0.42);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(x - h * 0.012, y - h * 0.02, h * 0.024, h * 0.08);
}

/* =========================================================
   1. ПЕРШИЙ ЕКРАН — процедурна сцена (заглушка під рендер/відео)
   ========================================================= */
const heroCanvas = document.getElementById('hero-canvas');
const hctx = heroCanvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
const scene = { t: 0 };

function buildScene() {
  const r = mulberry(7);
  scene.n1 = makeNoise(1); scene.n2 = makeNoise(2); scene.n3 = makeNoise(3);
  scene.farTrees = Array.from({ length: 260 }, () => ({ x: r() * 1.6 - 0.3, s: 0.5 + r() * 0.9, o: r() }));
  scene.nearTrees = [
    { x: -0.04, s: 1.3 }, { x: 0.04, s: 0.95 }, { x: 0.1, s: 0.6 },
    { x: 0.92, s: 0.75 }, { x: 1.02, s: 1.25 }, { x: 0.86, s: 0.5 }
  ];
  scene.win = Array.from({ length: 6000 }, r);
}

function withLayer(d, t, fn) {
  const ctx = hctx;
  ctx.save();
  const s = 1 + t * (0.12 + 1.0 * d);
  const ty = t * H * (0.42 * d - 0.04);
  const fx = W * 0.47, fy = H * 0.64;
  ctx.translate(fx, fy + ty);
  ctx.scale(s, s);
  ctx.translate(-fx, -fy);
  fn(ctx);
  ctx.restore();
}

function ridge(ctx, n, base, amp, freq, color) {
  ctx.beginPath();
  ctx.moveTo(-W, H * 2);
  for (let x = -W; x <= W * 2; x += 8) ctx.lineTo(x, base - fbm(n, (x + W) / W * freq) * amp);
  ctx.lineTo(W * 2, H * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function fog(ctx, y, h, a) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, 'rgba(226,206,178,0)');
  g.addColorStop(0.5, `rgba(226,206,178,${a})`);
  g.addColorStop(1, 'rgba(226,206,178,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-W, y - h, W * 3, h * 2);
}

function drawBuilding(ctx) {
  const u = Math.min(H / 135, W / (W < 700 ? 88 : 150));
  const cx = W * 0.46, base = H * 0.82;
  // [x0, x1, top] у юнітах відносно центру
  const blocks = [
    [-42, -30, 20], [-30, -20, 26], [-20, -11, 34], [-11, 9, 55],
    [9, 21, 36], [21, 32, 42], [32, 41, 53]
  ];
  let wi = 0;
  blocks.forEach((b, bi) => {
    const x0 = cx + b[0] * u, x1 = cx + b[1] * u, top = base - (80 - b[2]) * u;
    ctx.fillStyle = '#3a3027';
    ctx.fillRect(x0, top, x1 - x0, base - top);
    // поверхи та вікна
    for (let y = top + 2 * u; y < base - 2 * u; y += 5 * u) {
      ctx.fillStyle = '#2a221b';
      ctx.fillRect(x0, y + 3.6 * u, x1 - x0, 0.5 * u);
      for (let x = x0 + 1 * u; x < x1 - 2 * u; x += 2.8 * u) {
        const lit = scene.win[wi++ % scene.win.length];
        ctx.fillStyle = lit > 0.74 ? 'rgba(244,186,104,.95)' : '#1c1712';
        ctx.fillRect(x, y, 1.5 * u, 2.6 * u);
      }
    }
    // ламелі
    ctx.fillStyle = 'rgba(120,98,74,.35)';
    for (let x = x0; x < x1; x += 1.4 * u) ctx.fillRect(x, top, 0.35 * u, base - top);
    // тераса / дах
    ctx.fillStyle = (bi === 4 || bi === 5) ? '#5f6b3c' : '#8a7860';
    ctx.fillRect(x0 - 0.6 * u, top - 0.8 * u, x1 - x0 + 1.2 * u, 0.9 * u);
  });
  // басейн і земля
  ctx.fillStyle = '#1b1d16';
  ctx.fillRect(cx - 60 * u, base, 120 * u, 30 * u);
  ctx.fillStyle = '#6a98a8';
  ctx.fillRect(cx + 11 * u, base + 1.5 * u, 18 * u, 3 * u);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.fillRect(cx + 11 * u, base + 1.5 * u, 18 * u, 0.6 * u);
}

function drawProcedural() {
  const ctx = hctx, t = scene.t;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // небо + сонце
  withLayer(0, t, c => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#9a958c');
    g.addColorStop(0.42, '#e3c49c');
    g.addColorStop(0.65, '#cfa77c');
    c.fillStyle = g;
    c.fillRect(-W, -H, W * 3, H * 3);
    const s = c.createRadialGradient(W * 0.8, H * 0.38, 0, W * 0.8, H * 0.38, H * 0.45);
    s.addColorStop(0, 'rgba(255,238,200,1)');
    s.addColorStop(0.15, 'rgba(255,220,170,.7)');
    s.addColorStop(1, 'rgba(255,210,160,0)');
    c.fillStyle = s;
    c.fillRect(-W, -H, W * 3, H * 3);
  });
  withLayer(0.05, t, c => { ridge(c, scene.n1, H * 0.47, H * 0.15, 3, '#7a736a'); fog(c, H * 0.47, H * 0.05, 0.55); });
  withLayer(0.15, t, c => { ridge(c, scene.n2, H * 0.56, H * 0.13, 4, '#4b4b42'); fog(c, H * 0.56, H * 0.04, 0.45); });
  withLayer(0.3, t, c => {
    c.fillStyle = '#20241c';
    c.fillRect(-W, H * 0.62, W * 3, H * 2);
    scene.farTrees.forEach(tr => {
      const y = H * 0.625 + tr.o * H * 0.04;
      drawPine(c, tr.x * W, y, H * 0.06 * tr.s, tr.o > 0.5 ? '#262b22' : '#1d2119');
    });
    fog(c, H * 0.6, H * 0.03, 0.25);
  });
  withLayer(0.45, t, drawBuilding);
  withLayer(0.95, t, c => {
    scene.nearTrees.forEach(tr => drawPine(c, tr.x * W, H * 1.1, H * 0.6 * tr.s, '#121510'));
  });
}

/* ---------- Відео обльоту: послідовність кадрів, яку «крутить» скрол ---------- */
const FLY = { count: 145, path: i => `media/flyover/f_${String(i + 1).padStart(3, '0')}.webp`, imgs: [], ready: false };

function loadFrame(i) {
  return new Promise(res => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { FLY.imgs[i] = img; res(true); };
    img.onerror = () => res(false);
    img.src = FLY.path(i);
  });
}
// Спочатку кожен 4-й кадр (для прелоадера), решта — у фоні
function preloadFlyover(onProgress) {
  const first = [], rest = [];
  for (let i = 0; i < FLY.count; i++) (i % 4 === 0 || i === FLY.count - 1 ? first : rest).push(i);
  let done = 0;
  return Promise.all(first.map(i => loadFrame(i).then(ok => { done++; onProgress(done / first.length); return ok; })))
    .then(res => {
      FLY.ready = res.some(Boolean);
      // фонова догрузка по 6 паралельно
      (async () => {
        for (let k = 0; k < rest.length; k += 6) {
          await Promise.all(rest.slice(k, k + 6).map(loadFrame));
          drawHero();
        }
      })();
    });
}
function nearestFrame(i) {
  for (let d = 0; d < FLY.count; d++) {
    if (FLY.imgs[i - d]) return FLY.imgs[i - d];
    if (FLY.imgs[i + d]) return FLY.imgs[i + d];
  }
  return null;
}

function drawHero() {
  if (!FLY.ready) return drawProcedural();
  const t = scene.t;
  const img = nearestFrame(Math.round(t * (FLY.count - 1)));
  if (!img) return drawProcedural();
  const ctx = hctx;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#1e1b17';
  ctx.fillRect(0, 0, W, H);
  // кадр вписуємо в прямокутник картки: поки картка стискається,
  // весь кадр зменшується разом з нею (будинок видно цілком)
  const r = cardRect();
  const zoom = 1.04 + t * 0.06;
  const s = Math.max(r.w / img.width, r.h / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, r.x + (r.w - w) / 2, r.y + (r.h - h) * 0.55, w, h);
}

/* =========================================================
   2. ШТРИХОВИЙ ФІЛЬТР: будь-яке зображення → вертикальні смуги
   ========================================================= */
const stripeCanvas = document.getElementById('stripe-canvas');
const sctx = stripeCanvas.getContext('2d');
const stripes = { p: 0, src: null, cols: [], cw: 6, vh: 0 };

// Фото фасаду як основа «гравюри» — так будинок упізнаваний у штрихах
const stripePhoto = new Image();
stripePhoto.src = 'media/photos/facade.webp';
stripePhoto.onload = () => { try { buildStripes(); renderStripes(); } catch (e) { /* розмір 0 */ } };
function drawPhotoTop(o, SW, vh) {
  if (!stripePhoto.complete || !stripePhoto.naturalWidth) return false;
  const iw = stripePhoto.naturalWidth, ih = stripePhoto.naturalHeight;
  // cover у верхню половину; трохи нижче центру, щоб вежі були цілком
  const s = Math.max(SW / iw, vh / ih) * 1.02;
  const w = iw * s, h = ih * s;
  o.drawImage(stripePhoto, (SW - w) / 2, (vh - h) * 0.45, w, h);
  // у відтінки сірого + контраст: небо світле (тонкі штрихи), фасад темний (товсті)
  const img = o.getImageData(0, 0, SW, Math.ceil(vh));
  const d = img.data, lo = 35, hi = 215;
  for (let i = 0; i < d.length; i += 4) {
    let l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    l = Math.min(1, Math.max(0, (l - lo) / (hi - lo)));
    l = Math.pow(l, 0.85) * 255;
    d[i] = d[i + 1] = d[i + 2] = l;
  }
  o.putImageData(img, 0, 0);
  // м'який перехід низу фото в темний берег
  const fade = o.createLinearGradient(0, vh * 0.82, 0, vh * 1.02);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,.9)');
  o.fillStyle = fade; o.fillRect(0, vh * 0.82, SW, vh * 0.2);
  return true;
}

// Ілюстрація-заглушка: малюємо чорним по білому, потім перетворюємо на смуги.
// Для реального контенту сюди можна підставити будь-яку картинку (drawImage).
function paintIllustration(o, SW, SH, vh) {
  const r = mulberry(11);
  const n = makeNoise(21);
  const g = a => `rgba(0,0,0,${a})`;
  o.fillStyle = '#fff';
  o.fillRect(0, 0, SW, SH);

  // якщо фото фасаду завантажене — беремо його, інакше малюємо процедурно
  if (!drawPhotoTop(o, SW, vh)) {

  function cloud(cx, cy, R, a) {
    o.beginPath();
    for (let i = 0; i < 16; i++) {
      o.ellipse(cx + (r() - 0.5) * R * 2.4, cy + (r() - 0.5) * R * 0.7, R * (0.3 + r() * 0.45), R * (0.22 + r() * 0.3), 0, 0, Math.PI * 2);
    }
    o.fillStyle = g(a);
    o.fill();
  }
  cloud(SW * 0.18, vh * 0.28, vh * 0.16, 0.78);
  cloud(SW * 0.82, vh * 0.08, vh * 0.14, 0.85);
  cloud(SW * 0.55, vh * 0.02, vh * 0.08, 0.6);

  // дальній хребет
  o.beginPath(); o.moveTo(0, SH);
  for (let x = 0; x <= SW; x += 6) o.lineTo(x, vh * 0.5 - fbm(n, x / SW * 4) * vh * 0.18);
  o.lineTo(SW, SH); o.closePath();
  o.fillStyle = g(0.32); o.fill();

  // пагорб
  const hill = o.createLinearGradient(0, vh * 0.55, 0, vh * 1.15);
  hill.addColorStop(0, g(0.5)); hill.addColorStop(1, g(0.9));
  o.beginPath(); o.moveTo(0, SH);
  for (let x = 0; x <= SW; x += 6) o.lineTo(x, vh * 0.66 - fbm(n, x / SW * 3 + 40) * vh * 0.14);
  o.lineTo(SW, SH); o.closePath();
  o.fillStyle = hill; o.fill();

  // кучеряві крони ботанічного саду (листяні, як на рендерах)
  function crown(x, y, R, a) {
    o.beginPath();
    for (let i = 0; i < 7; i++) o.arc(x + (r() - 0.5) * R * 1.4, y + (r() - 0.6) * R * 0.9, R * (0.45 + r() * 0.35), 0, Math.PI * 2);
    o.fillStyle = g(a); o.fill();
  }
  for (let i = 0; i < 40; i++) crown(r() * SW, vh * (0.64 + r() * 0.1), vh * (0.03 + r() * 0.03), 0.62 + r() * 0.2);

  // три вежі Nordica: темний масив + білі рамки фасаду (світлі → тонкі штрихи)
  function tower(x, top, w, base, seed) {
    const rr = mulberry(seed);
    o.fillStyle = g(0.95);
    o.fillRect(x, top, w, base - top);
    o.fillStyle = 'rgb(245,245,245)';
    const lw = Math.max(2, w * 0.035);
    // вертикальні рамки
    for (let k = 0; k < 3; k++) {
      const fx = x + w * (0.12 + k * 0.3 + rr() * 0.06);
      const ft = top + (base - top) * (rr() * 0.35);
      o.fillRect(fx, ft, lw, base - ft);
    }
    // горизонтальні «сходинки» рамок
    for (let k = 0; k < 4; k++) {
      const fy = top + (base - top) * (0.15 + k * 0.2 + rr() * 0.05);
      const fx = x + w * rr() * 0.4;
      o.fillRect(fx, fy, w * (0.35 + rr() * 0.4), lw);
    }
    o.fillRect(x, top, w, lw * 1.2);
  }
  tower(SW * 0.56, vh * 0.42, SW * 0.07, vh * 1.32, 31);
  tower(SW * 0.645, vh * 0.3, SW * 0.06, vh * 1.32, 32);
  tower(SW * 0.72, vh * 0.52, SW * 0.08, vh * 1.32, 33);

  // кругла крона-дерево біля веж і праворуч
  for (let i = 0; i < 18; i++) crown(SW * (0.5 + r() * 0.5), vh * (1.05 + r() * 0.25), vh * (0.05 + r() * 0.04), 0.86);
  for (let i = 0; i < 18; i++) crown(SW * r() * 0.5, vh * (0.95 + r() * 0.3), vh * (0.05 + r() * 0.05), 0.8);

  }

  // берег
  const bank = o.createLinearGradient(0, vh * 1.0, 0, vh * 1.3);
  bank.addColorStop(0, g(0)); bank.addColorStop(1, g(0.9));
  o.fillStyle = bank; o.fillRect(0, vh * 1.0, SW, vh * 0.3);
  o.fillStyle = g(0.9); o.fillRect(0, vh * 1.3, SW, SH);

  // Дніпро: світлі хвилясті смуги → «відблиски» води
  for (let k = 0; k < 9; k++) {
    const y0 = vh * (1.42 + k * 0.05);
    o.beginPath();
    o.moveTo(0, y0);
    for (let x = 0; x <= SW; x += 10) o.lineTo(x, y0 + Math.sin(x / SW * 9 + k * 1.3) * vh * 0.012);
    o.lineWidth = vh * (0.006 + (8 - k) * 0.0015);
    o.strokeStyle = `rgba(255,255,255,${0.75 - k * 0.07})`;
    o.stroke();
  }
  // сонячна доріжка на воді
  const path = o.createRadialGradient(SW * 0.3, vh * 1.5, 0, SW * 0.3, vh * 1.5, vh * 0.25);
  path.addColorStop(0, 'rgba(255,255,255,.7)'); path.addColorStop(1, 'rgba(255,255,255,0)');
  o.fillStyle = path; o.fillRect(0, vh * 1.35, SW, vh * 0.35);

  // низ переходить у колір прологу
  o.fillStyle = g(0.985);
  o.fillRect(0, vh * 1.9, SW, SH);
}

function buildStripes() {
  const cw = W < 700 ? 5 : 6, ch = 2;
  const vh = H, SW = W, SH = Math.ceil(H * 2);
  stripes.cw = cw; stripes.vh = vh;

  const off = document.createElement('canvas');
  off.width = SW; off.height = SH;
  const o = off.getContext('2d', { willReadFrequently: true });
  paintIllustration(o, SW, SH, vh);
  const data = o.getImageData(0, 0, SW, SH).data;

  const src = document.createElement('canvas');
  src.width = SW; src.height = SH;
  const s = src.getContext('2d');
  s.fillStyle = INK;
  const n = makeNoise(5);
  const r = mulberry(3);
  stripes.cols = [];

  for (let x0 = 0, i = 0; x0 < SW; x0 += cw, i++) {
    const jitter = 0.75 + 0.5 * n(i * 0.21);
    const sx = Math.min(SW - 1, x0 + (cw >> 1));
    let runY = 0, runW = -1;
    const flush = y => { if (runW > 0) s.fillRect(x0 + (cw - runW) / 2, runY, runW, y - runY); };
    for (let y = 0; y < SH; y += ch) {
      const idx = ((Math.min(SH - 1, y + 1)) * SW + sx) * 4;
      const ink = 1 - data[idx] / 255;
      // контрастна крива: світлі тони → тонкі штрихи, темні → майже суцільні
      const k = Math.pow(ink, 1.35);
      let bw = ink < 0.06 ? 0 : Math.min(cw - 1.5, cw * k * 1.1 * jitter);
      bw = Math.round(bw * 2) / 2;
      if (bw !== runW) { flush(y); runY = y; runW = bw; }
    }
    flush(SH);
    // затримка росту колонки: шум + випадковість → ефект «еквалайзера»
    stripes.cols.push({ x: x0, d: clamp01(0.05 + n(i * 0.09 + 50) * 0.35 + r() * 0.12) });
  }
  stripes.src = src;

  stripeCanvas.width = SW; stripeCanvas.height = SH;
  stripeCanvas.style.width = SW + 'px';
  stripeCanvas.style.height = SH + 'px';
}

function renderStripes() {
  const { p, src, cols, cw, vh } = stripes;
  if (!src) return;
  sctx.clearRect(0, 0, stripeCanvas.width, stripeCanvas.height);
  if (p <= 0) return;
  const SH = src.height, half = vh * 0.5;
  for (const c of cols) {
    const k = easeOut(clamp01((p - c.d) / 0.5));
    if (k <= 0) continue;
    const top = Math.max(1, half * k);
    sctx.drawImage(src, c.x, 0, cw, top, c.x, 0, cw, top);           // росте зверху
    const y0 = vh - half * k;
    sctx.drawImage(src, c.x, y0, cw, vh - y0 + 1, c.x, y0, cw, vh - y0 + 1); // росте знизу
    if (k > 0.98) sctx.drawImage(src, c.x, vh, cw, SH - vh, c.x, vh, cw, SH - vh);
  }
}

/* =========================================================
   3. ПРОЛОГ — розбиваємо цитату на слова
   ========================================================= */
const quote = document.getElementById('quote');
quote.innerHTML = quote.textContent.trim().split(/\s+/)
  .map(w => `<span class="w">${w}</span>`).join(' ');
const words = [...quote.querySelectorAll('.w')];

/* =========================================================
   4. БАХРОМА + ПТАХИ
   ========================================================= */
const fringeCanvas = document.getElementById('fringe-canvas');
const fctx = fringeCanvas.getContext('2d');
const fringe = { p: 0, lens: [], h: 0 };

function buildFringe() {
  const h = Math.round(H * 0.5);
  fringe.h = h;
  fringeCanvas.width = W; fringeCanvas.height = h;
  fringeCanvas.style.height = h + 'px';
  const n = makeNoise(9), r = mulberry(4);
  fringe.lens = [];
  for (let x = 0, i = 0; x < W; x += 6, i++) {
    const base = 0.18 + fbm(n, i * 0.035) * 0.55;
    fringe.lens.push({ x, l: Math.min(1, base + r() * 0.12), w: 3 + r() * 2.5 });
  }
}
function renderFringe() {
  const { p, h, lens } = fringe;
  fctx.clearRect(0, 0, W, h);
  fctx.fillStyle = INK;
  fctx.fillRect(0, 0, W, h * 0.12);
  for (const s of lens) {
    // p=0 → суцільна темрява (продовження прологу), p=1 → бахрома
    const L = h * (1 - p) + h * s.l * p;
    fctx.fillRect(s.x + (6 - s.w) / 2, 0, s.w, L);
  }
}

const birdSVG = '<svg viewBox="0 0 60 30"><path d="M30 15 C22 3 10 1 0 6 C11 8 21 12 30 19 Z"/><path d="M30 15 C38 3 50 1 60 6 C49 8 39 12 30 19 Z"/><ellipse cx="30" cy="16.5" rx="5" ry="2.6"/></svg>';
const birdsBox = document.getElementById('birds');
const birdDefs = [
  { l: 18, t: 62, s: 1.1, dx: 30, dy: -38 }, { l: 24, t: 70, s: 0.8, dx: 34, dy: -30 },
  { l: 30, t: 58, s: 1.3, dx: 26, dy: -42 }, { l: 14, t: 76, s: 0.7, dx: 38, dy: -26 },
  { l: 36, t: 68, s: 0.9, dx: 30, dy: -34 }, { l: 70, t: 72, s: 0.6, dx: 18, dy: -40 }
];
const birds = birdDefs.map((b, i) => {
  const el = document.createElement('div');
  el.className = 'bird';
  el.innerHTML = birdSVG;
  el.style.left = b.l + '%';
  el.style.top = b.t + '%';
  el.style.width = 44 * b.s + 'px';
  el.querySelector('svg').style.animationDelay = (-i * 0.13) + 's';
  birdsBox.appendChild(el);
  return el;
});

/* =========================================================
   ТАЙМЛАЙНИ
   ========================================================= */
// Картка з облітом: v 0→1 — стискається до картки, 1→2 — зникає в точку
const heroMedia = document.getElementById('hero-media');
const card = { v: 0 };
function cardInsets() {
  const v = card.v, mob = W < 700;
  const ty = 25, tx = mob ? 8 : 21;
  if (v <= 1) return { t: ty * v, x: tx * v };
  const k = v - 1;
  return { t: ty + (50 - ty) * k, x: tx + (50 - tx) * k };
}
function cardRect() {
  const { t, x } = cardInsets();
  const px = W * x / 100, py = H * t / 100;
  return { x: px, y: py, w: Math.max(1, W - px * 2), h: Math.max(1, H - py * 2) };
}
function applyCard() {
  const { t, x } = cardInsets();
  heroMedia.style.clipPath = card.v <= 0 ? 'none' : `inset(${t}% ${x}% ${t}% ${x}%)`;
  drawHero();
}

function setupScroll() {
  // --- Перший екран: обліт → картка → гравюра → вівці
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=480%', scrub: 0.8, pin: true }
  });
  tl.to('.hero__top', { yPercent: -140, opacity: 0, ease: 'none', duration: 1.4 }, 0)
    .to('.hero__scroll', { opacity: 0, duration: 0.3 }, 0)
    .to(scene, { t: 1, duration: 4, ease: 'none', onUpdate: drawHero }, 0)
    .to('.hero__left', { opacity: 0, y: -24, duration: 0.8 }, 3.7)
    .to('.hero__cta', { autoAlpha: 0, duration: 0.6 }, 3.7)
    .to('.hero__shade', { opacity: 0, duration: 0.8 }, 3.7)
    .to(card, { v: 1, duration: 2, ease: 'power1.inOut', onUpdate: applyCard }, 3.7)
    .to(stripes, { p: 1, duration: 2.8, ease: 'none', onUpdate: renderStripes }, 3.9)
    .to(card, { v: 2, duration: 1.4, ease: 'power2.in', onUpdate: applyCard }, 5.9)
    .to('#stripe-canvas', { y: () => -window.innerHeight, duration: 2.6, ease: 'none' }, 6.6);

  // --- Пролог: слова з хаосу в абзац
  words.forEach(w => gsap.set(w, {
    x: gsap.utils.random(-160, 160),
    y: gsap.utils.random(-100, 100),
    scale: gsap.utils.random(0.5, 1.45),
    opacity: gsap.utils.random(0.06, 0.35)
  }));
  gsap.timeline({
    scrollTrigger: { trigger: '#prologue', start: 'top top', end: '+=200%', scrub: 0.8, pin: true }
  })
    .from('.prologue__label', { opacity: 0, y: 20, duration: 0.4 }, 0)
    .to(words, { x: 0, y: 0, scale: 1, opacity: 1, ease: 'power2.out', duration: 1, stagger: 0.045 }, 0)
    .from('.pill', { opacity: 0, y: 30, duration: 0.5 })
    ;

  // --- Бахрома: беж «піднімається» з темряви
  gsap.to(fringe, {
    p: 1, ease: 'none', onUpdate: renderFringe,
    scrollTrigger: { trigger: '#brand', start: 'top bottom', end: 'top 15%', scrub: 0.6 }
  });
  gsap.from('.brand__name', {
    yPercent: 40, opacity: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '#brand', start: 'top 70%', end: 'top 10%', scrub: 0.6 }
  });
  // --- Птахи летять по скролу
  birds.forEach((el, i) => {
    const d = birdDefs[i];
    gsap.fromTo(el, { xPercent: -200, x: 0, y: 0 }, {
      x: () => d.dx * window.innerWidth / 100,
      y: () => d.dy * window.innerHeight / 100,
      ease: 'none',
      scrollTrigger: { trigger: '#brand', start: 'top bottom', end: 'bottom top', scrub: 0.5 }
    });
  });
}

/* =========================================================
   РОЗМІРИ / ІНІЦІАЛІЗАЦІЯ
   ========================================================= */
function sizeAll() {
  // у прихованій вкладці розміри можуть бути 0 — не даємо ініціалізації впасти
  W = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1280);
  H = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 720);
  DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  heroCanvas.width = Math.round(W * DPR);
  heroCanvas.height = Math.round(H * DPR);
  try { buildStripes(); } catch (e) { console.warn("stripes skipped", e); }
  buildFringe();
  drawHero();
  renderStripes();
  renderFringe();
}

function initUI() {
  // меню
  document.getElementById('menu-btn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  // модалка
  const modal = document.getElementById('modal');
  const form = document.getElementById('lead-form');
  document.querySelectorAll('.js-open-form').forEach(b => b.addEventListener('click', () => {
    form.classList.remove('is-sent'); form.reset();
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
  }));
  document.querySelectorAll('.js-close-form').forEach(b => b.addEventListener('click', () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    // TODO: підключити відправку (Telegram-бот / email / CRM)
    form.classList.add('is-sent');
  });
}

function runPreloader(done) {
  document.body.classList.add('is-loading');
  const num = document.getElementById('preloader-num');
  const bar = document.getElementById('preloader-bar');
  const state = { v: 0 };
  const show = () => { num.textContent = Math.round(state.v); bar.style.width = state.v + '%'; };
  const finish = () => {
    gsap.to(state, {
      v: 100, duration: 0.4, ease: 'power2.out', onUpdate: show,
      onComplete: () => {
        drawHero();
        document.getElementById('preloader').classList.add('is-done');
        document.body.classList.remove('is-loading');
        done();
      }
    });
  };
  // відсоток = реальне завантаження кадрів відео (мінімум ~1 с, щоб не «блимало»)
  const minTime = new Promise(r => setTimeout(r, prefersReduced ? 0 : 900));
  Promise.all([
    preloadFlyover(p => gsap.to(state, { v: p * 95, duration: 0.3, overwrite: true, onUpdate: show })),
    minTime
  ]).then(finish, finish);
}

// після перезавантаження завжди починаємо з першого екрана
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

buildScene();
sizeAll();
initUI();
setupScroll();
runPreloader(() => {
  gsap.from('.hero__title', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'power3.out' });
  gsap.from('.hero__stats .stat, .hero__lead, .chip, .hero__cta span', { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', delay: 0.15 });
  ScrollTrigger.refresh();
});

let resizeTimer, lastW = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // на мобільних висота «стрибає» від адресного рядка — перебудовуємо лише при зміні ширини
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - H) < 120) return;
    lastW = window.innerWidth;
    sizeAll();
    ScrollTrigger.refresh();
  }, 200);
});
