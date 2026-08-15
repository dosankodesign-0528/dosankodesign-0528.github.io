/*
 * 人物イラスト「たまんねーっ」（ベクター版）
 *
 * もとは 1枚の PNG だったので眉毛も黒目も動かせなかった。トレースして
 * 「肌 → 白目 → ほお → 髪 → 線」の色レイヤーに分け、眉毛と黒目だけ
 * 別データに切り出してある。
 *   - 眉が上にずれても、下から肌色レイヤーが出るので跡は残らない
 *   - 黒目がずれても、下から白目レイヤーが出るので跡は白いまま
 *   - 黒目は白目の形でクリップしてあるので、動かしても目の外へはみ出さない
 *
 * 動きは「パキッと1コマ」。トランジションは掛けない。
 */
import { memo, useId } from "react";
import {
  BROW_D,
  EYE_CLIP_D,
  ILLUST_FLIP,
  ILLUST_LAYERS_OVER,
  ILLUST_LAYERS_UNDER,
  ILLUST_VIEWBOX,
  MOVING_FILL,
  PUPIL_D,
  type IllustLayer,
} from "./illustMainPaths";
import type { FaceState } from "./useFaceReaction";

/*
 * 動かす量は画面px で受け取るが、SVG の中の transform は viewBox の単位で効く。
 * このイラストは Stage でも調整パネルでも 284x357 で描画される前提なので、
 * その比率で換算する（size を変える時はここも直すこと）。
 */
export const ILLUST_RENDER = { w: 284, h: 357 } as const;
const UNIT = ILLUST_VIEWBOX.h / ILLUST_RENDER.h;

const VIEW_BOX = `0 0 ${ILLUST_VIEWBOX.w} ${ILLUST_VIEWBOX.h}`;
/* もとの <img> が object-cover だったので、SVG も同じ詰め方に合わせる */
const FIT = "xMidYMid slice";

function Layers({ layers }: { layers: IllustLayer[] }) {
  return (
    <>
      {layers.map((layer) => (
        <g key={layer.name} transform={ILLUST_FLIP} fill={layer.fill} stroke="none">
          {layer.d.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ))}
    </>
  );
}
/* 動かないところは描き直さない（カーソルに合わせて何度も再描画されるため） */
const StaticLayers = memo(Layers);

function Moving({ d }: { d: readonly string[] }) {
  return (
    <g transform={ILLUST_FLIP} fill={MOVING_FILL} stroke="none">
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </g>
  );
}

type Props = {
  /** いまの顔の状態（useFaceReaction が返す値）。単位は画面px */
  face?: FaceState;
  /** 外枠（サイズ・影・位置）に当てるクラス */
  className?: string;
};

export default function IllustTamannee({ face, className }: Props) {
  /* 同じページに複数置いてもクリップが混ざらないように id を分ける */
  const clipId = `${useId()}-eye`;
  const lift = -(face?.browLift ?? 0) * UNIT;
  const ex = (face?.eyeX ?? 0) * UNIT;
  const ey = (face?.eyeY ?? 0) * UNIT;

  return (
    <svg
      className={className}
      viewBox={VIEW_BOX}
      preserveAspectRatio={FIT}
      aria-hidden
    >
      <defs>
        {/* clipPath の中に <g> は置けないので、変換は clipPath 自身に付ける */}
        <clipPath id={clipId} transform={ILLUST_FLIP}>
          {EYE_CLIP_D.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>

      <StaticLayers layers={ILLUST_LAYERS_UNDER} />

      {/* 黒目。白目の形で切り抜いてあるので目の外には出ない */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${ex} ${ey})`}>
          <Moving d={PUPIL_D.left} />
          <Moving d={PUPIL_D.right} />
        </g>
      </g>

      <StaticLayers layers={ILLUST_LAYERS_OVER} />

      {/* 眉毛。上にずれた跡は下の肌色レイヤーが出る */}
      <g transform={`translate(0 ${lift})`}>
        <Moving d={BROW_D.left} />
        <Moving d={BROW_D.right} />
      </g>
    </svg>
  );
}
