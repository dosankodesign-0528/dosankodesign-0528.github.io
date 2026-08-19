/* ============================================================
   キービジュアル V2 — カンプ忠実版
   カンプ: figma jSLFEubHMoy3Hxgcw1AZuR / 15294-31034（TOP 3枚組・1440×920）
   ・レイアウト/線/ドット/箱/アイコンはすべてカンプ実測値
   ・中央エージェントのグラデは、カンプ3枚をキーフレームにした
     「光の波が右上へ抜けていく」アニメーション（LUTテクスチャ方式）
   ・もう1モードとして V1.0 の「B ハーフトーン」柄を移植
   切替: KV.setBoxStyle('flat'|'solid'|'iso') / KV.setAgentMode('grad'|'halftone')
   ============================================================ */
(function (global) {
  'use strict';

  const STAGE = { w: 1440, h: 920 };
  /* エージェント（カンプ 15294:29336 実測） */
  const AGENT = { x: 912.62, y: 348.85, w: 227.855, h: 182.065, r: 13 };

  /* ---- 配線（カンプの Vector 1〜6 のパスを座標解決したもの。白60%・2px）----
     向きは「箱 → エージェント」。ドットはこの順に流れる。 */
  const LINES = [
    { id: 'TL', dot: '#0EBBFF', pts: [[694.33, 259.93], [777.80, 259.93], [777.80, 406.87], [909.19, 406.87]] },
    { id: 'ML', dot: '#0E4497', pts: [[693.98, 542.14], [779.51, 542.14], [779.51, 475.17], [937.60, 475.17]] },
    { id: 'TC', dot: '#FF5D97', pts: [[1017.98, 212.08], [1017.98, 348.06]] },
    { id: 'TR', dot: '#0EBBFF', pts: [[1226.83, 268.98], [1178.04, 268.98], [1178.04, 415.92], [1103.38, 415.92]] },
    { id: 'BC', dot: '#FF5D97', pts: [[950.04, 707.66], [950.04, 622.13], [1001.00, 622.13], [1001.00, 522.34]] },
    { id: 'BR', dot: '#0E4497', pts: [[1254.63, 599.45], [1073.93, 599.45], [1073.93, 499.67]] },
  ];
  const DOT_R = 6.5867;   /* カンプの Ellipse 87〜92 = 13.173px */

  /* ---- 箱（カンプ実測 109.778×109.778 / r10）----
     kind: css   = ガラス箱を CSS で作りアイコン SVG を中に置く
           asset = カンプが箱ごと1枚のSVGで書き出しているもの（そのまま置く）
           empty = アイコン無しのフェード箱 */
  const BOXES = [
    { id: 'folder', kind: 'asset', x: 584.20, y: 203.89, svg: 'assets/icon-folder-box.svg' },
    { id: 'mail',   kind: 'css',   x: 584.20, y: 490.68,
      icon: { svg: 'assets/icon-mail.svg', x: 19.16, y: 16.56, w: 72.352, h: 67.83 } },
    { id: 'tc',     kind: 'empty', x: 967.12, y: 101.81, flip: false },
    { id: 'bc',     kind: 'empty', x: 895.15, y: 709.97, flip: true },
    { id: 'chart',  kind: 'asset', x: 1228.66, y: 214.09, svg: 'assets/icon-chart-box.svg' },
    { id: 'cal',    kind: 'css',   x: 1256.22, y: 542.14, lightBlue24: true },
  ];
  const BOX_S = 109.778;

  /* ===== カンプ3枚のグラデーション（キーフレーム）=====
     3枚とも同じ5色。共通軸 t（0=右上 → 1=左下）に直した各色の位置。
     F3 だけ角度が反転(47.24°)していたので t=1-p で正規化してある。
     ⚠️ 位置は画面外(<0, >1)もそのまま持つ。CSSと同じく端の色で頭打ちして評価する。 */
  const GRAD_COLORS = {
    cy: [14, 187, 255],    /* #0EBBFF */
    bl: [71, 126, 209],    /* #477ED1 */
    wh: [239, 238, 239],   /* #EFEEEF */
    mg: [255, 93, 151],    /* #FF5D97 */
    lb: [182, 224, 255],   /* #B6E0FF */
  };
  const GRAD_KEYS = {                  /*      F1        F2        F3   */
    cy: [0.28106, 0.0094376, 0.17480],
    bl: [0.36378, 0.52713,   0.53122],
    wh: [0.59602, 0.27152,   0.00072],
    mg: [1.00000, 0.60766,  -0.22260],
    lb: [1.33030, 1.33140,   0.93457],
  };

  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  function polyAt(p, t) {
    const total = polyLen(p); let d = t * total;
    for (let i = 1; i < p.length; i++) {
      const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (d <= seg || i === p.length - 1) { const k = seg ? d / seg : 0; return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]; }
      d -= seg;
    }
    return p[p.length - 1];
  }

  /* ===== グラデーション LUT（256px）を JS で焼く =====
     キーフレーム間はこの JS 側で補間し、シェーダーは LUT を引くだけ。
     ストップの順番がフレームによって入れ替わる（白と青が交差する）ため、
     シェーダーで直接評価せず、CSSと同じ「位置でソートして区間補間」をここでやる。 */
  const LUT_N = 256;
  const lutData = new Uint8Array(LUT_N * 4);
  function bakeStops(stops, out) {  /* stops: [{p, c:[r,g,b]}] */
    stops.sort((a, b) => a.p - b.p);
    for (let i = 0; i < LUT_N; i++) {
      const x = i / (LUT_N - 1);
      let c;
      if (x <= stops[0].p) c = stops[0].c;
      else if (x >= stops[stops.length - 1].p) c = stops[stops.length - 1].c;
      else {
        for (let k = 1; k < stops.length; k++) {
          if (x <= stops[k].p) {
            const a = stops[k - 1], b = stops[k];
            const u = (x - a.p) / Math.max(1e-6, b.p - a.p);
            c = [lerp(a.c[0], b.c[0], u), lerp(a.c[1], b.c[1], u), lerp(a.c[2], b.c[2], u)];
            break;
          }
        }
      }
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
    }
  }
  function stopsAt(f) {  /* f: 0..2 のキーフレーム位置（小数で補間） */
    const i = Math.min(1, Math.floor(f)), u = f - i;
    return Object.keys(GRAD_KEYS).map(k => ({ p: lerp(GRAD_KEYS[k][i], GRAD_KEYS[k][i + 1], u), c: GRAD_COLORS[k] }));
  }
  /* タイムライン【2026-08-19 ヒデさん指定: 左下→右上へ一方向・ゆっくりの波】
     F1→F2→F3 と波がゆっくり右上へ抜け(10s)、間を置かず
     色だけクロスフェードで F1 に戻る(1.4s)。逆走の動きは見せない。 */
  const T_FWD = 10.0, T_HOLD = 0.2, T_X = 1.4, T_ALL = T_FWD + T_HOLD + T_X;
  const lutA = new Uint8Array(LUT_N * 4), lutB = new Uint8Array(LUT_N * 4);
  function bakeTimeline(time, out) {
    const u = time % T_ALL;
    /* ほぼ等速（両端だけ僅かに柔らかく）＝一定の波が流れ続けて見える */
    const soft = t => t * t * (3 - 2 * t) * 0.25 + t * 0.75;
    if (u < T_FWD) { bakeStops(stopsAt(soft(u / T_FWD) * 2), out); return; }
    if (u < T_FWD + T_HOLD) { bakeStops(stopsAt(2), out); return; }
    const s = easeIO((u - T_FWD - T_HOLD) / T_X);
    bakeStops(stopsAt(2), lutA); bakeStops(stopsAt(0), lutB);
    for (let i = 0; i < out.length; i++) out[i] = lutA[i] + (lutB[i] - lutA[i]) * s;
  }

  /* ===== シェーダー（ディザはカンプ同様ベイヤー8で全域均一） ===== */
  const VS = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0);} ';
  const FS = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uMode;    /* 0=カンプのグラデ(LUT) 1=V1.0ハーフトーン */
