"use client";

/*
 * トップページに常時出しておく調整パネル（ヒデさん指示 2026-08-18）
 *
 * ・右下にアコーディオンをたたんだ状態で置く（startClosed）
 * ・仕様は tune-panel/README.md のライブラリ（public/tune-panel.js）に準拠
 *   アコーディオン2階層・検索・localStorage保存・「設定をコピー」・`.`キーで隠す
 *
 * 反映のしかたを2つに分けている
 *   ① 位置・大きさ … globals.css の --illust-* を直接書き換える（React を通さないので
 *      ドラッグ中もカクつかない）
 *   ② 案の切り替え・スクロール連動の値 … 手が止まってから React 側へ渡す（onSettle）
 *
 * ⚠️ 公開前にこのパネルは外すこと（本番の見た目に出てしまうため）
 */
import { useEffect, useRef } from "react";
import { BO_PATTERNS, DEFAULT_BO } from "./boPatterns";
import { ILLUST_ENTER_PATTERNS } from "./illustEnterPatterns";
import { DEFAULT_SPOT_TRANSITION, type SpotTransition } from "./spotTransition";

export type TopTuneValues = {
  boPattern: number;
  illustEnter: number;
  spot: SpotTransition;
};

/* 位置・大きさ（px）。既定値は globals.css の :root と必ずそろえる */
const POS_DEFAULTS = {
  frameRight: 57,
  frameTop: 750,
  personX: 0,
  personY: 14,
  personW: 162,
  tamaraneeX: 135,
  tamaraneeY: 0,
  tamaraneeW: 75,
  boX: 135,
  boY: 8,
  boW: 62,
  sparkleX: 7,
  sparkleY: 54,
  sparkleW: 14,
};

/* params のキー → CSS 変数名 */
const VAR_OF: Record<keyof typeof POS_DEFAULTS, string> = {
  frameRight: "--illust-frame-right",
  frameTop: "--illust-frame-top",
  personX: "--illust-person-x",
  personY: "--illust-person-y",
  personW: "--illust-person-w",
  tamaraneeX: "--illust-tamaranee-x",
  tamaraneeY: "--illust-tamaranee-y",
  tamaraneeW: "--illust-tamaranee-w",
  boX: "--illust-bo-x",
  boY: "--illust-bo-y",
  boW: "--illust-bo-w",
  sparkleX: "--illust-sparkle-x",
  sparkleY: "--illust-sparkle-y",
  sparkleW: "--illust-sparkle-w",
};

type Params = {
  pos: typeof POS_DEFAULTS;
  anim: { boPattern: number; illustEnter: number };
  spot: SpotTransition;
};

/* tune-panel.js（依存ゼロの素のJS）の必要なところだけの型 */
type TunePanelLib = {
  create: (cfg: Record<string, unknown>) => { destroy: () => void };
};
declare global {
  interface Window {
    TunePanel?: TunePanelLib;
  }
}

