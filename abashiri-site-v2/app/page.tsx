"use client";

import { useCallback, useState } from "react";
import Stage from "@/components/Stage";
import TopPage from "@/components/TopPage";
import TopTunePanel, { type TopTuneValues } from "@/components/TopTunePanel";
import { DEFAULT_BO } from "@/components/boPatterns";
import { DEFAULT_SPOT_TRANSITION } from "@/components/spotTransition";
import { DEFAULT_FACE } from "@/components/faceConfig";
import { DEFAULT_KV_EXIT } from "@/components/kvExitConfig";
import { DEFAULT_HERO_ENTER } from "@/components/heroEnterConfig";
import { DEFAULT_MSG } from "@/components/msgConfig";

export default function Home() {
  /* 右下の調整パネルからもらう値。位置・大きさは CSS 変数側で直接反映されるので、
     ここで持つのは「案の切り替え」と「スクロール連動の値」だけ */
  const [tune, setTune] = useState<TopTuneValues>({
    boPattern: DEFAULT_BO,
    illustEnter: 3,
    hoverBounce: 1,
    tamaranee: 1,
    tamaIntro: { delay: 350, hold: 3000 },
    preview: { faceOn: false, patchRed: false },
    face: DEFAULT_FACE,
    spot: DEFAULT_SPOT_TRANSITION,
    kvExit: DEFAULT_KV_EXIT,
    hero: DEFAULT_HERO_ENTER,
    msg: DEFAULT_MSG,
  });
  const onSettleValues = useCallback((v: TopTuneValues) => setTune(v), []);

  /* 登場アニメに関わる値を触ったら、ページを作り直して登場を再生し直す
     （Anyflow のパネルと同じ「変えたらその場でアニメが見られる」挙動。
      環境音のON/OFF確認は済んだ記憶が残っているので、再生はすぐ始まる） */
  const [replayEpoch, setReplayEpoch] = useState(0);
  const onReplay = useCallback(() => setReplayEpoch((e) => e + 1), []);

  return (
    <>
      <Stage
        key={replayEpoch}
        illustration="tamannee"
        illustEntrance
        illustEnter={tune.illustEnter}
        hoverBounce={tune.hoverBounce}
        bo={tune.boPattern}
        face={tune.face}
        tamaranee={tune.tamaranee}
        tamaIntro={tune.tamaIntro}
        forceFace={tune.preview.faceOn}
        patchRed={tune.preview.patchRed}
      >
        {/* 決定版：吹き出し→な〜んにもない→たまらない を順にブラー
            →ボタン→イラスト（ブラー後にクルンと一回転） */}
        <TopPage
          intro={2}
          blurSeq
          waitConsent
          spotTune={tune.spot}
          kvExit={tune.kvExit}
          heroEnter={tune.hero}
          msgTune={tune.msg}
        />
      </Stage>

      {/* ⚠️ 公開前に外す：確認用の調整パネル（右下・たたんだ状態） */}
      <TopTunePanel onSettleValues={onSettleValues} onReplay={onReplay} />
    </>
  );
}