uniform float uEnergy;
uniform float uAspect;
uniform float uCell;    /* ディザ1セルのデバイスpx（Figmaの Size=1 → ステージ1pxぶん） */
uniform float uQuant;   /* 0=チャンネル別に量子化 1=グラデ位置を量子化（検証用） */
uniform sampler2D uLUT;

/* ===== Figma のレイヤー効果を実測値で再現 =====
   Style: Bayer 16x16 / Size: 1 / Levels: 3 / Brightness: 104% / Contrast: 1.38 / Mono: off */
float bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5*a)*0.25 + bayer2(a); }
float bayer16(vec2 a){ return bayer8(0.5*a)*0.25 + bayer2(a); }
float hash(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+34.5); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }

/* V1.0「B ハーフトーン」の配色ランプ（面積比そのまま移植） */
vec3 rampV1(float x){
  x = clamp(x, 0.0, 1.0);
  vec3 mg = vec3(1.000, 0.365, 0.592);
  vec3 pu = vec3(0.502, 0.459, 0.863);
  vec3 bl = vec3(0.102, 0.659, 0.984);
  vec3 cy = vec3(0.043, 0.867, 1.000);
  vec3 wh = vec3(0.918, 1.000, 1.000);
  if (x < 0.075) return mix(mg, pu, x / 0.075);
  if (x < 0.115) return mix(pu, bl, (x - 0.075) / 0.040);
  if (x < 0.355) return mix(bl, cy, (x - 0.115) / 0.240);
  if (x < 0.915) return mix(cy, mix(cy, wh, 0.22), (x - 0.355) / 0.560);
  return mix(mix(cy, wh, 0.22), wh, (x - 0.915) / 0.085);
}
float sdRound(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return min(max(d.x,d.y),0.0)+length(max(d,0.0))-r; }

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 cell = floor(fc/uCell);
  vec2 fcc = (cell+0.5)*uCell;
  vec2 P = (fcc*2.0 - uRes)/uRes.y;

  vec2 hs = vec2(0.86*uAspect, 0.86);
  float sd = sdRound(P, hs, 0.135);
  float pxw = 2.0/uRes.y;
  float mask = 1.0 - smoothstep(-2.0*pxw, 2.0*pxw, sd);
  if (mask <= 0.0){ gl_FragColor = vec4(0.0); return; }

  vec2 pc = vec2(P.x, -P.y);
  float dith = bayer16(cell);
  vec3 col;

  if (uMode < 0.5) {
    /* カンプの線形グラデ 229.049° → LUT（キーフレーム補間済み・連続色） */
    vec2 DIR = vec2(-0.75512, 0.65559);
    float L = 2.0*hs.x*0.75512 + 2.0*hs.y*0.65559;
    float t = 0.5 + dot(pc, DIR)/L;
    t -= 0.04*uEnergy;
    vec3 src = texture2D(uLUT, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
    /* Brightness 104% → Contrast 1.38（Figmaのパネル順） */
    src = clamp(src * 1.04, 0.0, 1.0);
    src = clamp((src - 0.5) * 1.38 + 0.5, 0.0, 1.0);
    if (uQuant < 0.5) {
      /* Levels 3: RGB各チャンネルを3階調へ、ベイヤー16の同一しきい値で量子化 */
      col = clamp(floor(src * 2.0 + dith) / 2.0, 0.0, 1.0);
    } else {
      /* 検証用: グラデ位置そのものを3階調へ */
      float q = clamp(floor(clamp(t,0.0,1.0) * 2.0 + dith) / 2.0, 0.0, 1.0);
      col = texture2D(uLUT, vec2(q, 0.5)).rgb;
      col = clamp(col * 1.04, 0.0, 1.0);
      col = clamp((col - 0.5) * 1.38 + 0.5, 0.0, 1.0);
    }
  } else {
    /* V1.0 ハーフトーンの配色で、白い帯が斜めに流れる。
       【2026-08-19 ヒデさん指定】こちらはディザリング無し＝滑らかなグラデのまま */
    vec2 axis = normalize(vec2(0.70, 0.62));
    float u = dot(pc, axis) / 0.9;
    float v = dot(pc, vec2(-axis.y, axis.x)) / 0.9;
    float wave = u*2.2 + sin(v*2.1 + uTime*0.5)*0.28 - uTime*0.30;
    float lum = 0.5 + 0.5*sin(wave*3.14159265);
    lum += (vnoise(pc*2.4 + uTime*0.1) - 0.5)*0.10;
    lum += 0.15*uEnergy;
    col = rampV1(clamp(lum, 0.0, 1.0));
  }
  gl_FragColor = vec4(col*mask, mask);
}`;

  function makeGL(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return null;
    const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[KV]', gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('[KV]', gl.getProgramInfoLog(p)); return null; }
    gl.useProgram(p);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = n => gl.getUniformLocation(p, n);
    const u = { uRes: U('uRes'), uTime: U('uTime'), uMode: U('uMode'), uEnergy: U('uEnergy'), uAspect: U('uAspect'), uCell: U('uCell'), uQuant: U('uQuant'), uLUT: U('uLUT') };
    gl.uniform1i(u.uLUT, 0);
    return {
      draw(w, h, o) {
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, LUT_N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, o.lut);
        gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uTime, o.time); gl.uniform1f(u.uMode, o.mode);
        gl.uniform1f(u.uEnergy, o.energy); gl.uniform1f(u.uAspect, o.aspect); gl.uniform1f(u.uCell, o.cell); gl.uniform1f(u.uQuant, o.quant || 0);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }
  function fallbackGL(canvas) {
    const ctx = canvas.getContext('2d');
    return { draw(w, h) { if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const g = ctx.createLinearGradient(w, 0, 0, h);
      g.addColorStop(0, '#0EBBFF'); g.addColorStop(0.281, '#0EBBFF');
      g.addColorStop(0.364, '#477ED1'); g.addColorStop(0.596, '#EFEEEF'); g.addColorStop(1, '#FF5D97');
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); } };
  }

  /* ===================== 構築 ===================== */
  let rootEl = null, agentMode = 0;
  function start(cfg) {
    cfg = cfg || {};
    const root = document.getElementById(cfg.mount || 'kv');
    rootEl = root;
    root.classList.add('kv-root', 'mode-flat');

    const stage = document.createElement('div'); stage.className = 'kv-stage'; root.appendChild(stage);
    const world = document.createElement('div'); world.className = 'kv-world'; stage.appendChild(world);

    /* 線＋ドット（カンプのパス座標をそのまま描く） */
    const svg = el('svg', { class: 'kv-lines', viewBox: `0 0 ${STAGE.w} ${STAGE.h}` });
    svg.setAttribute('width', STAGE.w); svg.setAttribute('height', STAGE.h);
    world.appendChild(svg);
    const dots = [];
    LINES.forEach((ln, i) => {
      const d = 'M' + ln.pts.map(p => `${p[0]} ${p[1]}`).join(' L');
      svg.appendChild(el('path', { d, class: 'kv-line', fill: 'none' }));
      /* 【2026-08-19 ヒデさん指定】ドットは SVG の円だとアイソメで床ごと倒れて
         平べったく見える。div の球体（ラジアルグラデ＋影）にして、
         傾けたビューでは常にカメラへ向ける（ビルボード）。 */
      const c = document.createElement('div');
      c.className = 'kv-dot3';
      /* 【2026-08-19 ヒデさん指定】3Dの球体はやめる。
         2Dの平らな円のまま、傾いたビューでは常にカメラへ向ける（ビルボード）。
         床ごと倒れないので楕円に潰れず、カンプの見た目のまま立体空間に馴染む */
      c.style.setProperty('--dc', ln.dot);
      world.appendChild(c);
      dots.push({ ln, node: c, t: (i * 0.37) % 1, speed: 0.14 * (0.9 + 0.25 * (i % 3) / 2) });
    });

    /* 白キューブの厚み（Blender風）。z=0 が天面、下へ layers 枚重ねて側面を作る。
       ぼかした接地影も敷いて、上からのソフトな光で置いてある感じにする */
    function buildSlab(host, thick, layers, lightTop) {
      const sh = document.createElement('div'); sh.className = 'kv-slab-shadow';
      sh.style.transform = `translateZ(${-thick - 2}px)`;
      host.appendChild(sh);
      for (let i = layers; i >= 1; i--) {
        const L = document.createElement('div'); L.className = 'kv-slab-layer';
        const k = i / layers;                     /* 1=最下段 */
        const light = lightTop ? 1 : 0;
        L.style.transform = `translateZ(${(-thick * k).toFixed(2)}px)`;
        L.style.background = light
          ? `hsl(222 30% ${92 - 14 * k}%)`        /* 白キューブの側面（下ほど陰） */
          : `hsl(222 34% ${86 - 20 * k}%)`;
        host.appendChild(L);
      }
    }

    /* 箱（3種類の作りをカンプどおりに） */
    BOXES.forEach(b => {
      const d = document.createElement('div');
      d.className = 'kv-box kv-box--' + b.kind;
      d.style.left = b.x + 'px'; d.style.top = b.y + 'px';
      d.style.width = BOX_S + 'px'; d.style.height = BOX_S + 'px';
      /* 【2026-08-19 ヒデさん指定】Blender風キューブは 幅=縦=高さ を統一して
         きれいな立方体に見せる。厚み = 一辺(109.778px)そのもの */
      buildSlab(d, BOX_S, 28, true);   /* 枚数が少ないと側面が縞になる（12枚で実際に縞が出た） */
      const face = document.createElement('div'); face.className = 'kv-face';
      d.appendChild(face);
      b._face = face;   /* アイコン色変更(setIconColor)が参照する */
      if (b.kind === 'asset') {
        fetch(b.svg).then(r => r.text()).then(t => { face.innerHTML = t; const s = face.querySelector('svg');
          if (s) { s.style.width = '100%'; s.style.height = '100%'; s.style.display = 'block'; } });
      } else if (b.kind === 'empty') {
        if (b.flip) face.classList.add('is-flip');
      } else if (b.icon) {
        fetch(b.icon.svg).then(r => r.text()).then(t => {
          const w = document.createElement('div'); w.className = 'kv-box-ico';
          w.style.left = b.icon.x + 'px'; w.style.top = b.icon.y + 'px';
          w.style.width = b.icon.w + 'px'; w.style.height = b.icon.h + 'px';
          w.innerHTML = t; const s = w.querySelector('svg');
          if (s) { s.style.width = '100%'; s.style.height = '100%'; s.style.display = 'block'; }
          face.appendChild(w);
        });
      } else if (b.lightBlue24) {
        /* カンプの Light-Blue-24 インスタンス: 色バー(グラデ) + ガラスSVG */
        const w = document.createElement('div'); w.className = 'kv-lb24';
        const bar = document.createElement('div'); bar.className = 'kv-lb24-bar'; w.appendChild(bar);
        const glass = document.createElement('div'); glass.className = 'kv-lb24-glass';
        fetch('assets/icon-cal-glass.svg').then(r => r.text()).then(t => { glass.innerHTML = t;
          const s = glass.querySelector('svg'); if (s) { s.style.width = '100%'; s.style.height = '100%'; s.style.display = 'block'; } });
        w.appendChild(glass);
        face.appendChild(w);
      }
      world.appendChild(d);
    });

    /* エージェント */
    const agentBox = document.createElement('div'); agentBox.className = 'kv-agent';
    agentBox.style.left = AGENT.x + 'px'; agentBox.style.top = AGENT.y + 'px';
    agentBox.style.width = AGENT.w + 'px'; agentBox.style.height = AGENT.h + 'px';
    agentBox.style.borderRadius = AGENT.r + 'px';
    buildSlab(agentBox, 30, 12, false);
    const canvas = document.createElement('canvas'); canvas.className = 'kv-agent-cv'; agentBox.appendChild(canvas);
    world.appendChild(agentBox);
    const agent = makeGL(canvas) || fallbackGL(canvas);

    function fit() {
      const rw = root.clientWidth, rh = root.clientHeight;
      const s = Math.min(rw / STAGE.w, rh / STAGE.h);
      stage.style.transform = `translate(${(rw - STAGE.w * s) / 2}px, ${(rh - STAGE.h * s) / 2}px) scale(${s})`;
      root._scale = s;
    }
    window.addEventListener('resize', fit); fit();

    let energy = 0, last = performance.now();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    /* 検証用: ?freeze=1 で F1 の静止状態（カンプ1枚目と同じ絵）に固定。
       ?quant=t でグラデ位置量子化の比較モード */
    const qs = new URLSearchParams(location.search);
    const FREEZE = qs.get('freeze') === '1';
    const QUANT = qs.get('quant') === 't' ? 1 : 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const time = FREEZE ? 0 : now / 1000;
      dots.forEach(d => {
        d.t += d.speed * dt;
        if (d.t >= 1) { d.t -= 1; energy = Math.min(1.2, energy + 0.4); }
        const pos = polyAt(d.ln.pts, d.t);
        /* 【2026-08-19 ヒデさん指定】終点(エージェント)で急に消えず、
           到達する頃にフェードアウト＋少し縮んで「取り込まれる」感じにする。
           出はじめも軽くフェードイン。 */
        const fadeIn = Math.min(1, d.t / 0.10);
        const fadeOut = Math.min(1, (1 - d.t) / 0.16);
        const shrink = 1 - 0.35 * Math.max(0, 1 - (1 - d.t) / 0.16);
        /* ⚠️ z はエージェントの面(2.5px)より必ず低くする。7px にしていた時、
           ドットがエージェントの上を滑って見えた（ヒデさん報告）。
           線(z=0)よりは上、面より下の 1px に置く */
        d.node.style.transform = `translate3d(${(pos[0] - DOT_R).toFixed(1)}px, ${(pos[1] - DOT_R).toFixed(1)}px, 1px) ${view.billboard} scale(${shrink.toFixed(3)})`;
        d.node.style.opacity = (fadeIn * fadeOut * (0.55 + 0.45 * d.t)).toFixed(2);
      });
      energy = Math.max(0, energy - dt * 1.4);
      bakeTimeline(time, lutData);
      const s = (root._scale || 1) * dpr;
      /* ⚠️ Figma の Size=1 ＝「ステージ座標の1px」がディザ1セル。
         キャンバスのデバイスpx换算では scale×dpr がちょうど1セルになる */
      agent.draw(Math.max(2, Math.round(AGENT.w * s)), Math.max(2, Math.round(AGENT.h * s)),
        { time, mode: agentMode, energy: FREEZE ? 0 : clamp01(energy), aspect: AGENT.w / AGENT.h,
          cell: Math.max(1, Math.round(s)), quant: QUANT, lut: lutData });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return root;
  }

  /* ===== ビュー（回転XYZ + 拡大率）=====
     普通(0,0,0)ならカンプそのまま。傾いている時は白キューブの3D表示に切り替わる */
  const view = { x: 0, y: 0, z: 0, s: 1, billboard: '' };
  function setView(v) {
    Object.assign(view, v);
    /* ドットをカメラへ向ける = ワールド回転の逆順・逆符号 */
    view.billboard = (view.x || view.y || view.z)
      ? `rotateZ(${-view.z}deg) rotateY(${-view.y}deg) rotateX(${-view.x}deg)` : '';
    const world = rootEl.querySelector('.kv-world');
    world.style.transform =
      `rotateX(${view.x}deg) rotateY(${view.y}deg) rotateZ(${view.z}deg) scale(${view.s})`;
    rootEl.classList.toggle('mode-3d', !!(view.x || view.y || view.z));
    rootEl.classList.toggle('mode-flat', !(view.x || view.y || view.z));
  }
  const VIEWS = {
    flat: { x: 0,  y: 0, z: 0,   s: 1.00 },
    d3:   { x: 26, y: 0, z: -14, s: 1.06 },   /* 3D ライト（浅い俯瞰） */
    iso1: { x: 54, y: 0, z: -42, s: 1.26 },   /* アイソメ標準 */
    iso2: { x: 40, y: 0, z: -28, s: 1.14 },   /* アイソメ浅め */
    iso3: { x: 62, y: 0, z: -45, s: 1.32 },   /* アイソメ深め */
    iso4: { x: 54, y: 0, z: 42,  s: 1.26 },   /* アイソメ右流し */
  };
  function setAgentMode(m) { agentMode = (m === 'halftone') ? 1 : 0; }

  /* ===== アイコンの色変更（2026-08-19 ヒデさん指定）=====
     カンプのアイコンSVGは青系ガラスの多層構造で、パスの塗りを個別に書き換えるのは
     現実的でない。単色ベース(青 h≈210°)なので、CSSフィルタで丸ごと色相を回す。
       hue-rotate = 目標色相 − 210° / saturate・brightness も目標のHSLから近似
     白・透明の部分は hue-rotate の影響をほぼ受けないので、ガラスの質感は保たれる。 */
  function hexToHsl(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return { h: 0, s: 0, l };
    const d = mx - mn;
    const sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    return { h, s: sat, l };
  }
  const ICON_BASE = { h: 210, s: 0.9, l: 0.62 };   /* カンプアイコンの支配色の実測近似 */
  function setIconColor(id, hex) {
    const box = BOXES.find(x => x.id === id);
    if (!box) return false;
    const host = box.kind === 'asset' ? box._face : (box._face && (box._face.querySelector('.kv-box-ico') || box._face.querySelector('.kv-lb24')));
    if (!host) return false;
    if (!hex) { host.style.filter = ''; return true; }   /* 空文字で元の色へ */
    const c = hexToHsl(hex);
    if (!c) return false;
    const dh = Math.round(c.h - ICON_BASE.h);
    const sat = Math.max(0.02, Math.min(2, c.s / ICON_BASE.s));
    /* ⚠️ asset種(箱ごと1枚のSVG)は、明度補正が白い箱まで暗くしてグレーの箱になる
       （緑#22C55Eで実際にグレー化した）。箱を巻き込まないよう明度はほぼ固定にする */
    const briRange = box.kind === 'asset' ? [0.94, 1.10] : [0.55, 1.45];
    const bri = Math.max(briRange[0], Math.min(briRange[1], c.l / ICON_BASE.l));
    host.style.filter = `hue-rotate(${dh}deg) saturate(${sat.toFixed(2)}) brightness(${bri.toFixed(2)})`;
    return true;
  }

  global.KV = { start, setView, getView: () => ({ ...view }), VIEWS, setAgentMode, setIconColor, STAGE, AGENT };
})(window);
