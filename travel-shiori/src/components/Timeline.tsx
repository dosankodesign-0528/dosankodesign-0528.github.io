'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import { Spot, getSpotConfig, TRANSPORT_LABELS, ASSIGNEE_CONFIG, AssigneeType } from '../lib/types';
import { cn } from '../lib/utils';

/** スポットの「有効なassignee」を返す（未設定='all'扱い） */
function getEffectiveAssignee(spot: Spot): AssigneeType {
  return spot.assignee && spot.assignee !== 'all' ? spot.assignee : 'all';
}

interface TimelineProps {
  spots: Spot[];
  selectedSpotId: string | null;
  onSpotSelect: (id: string) => void;
  onSpotEdit: (id: string) => void;
  onSpotDelete: (id: string) => void;
  onAdd?: () => void;
  readOnly: boolean;
  /** spotId → "Day1 4/10(金)" のようなラベル */
  spotDateMap?: Record<string, string>;
}

export default function Timeline({
  spots,
  selectedSpotId,
  onSpotSelect,
  onSpotDelete,
  onAdd,
  readOnly,
  spotDateMap,
}: TimelineProps) {
  if (spots.length === 0) {
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

  // 人物グループが切り替わるインデックスを計算
  const assigneeChangeIndices = new Set<number>();
  for (let i = 0; i < spots.length; i++) {
    const curr = getEffectiveAssignee(spots[i]);
    const prev = i > 0 ? getEffectiveAssignee(spots[i - 1]) : 'all';
    // all → 個人、または異なる個人への切り替え時にヘッダーを出す
    if (curr !== 'all' && curr !== prev) {
      assigneeChangeIndices.add(i);
    }
    // 個人 → all に戻る時も区切りを出す
    if (curr === 'all' && prev !== 'all') {
      assigneeChangeIndices.add(i);
    }
  }

  return (
    <div className="px-3 pt-3">
      <div className="flex flex-col gap-1.5">
        {spots.map((spot, spotIdx) => {
          const config = getSpotConfig(spot.type);
          const isSelected = selectedSpotId === spot.id;
          const isTransit = spot.type === 'transit';
          const dateLabel = spotDateMap?.[spot.id];
          const effectiveAssignee = getEffectiveAssignee(spot);
          const showGroupHeader = assigneeChangeIndices.has(spotIdx);

          // 移動・経由はインデント＋コンパクト表示
          if (isTransit) {
            const transitCard = (
              <button
                type="button"
                onClick={() => onSpotSelect(spot.id)}
                className={cn(
                  'w-full text-left rounded-xl py-2.5 px-3 ml-3 transition-all duration-150 active:scale-[0.98]',
                  'bg-transparent',
                  isSelected && 'bg-blue-50/50',
                )}
              >
                <div className="flex items-center gap-2">
                  {/* 移動線アイコン */}
                  <div className="flex flex-col items-center gap-0.5 text-gray-300">
                    <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
                    <span className="text-[13px]">{config?.icon ?? '📌'}</span>
                    <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {dateLabel && (
                        <span className="text-[11px] text-gray-400 font-medium">{dateLabel}</span>
                      )}
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
            return (
              <div key={spot.id}>
                {showGroupHeader && (
                  <AssigneeGroupHeader assignee={effectiveAssignee} />
                )}
                {transitCard}
              </div>
            );
          }

          // 目的地・ホテル・食事などのメインカード
          const cfgColor = config?.color ?? '#70757A';
          const mainCard = (
            <button
              type="button"
              onClick={() => onSpotSelect(spot.id)}
              className={cn(
                'w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.98]',
                'bg-white shadow-sm ring-1 ring-black/[0.04] p-3.5',
                isSelected && 'ring-2 ring-blue-500/30 shadow-md',
              )}
              style={{ borderLeft: `3px solid ${cfgColor}` }}
            >
              {/* 日付ラベル */}
              {dateLabel && (
                <div className="text-[11px] text-gray-400 font-medium mb-1">{dateLabel}</div>
              )}
              {/* 上段: 時刻 */}
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
                      onClick={(e) => { e.stopPropagation(); onSpotDelete(spot.id); }}
                      className="pc-delete-btn w-7 h-7 rounded-full items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 下段: スポット名 */}
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
          return (
            <div key={spot.id}>
              {showGroupHeader && (
                <AssigneeGroupHeader assignee={effectiveAssignee} />
              )}
              {mainCard}
            </div>
          );
        })}
      </div>
    </div>
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
