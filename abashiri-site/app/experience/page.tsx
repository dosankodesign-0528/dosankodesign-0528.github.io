"use client";

import { useCallback, useEffect, useState } from "react";
import Stage from "@/components/Stage";
import ExperienceFlow, { type Step } from "@/components/ExperienceFlow";
import TopTunePanel, { type TopTuneValues } from "@/components/TopTunePanel";
import { DEFAULT_BO } from "@/components/boPatterns";
import { DEFAULT_SPOT_TRANSITION } from "@/components/spotTransition";
import { DEFAULT_FACE } from "@/components/faceConfig";

export default function ExperiencePage() {
  const [step, setStep] = useState<Step>(1);
  /* 「この場所にする」を押したか。人物イラストはここで初めて出てくる */
  const [picked, setPicked] = useState(false);
  /* 「ぼーっ」はこの画面にしか出ないので、調整パネルもここに置く */
  const [tune, setTune] = useState<TopTuneValues>({
    boPattern: DEFAULT_BO,
    illustEnter: 1,
    tamaranee: 1,
    spotSwitch: 1,
    tamaIntro: { delay: 350, hold: 3000 },
    preview: { faceOn: false, patchRed: false },
    face: DEFAULT_FACE,
    spot: DEFAULT_SPOT_TRANSITION,
  });
  const onSettleValues = useCallback((v: TopTuneValues) => setTune(v), []);

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
      <Stage illustration="bo" hideIllust={!picked} bo={tune.boPattern}>
        <ExperienceFlow
          step={step}
          setStep={setStep}
          onPicked={() => setPicked(true)}
        />
      </Stage>

      {/* ⚠️ 公開前に外す：確認用の調整パネル（右下・たたんだ状態） */}
      <TopTunePanel onSettleValues={onSettleValues} />
    </>
  );
}
