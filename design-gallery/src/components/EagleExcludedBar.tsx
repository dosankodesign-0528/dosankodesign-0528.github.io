"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eagle重複を扱うセカンダリバー。
 *
 * - ヘッダーのすぐ下、FilterBar の上に配置する。
 * - `visible=false` でも DOM は残して、max-height と opacity でスッと出入りさせる。
 * - 直近の excludedCount をキャッシュしておき、退場中に「0件」に切り替わらないようにする。
 * - `hideEagleDuplicates` で「非表示中」「表示中」の文言とトグルボタンを切り替える。
 */

interface EagleExcludedBarProps {
  /** Eagle 重複で「非表示 or 表示」の対象になっている件数 */
  excludedCount: number;
  /** バーの「一覧を見る」クリック時に呼ぶ（現在の非表示一覧モーダルを開く） */
  onOpenExcluded: () => void;
  /** 表示状態。false なら max-height=0 + opacity=0 に遷移 */
  visible: boolean;
  /** true なら Eagle 重複を非表示中、false なら表示中 */
  hideEagleDuplicates: boolean;
  /** ON/OFF トグル */
  onToggleHide: () => void;
}

export function EagleExcludedBar({
  excludedCount,
  onOpenExcluded,
  visible,
  hideEagleDuplicates,
  onToggleHide,
}: EagleExcludedBarProps) {
  // 退場アニメ中は直前の件数を残しておく（0件表示にならないように）
  const lastCountRef = useRef(excludedCount);
  if (excludedCount > 0) lastCountRef.current = excludedCount;
  const displayCount = excludedCount > 0 ? excludedCount : lastCountRef.current;

  // 初回マウント直後は transition を無効化して「ポッ」と出るのを避ける
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`shrink-0 overflow-hidden ${
        mounted ? "transition-[max-height,opacity] duration-300 ease-out" : ""
      } ${visible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}
    >
      <div
        className={`h-10 flex items-center px-5 gap-3 bg-accent/5 border-b border-accent/20 text-[12px] transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "-translate-y-1"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 text-accent shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
        <span className="text-accent font-medium tabular-nums">
          Eagle重複{" "}
          <span className="font-bold">{displayCount.toLocaleString()}</span>{" "}
          件を{hideEagleDuplicates ? "非表示中" : "表示中"}
        </span>

        {/* ON/OFF トグル */}
        <button
          onClick={onToggleHide}
          tabIndex={visible ? 0 : -1}
          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
          title={
            hideEagleDuplicates
              ? "Eagle 重複も表示する"
              : "Eagle 重複を非表示にする"
          }
        >
          <span
            className={`w-6 h-3 rounded-full relative transition-colors ${
              hideEagleDuplicates ? "bg-accent" : "bg-accent/30"
            }`}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                hideEagleDuplicates ? "left-0.5" : "left-[calc(100%-0.625rem-0.125rem)]"
              }`}
            />
          </span>
          <span className="text-[11px] font-medium">
            {hideEagleDuplicates ? "隠す" : "表示"}
          </span>
        </button>

        <button
          onClick={onOpenExcluded}
          tabIndex={visible ? 0 : -1}
          className="text-accent underline underline-offset-2 hover:text-accent/80"
        >
          一覧を見る
        </button>
      </div>
    </div>
  );
}
