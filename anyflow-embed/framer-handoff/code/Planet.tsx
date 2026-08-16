// =============================================================
//  Anyflow Embed — 惑星（WebGL）
//  ⚠️ 手書きではありません。anyflow-embed/index.html から機械的に抽出しています。
//     DESIGNS  : index.html 1841〜2025 行
//     描画本体 : index.html 3901〜4091 行
//     元を直したら、この生成をやり直してください。
//
//  Framer の Code に丸ごと貼り付けてください。
//  Insert メニューに「Planet」として出てきます。
// =============================================================

import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

// ---- ここから index.html の DESIGNS をそのまま ----
const DESIGNS = {
  A1: {
    name: 'A1 ビビッドブルー',
    swatch: 'linear-gradient(140deg, #ff5d97 5%, #fff 30%, #1e9bff 65%, #0b6bff 100%)',
    src: 'assets/planet-b.png',
    grainScale: '120.0',
    /* ビビッド優先: 粒は乗算で粗く、白飛びさせない */
    finish: `
      col *= 1.0 + grain * 0.5 * uNoise;
      float hi = pow(max(dot(n, normalize(vec3(-0.4, 0.65, 0.65))), 0.0), 2.5);
      col = mix(col, vec3(1.0), hi * 0.08);
      col *= 1.0 - pow(1.0 - n.z, 2.2) * 0.10;`,
  },
  A2: {
    name: 'A2 ピンク×ブルー',
    swatch: 'linear-gradient(160deg, #ff5d97 22%, #fff 50%, #26a9ff 78%)',
    src: 'assets/planet-c.png',
    grainScale: '150.0',
    /* 2色の境界を活かす: 中くらいの粒を加算で */
    finish: `
      col += grain * 0.16 * uNoise;
      float hi = pow(max(dot(n, normalize(vec3(-0.45, 0.6, 0.66))), 0.0), 2.2);
      col = mix(col, vec3(1.0), hi * 0.12);
      col *= 1.0 - pow(1.0 - n.z, 2.0) * 0.08;`,
  },
  A3: {
    name: 'A3 ライトグレイン',
    swatch: 'linear-gradient(200deg, #9fdcff 12%, #fff 45%, #ff9ac4 88%)',
    src: 'assets/planet-d.png',
    grainScale: '260.0',
    /* 高密度の微粒が主役: 細かい粒を強めに */
    finish: `
      col += grain * 0.20 * uNoise;
      float hi = pow(max(dot(n, normalize(vec3(-0.45, 0.6, 0.66))), 0.0), 2.2);
      col = mix(col, vec3(1.0), hi * 0.12);
      col *= 1.0 - pow(1.0 - n.z, 2.0) * 0.07;`,
  },
  B: {
    name: 'B ハーフトーン',
    swatch: 'radial-gradient(circle at 68% 30%, #fff 8%, #5fd2ff 40%, #0e9bff 72%, #ff4fd8 100%)',
    src: 'assets/planet-e.png',   /* WebGL非対応時のフォールバック表示にのみ使用 */
    /* 完全生成のディザリング専用シェーダー:
       画像貼り付けだと網点が回転でにじみ継ぎ目も出るため、
       色のグラデを計算で作り、ベイヤーディザで1pxドットに割ってピクセル調に仕上げる */
    fragment: `
precision highp float;
uniform vec2 uRes;
uniform float uAngle;
uniform float uAngle2;
uniform float uNoise;
uniform float uTime;    /* ディザ演出用の時間 (一時停止と連動) */
uniform float uDither;  /* ディザ演出モード 1〜8 */
uniform float uLight;   /* 1=なし / 2=右上光源 */

mat3 rotAxis(vec3 a, float t){
  float c = cos(t), s = sin(t);
  vec3 u = normalize(a);
  return mat3(
    c+u.x*u.x*(1.-c),      u.x*u.y*(1.-c)-u.z*s,  u.x*u.z*(1.-c)+u.y*s,
    u.y*u.x*(1.-c)+u.z*s,  c+u.y*u.y*(1.-c),      u.y*u.z*(1.-c)-u.x*s,
    u.z*u.x*(1.-c)-u.y*s,  u.z*u.y*(1.-c)+u.x*s,  c+u.z*u.z*(1.-c)
  );
}
float hash(vec3 p){
  p = fract(p * vec3(127.1, 311.7, 74.7));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i+vec3(1,0,0)), u.x),
        mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
        mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

/* マゼンタ → 紫 → 深い青 → ブルー → シアン → 白 のカラーランプ
   (0未満に押し下げられると紫〜マゼンタ帯に入る) */
vec3 ramp(float x){
  x = clamp(x, -0.6, 1.0);
  vec3 magenta = vec3(1.0, 0.27, 0.78);
  vec3 purple = vec3(0.58, 0.26, 0.94);
  vec3 deep = vec3(0.04, 0.36, 0.86);
  vec3 blue = vec3(0.05, 0.62, 0.98);
  vec3 cyan = vec3(0.56, 0.88, 1.0);
  vec3 white = vec3(1.0);
  if (x < -0.3) return mix(magenta, purple, (x + 0.6) / 0.3);
  if (x < 0.0) return mix(purple, deep, (x + 0.3) / 0.3);
  if (x < 0.34) return mix(deep, blue, x / 0.34);
  if (x < 0.67) return mix(blue, cyan, (x - 0.34) / 0.33);
  return mix(cyan, white, (x - 0.67) / 0.33);
}

void main(){
  float CELL = 2.0; /* ドット1粒の物理px (dpr2でCSS1px相当) */
  vec2 fcTrue = gl_FragCoord.xy;
  vec2 cellId = floor(fcTrue / CELL);
  vec2 fc = (cellId + 0.5) * CELL;   /* セル中央で色を決める → 粒が均一なピクセルに */
  vec2 pTrue = (fcTrue * 2.0 - uRes) / uRes.y;
  vec2 p = (fc * 2.0 - uRes) / uRes.y;
  float R = 0.884615;
  float px = 2.0 / uRes.y;
  float alpha = 1.0 - smoothstep(R - 1.5 * px, R + 1.5 * px, length(pTrue));
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  float z = sqrt(max(R * R - dot(p, p), 1e-5));
  vec3 n = normalize(vec3(p, z));
  vec3 ax1 = normalize(vec3(0.53, 0.85, 0.35));
  vec3 ax2 = normalize(vec3(-0.62, 0.22, 0.76));
  vec3 d = rotAxis(ax2, uAngle2) * rotAxis(ax1, uAngle) * n;

  /* 明るさ: 右上ハイライトは画面固定(カンプ準拠)、表面の流れは球と一緒に回る */
  vec3 L = normalize(vec3(0.55, 0.52, 0.62));
  float lam = dot(n, L) * 0.5 + 0.5;
  float flow = (fbm(d * 2.2) - 0.5) * 0.4;
  /* 中央はシアン〜ブルー主体、白は右上のハイライト付近だけ (カンプ準拠) */
  float lum = clamp(lam * 0.95 - 0.15 + pow(lam, 6.0) * 0.55 + flow, 0.0, 1.0);

  /* ---- ディザ演出: 表面の模様ではなく「色そのもの」を動かす ----
     lum を波で押し上げ/押し下げると 白⇄シアン⇄青⇄紫⇄マゼンタ の帯を行き来し、
     ベイヤーディザで量子化しているため境目のピクセルがパラパラと入れ替わる */
  if (uDither > 1.5 && uDither < 2.5) {
    /* ②うつろい: 場所ごとに位相の違うゆっくりした色サイクル (白⇄青⇄紫) */
    lum += sin(uTime * 0.45 + fbm(d * 1.6) * 6.2832) * 0.30;
  } else if (uDither > 2.5 && uDither < 3.5) {
    /* ③流れ: 白→青→紫の色の帯が斜めに流れていく */
    lum += sin(dot(p, normalize(vec2(0.8, -0.6))) * 3.2 - uTime * 1.1) * 0.32;
  } else if (uDither > 3.5 && uDither < 4.5) {
    /* ④さざ波: 細かい色の波が通過して境目のドットがめくれる */
    lum += sin((p.x + p.y) * 8.0 - uTime * 2.4) * 0.16;
  }
  float dith = bayer8(cellId);

  /* ベイヤーディザ: 階調を段に割って、隣のセルと交互に混ぜる → 網点 */
  float spread = 0.8 + uNoise * 1.2;
  float levels = 6.0;
  float q = clamp(floor(lum * levels + (dith - 0.5) * spread + 0.5) / levels, -0.6, 1.0);
  vec3 col = ramp(q);

  /* 左下のマゼンタリム (これもディザで混ぜる) */
  float rim = pow(1.0 - n.z, 1.6) * clamp(dot(normalize(n.xy + vec2(1e-4)), normalize(vec2(-0.7, -0.6))), 0.0, 1.0);
  float mg = clamp(floor((rim * 1.5 + flow * 0.25) * 3.0 + (dith - 0.5) * 1.3 + 0.5) / 3.0, 0.0, 1.0);
  col = mix(col, vec3(1.0, 0.27, 0.78), mg * 0.92);

  /* ---- 右上光源モード: 白を「光の反射」として陰影をつける ---- */
  if (uLight > 1.5) {
    vec3 Ldir = normalize(vec3(0.62, 0.62, 0.48));
    float diffL = clamp(dot(n, Ldir), 0.0, 1.0);
    float lightAmt = 0.45 + 0.55 * diffL;
    vec3 shadowCol = col * vec3(0.55, 0.60, 0.85); /* 影はグレーでなく青みに沈める */
    col = mix(shadowCol, col, lightAmt);
    col += vec3(0.95, 0.96, 1.0) * pow(diffL, 8.0) * 0.25;
  }

  gl_FragColor = vec4(col * alpha, alpha);
}`,
  },
  C1: {
    name: 'C1 波・流れる',
    swatch: 'linear-gradient(135deg, #fff 0%, #56d0ff 38%, #2f6dff 66%, #ff4fd8 100%)',
    src: 'assets/planet-e.png',
    fragment: waveFragment('0.55', '0.06'),
  },
  C2: {
    name: 'C2 波・白帯',
    swatch: 'linear-gradient(135deg, #ff6fd8 0%, #fff 32%, #56d0ff 62%, #2f6dff 100%)',
    src: 'assets/planet-e.png',
    fragment: waveFragment('1.05', '0.30'),
  },
  C3: {
    name: 'C3 波・呼吸',
    swatch: 'linear-gradient(140deg, #ff4fd8 0%, #fff 22%, #56d0ff 46%, #fff 68%, #2f6dff 100%)',
    src: 'assets/planet-e.png',
    fragment: waveFragment('0.85', '0.14'),
  },
};
// ---- ここまで ----

