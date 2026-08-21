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
import { BGM_VOLUME_EVENT, DEFAULT_BGM_VOLUME } from "./bgmConfig";
import { DEFAULT_FACE, type FaceConfig } from "./faceConfig";
import { BROW_ANIMS } from "./browAnimPatterns";
import { TAMARANEE_PATTERNS } from "./tamaraneePatterns";

export type TopTuneValues = {
  boPattern: number;
  illustEnter: number;
  /** 1〜5: たまらねーの出方（tamaraneePatterns.ts） */
  tamaranee: number;
  /** 1〜5: 15秒おきのスイング（Stage の ILLUST_ANIMS） */
  illustAnim: number;
  /** 初回の「たまらねー」お披露目（ms） */
  tamaIntro: { delay: number; hold: number };
  /** パネルの確認用スイッチ */
  preview: { faceOn: boolean; patchRed: boolean };
  face: FaceConfig;
  spot: SpotTransition;
};

/* 位置・大きさ（px）。既定値は globals.css の :root と必ずそろえる */
const POS_DEFAULTS = {
  frameRight: 57,
  frameTop: 750,
  personX: 0,
  personY: 14,
  personW: 162,
  tamaraneeX: 107,
  tamaraneeY: -10,
  tamaraneeW: 75,
  boX: 135,
  boY: 8,
  boW: 62,
  sparkleX: 4,
  sparkleY: 53,
  sparkleW: 18,
  sparkle2Dx: -5,
  sparkle2Dy: -5,
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
  sparkle2Dx: "--illust-sparkle2-dx",
  sparkle2Dy: "--illust-sparkle2-dy",
};

