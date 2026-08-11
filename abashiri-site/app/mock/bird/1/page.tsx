/* 案1：左右の羽を分割して、体を支点にパタパタ回転 */
/* eslint-disable @next/next/no-img-element */
import { MockStage } from "../shared";

const css = `
@keyframes wing-l {
  0%, 100% { transform: rotate(7deg); }
  50%      { transform: rotate(-11deg); }
}
@keyframes wing-r {
  0%, 100% { transform: rotate(-7deg); }
  50%      { transform: rotate(11deg); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50%      { transform: translateY(-10px) rotate(2deg); }
}
.split-bird { position: relative; }
.split-bird img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.split-bird .wl {
  clip-path: inset(-40% 50% -40% -40%);
  transform-origin: 50% 96%;
  animation-name: wing-l;
}
.split-bird .wr {
  clip-path: inset(-40% -40% -40% 50%);
  transform-origin: 50% 96%;
  animation-name: wing-r;
}
.bob { animation: bob 4s ease-in-out infinite; }
`;

function SplitBird({
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
      <div className="split-bird" style={{ width: w, height: h }}>
        <img className="wl" src={src} alt="" style={{ animationDuration: `${dur}s` }} />
        <img className="wr" src={src} alt="" style={{ animationDuration: `${dur}s` }} />
      </div>
    </div>
  );
}

export default function Bird1() {
  return (
    <MockStage title="案1：左右の羽を分割して回転" css={css}>
      <div className="absolute left-[12%] top-[20%]">
        <SplitBird src="/img/bird-sky-1.svg" w={105} h={70} dur={0.75} />
      </div>
      <div className="absolute left-[38%] top-[12%]">
        <SplitBird src="/img/bird-sky-2.svg" w={46} h={22} dur={0.55} bobDur={3.2} />
      </div>
      <div className="absolute left-[60%] top-[30%]">
        <SplitBird src="/img/bird-promo-2.svg" w={62} h={32} dur={0.6} bobDur={3.6} />
      </div>
      <div className="absolute left-[26%] top-[48%]">
        <SplitBird src="/img/bird-blue-2.svg" w={189} h={86} dur={0.9} bobDur={5} />
      </div>
      <div className="absolute left-[62%] top-[58%]">
        <SplitBird src="/img/bird-blue-1.svg" w={110} h={71} dur={0.8} bobDur={4.4} />
      </div>
      <p className="absolute bottom-6 left-1/2 w-[90%] max-w-[560px] -translate-x-1/2 rounded-xl bg-white/85 p-4 text-center text-[13px] font-bold text-[#1e1e1e]">
        羽を左右半分に分けて、体の中心を支点に逆位相で回転。
        <br />
        いちばん「パタパタ感」が出る案です
      </p>
    </MockStage>
  );
}