interface Props {
    design: string
    duration: number
    tumble: number
    noise: number
    dir: number
    tilt: number
    random: number
    dither: number
    light: number
    fallbackSrc: string
}

export default function Planet(props: Partial<Props>) {
    const {
        design = "B",
        duration = 32,
        tumble = 0.37,
        noise = 0.5,
        dir = 1,
        tilt = 0,
        random = 0,
        dither = 1,
        light = 1,
        fallbackSrc = "",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const sphereCanvas = canvasRef.current
        if (!sphereCanvas) return
        let sphereGL: any = null
        let elapsed = 0

        // index.html の params のうち、惑星が使う分だけをここで作る
        const params = {
            design,
            dither,
            light,
            sphere: { duration, tumble, noise, dir, tilt, random },
        }

        // Framer にアップロードした画像を使いたい場合は、ここで差し替える
        if (fallbackSrc && DESIGNS[design]) DESIGNS[design].src = fallbackSrc

    function initSphere() {
      const gl = sphereCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
      if (!gl) { sphereFallback(); return; }

      const vs = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

      /* 共通部にデザイン専用の仕上げ(finish)・補助関数(helpers)・粒の細かさを差し込み、惑星ごとに別シェーダーを作る */
      const fsTemplate = (grainScale, finish, helpers) => `
    precision highp float;
    uniform vec2 uRes;
    uniform float uAngle;    /* 主回転 (rad) */
    uniform float uAngle2;   /* 2軸目の回転 (rad) */
    uniform float uNoise;    /* 追い粒の強さ (カンプ由来の質感に上乗せ) */
    uniform float uLight;    /* 1=なし / 2=右上光源 */
    uniform sampler2D uTex;  /* カンプの惑星画像 (4倍解像度) */

    mat3 rotAxis(vec3 a, float t){
      float c = cos(t), s = sin(t);
      vec3 u = normalize(a);
      return mat3(
        c+u.x*u.x*(1.-c),      u.x*u.y*(1.-c)-u.z*s,  u.x*u.z*(1.-c)+u.y*s,
        u.y*u.x*(1.-c)+u.z*s,  c+u.y*u.y*(1.-c),      u.y*u.z*(1.-c)-u.x*s,
        u.z*u.x*(1.-c)-u.y*s,  u.z*u.y*(1.-c)+u.x*s,  c+u.z*u.z*(1.-c)
      );
    }
    float hash(vec3 p){
      p = fract(p * vec3(127.1, 311.7, 74.7));
      p += dot(p, p.yzx + 19.19);
      return fract((p.x + p.y) * p.z);
    }
    ${helpers || ''}
    void main(){
      vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
      float R = 0.884615; /* 230px / 260px */
      float len = length(p);
      float px = 2.0 / uRes.y;
      float alpha = 1.0 - smoothstep(R - 1.5 * px, R + 1.5 * px, len);
      if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
      float z = sqrt(max(R * R - dot(p, p), 1e-5));
      vec3 n = normalize(vec3(p, z));

      /* 回転軸: 軌道の傾き(-23°)とはずらした斜め軸 + ゆっくり別軸 → 多面的 */
      vec3 ax1 = normalize(vec3(0.53, 0.85, 0.35));
      vec3 ax2 = normalize(vec3(-0.62, 0.22, 0.76));
      vec3 d = rotAxis(ax2, uAngle2) * rotAxis(ax1, uAngle) * n;

      /* カンプ画像を球面に貼る: 回転後の向き d から画像の色を拾う。
         無回転ならカンプがピクセルそのまま出る。裏側(d.z<0)はカンプに無いので鏡映で生成 */
      vec2 uv = vec2(0.5 + d.x * 0.47, 0.5 - d.y * 0.47);
      vec3 col = texture2D(uTex, uv).rgb;

      /* 球の表面に張り付いた粒 (球と一緒に回る) */
      float grain = hash(floor(d * ${grainScale}) + 0.5) - 0.5;

      /* ---- デザイン専用の仕上げ ---- */
      ${finish}

      /* ---- 右上光源モード: 白を「光の反射」として陰影をつける ---- */
      if (uLight > 1.5) {
        vec3 Ldir = normalize(vec3(0.62, 0.62, 0.48));
        float diff = clamp(dot(n, Ldir), 0.0, 1.0);
        float lightAmt = 0.45 + 0.55 * diff;
        vec3 shadowCol = col * vec3(0.55, 0.60, 0.85); /* 影はグレーでなく青みに沈める */
        col = mix(shadowCol, col, lightAmt);
        col += vec3(0.95, 0.96, 1.0) * pow(diff, 8.0) * 0.25;
      }

      gl_FragColor = vec4(col * alpha, alpha);
    }`;

      function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      }
      const v = compile(gl.VERTEX_SHADER, vs);
      if (!v) { sphereFallback(); return; }

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sphereCanvas.width = 260 * dpr;
      sphereCanvas.height = 260 * dpr;
      gl.viewport(0, 0, sphereCanvas.width, sphereCanvas.height);

      const progs = {};
      for (const [key, ds] of Object.entries(DESIGNS)) {
        /* fragment があるデザインは完全カスタムシェーダー (テクスチャ不使用) */
        const fsSrc = ds.fragment || fsTemplate(ds.grainScale, ds.finish, ds.helpers);
        const f = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!f) { sphereFallback(); return; }
        const prog = gl.createProgram();
        gl.attachShader(prog, v);
        gl.attachShader(prog, f);
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), sphereCanvas.width, sphereCanvas.height);
        progs[key] = {
          prog,
          needsTex: !ds.fragment,
          uAngle: gl.getUniformLocation(prog, 'uAngle'),
          uAngle2: gl.getUniformLocation(prog, 'uAngle2'),
          uNoise: gl.getUniformLocation(prog, 'uNoise'),
          uTime: gl.getUniformLocation(prog, 'uTime'),
          uDither: gl.getUniformLocation(prog, 'uDither'),
          uLight: gl.getUniformLocation(prog, 'uLight'),
        };
        if (!ds.fragment) {
          gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
          /* カンプ画像をテクスチャとして読み込み (読み込み完了したら描画) */
          const tex = gl.createTexture();
          const img = new Image();
          img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            progs[key].tex = tex;
            renderSphere();
          };
          img.src = ds.src;
        }
      }
      sphereGL = { gl, progs };
    }

    /* WebGLが使えない環境: カンプ画像をそのまま表示 */
    function sphereFallback() {
      sphereGL = null;
      sphereCanvas.classList.add('fallback');
      const ds = DESIGNS[params.design] || DESIGNS[Object.keys(DESIGNS)[0]];
      sphereCanvas.style.backgroundImage = `url('${ds.src}')`;
    }

    /* 球体の回転角 (主回転, 2軸目) */
    function sphereAngles() {
      const sp = params.sphere;
      let t = elapsed;
      /* ランダム: 周期の違う3つの波を重ねて、繰り返しに聞こえない不規則さを作る
         (乱数を毎フレーム引くとガタガタになるので、なめらかな擬似ランダムにしている) */
      if (sp.random > 0) {
        t += sp.random * sp.duration / (2 * Math.PI) *
             (Math.sin(elapsed * 0.31) * 0.6 + Math.sin(elapsed * 0.73 + 1.7) * 0.3 + Math.sin(elapsed * 1.27 + 3.1) * 0.1);
      }
      const a = 2 * Math.PI * t / sp.duration * (sp.dir || 1);
      return [a + sp.tilt * Math.PI / 180, a * sp.tumble];
    }

    function renderSphere() {
      if (!sphereGL) {
        if (sphereCanvas.classList.contains('fallback')) {
          const ds = DESIGNS[params.design] || DESIGNS[Object.keys(DESIGNS)[0]];
          sphereCanvas.style.backgroundImage = `url('${ds.src}')`;
        }
        return;
      }
      const { gl, progs } = sphereGL;
      const pr = progs[params.design] || progs[Object.keys(progs)[0]];
      if (!pr || (pr.needsTex && !pr.tex)) return;
      const [ang, ang2] = sphereAngles();
      gl.useProgram(pr.prog);
      if (pr.tex) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pr.tex);
      }
      gl.uniform1f(pr.uAngle, ang);
      gl.uniform1f(pr.uAngle2, ang2);
      gl.uniform1f(pr.uNoise, params.sphere.noise);
      if (pr.uTime) gl.uniform1f(pr.uTime, elapsed);
      if (pr.uDither) gl.uniform1f(pr.uDither, params.dither || 1);
      if (pr.uLight) gl.uniform1f(pr.uLight, params.light || 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

        initSphere()

        let raf = 0
        const t0 = performance.now()
        const loop = (t: number) => {
            elapsed = (t - t0) / 1000
            renderSphere()
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [design, duration, tumble, noise, dir, tilt, random, dither, light, fallbackSrc])

    return (
        <canvas
            ref={canvasRef}
            width={520}
            height={520}
            style={{ width: "100%", height: "100%", display: "block" }}
        />
    )
}

