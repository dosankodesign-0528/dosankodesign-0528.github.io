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
 * 持ち上げ量は画面px で受け取るが、SVG の中の transform は viewBox の単位で効く。
 * このイラストは Stage でも調整パネルでも 284x357 で描画される前提なので、
 * その比率で換算する（size を変える時はここも直すこと）。
 */
export const ILLUST_RENDER = { w: 284, h: 357 } as const;
const UNIT = ILLUST_VIEWBOX.h / ILLUST_RENDER.h;

const VIEW_BOX = `0 0 ${ILLUST_VIEWBOX.w} ${ILLUST_VIEWBOX.h}`;
/* <img> が object-cover なので、重ねる SVG も同じ詰め方に合わせる */
/* 画像側の object-contain / object-bottom と必ず対に。
   slice（＝cover）だと元PNGの縦横比の差で白フチが左右で切れる */
const FIT = "xMidYMax meet";

function Brows({ fill, spread }: { fill: string; spread?: number }) {
  return (
    <g
      transform={ILLUST_FLIP}
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
  /** 外枠（サイズ・影・位置）に当てるクラス */
  className?: string;
};

export default function IllustTamannee({ lift = 0, className }: Props) {
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
        <Brows fill={SKIN_FILL} spread={PATCH_SPREAD} />
        {/* 動く眉 */}
        <g
          className="transition-transform duration-300 ease-standard"
          style={{ transform: `translateY(${-lift * UNIT}px)` }}
        >
          <Brows fill={BROW_FILL} />
        </g>
      </svg>
    </div>
  );
}
