/*
 * 人物イラスト「たまんねーっ」
 *
 * 絵そのものは元の PNG（public/img/illust-main.png）をそのまま出す。
 * その上に眉毛だけを SVG で重ねてあり、カーソルが乗っている間だけ少し持ち上がる。
 *
 * 重ね方（下 → 上）:
 *   1. illust-main.png
 *   2. 元の眉を隠す肌色パッチ（動かない。眉の形を少し太らせたもの）
 *   3. 動く眉
 *
 * 止まっている時はパッチの上にぴったり眉が乗るので、見た目は元の PNG と変わらない。
 */
import {
  BROW_ALL,
  BROW_FILL,
  ILLUST_FLIP,
  ILLUST_VIEWBOX,
  PATCH_SPREAD,
  SKIN_FILL,
} from "./illustMainPaths";

/*
 * 位置・大きさの値はすべて「カンプ枠（162x226.8）上の px」で受け取る。
 * SVG の中は viewBox（648x1067）単位なので、固定の倍率4で換算する。
 * 表示を何倍に拡大しても、値の意味は変わらない（絵と一緒に拡大される）。
 */
export const ILLUST_RENDER = { w: 162, h: 266.75 } as const;
const COMP_UNIT = ILLUST_VIEWBOX.w / ILLUST_RENDER.w; /* = 4 */

const VIEW_BOX = `0 0 ${ILLUST_VIEWBOX.w} ${ILLUST_VIEWBOX.h}`;
/* <img> が object-cover なので、重ねる SVG も同じ詰め方に合わせる */
/* 画像側の object-contain / object-bottom と必ず対に。
   slice（＝cover）だと元PNGの縦横比の差で白フチが左右で切れる */
const FIT = "xMidYMax meet";

/* 口まわりのカンプ実測（15410:21336。162x226.8 の枠内の px）
   PATCH … 元の口（への字の線）を覆う肌色の四角
   RATIO … 開いた口の縦横比 10.39 / 7.96 */
const MOUTH_PATCH = { x: 43.17, y: 77.45, w: 26.49, h: 12.79 } as const;
const MOUTH_RATIO = 10.39 / 7.96;

function Brows({
  fill,
  spread,
  shift,
}: {
  fill: string;
  spread?: number;
  /** viewBox 単位でのずらし量（動く眉だけに掛ける） */
  shift?: { x: number; y: number };
}) {
  return (
    <g
      transform={`${shift ? `translate(${shift.x},${shift.y}) ` : ""}${ILLUST_FLIP}`}
      fill={fill}
      stroke={spread ? fill : "none"}
      strokeWidth={spread ?? 0}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {BROW_ALL.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

type Props = {
  /** 眉を持ち上げる量（画面px）。0 で元の位置 */
  lift?: number;
  /** 元の眉を隠すパッチの太らせ量を上書きする（調整用ページから） */
  patchSpread?: number;
  /** true: パッチを赤くして、元の眉を覆えているか確かめる（調整用ページから） */
  debugPatch?: boolean;
  /** 眉そのものの位置ずらし（画面px）。＋で右／下 */
  browX?: number;
  browY?: number;
  /** true: 口を「開いた口」に差し替える（ホバー中） */
  mouthOpen?: boolean;
  /** 口の位置・大きさ・線の太さ（画面px。カンプ 15410:21336 が既定） */
  mouthX?: number;
  mouthY?: number;
  mouthW?: number;
  mouthStroke?: number;
  /** 外枠（サイズ・影・位置）に当てるクラス */
  className?: string;
};

export default function IllustTamannee({
  lift = 0,
  patchSpread = PATCH_SPREAD,
  debugPatch = false,
  browX = 0,
  browY = 0,
  mouthOpen = false,
  mouthX = 49.9,
  mouthY = 81.2,
  mouthW = 8,
  mouthStroke = 1.5,
  className,
}: Props) {
  const unit = COMP_UNIT;
  /* 位置ずらしは「静止時の眉の置き場所」。パッチは動かさない
     （動かすと元の眉が顔を出してしまう） */
  const shift = { x: browX * unit, y: browY * unit };
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/illust-main.png"
        alt=""
        className="absolute inset-0 size-full object-contain object-bottom"
      />
      <svg
        className="absolute inset-0 size-full"
        viewBox={VIEW_BOX}
        preserveAspectRatio={FIT}
        aria-hidden
      >
        {/* 元の眉を隠しておく。眉が上がった時にここが額として見える */}
        <Brows fill={debugPatch ? "#FF3B30" : SKIN_FILL} spread={patchSpread} />
        {/* 動く眉 */}
        <g
          className="transition-transform duration-300 ease-standard"
          style={{ transform: `translateY(${-lift * unit}px)` }}
        >
          <Brows fill={BROW_FILL} shift={shift} />
        </g>
        {/* 口：ホバー中だけ「開いた口」に差し替える（カンプ 15410:21336）。
            肌色の四角で元の口（への字の線）を覆い、その上に白地・黒線の縦長楕円を描く。
            四角の位置はイラストに焼き付いた元の口を隠すためのものなので動かさない。
            楕円だけが調整パネルで動く */}
        <g
          style={{
            opacity: mouthOpen ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <rect
            x={MOUTH_PATCH.x * unit}
            y={MOUTH_PATCH.y * unit}
            width={MOUTH_PATCH.w * unit}
            height={MOUTH_PATCH.h * unit}
            fill={debugPatch ? "#FF3B30" : SKIN_FILL}
          />
          <ellipse
            cx={(mouthX + mouthW / 2) * unit}
            cy={(mouthY + (mouthW * MOUTH_RATIO) / 2) * unit}
            rx={((mouthW - mouthStroke) / 2) * unit}
            ry={((mouthW * MOUTH_RATIO - mouthStroke) / 2) * unit}
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={mouthStroke * unit}
          />
        </g>
      </svg>
    </div>
  );
}
