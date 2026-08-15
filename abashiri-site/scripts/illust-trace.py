#!/usr/bin/env python3
"""
人物イラスト「たまんねーっ」(public/img/illust-main.png) を
ベクター化して components/illustMainPaths.ts を作り直すスクリプト。

眉毛と黒目だけ動かしたいのに 1枚のPNGでは動かせなかったので、色ごとのレイヤーに
分けてトレースし、眉毛と黒目を別データに切り出している。
- 眉が上にずれても、下から肌色レイヤーが出るので抜けた跡は残らない
- 黒目がずれても、下から白目レイヤーが出るので跡は白いまま

黒目は上まぶたの線とくっついているが、線が細く黒目が太いので
オープニング（縮めてから戻す）で機械的に切り離せる。

使い方（potrace と Pillow/numpy/scipy が要る）:
    brew install potrace
    python3 -m venv venv && venv/bin/pip install pillow numpy scipy
    venv/bin/python scripts/illust-trace.py
    # 出力された illustMainPaths.ts を components/ にコピーする

イラストを描き直した時だけ実行すればよい。
"""
import re, subprocess, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = os.path.join(os.path.dirname(__file__), "..", "public", "img", "illust-main.png")
a = np.array(Image.open(SRC).convert("RGBA")).astype(np.int16)
rgb, al = a[..., :3], a[..., 3]
H, W = al.shape
opaque = al > 128

PAL = {"black": (0,0,0), "dark": (35,34,34), "gray": (205,204,204),
       "skin": (252,228,211), "cheek": (252,208,189), "white": (255,255,255)}
names = list(PAL)
cols = np.array([PAL[n] for n in names])
idx = np.linalg.norm(rgb[:,:,None,:] - cols[None,None,:,:], axis=3).argmin(axis=2)
M = {n: (idx == i) & opaque for i, n in enumerate(names)}

S8 = np.ones((3,3), bool)
fill = ndi.binary_fill_holes
dil  = lambda m, n=1: ndi.binary_dilation(m, S8, iterations=n)

def despeckle(m, minpx):
    """AA fringes get mis-classified into neighbouring colours; drop the crumbs."""
    lab, n = ndi.label(m, structure=S8)
    if n == 0: return m
    keep = np.flatnonzero(ndi.sum(m, lab, range(1, n + 1)) >= minpx) + 1
    return np.isin(lab, keep)

# --- eyebrows: isolated components of the ink layer -------------------------
ink = M["black"] | M["dark"]
lab, _ = ndi.label(ink, structure=S8)
BROW_IDS = []
for i, sl in enumerate(ndi.find_objects(lab), 1):
    ys, xs = sl
    # forehead band, small, wide-and-flat  → eyebrow
    if 190 <= ys.start <= 240 and 190 <= xs.start <= 400 and (lab[sl] == i).sum() < 1200 \
       and (xs.stop - xs.start) > 1.2 * (ys.stop - ys.start):
        BROW_IDS.append(i)
assert len(BROW_IDS) == 2, BROW_IDS
BROW_IDS.sort(key=lambda i: ndi.find_objects(lab)[i-1][1].start)   # 左→右
brow_left, brow_right = (lab == BROW_IDS[0]), (lab == BROW_IDS[1])
brows = brow_left | brow_right
print("brow components L/R:", BROW_IDS, "px:", brow_left.sum(), brow_right.sum())

# --- 黒目: 上まぶたの線とくっついているのでオープニングで切り離す -------------
# 線は細いので縮めると消える。太い黒目だけが芯として残るので、それを元の
# 成分の中で膨らませ直すと黒目だけが取れる。
EYE_ERODE = 4
D4 = ndi.generate_binary_structure(2, 1)   # 4近傍。斜めを削りすぎない
found = []
for i, sl in enumerate(ndi.find_objects(lab), 1):
    ys, xs = sl
    if not (240 <= ys.start <= 300 and 180 <= xs.start <= 400):
        continue
    comp = lab == i
    core = ndi.binary_erosion(comp, D4, iterations=EYE_ERODE)
    cl, cn = ndi.label(core, structure=S8)
    if cn == 0:
        continue
    keep = np.flatnonzero(ndi.sum(core, cl, range(1, cn + 1)) >= 40) + 1
    if len(keep) != 1:          # 芯が1個だけ残る成分＝黒目付きのまぶた
        continue
    core = np.isin(cl, keep)
    found.append((xs.start, ndi.binary_dilation(core, D4, iterations=EYE_ERODE) & comp))