export default function TopTunePanel({
  onSettleValues,
}: {
  /** 手が止まった時に、案の切り替えとスクロール連動の値を渡す */
  onSettleValues: (v: TopTuneValues) => void;
}) {
  const madeRef = useRef(false);

  useEffect(() => {
    if (madeRef.current) return;

    const DEFAULTS: Params = {
      pos: { ...POS_DEFAULTS },
      anim: { boPattern: DEFAULT_BO, illustEnter: 2 },
      spot: { ...DEFAULT_SPOT_TRANSITION },
    };
    const params: Params = structuredClone(DEFAULTS);

    /* ① 位置・大きさは CSS 変数へ直書き */
    const applyVars = () => {
      const root = document.documentElement;
      for (const k of Object.keys(VAR_OF) as (keyof typeof POS_DEFAULTS)[]) {
        root.style.setProperty(VAR_OF[k], `${params.pos[k]}px`);
      }
    };
    /* ② 案・スクロール連動は React へ */
    const pushValues = () =>
      onSettleValues({
        boPattern: params.anim.boPattern,
        illustEnter: params.anim.illustEnter,
        spot: { ...params.spot },
      });

    let panel: { destroy: () => void } | null = null;

    const build = () => {
      const lib = window.TunePanel;
      if (!lib) return;
      madeRef.current = true;
      panel = lib.create({
        title: "⚙️ 網走サイト 調整パネル",
        storageKey: "abashiri-top-tune",
        version: 1,
        startClosed: true /* たたんだ状態で置く（ヒデさん指示） */,
        position: { right: 20, bottom: 20 },
        params,
        defaults: DEFAULTS,
        schema: [
          {
            cat: "🧍 人物イラスト",
            items: [
              { sub: "置く場所（枠ごと動く）" },
              {
                slider: "右端からの距離",
                path: "pos.frameRight",
                min: -100,
                max: 400,
                step: 1,
                fmt: "px",
                hint: "大きくすると左へ寄ります。人物・文字・キラキラがまとめて動きます。",
              },
              {
                slider: "上からの距離",
                path: "pos.frameTop",
                min: 400,
                max: 980,
                step: 1,
                fmt: "px",
                hint: "小さくすると上へ。カンプは 750px です。",
              },
              { sub: "人物そのもの" },
              {
                slider: "横ずれ",
                path: "pos.personX",
                min: -120,
                max: 120,
                step: 1,
                fmt: "px",
                hint: "枠の中での左右の位置。",
              },
              {
                slider: "縦ずれ",
                path: "pos.personY",
                min: -120,
                max: 120,
                step: 1,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "pos.personW",
                min: 80,
                max: 320,
                step: 1,
                fmt: "px",
                hint: "横幅。縦は元の比率のまま付いてきます。",
              },
            ],
          },
          {
            cat: "💬 たまらねー",
            items: [
              {
                note: "トップで人物にカーソルを乗せた時に出る文字です。位置を見るには人物にカーソルを乗せてください。",
              },
              {
                slider: "横ずれ",
                path: "pos.tamaraneeX",
                min: -60,
                max: 260,
                step: 1,
                fmt: "px",
              },
              {
                slider: "縦ずれ",
                path: "pos.tamaraneeY",
                min: -120,
                max: 160,
                step: 1,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "pos.tamaraneeW",
                min: 40,
                max: 200,
                step: 1,
                fmt: "px",
              },
            ],
          },
          {
            cat: "💭 ぼーっ（動画再生中）",
            items: [
              {
                note: "体験ページで動画を見ている時に出る吹き出しです。トップには出ません。",
              },
              {
                pills: "出方の案",
                path: "anim.boPattern",
                immediate: true,
                options: BO_PATTERNS.map((p, i) => ({
                  name: `案${i + 1}`,
                  value: i + 1,
                  swatch: "#0070c9",
                  desc: `${p.note}（${p.nuance}）`,
                })),
              },
              {
                slider: "横ずれ",
                path: "pos.boX",
                min: -60,
                max: 260,
                step: 1,
                fmt: "px",
              },
              {
                slider: "縦ずれ",
                path: "pos.boY",
                min: -120,
                max: 160,
                step: 1,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "pos.boW",
                min: 30,
                max: 180,
                step: 1,
                fmt: "px",
              },
            ],
          },
          {
            cat: "✨ キラキラ",
            items: [
              {
                slider: "横ずれ",
                path: "pos.sparkleX",
                min: -40,
                max: 200,
                step: 1,
                fmt: "px",
              },
              {
                slider: "縦ずれ",
                path: "pos.sparkleY",
                min: -40,
                max: 240,
                step: 1,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "pos.sparkleW",
                min: 6,
                max: 60,
                step: 1,
                fmt: "px",
              },
            ],
          },
          {
            cat: "🚶 人物の登場のしかた",
            items: [
              {
                pills: "案",
                path: "anim.illustEnter",
                immediate: true,
                options: ILLUST_ENTER_PATTERNS.map((p, i) => ({
                  name: `案${i + 1}`,
                  value: i + 1,
                  swatch: "#0070c9",
                  desc: p.note,
                })),
              },
              {
                note: "切り替えたらページを読み込み直すと、その出方でもう一度登場します。",
              },
            ],
          },
          {
            cat: "🌫 キービジュアル → ぼーっとスポット",
            items: [
              { sub: "① 作字" },
              {
                slider: "消えきる位置",
                path: "spot.kvOut",
                min: 100,
                max: 1200,
                step: 10,
                fmt: "px",
                hint: "スクロールこのくらいで「な〜んにもない たまらない」が消えます。",
              },
              { sub: "② 背景写真" },
              {
                slider: "ボケ始める位置",
                path: "spot.bgFrom",
                min: 0,
                max: 800,
                step: 10,
                fmt: "px",
              },
              {
                slider: "ボケが最大になる位置",
                path: "spot.bgTo",
                min: 100,
                max: 1400,
                step: 10,
                fmt: "px",
              },
              {
                slider: "最大のボケ量",
                path: "spot.bgBlur",
                min: 0,
                max: 60,
                step: 1,
                fmt: "px",
              },
              { sub: "③ スポット写真" },
              {
                slider: "出はじめる位置",
                path: "spot.spotFrom",
                min: 0,
                max: 1400,
                step: 10,
                fmt: "px",
              },
              {
                slider: "ブラーが晴れきる位置",
                path: "spot.spotTo",
                min: 200,
                max: 2000,
                step: 10,
                fmt: "px",
                hint: "ここから「固定ビュー」が始まります。",
              },
              {
                slider: "最初のボケ量",
                path: "spot.spotBlur",
                min: 0,
                max: 80,
                step: 1,
                fmt: "px",
              },
              { sub: "④ 固定ビュー" },
              {
                slider: "留まっている長さ",
                path: "spot.hold",
                min: 0,
                max: 3000,
                step: 10,
                fmt: "px",
                hint: "総スクロール量 = ③の「晴れきる位置」＋ここ。長くすると留まる時間が伸びます。",
              },
            ],
          },
        ],
        onChange: applyVars,
        onSettle: () => {
          applyVars();
          pushValues();
        },
      });
      /* 保存されていた値を最初の1回だけ反映する */
      applyVars();
      pushValues();
    };

    if (window.TunePanel) {
      build();
    } else {
      const s = document.createElement("script");
      s.src = "/tune-panel.js";
      s.onload = build;
      document.head.appendChild(s);
    }

    return () => {
      panel?.destroy();
      madeRef.current = false;
    };
    /* onSettleValues は毎回同じ関数を渡す前提（page 側で useCallback 済み） */
  }, [onSettleValues]);

  return null;
}
