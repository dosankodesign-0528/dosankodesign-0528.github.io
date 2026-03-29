'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import { Spot, getSpotConfig, TRANSPORT_LABELS } from '../lib/types';
import { cn } from '../lib/utils';

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

  return (
    <div className="px-3 pt-3">
      <div className="flex flex-col gap-1.5">
        {spots.map((spot) => {
          const config = getSpotConfig(spot.type);
          const isSelected = selectedSpotId === spot.id;
          const isTransit = spot.type === 'transit';
          const dateLabel = spotDateMap?.[spot.id];

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
            return <div key={spot.id}>{transitCard}</div>;
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
          return <div key={spot.id}>{mainCard}</div>;
        })}
      </div>
    </div>
  );
}
