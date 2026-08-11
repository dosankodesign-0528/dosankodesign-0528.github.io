/* 案2：紙飛行機風の3D羽ばたき（奥行き方向にパタッと折る） */
/* eslint-disable @next/next/no-img-element */
import { MockStage } from "../shared";

const css = `
@keyframes flap3d {
  0%, 100% { transform: rotateX(8deg); }
  50%      { transform: rotateX(58deg); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50%      { transform: translateY(-10px) rotate(2deg); }
}
.persp { perspective: 220px; }
.flap3d {
  transform-origin: 50% 70%;
  animation: flap3d 0.7s ease-in-out infinite;
  width: 100%; height: 100%;
}
.bob { animation: bob 4s ease-in-out infinite; }
`;

function PaperBird({
  src,
  w,
  h,
  dur = 0.7,
  bobDur = 4,
}: {
  src: string;
  w: number;
  h: number;
  dur?: number;
  bobDur?: number;
}) {
  return (
    <div className="bob" style={{ width: w, height: h, animationDuration: `${bobDur}s` }}>
      <div className="persp" style={{ width: w, height: h }}>
        <img className="flap3d" src={src} alt="" style={{ animationDuration: `${dur}s` }} />
      </div>
    </div>
  );
}

export default function Bird2() {
  return (
    <MockStage title="案2：紙飛行機風の3D羽ばたき" css={css}>
      <div className="absolute left-[12%] top-[20%]">
        <PaperBird src="/img/bird-sky-1.svg" w={105} h={70} dur={0.75} />
      </div>
      <div className="absolute left-[38%] top-[12%]">
        <PaperBird src="/img/bird-sky-2.svg" w={46} h={22} dur={0.55} bobDur={3.2} />
      </div>
      <div className="absolute left-[60%] top-[30%]">
        <PaperBird src="/img/bird-promo-2.svg" w={62} h={32} dur={0.6} bobDur={3.6} />
      </div>
      <div className="absolute left-[26%] top-[48%]">
        <PaperBird src="/img/bird-blue-2.svg" w={189} h={86} dur={0.9} bobDur={5} />
      </div>
      <div className="absolute left-[62%] top-[58%]">
        <PaperBird src="/img/bird-blue-1.svg" w={110} h={71} dur={0.8} bobDur={4.4} />
      </div>
      <p className="absolute bottom-6 left-1/2 w-[90%] max-w-[560px] -translate-x-1/2 rounded-xl bg-white/85 p-4 text-center text-[13px] font-bold text-[#1e1e1e]">
        カモメ全体を奥行き方向にパタッと折るように回転。
        <br />
        遠くを飛ぶ鳥の「チラチラ」した見え方に近い案です
      </p>
    </MockStage>
  );
}
