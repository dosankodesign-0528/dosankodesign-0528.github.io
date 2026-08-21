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
 * 本番の表示サイズは 162x266.75（絵は上 227 ぶん、下は画面外へ隠す延長）。
 * 拡大して見せる調整用ページは renderH に実際の高さを渡すこと。
 */
export const ILLUST_RENDER = { w: 162, h: 266.75 } as const;

const VIEW_BOX = `0 0 ${ILLUST_VIEWBOX.w} ${ILLUST_VIEWBOX.h}`;
/* <img> が object-cover なので、重ねる SVG も同じ詰め方に合わせる */
/* 画像側の object-contain / object-bottom と必ず対に。
   slice（＝cover）だと元PNGの縦横比の差で白フチが左右で切れる */
const FIT = "xMidYMax meet";

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
  /** 実際に描画される高さ(px)。持ち上げ量を画面px として扱うための基準 */
  renderH?: number;
  /** 元の眉を隠すパッチの太らせ量を上書きする（調整用ページから） */
  patchSpread?: number;
  /** true: パッチを赤くして、元の眉を覆えているか確かめる（調整用ページから） */
  debugPatch?: boolean;
  /** 眉そのものの位置ずらし（画面px）。＋で右／下 */
  browX?: number;
  browY?: number;
  /** 外枠（サイズ・影・位置）に当てるクラス */
  className?: string;
};

export default function IllustTamannee({
  lift = 0,
  renderH = ILLUST_RENDER.h,
  patchSpread = PATCH_SPREAD,
  debugPatch = false,
  browX = 0,
  browY = 0,
  className,
}: Props) {
  const unit = ILLUST_VIEWBOX.h / renderH;
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
      </svg>
    </div>
  );
}
