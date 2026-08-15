/*
 * 人物イラスト「たまんねーっ」（ベクター版）
 *
 * もとは 1枚の PNG だったので眉毛だけ動かせなかった。トレースして
 * 「肌 → 頬 → 髪 → 線」の色レイヤーに分け、眉毛だけ別の SVG に切り出してある。
 * 眉が上にずれても下から肌色レイヤーが出てくるので、抜けた跡は残らない。
 *
 * 眉とキラキラは同じ --hop-cycle（Stage 側で指定）で動くので、
 * 必ず同じ瞬間にパキッと切り替わる。
 */
import {
  BROW_D,
  BROW_FILL,
  ILLUST_FLIP,
  ILLUST_LAYERS,
  ILLUST_VIEWBOX,
} from "./illustMainPaths";
import { DEFAULT_BROW, type BrowConfig } from "./browConfig";

const VIEW_BOX = `0 0 ${ILLUST_VIEWBOX.w} ${ILLUST_VIEWBOX.h}`;
/* もとの <img> が object-cover だったので、SVG も同じ詰め方に合わせる */
const FIT = "xMidYMid slice";

function Paths({ d, fill }: { d: readonly string[]; fill: string }) {
  return (
    <g transform={ILLUST_FLIP} fill={fill} stroke="none">
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </g>
  );
}

type Props = {
  /** 眉の動き（browConfig.ts）。lift=0 で止まる */
  brow?: BrowConfig;
  /** 外枠（サイズ・影・位置）に当てるクラス */
  className?: string;
};

export default function IllustTamannee({ brow = DEFAULT_BROW, className }: Props) {
  /* 動かさない眉も .brow-hop は付けたまま持ち上げ量を0にする。
     クラスを付け外しするとアニメが再スタートして、キラキラと拍がズレるため */
  const liftOf = (side: "left" | "right") =>
    brow.target === "both" || brow.target === side ? brow.lift : 0;

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* 眉以外ぜんぶ。眉があった所は肌色で埋まっている */}
      <svg
        className="absolute inset-0 size-full"
        viewBox={VIEW_BOX}
        preserveAspectRatio={FIT}
        aria-hidden
      >
        {ILLUST_LAYERS.map((layer) => (
          <Paths key={layer.name} d={layer.d} fill={layer.fill} />
        ))}
      </svg>

      {/* 眉毛だけ別レイヤー。CSS で上下するので px はそのまま画面上の px */}
      {(["left", "right"] as const).map((side) => (
        <svg
          key={side}
          className="brow-hop absolute inset-0 size-full"
          style={{ "--brow-lift": liftOf(side) } as React.CSSProperties}
          viewBox={VIEW_BOX}
          preserveAspectRatio={FIT}
          aria-hidden
        >
          <Paths d={BROW_D[side]} fill={BROW_FILL} />
        </svg>
      ))}
    </div>
  );
}
