/* ============================================================
   キービジュアル V2 — 右側グラフィック 4案エンジン（KVP）
   ChatGPT生成4枚を忠実再現。中央=ダッシュボード / 周囲=Figmaアイコン部品
   ・engine.js（エージェント版）とは独立。#kvp に別ステージで描く
   ・アイコンのガラス/グラデ/内側の光は Figma書き出しSVG（kv/assets/icons/*.svg）
     をそのまま埋め込む＝「似せて作る」ではなく本物のデータを使う
   ・立体ニュアンスは CSS の 3D transform / 厚みスラブ / 接地影で極力寄せる
   切替: KVP.setPattern('p1'|'p2'|'p3'|'p4') / KVP.show() / KVP.hide()
   ============================================================ */
(function (global) {
  'use strict';

  const STAGE = { w: 1440, h: 920 };
  const C = { x: 1030, y: 430 };                 /* ダッシュボード中心 */
  const DASH = { w: 600, h: 360 };
  const dashRect = { l: C.x - DASH.w / 2, r: C.x + DASH.w / 2, t: C.y - DASH.h / 2, b: C.y + DASH.h / 2 };
  const ICO = 100;                                /* アイコン箱の一辺 */
  const ICONS_DIR = 'assets/icons/';

  /* ---- Figmaアイコンの部品定義（inset:[top,right,bottom,left] % / 100×100内）----
     svg=ファイル埋め込み / css=スタイル直指定 / dot=白い小片
     ※ inset値・SVGは Figma node 15673 の各アイコン実測（get_design_context） */
  const GLASS_BAR =
    'border-radius:6px;border:.5px solid #7EE5FF;' +
    'background-image:linear-gradient(108deg,rgba(130,232,255,.35),rgba(55,159,255,.35));' +
    'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
    'box-shadow:inset 0 2px 5px rgba(255,255,255,.5);';
  const GRAD = 'background-image:linear-gradient(180deg,#58D0FF,#0EBBFF);';
  const CAL_CELL = 'background:#fff;border-radius:3px;box-shadow:inset 0 1px 1px rgba(255,255,255,.6);';

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

  /* ---- レイアウト（各アイコンの中心座標。世界座標＝フラット時の見た目そのまま）---- */
  const LAYOUT_CIRCUIT = [          /* P1 / P3 */
    { id: 'chat',     x: 690,  y: 260 },
    { id: 'chart',    x: 1010, y: 150 },
    { id: 'person',   x: 1360, y: 250 },
    { id: 'lock',     x: 1380, y: 500 },
    { id: 'folder',   x: 690,  y: 500 },
    { id: 'calendar', x: 1035, y: 705 },
  ];
  const LAYOUT_RINGS = [            /* P2 */
    { id: 'cloud',    x: 735,  y: 210 },
    { id: 'chart',    x: 1010, y: 130 },
    { id: 'person',   x: 1330, y: 205 },
    { id: 'folder',   x: 1400, y: 455 },
    { id: 'calendar', x: 690,  y: 470 },
    { id: 'chat',     x: 800,  y: 700 },
    { id: 'lock',     x: 1130, y: 720 },
  ];
  const ORBIT_ICONS = ['chat', 'person', 'lock', 'calendar', 'folder', 'chart'];  /* P4（等間隔で公転）*/
  const ORBIT_R = 430;

  const PATTERNS = {
    p1: { view: 'flat', conn: 'circuit', box: 'white', layout: LAYOUT_CIRCUIT },
    p2: { view: 'flat', conn: 'rings',   box: 'glass', layout: LAYOUT_RINGS },
    p3: { view: 'iso',  conn: 'circuit', box: 'glass', layout: LAYOUT_CIRCUIT },
    p4: { view: 'iso',  conn: 'orbit',   box: 'white', layout: null },
  };
  const DOT_COLORS = ['#0EBBFF', '#FF5D97', '#0E4497'];

  const SVGNS = 'http://www.w3.org/2000/svg';
  const elS = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const svgCache = {};
  function loadSVG(file, host) {                 /* Figma部品SVGを取ってきて埋め込む */
    if (svgCache[file]) { host.innerHTML = svgCache[file]; return; }
    fetch(ICONS_DIR + file).then(r => r.text()).then(t => { svgCache[file] = t; host.innerHTML = t; });
  }

  /* inset[t,r,b,l]% → left/top/width/height(px, 100×100内) */
  function insetToBox(ins) {
    const [t, r, b, l] = ins;
    return { left: l, top: t, width: 100 - l - r, height: 100 - t - b };
  }

  let rootEl, worldEl, dotLayer;
  const dots = [];          /* 回路のドット */
  const orbitNodes = [];    /* 公転アイコン */
  let cur = null;

  /* ---------- アイコン1個を組む ---------- */
  function buildIcon(id, boxStyle) {
    const wrap = document.createElement('div');
    wrap.className = 'kvp-ico kvp-ico--' + boxStyle;

    const shadow = document.createElement('div'); shadow.className = 'kvp-ico-shadow';
    wrap.appendChild(shadow);
    /* 白い立体箱の厚み（アイソメで側面を出す。多層で縞を消す） */
    if (boxStyle === 'white') {
      const LAYERS = 18, THICK = 26;
      for (let i = LAYERS; i >= 1; i--) {
        const L = document.createElement('div'); L.className = 'kvp-slab';
        const k = i / LAYERS;
        L.style.transform = `translateZ(${(-THICK * k).toFixed(2)}px)`;
        L.style.background = `hsl(222 26% ${95 - 18 * k}%)`;
        wrap.appendChild(L);
      }
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
    wrap.appendChild(face);
    return wrap;
  }

  /* ---------- ダッシュボード中央 ---------- */
  function buildDash() {
    const dash = document.createElement('div');
    dash.className = 'kvp-dash';
    dash.style.left = dashRect.l + 'px'; dash.style.top = dashRect.t + 'px';
    /* 左：コード風の色バー（カンプmockの配色: ピンク/シアン/青） */
    const code = document.createElement('div'); code.className = 'dash-code';
    const bars = [
      ['#FF5D97', 38], ['#0EBBFF', 62], ['#379FFF', 30],
      ['#e4e8ee', 74], ['#0EBBFF', 46], ['#FF5D97', 34],
      ['#379FFF', 58], ['#e4e8ee', 42], ['#0EBBFF', 68],
    ];
    bars.forEach(([c, w]) => {
      const el = document.createElement('div'); el.className = 'cbar';
      el.style.width = w + '%'; el.style.background = c; code.appendChild(el);
    });
    dash.appendChild(code);
    /* 右：ロゴ＋色玉リスト */
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
    return dash;
  }

  /* ---------- 回路線（L字）＋ドット ---------- */
  function anchorOnDash(ix, iy) {                 /* アイコン中心→ダッシュ枠の最寄り点 */
    const ax = Math.max(dashRect.l + 24, Math.min(dashRect.r - 24, ix));
    const ay = Math.max(dashRect.t + 24, Math.min(dashRect.b - 24, iy));
    /* 外側の点はダッシュ縁にスナップ（PCBらしく縁で受ける） */
    const dl = Math.abs(ix - dashRect.l), dr = Math.abs(ix - dashRect.r);
    const dt = Math.abs(iy - dashRect.t), db = Math.abs(iy - dashRect.b);
    const m = Math.min(dl, dr, dt, db);
    if (m === dt) return [ax, dashRect.t];
    if (m === db) return [ax, dashRect.b];
    if (m === dl) return [dashRect.l, ay];
    return [dashRect.r, ay];
  }
  function buildCircuit(layout) {
    const svg = elS('svg', { class: 'kvp-lines', viewBox: `0 0 ${STAGE.w} ${STAGE.h}` });
    svg.setAttribute('width', STAGE.w); svg.setAttribute('height', STAGE.h);
    layout.forEach((it, i) => {
      const [ax, ay] = anchorOnDash(it.x, it.y);
      /* L字: アイコン→縦→横→縁。向きは近い軸を後にする */
      const elbow = (Math.abs(it.x - ax) > Math.abs(it.y - ay)) ? [ax, it.y] : [it.x, ay];
      const pts = [[it.x, it.y], elbow, [ax, ay]];
      const d = 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L');
      svg.appendChild(elS('path', { d, class: 'kvp-line' }));
      const dot = document.createElement('div'); dot.className = 'kvp-dot';
      dot.style.background = DOT_COLORS[i % DOT_COLORS.length];
      dotLayer.appendChild(dot);
      dots.push({ pts, node: dot, t: (i * 0.31) % 1, speed: 0.16 + 0.03 * (i % 3), len: polyLen(pts) });
    });
    return svg;
  }
  function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  function polyAt(p, t) {
    let d = t * polyLen(p);
    for (let i = 1; i < p.length; i++) {
      const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (d <= seg || i === p.length - 1) { const k = seg ? d / seg : 0; return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]; }
      d -= seg;
    }
    return p[p.length - 1];
  }

  /* ---------- 同心円グロー（P2） ---------- */
  function buildRings() {
    const box = document.createElement('div'); box.className = 'kvp-rings';
    box.style.position = 'absolute'; box.style.inset = '0';
    const radii = [200, 300, 405, 470];           /* 半径(px) */
    radii.forEach((r, i) => {
      const ring = document.createElement('div');
      ring.className = 'kvp-ring' + (i === radii.length - 1 ? ' soft' : '');
      ring.style.left = (C.x - r) + 'px'; ring.style.top = (C.y - r * 0.72) + 'px';
      ring.style.width = (r * 2) + 'px'; ring.style.height = (r * 2 * 0.72) + 'px';
      ring.style.animation = `kvpBreath ${4 + i * 0.6}s ease-in-out ${i * 0.3}s infinite`;
      box.appendChild(ring);
    });
    return box;
  }

  /* ---------- 単一軌道（P4） ---------- */
  function buildOrbit(boxStyle) {
    const ring = document.createElement('div'); ring.className = 'kvp-orbit';
    ring.style.left = (C.x - ORBIT_R) + 'px'; ring.style.top = (C.y - ORBIT_R) + 'px';
    ring.style.width = (ORBIT_R * 2) + 'px'; ring.style.height = (ORBIT_R * 2) + 'px';
    worldEl.appendChild(ring);
    ORBIT_ICONS.forEach((id, i) => {
      const node = buildIcon(id, boxStyle);
      worldEl.appendChild(node);
      orbitNodes.push({ node, base: (i / ORBIT_ICONS.length) * Math.PI * 2 });
    });
  }

  /* ---------- ビルボード（アイソメで箱を常にカメラへ向ける） ---------- */
  const ISO = { rx: 52, rz: -40 };
  function billboard(view) {
    return view === 'iso' ? `rotateZ(${-ISO.rz}deg) rotateX(${-ISO.rx}deg)` : '';
  }

  /* ---------- 構築 ---------- */
  function start(cfg) {
    cfg = cfg || {};
    rootEl = document.getElementById(cfg.mount || 'kvp');
    rootEl.classList.add('kvp-root', 'hidden');
    const stage = document.createElement('div'); stage.className = 'kvp-stage'; rootEl.appendChild(stage);
    worldEl = document.createElement('div'); worldEl.className = 'kvp-world view-flat'; stage.appendChild(worldEl);

    function fit() {
      const rw = rootEl.clientWidth, rh = rootEl.clientHeight;
      const s = Math.min(rw / STAGE.w, rh / STAGE.h);
      stage.style.transform = `translate(${(rw - STAGE.w * s) / 2}px, ${(rh - STAGE.h * s) / 2}px) scale(${s})`;
    }
    window.addEventListener('resize', fit); fit();
    rootEl._fit = fit;

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const p = cur && PATTERNS[cur];
      if (p && p.conn === 'circuit') {
        const bb = billboard(p.view);
        dots.forEach(d => {
          d.t += d.speed * dt; if (d.t >= 1) d.t -= 1;
          const pos = polyAt(d.pts, d.t);
          const fo = Math.min(1, (1 - d.t) / 0.14) * Math.min(1, d.t / 0.08);
          d.node.style.transform = `translate3d(${(pos[0] - 6).toFixed(1)}px, ${(pos[1] - 6).toFixed(1)}px, 2px) ${bb}`;
          d.node.style.opacity = fo.toFixed(2);
        });
      }
      if (p && p.conn === 'orbit') {
        const bb = billboard('iso');
        const ang = now / 1000 * 0.12;
        orbitNodes.forEach(o => {
          const a = o.base + ang;
          const x = C.x + Math.cos(a) * ORBIT_R - ICO / 2;
          const y = C.y + Math.sin(a) * ORBIT_R - ICO / 2;
          o.node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 14px) ${bb}`;
        });
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return rootEl;
  }

  /* ---------- パターン切替（毎回作り直し：状態を持ち越さない） ---------- */
  function clearWorld() {
    dots.length = 0; orbitNodes.length = 0;
    worldEl.innerHTML = '';
    dotLayer = document.createElement('div'); dotLayer.style.cssText = 'position:absolute;inset:0;';
  }
  function setPattern(key) {
    const p = PATTERNS[key]; if (!p) return;
    cur = key;
    clearWorld();
    rootEl.classList.remove('pat-p1', 'pat-p2', 'pat-p3', 'pat-p4');
    rootEl.classList.add('pat-' + key);
    worldEl.className = 'kvp-world view-' + p.view;

    /* アンビエント光（ガラス案でシーンに下地の光を敷く＝すりガラスが blur で拾う） */
    if (p.box === 'glass') {
      const amb = document.createElement('div'); amb.className = 'kvp-ambient';
      const aw = 1080, ah = 820;
      amb.style.left = (C.x - aw / 2) + 'px'; amb.style.top = (C.y - ah / 2) + 'px';
      amb.style.width = aw + 'px'; amb.style.height = ah + 'px';
      worldEl.appendChild(amb);
    }

    /* 接地影（アイソメ時） */
    const dsh = document.createElement('div'); dsh.className = 'kvp-dash-shadow';
    dsh.style.left = dashRect.l + 'px'; dsh.style.top = (dashRect.t + 30) + 'px';
    worldEl.appendChild(dsh);

    /* 接続レイヤー（ダッシュより後ろ／前は用途で分ける） */
    if (p.conn === 'rings') worldEl.appendChild(buildRings());
    worldEl.appendChild(buildDash());
    if (p.conn === 'circuit') { worldEl.appendChild(buildCircuit(p.layout)); worldEl.appendChild(dotLayer); }
    if (p.conn === 'orbit') buildOrbit(p.box);

    /* アイコン（circuit/rings はレイアウト固定配置。orbit は frame で動かす） */
    if (p.layout) {
      p.layout.forEach(it => {
        const node = buildIcon(it.id, p.box);
        node.style.left = (it.x - ICO / 2) + 'px';
        node.style.top = (it.y - ICO / 2) + 'px';
        const z = p.view === 'iso' ? 14 : 0;
        node.style.transform = `translateZ(${z}px) ${billboard(p.view)}`;
        worldEl.appendChild(node);
      });
    }
  }

  function show() { rootEl.classList.remove('hidden'); rootEl._fit && rootEl._fit(); }
  function hide() { rootEl.classList.add('hidden'); }

  global.KVP = { start, setPattern, show, hide, get: () => cur, PATTERNS, C, STAGE };
})(window);
