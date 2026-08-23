/* ============================================================
   キービジュアル V2 — 右側グラフィック 4案エンジン（KVP）v2
   添付4枚を忠実再現。中央=ダッシュボード / 周囲=Figmaアイコン部品
   ・アイコンは「本物の3D箱」（前面グリフ＋厚みスラブ＝上面/側面が見える）
   ・①③=白い回線ネットワーク＋青いデータ光が流れる / ②=同心円グロー / ④=単一軌道
   ・立体はビルボードをやめ、各要素が自前の3D transform を持つ（アイソメに乗る）
   切替: KVP.setPattern('p1'|'p2'|'p3'|'p4') / KVP.show() / KVP.hide()
   ============================================================ */
(function (global) {
  'use strict';

  const STAGE = { w: 1440, h: 920 };
  const C = { x: 1030, y: 430 };                 /* ダッシュボード中心 */
  const DASH = { w: 600, h: 358 };
  const dashRect = { l: C.x - DASH.w / 2, r: C.x + DASH.w / 2, t: C.y - DASH.h / 2, b: C.y + DASH.h / 2 };
  const ICO = 112;                                /* アイコン箱の一辺 */
  const ICONS_DIR = 'assets/icons/';

  const GLASS_BAR =
    'border-radius:6px;border:.5px solid #7EE5FF;' +
    'background-image:linear-gradient(108deg,rgba(130,232,255,.35),rgba(55,159,255,.35));' +
    'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
    'box-shadow:inset 0 2px 5px rgba(255,255,255,.5);';
  const GRAD = 'background-image:linear-gradient(180deg,#58D0FF,#0EBBFF);';
  const CAL_CELL = 'background:#fff;border-radius:3px;box-shadow:inset 0 1px 1px rgba(255,255,255,.6);';

  /* Figmaアイコンの部品（inset:[top,right,bottom,left]% / 100×100内） */
  const ICON_DEFS = {
    chat: [
      { svg: 'chat-body.svg',   inset: [18.57, 32.34, 31.79, 14.68] },
      { svg: 'chat-shape1.svg', inset: [31.82, 14.68, 18.57, 32.34] },
      { css: 'background:#fff;border-radius:6px;', inset: [46, 30, 47, 46] },
      { css: 'background:#fff;border-radius:6px;', inset: [55, 36, 40, 46] },
    ],
    chart: [
      { css: GRAD + 'border-radius:6px;',  inset: [60.34, 17.49, 19.95, 17.49] },
      { css: GLASS_BAR, inset: [20.51, 61.57, 25.8, 24.08] },
      { css: GLASS_BAR, inset: [37.10, 25.05, 25.8, 60.60] },
      { css: GLASS_BAR, inset: [43.23, 43.31, 25.8, 42.34] },
    ],
    person: [
      { svg: 'person-ell98.svg',  inset: [10.5, 24.5, 67.75, 53.75] },
      { svg: 'person-ell97.svg',  inset: [15.85, 33.6, 51.36, 33.6] },
      { svg: 'person-vector.svg', inset: [50, 14.36, 21.41, 17.32] },
    ],
    lock: [
      { svg: 'lock-union.svg', inset: [16.66, 33.16, 48.94, 33.16] },
      { svg: 'lock-rect.svg',  inset: [35.52, 17.33, 16.66, 17.33] },
      { svg: 'lock-ell16.svg', inset: [52.91, 42.7, 32.48, 42.7] },
    ],
    folder: [
      { svg: 'folder-shape.svg',  inset: [26.69, 21.44, 32.45, 22.26] },
      { svg: 'folder-shape1.svg', inset: [22.15, 15, 22.15, 15] },
    ],
    cloud: [
      { svg: 'cloud-ell96.svg', inset: [18.14, 14.25, 43.56, 47.45] },
      { svg: 'cloud-union.svg', inset: [27.4, 11.03, 24.28, 11.03] },
    ],
    calendar: [
      { css: GRAD + 'border-radius:99px;', inset: [12.95, 57.98, 58.91, 31.34] },
      { css: GRAD + 'border-radius:99px;', inset: [12.95, 31.34, 58.91, 57.98] },
      { css: 'border:.5px solid #7EE5FF;border-radius:9px;background-image:linear-gradient(108deg,rgba(130,232,255,.3),rgba(55,159,255,.3));backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:inset 0 3px 10px rgba(255,255,255,.4);',
        inset: [25.76, 16.41, 21.98, 16.41] },
      { css: CAL_CELL, inset: [53.1, 59.36, 40.76, 28.17] },
      { css: CAL_CELL, inset: [41.09, 59.36, 52.77, 28.17] },
      { css: CAL_CELL, inset: [53.1, 43.76, 40.76, 43.76] },
      { css: CAL_CELL, inset: [41.09, 43.76, 52.77, 43.76] },
      { css: CAL_CELL, inset: [53.1, 28.17, 40.76, 59.36] },
      { css: CAL_CELL, inset: [41.09, 28.17, 52.77, 59.36] },
    ],
  };

  /* ---- レイアウト（2D screen座標。各アイコン中心）---- */
  const LAYOUT_CIRCUIT = [          /* P1 / P3（添付①③） */
    { id: 'chat',     x: 705,  y: 245 },
    { id: 'chart',    x: 1045, y: 150 },
    { id: 'person',   x: 1375, y: 255 },
    { id: 'lock',     x: 1385, y: 580 },
    { id: 'calendar', x: 1070, y: 715 },
    { id: 'folder',   x: 695,  y: 590 },
  ];
  const LAYOUT_RINGS = [            /* P2（添付②） */
    { id: 'chat',     x: 715,  y: 255 },
    { id: 'chart',    x: 1080, y: 150 },
    { id: 'person',   x: 1400, y: 265 },
    { id: 'lock',     x: 1400, y: 615 },
    { id: 'calendar', x: 1085, y: 725 },
    { id: 'folder',   x: 710,  y: 615 },
  ];
  const ORBIT = { rx: 405, ry: 250 };
  const LAYOUT_ORBIT = [            /* P4（添付④・楕円軌道の上） */
    { id: 'chat', a: -90 }, { id: 'person', a: -40 }, { id: 'lock', a: 6 },
    { id: 'calendar', a: 52 }, { id: 'folder', a: 90 }, { id: 'chart', a: 140 }, { id: 'cloud', a: 200 },
  ].map(o => ({ id: o.id, x: C.x + ORBIT.rx * Math.cos(o.a * Math.PI / 180), y: C.y + ORBIT.ry * Math.sin(o.a * Math.PI / 180) }));

  const PATTERNS = {
    p1: { conn: 'circuit', box: 'white', layout: LAYOUT_CIRCUIT, iso: false },
    p2: { conn: 'rings',   box: 'glass', layout: LAYOUT_RINGS,   iso: false },
    p3: { conn: 'circuit', box: 'glass', layout: LAYOUT_CIRCUIT, iso: true  },
    p4: { conn: 'orbit',   box: 'white', layout: LAYOUT_ORBIT,   iso: true  },
  };

  const SVGNS = 'http://www.w3.org/2000/svg';
  const elS = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const svgCache = {};
  function loadSVG(file, host) {
    if (svgCache[file]) { host.innerHTML = svgCache[file]; return; }
    fetch(ICONS_DIR + file).then(r => r.text()).then(t => { svgCache[file] = t; host.innerHTML = t; });
  }
  function insetToBox(ins) { const [t, r, b, l] = ins; return { left: l, top: t, width: 100 - l - r, height: 100 - t - b }; }

  /* 多点の丸角ポリライン（PCB風の配線）。全ての中間角を半径 r で丸める */
  function roundedPoly(pts, r) {
    if (pts.length < 3) return 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L');
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], e = pts[i], p2 = pts[i + 1];
      const v1x = e[0] - p0[0], v1y = e[1] - p0[1], l1 = Math.hypot(v1x, v1y) || 1;
      const v2x = p2[0] - e[0], v2y = p2[1] - e[1], l2 = Math.hypot(v2x, v2y) || 1;
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const a = [e[0] - v1x / l1 * rr, e[1] - v1y / l1 * rr];
      const b = [e[0] + v2x / l2 * rr, e[1] + v2y / l2 * rr];
      d += ` L${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${e[0]} ${e[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L${last[0]} ${last[1]}`;
    return d;
  }
  const iconPos = (layout, id) => layout.find(i => i.id === id);

  let rootEl, worldEl, cur = null;

  /* ---------- アイコン1個＝本物の3D箱 ---------- */
  function buildIcon(id, boxStyle) {
    const wrap = document.createElement('div');
    wrap.className = 'kvp-ico kvp-ico--' + boxStyle;
    const shadow = document.createElement('div'); shadow.className = 'kvp-ico-shadow';
    wrap.appendChild(shadow);
    const box = document.createElement('div'); box.className = 'kvp-ico-box';
    /* 厚みスラブ（前面の後ろに積む＝側面/上面になる。多層で角丸をなめらかに） */
    const LAYERS = 16, THICK = 30;
    for (let i = LAYERS; i >= 1; i--) {
      const L = document.createElement('div'); L.className = 'kvp-slab';
      const k = i / LAYERS;
      L.style.transform = `translateZ(${(-THICK * k).toFixed(2)}px)`;
      L.style.background = boxStyle === 'white'
        ? `hsl(220 22% ${95 - 17 * k}%)`
        : `hsla(202 100% ${90 - 12 * k}% / ${0.12 + 0.06 * k})`;
      box.appendChild(L);
    }
    const face = document.createElement('div'); face.className = 'kvp-ico-face';
    const glyph = document.createElement('div'); glyph.className = 'kvp-ico-glyph';
    (ICON_DEFS[id] || []).forEach(part => {
      const b = insetToBox(part.inset);
      const s = document.createElement('span');
      s.style.left = b.left + '%'; s.style.top = b.top + '%';
      s.style.width = b.width + '%'; s.style.height = b.height + '%';
      if (part.css) s.style.cssText += ';' + part.css;
      if (part.svg) loadSVG(part.svg, s);
      glyph.appendChild(s);
    });
    face.appendChild(glyph);
    box.appendChild(face);
    wrap.appendChild(box);
    return wrap;
  }
  function placeIcon(node, x, y) {
    node.style.left = (x - ICO / 2) + 'px';
    node.style.top = (y - ICO / 2) + 'px';
  }

  /* ---------- 中央ダッシュボード ---------- */
  function buildDash() {
    const wrap = document.createElement('div'); wrap.className = 'kvp-dash-wrap';
    wrap.style.left = dashRect.l + 'px'; wrap.style.top = dashRect.t + 'px';
    wrap.style.width = DASH.w + 'px'; wrap.style.height = DASH.h + 'px';
    const shadow = document.createElement('div'); shadow.className = 'kvp-dash-shadow'; wrap.appendChild(shadow);
    const dash = document.createElement('div'); dash.className = 'kvp-dash';
    const code = document.createElement('div'); code.className = 'dash-code';
    [['#FF5D97', 38], ['#0EBBFF', 62], ['#379FFF', 30], ['#e4e8ee', 74], ['#0EBBFF', 46],
     ['#FF5D97', 34], ['#379FFF', 58], ['#e4e8ee', 42], ['#0EBBFF', 68]].forEach(([c, w]) => {
      const el = document.createElement('div'); el.className = 'cbar';
      el.style.width = w + '%'; el.style.background = c; code.appendChild(el);
    });
    dash.appendChild(code);
    const side = document.createElement('div'); side.className = 'dash-side';
    const logo = document.createElement('div'); logo.className = 'dash-logo';
    logo.innerHTML = '<img src="assets/header-logo.svg" alt="">';
    side.appendChild(logo);
    ['#0EBBFF', '#FF5D97', '#0EBBFF'].forEach(c => {
      const row = document.createElement('div'); row.className = 'srow';
      const dot = document.createElement('div'); dot.className = 'sdot';
      dot.style.background = `linear-gradient(150deg,#58D0FF,${c})`;
      const lines = document.createElement('div'); lines.className = 'slines';
      lines.innerHTML = '<i></i><i class="short"></i>';
      row.appendChild(dot); row.appendChild(lines); side.appendChild(row);
    });
    dash.appendChild(side);
    wrap.appendChild(dash);
    return wrap;
  }

  /* ---------- 回線ネットワーク（白線＋ジャンクション）＋青いデータ光 ---------- */
  function anchorOnDash(ix, iy) {
    const ax = Math.max(dashRect.l + 30, Math.min(dashRect.r - 30, ix));
    const ay = Math.max(dashRect.t + 30, Math.min(dashRect.b - 30, iy));
    const dl = Math.abs(ix - dashRect.l), dr = Math.abs(ix - dashRect.r);
    const dt = Math.abs(iy - dashRect.t), db = Math.abs(iy - dashRect.b);
    const m = Math.min(dl, dr, dt, db);
    if (m === dt) return [ax, dashRect.t];
    if (m === db) return [ax, dashRect.b];
    if (m === dl) return [dashRect.l, ay];
    return [dashRect.r, ay];
  }
  function buildCircuit(layout) {
    const box = document.createElement('div'); box.className = 'kvp-net';
    const svg = elS('svg', { class: 'kvp-lines', viewBox: `0 0 ${STAGE.w} ${STAGE.h}` });
    svg.setAttribute('width', STAGE.w); svg.setAttribute('height', STAGE.h);
    const dataLayer = document.createElement('div'); dataLayer.className = 'kvp-data-layer';
    const T = dashRect.t, B = dashRect.b, Lx = dashRect.l, Rx = dashRect.r;
    const spineY = T - 42, botY = B + 46, h = ICO / 2;
    const chat = iconPos(layout, 'chat'), chart = iconPos(layout, 'chart'), person = iconPos(layout, 'person');
    const lock = iconPos(layout, 'lock'), cal = iconPos(layout, 'calendar'), folder = iconPos(layout, 'folder');
    /* 配線網（多点ポリライン）＝ トップ/ボトムのスパイン＋分岐＋側面直結 */
    const P = [];
    const nodes = [];
    /* ---- トップ・スパイン（chat/chart/person を束ねる横バス）＋ダッシュへの2本の縦リンク ---- */
    P.push([[Lx + 48, spineY], [Rx - 48, spineY]]);
    P.push([[Lx + 150, spineY], [Lx + 150, T]]);
    P.push([[Rx - 150, spineY], [Rx - 150, T]]);
    nodes.push([Lx + 48, spineY], [Rx - 48, spineY], [Lx + 150, T], [Rx - 150, T]);
    if (chart)  { P.push([[chart.x, chart.y + h - 12], [chart.x, spineY]]); nodes.push([chart.x, spineY]); }
    if (chat)   { P.push([[chat.x + h - 12, chat.y], [chat.x + h + 34, chat.y], [chat.x + h + 34, spineY]]); nodes.push([chat.x + h + 34, spineY]); }
    if (person) { P.push([[person.x - h + 12, person.y], [person.x - h - 34, person.y], [person.x - h - 34, spineY]]); nodes.push([person.x - h - 34, spineY]); }
    /* ---- 側面・下：直結の丸角L ---- */
    if (lock)   { P.push([[Rx, lock.y], [lock.x - h + 12, lock.y]]); nodes.push([Rx, lock.y]); }
    if (cal)    { P.push([[cal.x, B], [cal.x, cal.y - h + 12]]); nodes.push([cal.x, B]); }
    if (folder) { P.push([[Lx + 80, B], [Lx + 80, botY], [folder.x, botY], [folder.x, folder.y + h - 12]]); nodes.push([Lx + 80, B]); }
    /* ---- 左の入力線（データ流入。添付①の左側の短い線）---- */
    P.push([[Lx - 150, T + 120], [Lx - 24, T + 120]]);
    P.push([[Lx - 150, T + 162], [Lx - 24, T + 162]]);
    P.push([[Lx - 128, T + 204], [Lx - 24, T + 204]]);
    /* 描画：白トレース＋青データ光 */
    P.forEach((pts, i) => {
      const d = roundedPoly(pts, 18);
      svg.appendChild(elS('path', { d, class: 'kvp-line' }));
      const dot = document.createElement('div'); dot.className = 'kvp-data';
      dot.style.offsetPath = `path('${d}')`; dot.style.webkitOffsetPath = `path('${d}')`;
      dot.style.animationDelay = (-(i * 0.33)) + 's';
      dataLayer.appendChild(dot);
    });
    nodes.forEach(n => svg.appendChild(elS('circle', { cx: n[0], cy: n[1], r: 4, class: 'kvp-node' })));
    box.appendChild(svg); box.appendChild(dataLayer);
    return box;
  }

  /* ---------- 同心円グロー（P2） ---------- */
  function buildRings() {
    const wrap = document.createElement('div'); wrap.className = 'kvp-rings';
    [235, 330, 425, 510].forEach((r, i) => {
      const ring = document.createElement('div');
      ring.className = 'kvp-ring' + (i === 3 ? ' soft' : '');
      const ry = r * 0.62;
      ring.style.left = (C.x - r) + 'px'; ring.style.top = (C.y - ry) + 'px';
      ring.style.width = (r * 2) + 'px'; ring.style.height = (ry * 2) + 'px';
      ring.style.animation = `kvpBreath ${4 + i * 0.6}s ease-in-out ${i * 0.3}s infinite`;
      wrap.appendChild(ring);
    });
    return wrap;
  }

  /* ---------- 単一軌道（P4）---------- */
  function buildOrbitRing() {
    const ring = document.createElement('div'); ring.className = 'kvp-orbit';
    ring.style.left = (C.x - ORBIT.rx) + 'px'; ring.style.top = (C.y - ORBIT.ry) + 'px';
    ring.style.width = (ORBIT.rx * 2) + 'px'; ring.style.height = (ORBIT.ry * 2) + 'px';
    return ring;
  }

  /* ---------- 構築 ---------- */
  function start(cfg) {
    cfg = cfg || {};
    rootEl = document.getElementById(cfg.mount || 'kvp');
    rootEl.classList.add('kvp-root', 'hidden');
    const stage = document.createElement('div'); stage.className = 'kvp-stage'; rootEl.appendChild(stage);
    worldEl = document.createElement('div'); worldEl.className = 'kvp-world'; stage.appendChild(worldEl);
    function fit() {
      const rw = rootEl.clientWidth, rh = rootEl.clientHeight;
      const s = Math.min(rw / STAGE.w, rh / STAGE.h);
      stage.style.transform = `translate(${(rw - STAGE.w * s) / 2}px, ${(rh - STAGE.h * s) / 2}px) scale(${s})`;
    }
    window.addEventListener('resize', fit); fit(); rootEl._fit = fit;
    return rootEl;
  }

  function setPattern(key) {
    const p = PATTERNS[key]; if (!p) return;
    cur = key;
    worldEl.innerHTML = '';
    rootEl.classList.remove('pat-p1', 'pat-p2', 'pat-p3', 'pat-p4', 'is-iso', 'is-flat');
    rootEl.classList.add('pat-' + key, p.iso ? 'is-iso' : 'is-flat');

    if (p.conn === 'rings')  worldEl.appendChild(buildRings());
    if (p.conn === 'orbit')  worldEl.appendChild(buildOrbitRing());
    worldEl.appendChild(buildDash());
    if (p.conn === 'circuit') worldEl.appendChild(buildCircuit(p.layout));

    p.layout.forEach(it => {
      const node = buildIcon(it.id, p.box);
      placeIcon(node, it.x, it.y);
      worldEl.appendChild(node);
    });
  }

  function show() { rootEl.classList.remove('hidden'); rootEl._fit && rootEl._fit(); }
  function hide() { rootEl.classList.add('hidden'); }

  global.KVP = { start, setPattern, show, hide, get: () => cur, PATTERNS, C, STAGE };
})(window);
