import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// Liquid Gradient — 流れるグラデーション背景
// Liquid Gradient Generator で生成 ( https://liquid-gradient-generator.vercel.app )

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;
uniform float uScale;
uniform float uWarp;
uniform float uSpeed;
uniform float uAngle;
uniform float uStretch;
uniform float uSoft;
uniform float uSheen;
uniform float uGrain;
uniform float uSeed;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.0 + 11.5;
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 p = mat2(ca, -sa, sa, ca) * uv;
  float t = uTime * uSpeed;

  vec2 pp = vec2(p.x, p.y * uStretch) * uScale * 1.2 + uSeed * 7.31;
  vec2 q = vec2(
    fbm(pp + vec2(0.0, t * 0.30)),
    fbm(pp + vec2(5.2, 1.3) + vec2(t * 0.24, 0.0))
  );
  float w2 = fbm(pp * 1.8 + q * 1.6 - vec2(t * 0.12, t * 0.09));

  float f = p.y * 1.1 + 0.5;
  f += (q.x - 0.5) * uWarp * 1.1;
  f += (w2 - 0.5) * uWarp * 0.45;
  f = clamp(f, 0.0, 1.0);

  vec3 col = uC0;
  col = mix(col, uC1, smoothstep(0.18 - uSoft, 0.18 + uSoft, f));
  col = mix(col, uC2, smoothstep(0.42 - uSoft, 0.42 + uSoft, f));
  col = mix(col, uC3, smoothstep(0.62 - uSoft, 0.62 + uSoft, f));
  col = mix(col, uC4, smoothstep(0.82 - uSoft, 0.82 + uSoft, f));
  col = mix(col, uC0, smoothstep(0.96 - uSoft * 0.6, 0.96 + uSoft * 0.6, f));

  float sheen = exp(-pow((f - 0.30) / 0.045, 2.0))
              + 0.6 * exp(-pow((f - 0.52) / 0.035, 2.0));
  col += uSheen * sheen * 0.4;

  col += (hash(gl_FragCoord.xy * 0.7 + uSeed) - 0.5) * uGrain;

  gl_FragColor = vec4(col, 1.0);
}
`

function parseColor(input: any): [number, number, number] {
    if (!input) return [0, 0, 0]
    let str = String(input).trim()
    const v = str.match(/var\([^,]+,\s*(.+)\)\s*$/)
    if (v) str = v[1].trim()
    if (str.startsWith("#")) {
        let h = str.slice(1)
        if (h.length === 3) h = h.split("").map(c => c + c).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    const m = str.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(",").map(parseFloat)
        return [p[0] / 255, p[1] / 255, p[2] / 255]
    }
    return [0, 0, 0]
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 * @framerDisableUnlink
 */
export default function LiquidGradient(props: any) {
    const {
        color1 = "#EDF1F7",
        color2 = "#9FE0F7",
        color3 = "#4A7BF0",
        color4 = "#1D2B96",
        color5 = "#F78EC2",
        angle = -30,
        scale = 1.0,
        stretch = 2.4,
        warp = 1.0,
        speed = 0.35,
        softness = 0.14,
        sheen = 0.6,
        grain = 0.05,
        seed = 42,
        paused = false,
        style,
    } = props
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { antialias: true })
        if (!gl) return

        const mkShader = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            return sh
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U = (n: string) => gl.getUniformLocation(prog, n)

        gl.uniform3fv(U("uC0"), parseColor(color1))
        gl.uniform3fv(U("uC1"), parseColor(color2))
        gl.uniform3fv(U("uC2"), parseColor(color3))
        gl.uniform3fv(U("uC3"), parseColor(color4))
        gl.uniform3fv(U("uC4"), parseColor(color5))
        gl.uniform1f(U("uScale"), scale)
        gl.uniform1f(U("uWarp"), warp)
        gl.uniform1f(U("uSpeed"), speed)
        gl.uniform1f(U("uAngle"), (angle * Math.PI) / 180)
        gl.uniform1f(U("uStretch"), stretch)
        gl.uniform1f(U("uSoft"), softness)
        gl.uniform1f(U("uSheen"), sheen)
        gl.uniform1f(U("uGrain"), grain)
        gl.uniform1f(U("uSeed"), seed)

        const draw = (t: number) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
            gl.uniform2f(U("uRes"), w, h)
            gl.uniform1f(U("uTime"), t)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        let isStatic = paused
        try {
            if (RenderTarget.current() === RenderTarget.canvas) isStatic = true
        } catch (e) {}

        if (isStatic) {
            const staticT = seed * 37.7 + 12.0
            draw(staticT)
            const ro = new ResizeObserver(() => draw(staticT))
            ro.observe(canvas)
            return () => ro.disconnect()
        }

        let raf = 0
        const loop = () => {
            draw(performance.now() / 1000)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [color1, color2, color3, color4, color5, angle, scale, stretch, warp, speed, softness, sheen, grain, seed, paused])

    return (
        <div style={{ overflow: "hidden", ...style }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
    )
}

addPropertyControls(LiquidGradient, {
    color1: { type: ControlType.Color, title: "色1 ベース", defaultValue: "#EDF1F7" },
    color2: { type: ControlType.Color, title: "色2", defaultValue: "#9FE0F7" },
    color3: { type: ControlType.Color, title: "色3", defaultValue: "#4A7BF0" },
    color4: { type: ControlType.Color, title: "色4", defaultValue: "#1D2B96" },
    color5: { type: ControlType.Color, title: "色5 アクセント", defaultValue: "#F78EC2" },
    angle: { type: ControlType.Number, title: "角度", min: -180, max: 180, step: 1, defaultValue: -30 },
    scale: { type: ControlType.Number, title: "スケール", min: 0.4, max: 3, step: 0.05, defaultValue: 1.0 },
    stretch: { type: ControlType.Number, title: "リボン感", min: 1, max: 4, step: 0.1, defaultValue: 2.4 },
    warp: { type: ControlType.Number, title: "うねり", min: 0, max: 2, step: 0.05, defaultValue: 1.0 },
    speed: { type: ControlType.Number, title: "速さ", min: 0, max: 1.5, step: 0.05, defaultValue: 0.35 },
    softness: { type: ControlType.Number, title: "なめらかさ", min: 0.02, max: 0.4, step: 0.01, defaultValue: 0.14 },
    sheen: { type: ControlType.Number, title: "光の筋", min: 0, max: 1, step: 0.05, defaultValue: 0.6 },
    grain: { type: ControlType.Number, title: "粒子", min: 0, max: 0.3, step: 0.01, defaultValue: 0.05 },
    seed: { type: ControlType.Number, title: "シード", min: 0, max: 999, step: 1, defaultValue: 42 },
    paused: { type: ControlType.Boolean, title: "停止", defaultValue: false },
})