type Params = {
  pos: typeof POS_DEFAULTS;
  anim: { boPattern: number; illustEnter: number; tamaranee: number; illustAnim: number };
  intro: { delay: number; hold: number };
  preview: { faceOn: boolean; patchRed: boolean };
  sound: { volume: number };
  face: FaceConfig;
  sparkle: { period: number };
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
      anim: { boPattern: DEFAULT_BO, illustEnter: 2, tamaranee: 1, illustAnim: 4 },
      intro: { delay: 350, hold: 3000 },
      preview: { faceOn: false, patchRed: false },
      /* 音量は % で持つ（スライダーが扱いやすいので）。0〜100 = 0〜1 */
      sound: { volume: Math.round(DEFAULT_BGM_VOLUME * 100) },
      face: { ...DEFAULT_FACE },
      /* キラキラの切替周期（秒）。CSS 変数へは applyVars とは別に書く */
      sparkle: { period: 1.2 },
      spot: { ...DEFAULT_SPOT_TRANSITION },
    };
    const params: Params = structuredClone(DEFAULTS);

    /* ① 位置・大きさは CSS 変数へ直書き */
    const applyVars = () => {
      const root = document.documentElement;
      for (const k of Object.keys(VAR_OF) as (keyof typeof POS_DEFAULTS)[]) {
        root.style.setProperty(VAR_OF[k], `${params.pos[k]}px`);
      }
      root.style.setProperty("--illust-sparkle-period", `${params.sparkle.period}s`);
    };
    /* 音量は SoundUi へイベントで直接渡す（鳴っている最中でもその場で変わる） */
    const applyVolume = () =>
      window.dispatchEvent(
        new CustomEvent(BGM_VOLUME_EVENT, {
          detail: { v: params.sound.volume / 100 },
        })
      );

    /* ② 案・スクロール連動は React へ */
    const pushValues = () =>
      onSettleValues({
        boPattern: params.anim.boPattern,
        illustEnter: params.anim.illustEnter,
        tamaranee: params.anim.tamaranee,
        illustAnim: params.anim.illustAnim,
        tamaIntro: { ...params.intro },
        preview: { ...params.preview },
        face: { ...params.face },
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
        /* ⚠️ 既定値の意味を変えたら必ず上げる（古い保存値が自動で捨てられる）。
           v2: 「ぼーっ」の採用案を 案1 → 案4 に変更（2026-08-18）
           v3: カンプ更新でイラストが差し替わり、キラキラの項目が無くなった（2026-08-19）
           v4: 環境音の音量を追加（2026-08-19）
           v5: 眉毛（持ち上げ量・位置）を追加、たまらねーの既定位置を変更（2026-08-20）
           v6: キラキラ（2コマ）を追加（2026-08-20）
           v7: 口元（開いた口の位置・大きさ・線の太さ）を追加（2026-08-20）
           v8: 口の形をカンプ更新（Vector 8）に差し替え・既定位置を変更、
               眉の動き方5案を追加（2026-08-21）
           v9: 全パターンを本番パネルに集約（たまらねー出方・スイング・初回タイミング・
               パッチ・確認用スイッチ）。キラキラ2コマ目 dx=-5、眉1px（2026-08-21） */
        version: 9,
        startClosed: true /* たたんだ状態で置く（ヒデさん指示） */,
        position: { right: 20, bottom: 20 },
        params,
        defaults: DEFAULTS,
        schema: [
          {
            cat: "🔊 環境音（BGM）",
            items: [
              {
                slider: "音量",
                path: "sound.volume",
                min: 0,
                max: 100,
                step: 1,
                fmt: "%",
                hint: "100% で音源そのままの大きさ。これ以上は上げられない仕様なので音割れしません。カンプ制定時は45%、いまの既定は62%です。",
              },
              {
                note: "動かすとその場で音量が変わります（鳴っている最中でもOK）。開発中(localhost)は既定で無音なので、URLに ?sound を付けて開いてください。",
              },
            ],
          },
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
                hint: "大きくすると左へ寄ります。人物と文字がまとめて動きます。",
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
              { sub: "たまに揺れる動き（約15秒おき）" },
              {
                pills: "スイング",
                path: "anim.illustAnim",
                immediate: true,
                options: [
                  { name: "案1", value: 1, swatch: "#0070c9", desc: "タメて→スナップ。左へゆっくり傾いてから右へ一気" },
                  { name: "案2", value: 2, swatch: "#0070c9", desc: "速い2往復→ふわっと収束。出だし全力" },
                  { name: "案3", value: 3, swatch: "#0070c9", desc: "ワイパー。じっくりため→ビュッ→ゆっくり中央へ" },
                  { name: "案4", value: 4, swatch: "#0070c9", desc: "小刻みシェイク→ピタッ（今の採用案）" },
                  { name: "案5", value: 5, swatch: "#0070c9", desc: "タメ静止つきワンモーション" },
                ],
              },
            ],
          },
          {
            cat: "🙂 眉毛（カーソルを乗せた時）",
            items: [
              {
                note: "人物にカーソルを乗せると眉が持ち上がります。触っている間だけ見えるので、乗せながら動かしてください。",
              },
              {
                pills: "動き方",
                path: "face.browAnim",
                immediate: true,
                options: BROW_ANIMS.map((p, i) => ({
                  name: `案${i + 1}`,
                  value: i + 1,
                  swatch: "#0070c9",
                  desc: `${p.label.replace(/^案\d+\s*/, "")}　${p.note}`,
                })),
              },
              {
                slider: "持ち上げる量",
                path: "face.browLift",
                min: 0,
                max: 20,
                step: 1,
                fmt: "px",
                hint: "0 で動かなくなります。",
              },
              { sub: "眉そのものの置き場所" },
              {
                slider: "横ずれ",
                path: "face.browX",
                min: -20,
                max: 20,
                step: 1,
                fmt: "px",
                hint: "＋で右へ。元の眉を隠す肌色パッチは動かないので、ずらしすぎると下から元の眉が出ます。",
              },
              {
                slider: "縦ずれ",
                path: "face.browY",
                min: -20,
                max: 20,
                step: 1,
                fmt: "px",
                hint: "＋で下へ。",
              },
              { sub: "元の眉を隠すパッチ" },
              {
                slider: "パッチの太らせ",
                path: "face.patchSpread",
                min: 0,
                max: 300,
                step: 5,
                fmt: "",
                hint: "眉を上げた時に元の眉がはみ出したら、ここを上げます。",
              },
              { sub: "確認用（保存されても本番の見た目には出ません）" },
              {
                toggle: "眉と口を出しっぱなしにする",
                path: "preview.faceOn",
                hint: "カーソルを乗せなくても、上がった眉・開いた口・たまらねーが出ます。位置調整に。",
              },
              {
                toggle: "パッチを赤くする",
                path: "preview.patchRed",
                hint: "元の眉と口をちゃんと覆えているかが一目で分かります。",
              },
            ],
          },
          {
            cat: "✨ キラキラ（2コマ）",
            items: [
              {
                note: "顔の横のキラキラです。2つの位置をパキッと行き来します（GIF風・フェード無し）。",
              },
              { sub: "1コマ目（基準の位置）" },
              {
                slider: "横ずれ",
                path: "pos.sparkleX",
                min: -40,
                max: 160,
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
              { sub: "2コマ目（どこへ跳ぶか）" },
              {
                slider: "横のずらし",
                path: "pos.sparkle2Dx",
                min: -30,
                max: 30,
                step: 1,
                fmt: "px",
                hint: "＋で右へ。1コマ目からの相対位置です。",
              },
              {
                slider: "縦のずらし",
                path: "pos.sparkle2Dy",
                min: -30,
                max: 30,
                step: 1,
                fmt: "px",
                hint: "−で上へ。",
              },
              {
                slider: "切替の速さ",
                path: "sparkle.period",
                min: 0.3,
                max: 4,
                step: 0.1,
                fmt: "s",
                hint: "1往復にかかる時間。小さいほどせわしなく光ります。",
              },
            ],
          },
          {
            cat: "👄 口元（カーソルを乗せた時）",
            items: [
              {
                note: "人物にカーソルを乗せると、口がぽかんと開きます。乗せながら動かしてください。",
              },
              {
                slider: "横ずれ",
                path: "face.mouthX",
                min: 30,
                max: 70,
                step: 0.5,
                fmt: "px",
              },
              {
                slider: "縦ずれ",
                path: "face.mouthY",
                min: 60,
                max: 100,
                step: 0.5,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "face.mouthW",
                min: 4,
                max: 20,
                step: 0.5,
                fmt: "px",
                hint: "横幅。縦は元の比率のまま付いてきます。カンプは 8px です。",
              },
              {
                slider: "線の太さ",
                path: "face.mouthStroke",
                min: 0.5,
                max: 4,
                step: 0.25,
                fmt: "px",
                hint: "カンプは 1.5px です。",
              },
            ],
          },
          {
            cat: "💬 たまらねー",
            items: [
              {
                note: "人物にカーソルを乗せた時と、登場直後の1回だけ出る文字です。「眉と口を出しっぱなしにする」をONにすると位置調整がラクです。",
              },
              {
                pills: "出方",
                path: "anim.tamaranee",
                immediate: true,
                options: TAMARANEE_PATTERNS.map((p, i) => ({
                  name: `案${i + 1}`,
                  value: i + 1,
                  swatch: "#0070c9",
                  desc: `${p.label.replace(/^案\d+\s*/, "")}　${p.note}`,
                })),
              },
              { sub: "初回のお披露目（登場のあと1回だけ）" },
              {
                slider: "出すまでの間",
                path: "intro.delay",
                min: 0,
                max: 2000,
                step: 50,
                fmt: "ms",
                hint: "ぴょこんと登場し終わってから、たまらねーが出るまで。",
              },
              {
                slider: "見せる時間",
                path: "intro.hold",
                min: 500,
                max: 8000,
                step: 100,
                fmt: "ms",
                hint: "出したまま留めておく長さ。このあと引っ込みます。",
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
        onChange: () => {
          applyVars();
          applyVolume();
        },
        onSettle: () => {
          applyVars();
          applyVolume();
          pushValues();
        },
      });
      /* 保存されていた値を最初の1回だけ反映する */
      applyVars();
      applyVolume();
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
