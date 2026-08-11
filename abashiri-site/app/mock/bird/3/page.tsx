/* 案3：変形なし・ふわふわ漂うだけ（上品案） */
/* eslint-disable @next/next/no-img-element */
import { MockStage } from "../shared";

const css = `
@keyframes floaty {
  0%, 100% { transform: translate(0, 0) rotate(-3deg); }
  25%      { transform: translate(6px, -8px) rotate(0deg); }
  50%      { transform: translate(12px, -2px) rotate(3deg); }
  75%      { transform: translate(5px, 6px) rotate(0deg); }
}
.floaty {
  animation: floaty 6s ease-in-out infinite;
  width: 100%; height: 100%;
}
`;

function FloatyBird({
  src,
  w,
  h,
  dur = 6,
  delay = 0,
}: {
  src: string;
  w: number;
  h: number;
  dur?: number;
  delay?: number;
}) {
  return (
    <div style={{ width: w, height: h }}>
      <img
        className="floaty"
        src={src}
        alt=""
        style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
      />
    </div>
  );
}

export default function Bird3() {
  return (
    <MockStage title="案3：変形なし・ふわふわ漂うだけ" css={css}>
      <div className="absolute left-[12%] top-[20%]">
        <FloatyBird src="/img/bird-sky-1.svg" w={105} h={70} dur={6} />
      </div>
      <div className="absolute left-[38%] top-[12%]">
        <FloatyBird src="/img/bird-sky-2.svg" w={46} h={22} dur={5} delay={0.8} />
      </div>
      <div className="absolute left-[60%] top-[30%]">
        <FloatyBird src="/img/bird-promo-2.svg" w={62} h={32} dur={5.4} delay={1.6} />
      </div>
      <div className="absolute left-[26%] top-[48%]">
        <FloatyBird src="/img/bird-blue-2.svg" w={189} h={86} dur={7} delay={0.4} />
      </div>
      <div className="absolute left-[62%] top-[58%]">
        <FloatyBird src="/img/bird-blue-1.svg" w={110} h={71} dur={6.4} delay={1.2} />
      </div>
      <p className="absolute bottom-6 left-1/2 w-[90%] max-w-[560px] -translate-x-1/2 rounded-xl bg-white/85 p-4 text-center text-[13px] font-bold text-[#1e1e1e]">
        イラストは一切変形させず、ゆっくり上下に揺れて傾くだけ。
        <br />
        上品で背景に馴染む、大人しい案です
      </p>
    </MockStage>
  );
}
