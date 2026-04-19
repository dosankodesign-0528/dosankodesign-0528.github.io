"use client";

/**
 * Eagle重複で非表示中の件数を案内する「セカンダリバー」。
 *
 * - ヘッダーのすぐ下、FilterBar の上に配置する。
 * - Eagle トグルが ON で、かつ除外件数が 1件以上あるときだけ出現。
 * - ヘッダー内は何も動かないので、トグル切替時のレイアウトシフトが起きない。
 */

interface EagleExcludedBarProps {
  /** 現在 Eagle 重複で非表示になっている件数 */
  excludedCount: number;
  /** バー本体（または「一覧を見る」）クリック時に呼ぶ */
  onOpenExcluded: () => void;
}

export function EagleExcludedBar({
  excludedCount,
  onOpenExcluded,
}: EagleExcludedBarProps) {
  if (excludedCount <= 0) return null;

  return (
    <div className="h-10 shrink-0 flex items-center px-5 gap-3 bg-accent/5 border-b border-accent/20 text-[12px]">
      <svg
        className="w-3.5 h-3.5 text-accent"
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
        <span className="font-bold">{excludedCount.toLocaleString()}</span> 件を非表示中
      </span>
      <button
        onClick={onOpenExcluded}
        className="text-accent underline underline-offset-2 hover:text-accent/80"
      >
        一覧を見る
      </button>
    </div>
  );
}