assert len(found) == 2, [f[0] for f in found]
found.sort(key=lambda t: t[0])                                    # 左→右
pupil_left, pupil_right = found[0][1], found[1][1]
pupils = pupil_left | pupil_right
print("pupil px L/R:", pupil_left.sum(), pupil_right.sum())
# 目の中心（イラスト全体に対する割合）。カーソルの向きを測る基準に使う
_py, _px = np.nonzero(pupils)
EYE_CX, EYE_CY = _px.mean() / W, _py.mean() / H
print(f"eye center: {EYE_CX:.4f}, {EYE_CY:.4f}")

# eye whites = white blobs that are not the outer sticker halo
wl, _ = ndi.label(M["white"], structure=S8)
sizes = ndi.sum(M["white"], wl, range(1, wl.max() + 1))
halo = int(np.argmax(sizes)) + 1
# 黒目を白目に足しておく。黒目がずれても下は白いまま
eyewhite = ((wl > 0) & (wl != halo)) | pupils

MOVING = brows | pupils        # 動かすものは下の固定レイヤーから抜く

# --- layer stack, bottom → top ---------------------------------------------
# UNDER = 黒目より下、OVER = 黒目より上（黒目が下まぶたの線を覆わないように）
eyes_mask = dil(despeckle(eyewhite, 100))   # 白目。黒目のクリップ形にも使う
LAYERS_UNDER = [
    ("halo",  fill(opaque),                                  "#FFFFFF", 40),
    ("gray",  dil(fill(despeckle(M["gray"],  400))),         "#CDCCCC", 40),
    ("skin",  dil(fill(despeckle(M["skin"],  400))),         "#FCE4D3", 40),
    ("eyes",  eyes_mask,                                     "#FFFFFF", 20),
]
LAYERS_OVER = [
    ("cheek", dil(fill(despeckle(M["cheek"], 250))),         "#FCD0BD", 40),
    ("hair",  despeckle(M["dark"]  & ~MOVING, 40),           "#232222",  8),
    ("line",  despeckle(M["black"] & ~MOVING, 40),           "#000000",  8),
]
LAYERS = LAYERS_UNDER + LAYERS_OVER
BROW_LAYERS  = [("browL",  brow_left,   "#232222", 4), ("browR",  brow_right,  "#232222", 4)]
PUPIL_LAYERS = [("pupilL", pupil_left,  "#232222", 4), ("pupilR", pupil_right, "#232222", 4)]
BROW_FILL = PUPIL_FILL = "#232222"

PATH_RE = re.compile(r'<path d="([^"]+)"')
def trace(mask, name, turd=8):
    pbm = f"m_{name}.pbm"
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert("1").save(pbm)
    out = subprocess.run(["potrace", "-b", "svg", "-t", str(turd), "-a", "1.0",
                          "-O", "0.35", "-u", "10", "-o", "-", pbm],
                         capture_output=True, check=True).stdout.decode()
    # potrace は d 属性を途中で改行する。TSの文字列に入れるので一行に潰す
    return [" ".join(d.split()) for d in PATH_RE.findall(out)]

groups = []
trace_cache = {}
for name, mask, color, turd in LAYERS:
    ds = trace(mask, name, turd)
    trace_cache[name] = ds
    groups.append(f'<g fill="{color}">' + "".join(f'<path d="{d}"/>' for d in ds) + "</g>")
    print(f"{name:6s} paths={len(ds):3d} chars={sum(map(len, ds)):7d}")

mcache = {}
for mn, mm, _, mt in BROW_LAYERS + PUPIL_LAYERS:
    mcache[mn] = trace(mm, mn, mt)
    print(f"{mn:6s} paths={len(mcache[mn]):3d} chars={sum(map(len, mcache[mn])):7d}")

FLIP = f'transform="translate(0,{H}) scale(0.1,-0.1)"'
def svg_group(cls, ds, color, clip=""):
    return (f'<g {clip}><g class="{cls}"><g {FLIP} stroke="none"><g fill="{color}">'
            + "".join(f'<path d="{d}"/>' for d in ds) + "</g></g></g></g>")

