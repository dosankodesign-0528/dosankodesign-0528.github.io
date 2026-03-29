'use client';

import { Spot, SPOT_CONFIG, TRANSPORT_LABELS } from '../lib/types';

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
  return (
    <div className="relative pb-8">
      {/* Vertical timeline line */}
      <div
        className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-gray-200"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2">
        {spots.map((spot, index) => {
          const config = SPOT_CONFIG[spot.type];
          const isSelected = selectedSpotId === spot.id;
          const isMain = spot.isMain;

          return (
            <div
              key={spot.id}
              className="relative flex items-start gap-3"
            >
              {/* Timeline dot */}
              <div
                className="relative z-10 flex-shrink-0 flex items-center justify-center mt-4"
                style={{ width: 46, minHeight: 44 }}
              >
                <div
                  className={`rounded-full border-2 border-white shadow-sm ${
                    isMain ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
                  }`}
                  style={{ backgroundColor: config.color }}
                />
              </div>

              {/* Card */}
              <button
                type="button"
                onClick={() => onSpotSelect(spot.id)}
                className={`
                  flex-1 min-h-[44px] text-left rounded-2xl transition-all duration-200 ease-in-out
                  ${isMain
                    ? 'bg-white shadow-sm border border-gray-100 p-4'
                    : 'bg-gray-50/80 p-3 ml-2'
                  }
                  ${isSelected
                    ? 'ring-2 ring-blue-400/40 bg-blue-50/30 shadow-md'
                    : 'hover:shadow-sm active:scale-[0.98]'
                  }
                `}
                style={{
                  borderLeftWidth: isMain ? 4 : 0,
                  borderLeftColor: isMain ? config.color : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    {/* Time row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-bold tracking-tight text-gray-900 ${
                          isMain ? 'text-[20px]' : 'text-[16px]'
                        }`}
                      >
                        {spot.time}
                      </span>
                      {spot.endTime && (
                        <span className="text-[14px] text-gray-400">
                          ~ {spot.endTime}
                        </span>
                      )}
                    </div>

                    {/* Name row */}
                    <div className="flex items-center gap-1.5">
                      <span className={`${isMain ? 'text-[18px]' : 'text-[15px]'}`}>
                        {config.icon}
                      </span>
                      <span
                        className={`truncate ${
                          isMain
                            ? 'text-[17px] font-semibold text-gray-900'
                            : 'text-[15px] font-medium text-gray-700'
                        }`}
                      >
                        {spot.name}
                      </span>
                    </div>

                    {/* Transport badge */}
                    {spot.transport && (
                      <div className="mt-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                                     text-[13px] font-medium bg-gray-100 text-gray-600"
                        >
                          {TRANSPORT_LABELS[spot.transport]}
                        </span>
                      </div>
                    )}

                    {/* Memo */}
                    {spot.memo && (
                      <p
                        className={`mt-1.5 text-gray-500 leading-snug ${
                          isMain ? 'text-[15px]' : 'text-[14px]'
                        }`}
                      >
                        {spot.memo}
                      </p>
                    )}
                  </div>

                  {/* Action buttons (edit / delete) */}
                  {!readOnly && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSpotEdit(spot.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            onSpotEdit(spot.id);
                          }
                        }}
                        className="flex items-center justify-center w-[44px] h-[44px]
                                   rounded-xl text-gray-400 hover:text-blue-500
                                   hover:bg-blue-50 active:bg-blue-100
                                   transition-colors duration-150 cursor-pointer"
                        aria-label={`${spot.name}を編集`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSpotDelete(spot.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            onSpotDelete(spot.id);
                          }
                        }}
                        className="flex items-center justify-center w-[44px] h-[44px]
                                   rounded-xl text-gray-400 hover:text-red-500
                                   hover:bg-red-50 active:bg-red-100
                                   transition-colors duration-150 cursor-pointer"
                        aria-label={`${spot.name}を削除`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {spots.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-[16px]">
          スポットがまだありません
        </div>
      )}
    </div>
  );
}
