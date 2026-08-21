"use client";

import { useCallback, useState } from "react";
import Stage from "@/components/Stage";
import TopPage from "@/components/TopPage";
import TopTunePanel, { type TopTuneValues } from "@/components/TopTunePanel";
import { DEFAULT_BO } from "@/components/boPatterns";
import { DEFAULT_SPOT_TRANSITION } from "@/components/spotTransition";
import { DEFAULT_FACE } from "@/components/faceConfig";

export default function Home() {
  /* 右下の調整パネルからもらう値。位置・大きさは CSS 変数側で直接反映されるので、
     ここで持つのは「案の切り替え」と「スクロール連動の値」だけ */
  const [tune, setTune] = useState<TopTuneValues>({
    boPattern: DEFAULT_BO,
    illustEnter: 2,
    face: DEFAULT_FACE,
    spot: DEFAULT_SPOT_TRANSITION,
  });
  const onSettleValues = useCallback((v: TopTuneValues) => setTune(v), []);

  return (
    <>
      <Stage
        illustration="tamannee"
        illustEntrance
        illustEnter={tune.illustEnter}
        bo={tune.boPattern}
        face={tune.face}
      >
        {/* 決定版：吹き出し→な〜んにもない→たまらない を順にブラー
            →ボタン→イラスト（ブラー後にクルンと一回転） */}
        <TopPage intro={2} blurSeq waitConsent spotTune={tune.spot} />
      </Stage>

      {/* ⚠️ 公開前に外す：確認用の調整パネル（右下・たたんだ状態） */}
      <TopTunePanel onSettleValues={onSettleValues} />
    </>
  );
}