Planet.defaultProps = { width: 520, height: 520 }

addPropertyControls(Planet, {
    design: {
        type: ControlType.Enum,
        title: "デザイン",
        options: Object.keys(DESIGNS),
        defaultValue: "B",
    },
    duration: { type: ControlType.Number, title: "1回転の秒数", min: 4, max: 120, step: 1, defaultValue: 32 },
    tumble: { type: ControlType.Number, title: "多面ゆらぎ", min: 0, max: 2, step: 0.01, defaultValue: 0.37 },
    noise: { type: ControlType.Number, title: "粒の強さ", min: 0, max: 2, step: 0.01, defaultValue: 0.5 },
    dir: { type: ControlType.Enum, title: "回転方向", options: [1, -1], optionTitles: ["順回転", "逆回転"], defaultValue: 1 },
    tilt: { type: ControlType.Number, title: "回転軸の傾き", min: -90, max: 90, step: 1, defaultValue: 0, unit: "°" },
    random: { type: ControlType.Number, title: "ランダムのゆらぎ", min: 0, max: 1, step: 0.01, defaultValue: 0 },
    dither: { type: ControlType.Number, title: "ディザ", min: 0, max: 2, step: 0.01, defaultValue: 1 },
    light: { type: ControlType.Number, title: "ライト", min: 0, max: 2, step: 0.01, defaultValue: 1 },
    fallbackSrc: {
        type: ControlType.Image,
        title: "代替画像",
        description: "WebGL が使えない環境で表示されます（planet-b.png）",
    },
})
