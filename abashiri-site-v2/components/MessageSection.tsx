"use client";

/*
 * メッセージセクション（KV直下・カンプ 15480:22896。2026-08-21 ヒデさん依頼）
 *
 * 作字がブラーで消えたあと、ブラーのかかった背景の上にメッセージが出る。
 * スクロール量 [start .. start+len] の間で読み進み、終わると
 * ぼーっとスポットへ入れ替わる（入れ替えのずらしは TopPage 側で行う）。
 *
 * 文言・書体はカンプの実測値：
 *   見出し「網走は何もない。」 Noto Sans JP Thin(100) 90px / 行間1 / 白80%
 *   本文 Noto Sans JP Light(300) 20px / 行間2 / 字間0.4px / 白
 *   置き場所 left140 top172 幅720 / 見出しと本文の間120px
 *
 * 出方は5案（msgConfig.ts）。スクロール駆動なので、戻せば巻き戻る。
 */
import { useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { mergeMsg, type MsgTune } from "./msgConfig";

/* カンプ 15480:22896 の文言そのまま。空行区切りで5ブロック */
const TITLE = "網走は何もない。";
const BLOCKS: string[][] = [
  ["よくそんなことを言われます。", "ただ、それがいいんです。魅力なんです。"],
  [
    "いまの情報過多な日本で暮らしていると、考えることが多すぎです。",
    "休んでいるあいだも、頭が動き続けている。",
  ],
  ["網走は何も考えなくていい時間、ぼーっとする時間をお届けします。"],
  ["オホーツクの海と、広大な大地と、空。", "それ以外は、何もありません。"],
  ["網走は何もない。だから、たまらない。"],
];
const ALL_LINES = BLOCKS.flat();

/** 0〜1 に丸めた区間進捗 */
const seg = (p: number, from: number, span: number) =>
  Math.max(0, Math.min(1, (p - from) / Math.max(0.0001, span)));

export default function MessageSection({
  scrollY,
  start,
  tune,
}: {
  scrollY: MotionValue<number>;
  /** メッセージが出はじめるスクロール量(px) */
  start: number;
  tune?: Partial<MsgTune> | null;
}) {
  const M = mergeMsg(tune);
  const [v, setV] = useState(0);
  useMotionValueEvent(scrollY, "change", (val) => setV(val));

  /* 読みの進捗 0〜1（超えても計算は続く）。
     読み終わったあとは M.tail ぶんの「余韻」区間：最後の段落を見せたまま
     スクロールが進み、余韻が尽きてからブラーで退場する（2026-08-22 ヒデさん指摘） */
  const p = (v - start) / Math.max(1, M.len);
  /* 出はじめ：ふわっと。退場：余韻のあとにスポットへ譲る */
  const enter = seg(p, 0, 0.05);
  const exit = seg(v, start + M.len + M.tail, 300);
  const shellOpacity = enter * (1 - exit);
  const shellBlur = (1 - enter) * 10 + exit * 14;
  const minOp = M.minOpacity / 100;
  /* 見た目（透過率・ウェイト・行間）はパネルから（2026-08-23 ヒデさん依頼） */
  const titleBase = M.titleOpacity / 100;

  if (shellOpacity <= 0.001) return null;

  /* 「読む順」の通し番号：見出し=0、本文の行=1〜。案ごとの出しどころに使う。
     soft（にじみ幅）が大きいほど、1つの行が出るのに深いスクロールを使う
     ＝パッと切り替わらず、ゆーっくり にじみながら流れてくる（2026-08-21 ヒデさん指示） */
  const unitCount = 1 + ALL_LINES.length;
  /* 進捗の 0〜0.88 を読みに使い、残りは余韻（最後の行を読んでから間ができる） */
  const bandAt = (unit: number) => (unit / unitCount) * 0.88;
  const bandSpan = 0.88 / unitCount;
  const soft = Math.max(0.5, M.soft);

  /* ── 出現のさせ方（2026-08-23 作り直し） ──
     以前はスクロール量をそのまま透明度・位置に割り当てていた（スクラブ方式）。
     するとホイールの細かい進み戻りが文字の動きに直結して「上下にガタガタ」した。
     いまは「読み位置がしきい値を越えたら、時間ベースのトランジションでふわっと出す」。
     スクロールで順番に出る体験は同じで、スクロールのノイズは文字に乗らない。
     にじみ幅(soft)は「出るのにかける時間」として効く */
  const dur = Math.round(500 + soft * 350); /* soft1.3 ≒ 0.95秒 */
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const trans = `opacity ${dur}ms ${ease}, filter ${dur}ms ${ease}, transform ${dur}ms ${ease}`;

  /* 案別：見出しと各行のスタイル（on/off の2状態＋トランジション） */
  const titleOn = p >= bandAt(0);
  const titleStyle = (): React.CSSProperties => {
    switch (M.pattern) {
      case 2:
        return {
          opacity: titleBase * (titleOn ? 1 : minOp),
          transition: trans,
        };
      default: /* 1・3: ブラーで登場 */
        return {
          opacity: titleOn ? titleBase : 0,
          filter: titleOn ? "none" : "blur(12px)",
          transform: titleOn ? "translateY(0)" : "translateY(20px)",
          transition: trans,
        };
    }
  };

  const lineStyle = (globalLine: number, blockIdx: number): React.CSSProperties => {
    const unit = 1 + globalLine;
    switch (M.pattern) {
      case 2: {
        /* 浮かび上がり：全文うっすら置いてあり、読む順に濃くなる */
        const on = p >= bandAt(unit);
        return { opacity: on ? 1 : minOp, transition: trans };
      }
      case 3: {
        /* 行ごとに流れ込む */
        const on = p >= bandAt(unit);
        return {
          opacity: on ? 1 : 0,
          filter: on ? "none" : "blur(8px)",
          transform: on ? "translateY(0)" : "translateY(26px)",
          transition: trans,
        };
      }
      default: {
        /* 案1: 段落ごとにブラー出現（段落内は同時） */
        const firstUnit = 1 + BLOCKS.slice(0, blockIdx).flat().length;
        const on = p >= bandAt(firstUnit);
        return {
          opacity: on ? 1 : 0,
          filter: on ? "none" : "blur(10px)",
          transform: on ? "translateY(0)" : "translateY(18px)",
          transition: trans,
        };
      }
    }
  };

  let lineNo = -1;
  return (
    <div className="pointer-events-none sticky top-0 -mt-[982px] h-[982px]">
      <div
        className="absolute left-[140px] top-[172px] w-[720px] text-white"
        style={{ opacity: shellOpacity, filter: `blur(${shellBlur}px)` }}
      >
        {/* 見出し：カンプ 15481:23022 の実測（Noto Sans JP Thin / Hero_90px / 行間1 / 白80%） */}
        <p
          className="text-hero-90 whitespace-nowrap"
          style={{
            fontWeight: M.titleWeight,
            lineHeight: M.titleLeading,
            ...titleStyle(),
          }}
        >
          {TITLE}
        </p>
        {/* 本文：カンプ 15480:23019 の実測（Noto Sans JP Light 20px / 行間2 / 字間0.4px / 白） */}
        <div
          className="mt-[120px] text-body-20 tracking-[0.4px]"
          style={{ fontWeight: M.bodyWeight, lineHeight: M.bodyLeading }}
        >
          {BLOCKS.map((lines, bi) => (
            <div key={bi} className={bi === 0 ? "" : "mt-[40px]"}>
              {lines.map((l) => {
                lineNo += 1;
                return (
                  <p key={l} style={lineStyle(lineNo, bi)}>
                    {l}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
