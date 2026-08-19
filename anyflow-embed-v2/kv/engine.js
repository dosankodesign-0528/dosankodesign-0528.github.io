/* ============================================================
   キービジュアル V2 — データ基盤 × AIエージェント 共通エンジン
   カンプ: figma jSLFEubHMoy3Hxgcw1AZuR / node 15276-23959 (1440×920)
   各パターン(p1〜p5)は KV.start(config) を呼ぶだけ。
     config.flow    = グラデの流れ方 breathe/sweep/wave/huedrift/converge
     config.mount   = マウント先の id（既定 'kv'）
     config.cell    = ディザ粒の大きさ(px)
     config.mono    = 縁のマゼンタを控えめに
   箱のスタイルは KV.setBoxStyle(root, 'flat'|'solid'|'iso') で切替。
   ============================================================ */
(function (global) {
  'use strict';

  /* ---- カンプ実測の座標（ステージ 1440×920）---- */
  const STAGE = { w: 1440, h: 920 };
  const AGENT = { cx: 1021.8, cy: 387.7, w: 223.8, h: 178.8, r: 13 };  /* 角丸はカンプ 15290:25513 の 13px */
  const BOX = { w: 125.7, h: 100.45, r: 10 };
  /* 連携先ボックス（座標・ドット色はカンプ実測）。アイコンは汎用ピクトグラム（新規作成） */
  const BOXES = [
    { id: 'db',    cx: 651.4,   cy: 223.8,  color: '#FF5D97', icon: 'database', label: 'データベース' },
    { id: 'cloud', cx: 1013.99, cy: 129.99, color: '#0EBBFF', icon: 'chat',    label: 'ストレージ' },
    { id: 'chat',  cx: 1384.6,  cy: 229.3,  color: '#FF5D97', icon: 'chat',     label: 'チャット' },
    { id: 'sheet', cx: 651.4,   cy: 553.7,  color: '#0E4497', icon: 'database',    label: '表計算' },
    { id: 'mail',  cx: 1080.5,  cy: 822.5,  color: '#0EBBFF', icon: 'chat',     label: '通知' },
    { id: 'cal',   cx: 1326.3,  cy: 694.45, color: '#0EBBFF', icon: 'database', label: 'カレンダー' },
  ];

  /* ---- 連携先アイコン（2トーン版・2026-08-19）----
     【ヒデさん指定】フルのリッチ化は工数がかかるので、既存の枠線アイコンに
     ベタ塗りを効かせた2トーンをまず2個（データベース/チャット）だけ作り、
     他の箱はこの2個を使い回す。方向性が決まったら残りを起こす。
     色は currentColor 経由: 箱ごとに style.color = ドット色 が入るので、
     同じアイコンでも箱によってブランド3色に塗り分けられる。 */
  const ICONS = {
    /* データベース: 胴体はうすいベタ(15%) + 枠線、天板だけ濃いベタ塗り */
    database: `
      <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.6"/>
      <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <ellipse cx="12" cy="6" rx="7" ry="3" fill="currentColor"/>
      <ellipse cx="10.2" cy="5.4" rx="2.6" ry="0.9" fill="#fff" fill-opacity=".55"/>`,
    /* チャット: 吹き出しはうすいベタ + 枠線、中の3点だけ濃いベタ塗り */
    chat: `
      <path d="M6 4.5h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6.5L7 20v-3.5H6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="8.4" cy="10.5" r="1.35" fill="currentColor"/>
      <circle cx="12"  cy="10.5" r="1.35" fill="currentColor" fill-opacity=".75"/>
      <circle cx="15.6" cy="10.5" r="1.35" fill="currentColor" fill-opacity=".5"/>`,
  };

  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* ---- 配線ジオメトリ（直角L字。カンプの Vector 1〜6 と同じ流儀）---- */
  function agentAnchor(box) {
    const a = AGENT, L = a.cx - a.w / 2, R = a.cx + a.w / 2, T = a.cy - a.h / 2, B = a.cy + a.h / 2;
    const dx = box.cx - a.cx, dy = box.cy - a.cy;
    if (Math.abs(dx) * a.h > Math.abs(dy) * a.w) {
      const y = clamp01((box.cy - T) / (B - T)) * (B - T - 44) + T + 22;
      return dx < 0 ? { x: L, y } : { x: R, y };
    }
    const x = clamp01((box.cx - L) / (R - L)) * (R - L - 44) + L + 22;
    return dy < 0 ? { x, y: T } : { x, y: B };
  }
  function boxAnchor(box) {
    const L = box.cx - BOX.w / 2, R = box.cx + BOX.w / 2, T = box.cy - BOX.h / 2, B = box.cy + BOX.h / 2;
    const dx = AGENT.cx - box.cx, dy = AGENT.cy - box.cy;
    if (Math.abs(dx) * BOX.h > Math.abs(dy) * BOX.w) return dx < 0 ? { x: L, y: box.cy } : { x: R, y: box.cy };
    return dy < 0 ? { x: box.cx, y: T } : { x: box.cx, y: B };
  }
  function routePoly(box) {
    const s = boxAnchor(box), e = agentAnchor(box);
    const horizFromBox = Math.abs(s.x - box.cx) > 0.1;
    const mid = horizFromBox ? { x: e.x, y: s.y } : { x: s.x, y: e.y };
    return [s, mid, e].filter((p, i, arr) => i === 0 || Math.abs(p.x - arr[i - 1].x) > 0.5 || Math.abs(p.y - arr[i - 1].y) > 0.5);
  }
  function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; }
  function polyAt(pts, t) {
    const total = polyLen(pts); let d = t * total;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (d <= seg || i === pts.length - 1) { const k = seg ? d / seg : 0; return { x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k) }; }
      d -= seg;
    }
    return pts[pts.length - 1];
  }

  /* ===================== AIエージェント (WebGL・ベイヤー8ディザ) =====================
     現行サイトの「B ハーフトーン」と同じディザ質感を、角丸の発光コアに作り直したもの。
     配色ランプはカンプの放射グラデ実測値（中心 #FEE0F8 → #0EBBFF → 縁 #FF5D97）。 */
  const AGENT_VS = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0);} ';
  const AGENT_FS = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uFlow;    /* 0=呼吸 1=掃引 2=波及 3=色相ドリフト 4=収束 */
