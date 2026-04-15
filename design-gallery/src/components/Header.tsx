"use client";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  columns: number;
  onColumnsChange: (cols: number) => void;
  totalCount: number;
  filteredCount: number;
}

export function Header({
  search,
  onSearchChange,
  columns,
  onColumnsChange,
  totalCount,
  filteredCount,
}: HeaderProps) {
  return (
    <header className="h-[56px] bg-bg-secondary border-b border-border flex items-center px-5 gap-4 shrink-0 z-30">
      {/* ロゴ */}
      <h1 className="text-[15px] font-bold tracking-tight whitespace-nowrap text-text-primary">
        Design Gallery
      </h1>

      {/* 検索 */}
      <div className="relative flex-1 max-w-[400px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="サイト名、URL、エージェンシーで検索..."
          className="w-full h-8 pl-9 pr-3 text-[13px] bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {/* スペーサー */}
      <div className="flex-1" />

      {/* 件数 */}
      <span className="text-[12px] text-text-secondary whitespace-nowrap">
        {filteredCount === totalCount
          ? `${totalCount} sites`
          : `${filteredCount} / ${totalCount} sites`}
      </span>

      {/* 列数スライダー */}
      <div className="flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-text-secondary"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="1" y="1" width="3" height="3" rx="0.5" />
          <rect x="6" y="1" width="3" height="3" rx="0.5" />
          <rect x="11" y="1" width="3" height="3" rx="0.5" />
          <rect x="1" y="6" width="3" height="3" rx="0.5" />
          <rect x="6" y="6" width="3" height="3" rx="0.5" />
          <rect x="11" y="6" width="3" height="3" rx="0.5" />
        </svg>
        <input
          type="range"
          min={2}
          max={8}
          value={columns}
          onChange={(e) => onColumnsChange(Number(e.target.value))}
          className="w-[80px] accent-accent"
          title={`${columns}列`}
        />
        <svg
          className="w-3 h-3 text-text-secondary"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="1" y="1" width="6" height="6" rx="0.5" />
          <rect x="9" y="1" width="6" height="6" rx="0.5" />
          <rect x="1" y="9" width="6" height="6" rx="0.5" />
          <rect x="9" y="9" width="6" height="6" rx="0.5" />
        </svg>
      </div>
    </header>
  );
}
