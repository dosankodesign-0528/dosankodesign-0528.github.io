"use client";

/*
 * トップページに常時出しておく調整パネル（ヒデさん指示 2026-08-18）
 *
 * ・右下にアコーディオンをたたんだ状態で置く（startClosed）
 * ・仕様は tune-panel/README.md のライブラリ（public/tune-panel.js）に準拠
 *   アコーディオン2階層・検索・localStorage保存・「設定をコピー」・`.`キーで隠す
 *
 * カテゴリの並びは「ページ ＞ セクション ＞ 細目」の3階層（2026-08-21 ヒデさん指示。
 * AnyFlow のパネルと同じ考え方。全部を並列に並べない。全文は tune-panel/README.md）
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
import { TAMARANEE_PATTERNS } from "./tamaraneePatterns";

export type TopTuneValues = {
  boPattern: number;
  illustEnter: number;
  /** 1〜5: たまらねーの出方（tamaraneePatterns.ts） */
  tamaranee: number;
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
  birdExpX: 150,
  birdExpY: 380,
  birdExpW: 84,
  birdExpRot: -8,
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
  birdExpX: "--bird-exp-x",
  birdExpY: "--bird-exp-y",
  birdExpW: "--bird-exp-w",
  birdExpRot: "--bird-exp-rotate",
};

