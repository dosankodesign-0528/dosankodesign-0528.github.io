'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import { Spot, Day, getSpotConfig, TRANSPORT_LABELS, ASSIGNEE_CONFIG, AssigneeType } from '../lib/types';
import { cn } from '../lib/utils';

/** スポットの「有効なassignee」を返す（未設定='all'扱い） */
function getEffectiveAssignee(spot: Spot): AssigneeType {
  return spot.assignee && spot.assignee !== 'all' ? spot.assignee : 'all';
}

/** Day セクション情報 */
export interface DaySection {
  day: Day;
  dayIdx: number;
  dateLabel: string;    // "5/28(木)"
  headline: string;     // "女満別/旭川→東京 大誓堂・屋形船"
  spots: Spot[];        // フィルタ済みのスポット
}

interface TimelineProps {
  /** Day セクション単位のデータ（All表示用） */
  daySections: DaySection[];
  selectedSpotId: string | null;
  onSpotSelect: (id: string) => void;
  onSpotEdit: (id: string) => void;
  onSpotDelete: (id: string) => void;
  onAdd?: () => void;
  readOnly: boolean;
}

export default function Timeline({
  daySections,
  selectedSpotId,
  onSpotSelect,
  onSpotDelete,
  onAdd,
  readOnly,
}: TimelineProps) {
  const totalSpots = daySections.reduce((sum, s) => sum + s.spots.length, 0);

  if (totalSpots === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex flex-col items-center justify-center py-20 text-gray-400 active:bg-gray-50 transition-colors rounded-2xl cursor-pointer"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">📍</span>
        </div>
        <p className="text-[15px] font-medium text-gray-500">スポットがまだありません</p>
        <p className="text-[13px] mt-1 text-gray-400">タップしてスポットを追加</p>
      </button>
    );
  }

  // Day ごとの色テーマ
  const dayColors = [
    { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
    { bg: 'bg-amber-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  ];

  return (
    <div className="px-3 pt-1">
      {daySections.map((section, sectionIdx) => {
        const { day, spots } = section;
        if (spots.length === 0) return null;
        const color = dayColors[section.dayIdx % dayColors.length];

        // 人物グループ切り替え計算
        const assigneeChangeIndices = new Set<number>();
        for (let i = 0; i < spots.length; i++) {
          const curr = getEffectiveAssignee(spots[i]);
          const prev = i > 0 ? getEffectiveAssignee(spots[i - 1]) : 'all';
          if (curr !== 'all' && curr !== prev) assigneeChangeIndices.add(i);
          if (curr === 'all' && prev !== 'all') assigneeChangeIndices.add(i);
        }

        return (
          <div key={day.id} data-day-idx={section.dayIdx}>
            {/* Day 間の区切りスペース（最初のセクション以外） */}
            {sectionIdx > 0 && (
              <div className="py-4 -mx-3 px-3">
                <div className="h-[3px] bg-gray-100 rounded-full" />
              </div>
            )}

            {/* Day セクションヘッダー */}
            <div className="sticky top-0 z-10 -mx-3 px-4 pt-3 pb-2" style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 70%, rgba(255,255,255,0.85))',
              backdropFilter: 'blur(8px)',
            }}>
              <div className="flex items-baseline gap-2">
                <span className={cn('font-black', color.text)}>
                  <span className="text-[28px] tracking-tighter" style={{ fontWeight: 900 }}>{day.dayNum}</span>
                  <span className="text-[18px] tracking-tight ml-[1px]">日目</span>
                </span>
                <span className="text-[15px] font-semibold text-gray-500">
                  {section.dateLabel}
                </span>
              </div>
              {section.headline && (
                <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">
                  {section.headline}
                </p>
              )}
            </div>

            {/* スポット一覧 */}
            <div className="flex flex-col gap-1.5 pt-2">
              {spots.map((spot, spotIdx) => {
                const effectiveAssignee = getEffectiveAssignee(spot);
                const showGroupHeader = assigneeChangeIndices.has(spotIdx);

                return (
                  <div key={spot.id}>
                    {showGroupHeader && (
                      <AssigneeGroupHeader assignee={effectiveAssignee} />
                    )}
                    <SpotCard
                      spot={spot}
                      isSelected={selectedSpotId === spot.id}
                      readOnly={readOnly}
                      onSelect={() => onSpotSelect(spot.id)}
                      onDelete={() => onSpotDelete(spot.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 1スポットのカード表示 */
function SpotCard({
  spot,
  isSelected,
  readOnly,
  onSelect,
  onDelete,
}: {
  spot: Spot;
  isSelected: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const config = getSpotConfig(spot.type);
  const isTransit = spot.type === 'transit';

  if (isTransit) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full text-left rounded-xl py-2.5 px-3 ml-3 transition-all duration-150 active:scale-[0.98]',
          'bg-transparent',
          isSelected && 'bg-blue-50/50',
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5 text-gray-300">
            <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
            <span className="text-[13px]">{config?.icon ?? '📌'}</span>
            <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] tabular-nums text-gray-500 font-medium">
                {spot.time}
              </span>
              {spot.endTime && (
                <span className="text-[13px] text-gray-400">– {spot.endTime}</span>
              )}
              {spot.transport && TRANSPORT_LABELS[spot.transport] && (
                <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {TRANSPORT_LABELS[spot.transport]}
                </span>
              )}
              {spot.assignee && spot.assignee !== 'all' && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">
                  {ASSIGNEE_CONFIG[spot.assignee]?.icon} {ASSIGNEE_CONFIG[spot.assignee]?.label}
                </span>
              )}
            </div>
            <span className="text-[14px] text-gray-600 truncate block">
              {spot.name}
            </span>
          </div>
          {!readOnly && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </button>
    );
  }

  const cfgColor = config?.color ?? '#70757A';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.98]',
        'bg-white shadow-sm ring-1 ring-black/[0.04] p-3.5',
        isSelected && 'ring-2 ring-blue-500/30 shadow-md',
      )}
      style={{ borderLeft: `3px solid ${cfgColor}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[22px] font-bold tabular-nums tracking-tight text-gray-900">
          {spot.time}
        </span>
        {spot.endTime && (
          <span className="text-[14px] text-gray-400 font-medium">
            – {spot.endTime}
          </span>
        )}
        {spot.assignee && spot.assignee !== 'all' && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">
            {ASSIGNEE_CONFIG[spot.assignee]?.icon} {ASSIGNEE_CONFIG[spot.assignee]?.label}
          </span>
        )}
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium ml-auto"
          style={{
            backgroundColor: cfgColor + '15',
            color: cfgColor,
          }}
        >
          {config?.label ?? 'その他'}
        </span>
        {!readOnly && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="pc-delete-btn w-7 h-7 rounded-full items-center justify-center hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[16px]">{config?.icon ?? '📌'}</span>
        <span className="text-[17px] font-semibold text-gray-900 truncate flex-1">
          {spot.name}
        </span>
      </div>
      {spot.memo && (
        <p className="text-[13px] text-gray-400 truncate mt-1 ml-7">{spot.memo}</p>
      )}
    </button>
  );
}

/** 人物グループの区切りヘッダー */
function AssigneeGroupHeader({ assignee }: { assignee: AssigneeType }) {
  if (assignee === 'all') {
    return (
      <div className="flex items-center gap-2 py-2 mt-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[12px] text-gray-400 font-medium px-2">
          👨‍👩‍👦 みんな合流
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }

  const config = ASSIGNEE_CONFIG[assignee];
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    parents: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    son: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };
  const c = colors[assignee] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

  return (
    <div className="flex items-center gap-2 py-2 mt-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className={cn(
        'text-[12px] font-semibold px-3 py-1 rounded-full border',
        c.bg, c.text, c.border,
      )}>
        {config?.icon} {config?.label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
