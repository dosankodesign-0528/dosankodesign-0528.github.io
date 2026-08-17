"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/Stage";
import ExperienceFlow, { type Step } from "@/components/ExperienceFlow";

export default function ExperiencePage() {
  const [step, setStep] = useState<Step>(1);
  /* 「この場所にする」を押したか。人物イラストはここで初めて出てくる */
  const [picked, setPicked] = useState(false);

  /* ?step=2 / ?step=3 で途中のステップから開始できる（動作確認・デモ用） */
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("step");
    if (s === "2" || s === "3") setStep(Number(s) as Step);
    if (s === "3") setPicked(true);
  }, []);
  return (
    <>
      {/* カンプ 15152:29210 / 29251 / 29271 はどれも back（後ろ姿）バリアント。
          導入（step1）と場所えらび（step2）にはイラストを出さない。
          「この場所にする」を押した瞬間に所定の位置でフェードインして、
          そのまま人物ごと窓の中へ入っていく */}
      <Stage illustration="bo" hideIllust={!picked}>
        <ExperienceFlow
          step={step}
          setStep={setStep}
          onPicked={() => setPicked(true)}
        />
      </Stage>
    </>
  );
}