uniform float uEnergy;  /* ドット到達で跳ねて減衰 */
uniform vec2  uDir;     /* 直近のドットが来た方向 */
uniform float uAspect;  /* w/h */
uniform float uCell;    /* ディザ粒(px) */
uniform float uMono;    /* (未使用・互換のため残す) */

float bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5*a)*0.25 + bayer2(a); }
float hash(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+34.5); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }

/* ===== カンプ 15290:25513 の線形グラデを忠実に再現 =====
   linear-gradient(229.049deg,
     #0EBBFF 28.106%, #477ED1 36.378%, #EFEEEF 59.602%, #FF5D97 100%)
   ※ 133% に #B6E0FF のストップもあるが、100% より外なので表示には出ない。
   ※ 最初のストップが 28.1% なので、0〜28.1%（右上の角）はシアンのベタ。 */
vec3 grad(float x){
  x = clamp(x, 0.0, 1.0);
  vec3 cy = vec3(0.055, 0.733, 1.000);   /* #0EBBFF */
  vec3 bl = vec3(0.278, 0.494, 0.820);   /* #477ED1 */
  vec3 wh = vec3(0.937, 0.933, 0.937);   /* #EFEEEF */
  vec3 mg = vec3(1.000, 0.365, 0.592);   /* #FF5D97 */
  if (x < 0.28106) return cy;
  if (x < 0.36378) return mix(cy, bl, (x - 0.28106) / 0.08272);
  if (x < 0.59602) return mix(bl, wh, (x - 0.36378) / 0.23224);
  return mix(wh, mg, (x - 0.59602) / 0.40398);
}
float sdRound(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return min(max(d.x,d.y),0.0)+length(max(d,0.0))-r; }

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 cell = floor(fc/uCell);
  vec2 fcc = (cell+0.5)*uCell;
  vec2 P = (fcc*2.0 - uRes)/uRes.y;          /* 中心原点 / y上向き */

  vec2 hs = vec2(0.86*uAspect, 0.86);
  float sd = sdRound(P, hs, 0.16);
  float pxw = 2.0/uRes.y;
  float mask = 1.0 - smoothstep(-2.0*pxw, 2.0*pxw, sd);
  if (mask <= 0.0){ gl_FragColor = vec4(0.0); return; }

  /* CSS の 229.049deg をそのまま投影する（CSSはy下向きなので反転） */
  vec2 pc = vec2(P.x, -P.y);
  vec2 DIR = vec2(-0.75512, 0.65559);        /* (sinθ, -cosθ) θ=229.049° */
  float L = 2.0*hs.x*0.75512 + 2.0*hs.y*0.65559;   /* CSSのグラデ線の長さ */
  float t = 0.5 + dot(pc, DIR)/L;            /* 0=右上シアン側 → 1=左下マゼンタ側 */

  /* ---- グラデの流れ方（カンプの絵を基準に、tを軽く動かすだけ）---- */
  float e = uEnergy, tm = uTime;
  float v = dot(pc, vec2(0.65559, 0.75512)); /* 帯と直交する向き */
  float r = length(vec2(P.x/max(uAspect,0.001), P.y))/0.97;
  if (uFlow < 0.5){        /* 呼吸: 全体がゆっくり行き来し、到達で白側へふわり */
    t += 0.040*sin(tm*1.0) - 0.055*e;
  } else if (uFlow < 1.5){ /* 掃引: 帯に沿って色が流れ続ける */
    t += 0.065*sin(v*3.0 - tm*1.5) - 0.05*e;
  } else if (uFlow < 2.5){ /* 波及: ドットの来た方向から波が走る */
    float along = dot(normalize(pc + vec2(1e-4)), normalize(vec2(uDir.x, -uDir.y) + vec2(1e-4)));
    t += sin(r*7.0 - tm*2.4) * (0.025 + 0.12*e) * (0.5 + 0.5*along);
  } else if (uFlow < 3.5){ /* ドリフト: グラデ位置がゆっくり循環する */
    t = fract(t - tm*0.04);
  } else {                 /* 収束: 到達で中心へ吸い込まれ、白がふくらむ */
    t = mix(t, 0.5, 0.35*e*exp(-r*1.5));
    t -= 0.08*e;
  }

  t += (vnoise(pc*5.0 + tm*0.15) - 0.5)*0.03;   /* ごく薄いゆらぎ */

  /* ---- ディザ（カンプと同じくグラデ全域に均一にかかる）---- */
  float dith = bayer8(cell);
  float levels = 7.0;
  float q = clamp(floor(t*levels + (dith-0.5)*1.15 + 0.5)/levels, 0.0, 1.0);
  vec3 col = grad(q);

  gl_FragColor = vec4(col*mask, mask);
}`;

  function makeAgentGL(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[KV shader]', gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, AGENT_VS), f = sh(gl.FRAGMENT_SHADER, AGENT_FS);
    if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('[KV link]', gl.getProgramInfoLog(p)); return null; }
    gl.useProgram(p);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(p, n);
    const u = { uRes: U('uRes'), uTime: U('uTime'), uFlow: U('uFlow'), uEnergy: U('uEnergy'), uDir: U('uDir'), uAspect: U('uAspect'), uCell: U('uCell'), uMono: U('uMono') };
    return {
      draw(w, h, o) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uTime, o.time); gl.uniform1f(u.uFlow, o.flow);
        gl.uniform1f(u.uEnergy, o.energy); gl.uniform2f(u.uDir, o.dirX, o.dirY);
        gl.uniform1f(u.uAspect, o.aspect); gl.uniform1f(u.uCell, o.cell); gl.uniform1f(u.uMono, o.mono);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }
  function agentFallback(canvas) {
    const ctx = canvas.getContext('2d');
    return { draw(w, h) { if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const g = ctx.createLinearGradient(w, 0, 0, h);   /* 右上→左下 ≒ 229deg */
      g.addColorStop(0, '#0EBBFF'); g.addColorStop(0.281, '#0EBBFF');
      g.addColorStop(0.364, '#477ED1'); g.addColorStop(0.596, '#EFEEEF'); g.addColorStop(1, '#FF5D97');
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); } };
  }

  /* ===================== 構築 ===================== */
  function start(cfg) {
    cfg = cfg || {};
    const flowMap = { breathe: 0, sweep: 1, wave: 2, huedrift: 3, converge: 4 };
    const flow = flowMap[cfg.flow] != null ? flowMap[cfg.flow] : 0;
    const root = document.getElementById(cfg.mount || 'kv');
    root.classList.add('kv-root');

    const stage = document.createElement('div'); stage.className = 'kv-stage'; root.appendChild(stage);
    const world = document.createElement('div'); world.className = 'kv-world'; stage.appendChild(world);

    /* 線 */
    const svg = el('svg', { class: 'kv-lines', viewBox: `0 0 ${STAGE.w} ${STAGE.h}` });
    svg.setAttribute('width', STAGE.w); svg.setAttribute('height', STAGE.h);
    world.appendChild(svg);
    const conns = BOXES.map(b => {
      const pts = routePoly(b);
      const d = 'M' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
      svg.appendChild(el('path', { d, class: 'kv-line', fill: 'none' }));
      return { box: b, pts, len: polyLen(pts) };
    });

    /* 流れるドット（API）: 箱 → エージェント方向 */
    const dotG = el('g', { class: 'kv-dots' }); svg.appendChild(dotG);
    const DOTS_PER = cfg.dotsPerLine || 2;
    const dots = [];
    conns.forEach((c, ci) => { for (let i = 0; i < DOTS_PER; i++) {
      const node = el('circle', { r: cfg.dotR || 6, fill: c.box.color, class: 'kv-dot' });
      dotG.appendChild(node);
      dots.push({ conn: c, node, t: (i / DOTS_PER + ci * 0.13) % 1,
        speed: (cfg.dotSpeed || 0.15) * (0.85 + 0.3 * ((ci * 7 + i * 3) % 5) / 5) });
    } });

    /* 連携先ボックス */
    BOXES.forEach(b => {
      const d = document.createElement('div'); d.className = 'kv-box'; d.dataset.id = b.id;
      d.style.left = (b.cx - BOX.w / 2) + 'px'; d.style.top = (b.cy - BOX.h / 2) + 'px';
      d.style.width = BOX.w + 'px'; d.style.height = BOX.h + 'px';
      d.style.color = b.color;   /* 2トーンの塗り色 = ドットと同じブランド色 */
      d.innerHTML = `<svg viewBox="0 0 24 24" class="kv-ico" fill="none" stroke-linecap="round" stroke-linejoin="round">${ICONS[b.icon]}</svg>`;
      world.appendChild(d);
    });

    /* AIエージェント */
    const agentBox = document.createElement('div'); agentBox.className = 'kv-agent';
    agentBox.style.left = (AGENT.cx - AGENT.w / 2) + 'px'; agentBox.style.top = (AGENT.cy - AGENT.h / 2) + 'px';
    agentBox.style.width = AGENT.w + 'px'; agentBox.style.height = AGENT.h + 'px';
    agentBox.style.borderRadius = AGENT.r + 'px';
    const canvas = document.createElement('canvas'); canvas.className = 'kv-agent-cv'; agentBox.appendChild(canvas);
    world.appendChild(agentBox);
    const agent = makeAgentGL(canvas) || agentFallback(canvas);

    /* レスポンシブ: ステージを丸ごとスケール */
    function fit() {
      const rw = root.clientWidth, rh = root.clientHeight;
      const s = Math.min(rw / STAGE.w, rh / STAGE.h);
      stage.style.transform = `translate(${(rw - STAGE.w * s) / 2}px, ${(rh - STAGE.h * s) / 2}px) scale(${s})`;
      root._scale = s;
    }
    window.addEventListener('resize', fit); fit();

    /* アニメーション */
    let energy = 0, dirX = 0, dirY = -1, last = performance.now();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const time = now / 1000;
      dots.forEach(d => {
        d.t += d.speed * dt;
        if (d.t >= 1) {  /* 到達 → エージェントへエネルギー注入 */
          d.t -= 1;
          energy = Math.min(1.3, energy + 0.45);
          const a = agentAnchor(d.conn.box);
          dirX = (a.x - AGENT.cx) / 140; dirY = (a.y - AGENT.cy) / 140;
        }
        const pos = polyAt(d.conn.pts, d.t);
        d.node.setAttribute('cx', pos.x.toFixed(1)); d.node.setAttribute('cy', pos.y.toFixed(1));
        d.node.setAttribute('opacity', (0.35 + 0.65 * d.t).toFixed(2));
      });
      energy = Math.max(0, energy - dt * 1.5);
      const s = (root._scale || 1) * dpr;
      agent.draw(Math.max(2, Math.round(AGENT.w * s)), Math.max(2, Math.round(AGENT.h * s)),
        { time, flow, energy: clamp01(energy), dirX, dirY, aspect: AGENT.w / AGENT.h, cell: (cfg.cell || 2) * dpr, mono: cfg.mono ? 1 : 0 });
      const br = 1 + 0.018 * Math.sin(time * 1.1) + 0.03 * energy;   /* ふわりと膨らむ */
      canvas.style.transform = `scale(${br.toFixed(4)})`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return root;
  }

  /* 箱のスタイル切替: flat（カンプ） / solid（立体） / iso（アイソメトリック） */
  function setBoxStyle(root, style) {
    root.classList.remove('bs-flat', 'bs-solid', 'bs-iso');
    root.classList.add('bs-' + style);
  }

  global.KV = { start, setBoxStyle, BOXES, AGENT, STAGE };
})(window);
