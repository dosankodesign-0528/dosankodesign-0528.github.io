"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/Stage";
import ExperienceFlow, { type Step } from "@/components/ExperienceFlow";

export default function ExperiencePage() {
  const [step, setStep] = useState<Step>(1);

  /* ?step=2 / ?step=3 で途中のステップから開始できる（動作確認・デモ用） */
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("step");
    if (s === "2" || s === "3") setStep(Number(s) as Step);
  }, []);
  return (
    <>
      {/* カンプ 15152:29210 / 29251 / 29271 はどれも back（後ろ姿）バリアント。
          導入（step1）はカンプにイラストが無いので出さない */}
      <Stage illustration="bo" hideIllust={step === 1}>
        <ExperienceFlow step={step} setStep={setStep} />
      </Stage>
    </>
  );
}
