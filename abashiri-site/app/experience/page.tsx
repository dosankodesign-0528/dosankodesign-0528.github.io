"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/Stage";
import ExperienceMock, { type Step } from "@/components/ExperienceMock";
import SoundUi from "@/components/SoundUi";

export default function ExperiencePage() {
  const [step, setStep] = useState<Step>(1);

  /* ?step=2 / ?step=3 で途中のステップから開始できる（動作確認・デモ用） */
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("step");
    if (s === "2" || s === "3") setStep(Number(s) as Step);
  }, []);
  return (
    <>
      <Stage illustration={step === 3 ? "bo" : "tamannee"}>
        <ExperienceMock step={step} setStep={setStep} />
      </Stage>
      {/* 環境音のON/OFF切替（動画再生中は自動で止まる） */}
      <SoundUi />
    </>
  );
}
