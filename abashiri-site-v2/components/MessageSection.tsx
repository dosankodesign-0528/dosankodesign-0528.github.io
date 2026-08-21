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

  /* 読みの進捗 0〜1（超えても計算は続く＝退場に使う） */
  const p = (v - start) / Math.max(1, M.len);
  /* 出はじめ：ふわっと。読み終わり：スポットに譲りながらブラーで退場 */
  const enter = seg(p, 0, 0.05);
  const exit = seg(p, 1.0, 300 / M.len);
  const shellOpacity = enter * (1 - exit);
  const shellBlur = (1 - enter) * 10 + exit * 14;
  const minOp = M.minOpacity / 100;

  if (shellOpacity <= 0.001) return null;

  /* 「読む順」の通し番号：見出し=0、本文の行=1〜。案ごとの出しどころに使う */
  const unitCount = 1 + ALL_LINES.length;
  /* 進捗の 0〜0.88 を読みに使い、残りは余韻（最後の行を読んでから間ができる） */
  const bandAt = (unit: number) => (unit / unitCount) * 0.88;
  const bandSpan = 0.88 / unitCount;

  /* 案別：見出しと各行のスタイル */
  const titleStyle = (): React.CSSProperties => {
    const b = seg(p, bandAt(0), bandSpan * 1.4);
    switch (M.pattern) {
      case 2:
        return { opacity: 0.8 * (minOp + (1 - minOp) * b) };
      case 4:
        return { opacity: 0.8 * (minOp + (1 - minOp) * b) };
      case 5:
        return { opacity: 0.8 * b };
      default: /* 1・3: ブラーで登場 */
        return {
          opacity: 0.8 * b,
          filter: `blur(${(1 - b) * 12}px)`,
          transform: `translateY(${(1 - b) * 20}px)`,
        };
    }
  };

  const lineStyle = (globalLine: number, blockIdx: number): React.CSSProperties => {
    const unit = 1 + globalLine;
    switch (M.pattern) {
      case 2: {
        /* 浮かび上がり：全文うっすら置いてあり、読む順に濃くなる */
        const b = seg(p, bandAt(unit), bandSpan * 1.6);
        return { opacity: minOp + (1 - minOp) * b };
      }
      case 3: {
        /* 行ごとに流れ込む */
        const b = seg(p, bandAt(unit), bandSpan * 1.3);
        return {
          opacity: b,
          filter: `blur(${(1 - b) * 8}px)`,
          transform: `translateY(${(1 - b) * 26}px)`,
        };
      }
      case 4: {
        /* なぞり読み：行の中を左→右に文字が光る */
        const b = seg(p, bandAt(unit), bandSpan * 1.5);
        const x = Math.round(b * 100);
        return {
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) ${Math.max(0, x - 6)}%, rgba(255,255,255,${minOp}) ${Math.min(100, x + 6)}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        };
      }
      case 5: {
        /* ひと場面ずつ：段落が入れ替わりで出る（下のブロック側で制御） */
        return {};
      }
      default: {
        /* 案1: 段落ごとにブラー出現（段落内は同時） */
        const firstUnit = 1 + BLOCKS.slice(0, blockIdx).flat().length;
        const b = seg(p, bandAt(firstUnit), bandSpan * 1.8);
        return {
          opacity: b,
          filter: `blur(${(1 - b) * 10}px)`,
          transform: `translateY(${(1 - b) * 18}px)`,
        };
      }
    }
  };

  /* 案5：いま見せる段落番号。0=見出しだけ、1〜=その段落（1つずつ入れ替わり） */
  const sceneSpan = 0.88 / (BLOCKS.length + 1);
  const scene = Math.max(
    0,
    Math.min(BLOCKS.length, Math.floor(Math.min(p, 0.879) / sceneSpan))
  );
  const sceneProgress = seg(p, sceneSpan * scene, sceneSpan * 0.35);

  let lineNo = -1;
  return (
    <div className="pointer-events-none sticky top-0 -mt-[982px] h-[982px]">
      <div
        className="absolute left-[140px] top-[172px] w-[720px] text-white"
        style={{ opacity: shellOpacity, filter: `blur(${shellBlur}px)` }}
      >
        <p
          className="font-thin leading-none text-[90px] whitespace-nowrap"
          style={titleStyle()}
        >
          {TITLE}
        </p>
        {M.pattern === 5 ? (
          /* 案5：見出しの下の同じ場所で、段落が1つずつ入れ替わる */
          <div className="relative mt-[120px] h-[240px]">
            {BLOCKS.map((lines, bi) =>
              bi + 1 === scene ? (
                <div
                  key={bi}
                  className="absolute inset-x-0 top-0 font-light text-[20px] leading-[2] tracking-[0.4px]"
                  style={{
                    opacity: sceneProgress,
                    filter: `blur(${(1 - sceneProgress) * 10}px)`,
                  }}
                >
                  {lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="mt-[120px] font-light text-[20px] leading-[2] tracking-[0.4px]">
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
        )}
      </div>
    </div>
  );
}