# 黒目は白目の形で切り抜く。どこまで動かしても目の外に黒がはみ出さない
# clipPath の中に <g> は置けない（無視される）。変換は clipPath 自身に付ける
eye_clip = (f'<defs><clipPath id="eyeclip" {FLIP}>'
            + "".join(f'<path d="{d}"/>' for d in trace_cache["eyes"]) + "</clipPath></defs>")

# 動作確認用の1枚SVG（本番は components/illustMainPaths.ts の方を使う）
n_under = len(LAYERS_UNDER)
svg = (
 f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
 f'width="{W}" height="{H}" shape-rendering="geometricPrecision">'
 f'<g {FLIP} stroke="none">' + "".join(groups[:n_under]) + "</g>"
 + eye_clip + svg_group("pupil", mcache["pupilL"] + mcache["pupilR"], PUPIL_FILL,
                        'clip-path="url(#eyeclip)"') +
 f'<g {FLIP} stroke="none">' + "".join(groups[n_under:]) + "</g>"
 + svg_group("brow", mcache["browL"] + mcache["browR"], BROW_FILL) +
 "</svg>"
)
open("illust-main.svg", "w").write(svg)
print("SVG bytes:", len(svg), " (PNG was", os.path.getsize(SRC), ")")

# ---------------------------------------------------------------------------
# 生成物: components/illustMainPaths.ts（トレース結果のパスデータ）
# ---------------------------------------------------------------------------
def ts_layer(name, color, ds):
    body = ",\n      ".join(f'"{d}"' for d in ds)
    return f'  {{\n    name: "{name}",\n    fill: "{color}",\n    d: [\n      {body},\n    ],\n  }},'

under_ts = "\n".join(ts_layer(n, c, trace_cache[n]) for n, _, c, _ in LAYERS_UNDER)
over_ts  = "\n".join(ts_layer(n, c, trace_cache[n]) for n, _, c, _ in LAYERS_OVER)
ts_d = lambda ds: ",\n    ".join(f'"{d}"' for d in ds)

ts = f'''/*
 * 人物イラスト「たまんねーっ」のベクターデータ。
 * public/img/illust-main.png を色レイヤーごとに potrace でトレースして生成した
 * もの（生成スクリプトは scripts/illust-trace.py）。手で書き換えないこと。
 *
 * 座標系: 元PNGと同じ {W}x{H}。FLIP を掛けた内側で使う（potrace のY反転ぶん）。
 *
 * 重ねる順（下 → 上）:
 *   ILLUST_LAYERS_UNDER → 黒目(PUPIL_D) → ILLUST_LAYERS_OVER → 眉毛(BROW_D)
 *
 * 眉毛と黒目は動かすので別データにしてある。眉の下には肌色、黒目の下には
 * 白目が敷いてあるので、ずらしても抜けた跡は出ない。黒目はまぶたの線
 * （OVER の line/hair）より下に描く。下まぶたを覆ってしまわないため。
 */

/** potrace 出力（10倍・Y反転）を元PNGの座標系に戻す変換 */
export const ILLUST_FLIP = "translate(0,{H}) scale(0.1,-0.1)";

export const ILLUST_VIEWBOX = {{ w: {W}, h: {H} }} as const;

export type IllustLayer = {{ name: string; fill: string; d: string[] }};

/** 黒目より下（白目まで） */
export const ILLUST_LAYERS_UNDER: IllustLayer[] = [
{under_ts}
];

/** 黒目より上（ほお・髪・線） */
export const ILLUST_LAYERS_OVER: IllustLayer[] = [
{over_ts}
];

/** 目の中心。イラスト全体に対する割合。カーソルの向きを測る基準 */
export const EYE_CENTER = {{ x: {EYE_CX:.4f}, y: {EYE_CY:.4f} }} as const;

/** 黒目を切り抜く形（白目そのもの）。これで目の外に黒がはみ出さない */
export const EYE_CLIP_D: string[] = [
    {ts_d(trace_cache["eyes"])},
];

/** 動かすパーツの色。left = 向かって左 */
export const MOVING_FILL = "{BROW_FILL}";

export const BROW_D = {{
  left: [
    {ts_d(mcache["browL"])},
  ],
  right: [
    {ts_d(mcache["browR"])},
  ],
}} as const;

export const PUPIL_D = {{
  left: [
    {ts_d(mcache["pupilL"])},
  ],
  right: [
    {ts_d(mcache["pupilR"])},
  ],
}} as const;
'''
open("illustMainPaths.ts", "w").write(ts)
print("illustMainPaths.ts bytes:", len(ts))