type Params = {
  pos: typeof POS_DEFAULTS;
  anim: { boPattern: number; illustEnter: number; tamaranee: number };
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
  onReplay,
}: {
  /** 手が止まった時に、案の切り替えとスクロール連動の値を渡す */
  onSettleValues: (v: TopTuneValues) => void;
  /** 登場アニメに関わる値が変わって手が止まった時（Anyflow同様、その場で再生し直す用） */
  onReplay?: () => void;
}) {
  const madeRef = useRef(false);

  useEffect(() => {
    if (madeRef.current) return;

    const DEFAULTS: Params = {
      pos: { ...POS_DEFAULTS },
      anim: { boPattern: DEFAULT_BO, illustEnter: 1, tamaranee: 1 },
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
        /* Rot で終わるキーだけ単位が deg（カモメの傾きなど） */
        const unit = k.endsWith("Rot") ? "deg" : "px";
        root.style.setProperty(VAR_OF[k], `${params.pos[k]}${unit}`);
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
           v9: 全パターンを本番パネルに集約（2026-08-21）
           v10: 「ページ＞セクション＞細目」の3階層に再設計。スイング＝案4固定・
                眉の動き方（パキッと固定）でピルを撤去。登場はぴょこん4案に（2026-08-21）
           v11: 体験ページ左のカモメ（位置・大きさ・傾き）を追加（2026-08-21）
           v12: スポットが「1スクロールごとに切替」になり、切替の見せ方5案と
                1枚あたりのスクロール量を追加（2026-08-21）
           v13: 切替はブラーで確定しピルを撤去。余韻＝白フェードの長さに（2026-08-22）
           v14: グルメが5場面目（場面ごとブラー切替）になり、白フェードを廃止（2026-08-22） */
        version: 14,
        startClosed: true /* たたんだ状態で置く（ヒデさん指示） */,
        position: { right: 20, bottom: 20 },
        params,
        defaults: DEFAULTS,
        schema: [
          {
            cat: "🌐 サイト共通",
            open: false,
            items: [
              { sub: "環境音（BGM）" },
              {
                slider: "音量",
                path: "sound.volume",
                min: 0,
                max: 100,
                step: 1,
                fmt: "%",
                hint: "100% で音源そのままの大きさ。これ以上は上げられない仕様なので音割れしません。",
              },
              {
                note: "その場で反映されます。開発中(localhost)は既定で無音なので、URLに ?sound を付けて開いてください。",
              },
            ],
          },
          {
            cat: "🏠 トップページ",
            items: [
              /* ── 人物イラスト ─────────────────── */
              { sub: "人物イラスト｜登場のしかた" },
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
              { sub: "人物イラスト｜置き場所" },
              { sub: "枠ごと動かす", deep: true },
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
              },
              { sub: "人物そのもの", deep: true },
              {
                slider: "横ずれ",
                path: "pos.personX",
                min: -120,
                max: 120,
                step: 1,
                fmt: "px",
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
              /* ── 表情 ─────────────────────────── */
              { sub: "表情（カーソルを乗せた時）" },
              {
                note: "眉が上がり、口がぽかんと開きます（切替はパキッと・フェード無し）。位置調整は下の「出しっぱなし」をONにするとラクです。",
              },
              { sub: "眉", deep: true },
              {
                slider: "持ち上げる量",
                path: "face.browLift",
                min: 0,
                max: 20,
                step: 1,
                fmt: "px",
                hint: "0 で動かなくなります。",
              },
              {
                slider: "横ずれ",
                path: "face.browX",
                min: -20,
                max: 20,
                step: 1,
                fmt: "px",
                hint: "＋で右へ。",
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
              {
                slider: "パッチの太らせ",
                path: "face.patchSpread",
                min: 0,
                max: 300,
                step: 5,
                fmt: "",
                hint: "眉を上げた時に元の眉がはみ出したら、ここを上げます。",
              },
              { sub: "口", deep: true },
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
                hint: "横幅。縦は元の比率のまま。カンプは 11.2px です。",
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
              { sub: "確認用（本番の見た目には出ません）", deep: true },
              {
                toggle: "眉と口を出しっぱなしにする",
                path: "preview.faceOn",
              },
              {
                toggle: "パッチを赤くする",
                path: "preview.patchRed",
              },
              /* ── たまらねー ────────────────────── */
              { sub: "たまらねー" },
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
              { sub: "位置と大きさ", deep: true },
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
              { sub: "初回のお披露目（登場のあと1回だけ）", deep: true },
              {
                slider: "出すまでの間",
                path: "intro.delay",
                min: 0,
                max: 2000,
                step: 50,
                fmt: "ms",
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
              /* ── キラキラ ─────────────────────── */
              { sub: "キラキラ（2コマ）" },
              { sub: "1コマ目（基準の位置）", deep: true },
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
              { sub: "2コマ目（どこへ跳ぶか）", deep: true },
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
              },
              /* ── KV → ぼーっとスポット ─────────── */
              { sub: "ぼーっとスポット｜写真の切替" },
              {
                note: "切替はブラーで確定（2026-08-21）。写真とテキストが同時に切り替わります。",
              },
              {
                slider: "1枚あたりのスクロール量",
                path: "spot.stepLen",
                min: 300,
                max: 1600,
                step: 20,
                fmt: "px",
                hint: "このぶんスクロールするごとに次の写真へ。982でちょうど1画面ぶんです。",
              },
              { sub: "キービジュアル → ぼーっとスポット（入り）" },
              { sub: "① 作字", deep: true },
              {
                slider: "消えきる位置",
                path: "spot.kvOut",
                min: 100,
                max: 1200,
                step: 10,
                fmt: "px",
              },
              { sub: "② 背景写真", deep: true },
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
              { sub: "③ スポット写真", deep: true },
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
              { sub: "④ グルメ場面のあとの余白", deep: true },
              {
                slider: "ページ末尾までの長さ",
                path: "spot.hold",
                min: 0,
                max: 2000,
                step: 10,
                fmt: "px",
                hint: "グルメが出たあと、下に残しておくスクロールの余白です。",
              },
            ],
          },
          {
            cat: "🎬 ぼーっと体験ページ",
            items: [
              { sub: "「ぼーっ」の吹き出し（動画再生中）" },
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
              { sub: "位置と大きさ", deep: true },
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
              { sub: "左のカモメ" },
              {
                note: "右のカモメと対になる、左側のカモメです（体験ページだけに出ます）。動かすとその場で反映・自動保存されます。",
              },
              {
                slider: "左からの距離",
                path: "pos.birdExpX",
                min: 0,
                max: 700,
                step: 1,
                fmt: "px",
              },
              {
                slider: "上からの距離",
                path: "pos.birdExpY",
                min: 0,
                max: 950,
                step: 1,
                fmt: "px",
              },
              {
                slider: "大きさ",
                path: "pos.birdExpW",
                min: 30,
                max: 200,
                step: 1,
                fmt: "px",
              },
              {
                slider: "傾き",
                path: "pos.birdExpRot",
                min: -45,
                max: 45,
                step: 1,
                fmt: "°",
              },
            ],
          },
        ],
        onChange: () => {
          applyVars();
          applyVolume();
        },
        onSettle: (info?: { path?: string }) => {
          applyVars();
          applyVolume();
          pushValues();
          /* 登場のしかた（案切替・たまらねーの披露タイミング）を触ったら、
             Anyflow のパネルと同じく、その場で登場アニメを再生し直して見せる */
          const p = info?.path || "";
          if (p.startsWith("anim.") || p.startsWith("intro.")) onReplay?.();
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
