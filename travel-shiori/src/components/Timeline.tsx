'use client';

import { ChevronRight } from 'lucide-react';
import { Spot, SPOT_CONFIG, TRANSPORT_LABELS } from '../lib/types';
import { cn } from '../lib/utils';

interface TimelineProps {
  spots: Spot[];
  selectedSpotId: string | null;
  onSpotSelect: (id: string) => void;
  onSpotEdit: (id: string) => void;
  onSpotDelete: (id: string) => void;
  readOnly: boolean;
}

export default function Timeline({
  spots,
  selectedSpotId,
  onSpotSelect,
  onSpotEdit,
  onSpotDelete,
  readOnly,
}: TimelineProps) {
  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-4xl mb-3">📍</div>
        <p className="text-[15px]">スポットがまだありません</p>
        <p className="text-[13px] mt-1">右下の＋ボタンで追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="relative px-3 pt-3">
      {/* タイムライン縦線 */}
      <div className="absolute left-[22px] top-6 bottom-6 w-[1.5px] bg-gray-200" aria-hidden="true" />

      <div className="flex flex-col gap-1.5">
        {spots.map((spot) => {
          const config = SPOT_CONFIG[spot.type];
          const isSelected = selectedSpotId === spot.id;
          const isMain = spot.isMain;

          return (
            <div key={spot.id} className="relative flex items-start gap-2.5">
              {/* タイムラインドット */}
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center mt-3.5" style={{ width: 40 }}>
                <div
                  className={cn(
                    'rounded-full border-2 border-white shadow-sm',
                    isMain ? 'w-3 h-3' : 'w-2 h-2'
                  )}
                  style={{ backgroundColor: config.color }}
                />
              </div>

              {/* カード本体（全体がタップ可能） */}
              <button
                type="button"
                onClick={() => onSpotSelect(spot.id)}
                className={cn(
                  'flex-1 min-w-0 text-left rounded-xl transition-all duration-150 active:scale-[0.98]',
                  isMain
                    ? 'bg-white shadow-sm ring-1 ring-gray-100 p-3'
                    : 'bg-gray-50/80 p-2.5',
                  isSelected && 'ring-2 ring-blue-400/40 bg-blue-50/20 shadow-md',
                )}
                style={isMain ? { borderLeft: `3px solid ${config.color}` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* 時刻 */}
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        'font-bold tabular-nums text-gray-900',
                        isMain ? 'text-[17px]' : 'text-[14px]'
                      )}>
                        {spot.time}
                      </span>
                      {spot.endTime && (
                        <span className="text-[12px] text-gray-400">〜 {spot.endTime}</span>
                      )}
                      {spot.transport && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                          {TRANSPORT_LABELS[spot.transport]}
                        </span>
                      )}
                    </div>

                    {/* スポット名 */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={isMain ? 'text-[15px]' : 'text-[13px]'}>{config.icon}</span>
                      <span className={cn(
                        'truncate',
                        isMain ? 'text-[15px] font-semibold text-gray-900' : 'text-[14px] text-gray-700'
                      )}>
                        {spot.name}
                      </span>
                    </div>

                    {/* メモ */}
                    {spot.memo && (
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">{spot.memo}</p>
                    )}
                  </div>

                  {/* 右矢印（タップで編集画面へ入れることを示す） */}
                  {!readOnly && (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
