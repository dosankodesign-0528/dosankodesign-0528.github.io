'use client';

import { ChevronRight, Trash2 } from 'lucide-react';
import { Spot, Day, getSpotConfig, TRANSPORT_LABELS, ASSIGNEE_CONFIG, AssigneeType, DAY_COLORS, getDayColor } from '../lib/types';
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

  // Day ごとの色テーマ（共通定数から取得）
  const dayColors = DAY_COLORS;

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
                      dayNum={day.dayNum}
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

/** 人物の色テーマ + アバター画像 */
const ASSIGNEE_COLORS: Record<string, { bg: string; ring: string; iconBg: string; text: string; avatar: string }> = {
  parents: { bg: 'bg-orange-50', ring: 'ring-orange-200', iconBg: 'bg-orange-100', text: 'text-orange-700', avatar: '/avatar-parents-sm.jpg' },
  son:     { bg: 'bg-green-50',  ring: 'ring-green-200',  iconBg: 'bg-green-100',  text: 'text-green-700',  avatar: '/avatar-son-sm.jpg' },
};

/** ミニピンアイコン（マップピンと同じデザインの小型版） */
function MiniPinIcon({ dayNum, size = 28 }: { dayNum: number; size?: number }) {
  const color = getDayColor(dayNum);
  const svgH = Math.round(size * 1.3);
  return (
    <svg width={size} height={svgH} viewBox="0 0 32 42" fill="none" className="flex-shrink-0">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
            fill={color.hex} />
      <circle cx="16" cy="15" r="9" fill="white" opacity="0.95"/>
      <text x="16" y="19" textAnchor="middle" fill={color.hex}
            fontSize="14" fontWeight="700">{dayNum}</text>
    </svg>
  );
}

/** 1スポットのカード表示 */
function SpotCard({
  spot,
  dayNum,
  isSelected,
  readOnly,
  onSelect,
  onDelete,
}: {
  spot: Spot;
  dayNum: number;
  isSelected: boolean;
  readOnly: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const config = getSpotConfig(spot.type);
  const isTransit = spot.type === 'transit';
  const assignee = spot.assignee && spot.assignee !== 'all' ? spot.assignee : null;
  const aColor = assignee ? ASSIGNEE_COLORS[assignee] : null;
  const dayColor = getDayColor(dayNum);

  if (isTransit) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full text-left rounded-xl py-2.5 px-3 transition-all duration-150 active:scale-[0.98]',
          assignee ? cn(aColor!.bg, 'ring-1', aColor!.ring) : 'bg-transparent ml-3',
          isSelected && 'bg-blue-50/50',
        )}
      >
        <div className="flex items-center gap-2">
          {/* 人物アイコン（assigneeあり） or 移動線アイコン */}
          {assignee ? (
            <img
              src={aColor!.avatar}
              alt={ASSIGNEE_CONFIG[assignee]?.label}
              className={cn(
                'w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2',
                aColor!.ring,
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-0.5 text-gray-300">
              <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
              <span className="text-[13px]">{config?.icon ?? '📌'}</span>
              <div className="w-0.5 h-2 bg-gray-200 rounded-full" />
            </div>
          )}
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
              {assignee && (
                <span className={cn('text-[11px] font-semibold', aColor!.text)}>
                  {ASSIGNEE_CONFIG[assignee]?.label}
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-2xl transition-all duration-150 active:scale-[0.98]',
        'shadow-sm p-3.5',
        assignee
          ? cn(aColor!.bg, 'ring-1', aColor!.ring)
          : 'bg-white ring-1 ring-black/[0.04]',
        isSelected && 'ring-2 ring-blue-500/30 shadow-md',
      )}
      style={{ borderLeft: `3px solid ${dayColor.hex}` }}
    >
      <div className="flex items-center gap-3">
        {/* 左: アバター（assigneeあり時） */}
        {assignee && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <img
              src={aColor!.avatar}
              alt={ASSIGNEE_CONFIG[assignee]?.label}
              className={cn(
                'w-14 h-14 rounded-full object-cover ring-2',
                aColor!.ring,
              )}
            />
            <span className={cn('text-[11px] font-bold', aColor!.text)}>
              {ASSIGNEE_CONFIG[assignee]?.label}
            </span>
          </div>
        )}

        {/* ピンアイコン */}
        <MiniPinIcon dayNum={dayNum} size={28} />

        {/* メイン: 目的地名（主役）+ 時刻（脇役） */}
        <div className="flex-1 min-w-0">
          <span className="text-[18px] font-bold text-gray-900 truncate block leading-tight">
            {spot.name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[14px] tabular-nums text-gray-400 font-medium">
              {spot.time}
            </span>
            {spot.endTime && (
              <span className="text-[13px] text-gray-400">– {spot.endTime}</span>
            )}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: dayColor.hex + '15',
                color: dayColor.hex,
              }}
            >
              {config?.label ?? 'その他'}
            </span>
          </div>
        </div>

        {/* 右: 操作 */}
        {!readOnly && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="pc-delete-btn w-6 h-6 rounded-full items-center justify-center hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        )}
      </div>

      {/* メモ（あれば別枠で表示） */}
      {spot.memo && (
        <div className="mt-2 ml-11 px-2.5 py-1.5 bg-gray-50 rounded-lg">
          <p className="text-[11px] text-gray-400 leading-relaxed">{spot.memo}</p>
        </div>
      )}
    </button>
  );
}

/** 人物グループの区切りヘッダー */
function AssigneeGroupHeader({ assignee }: { assignee: AssigneeType }) {
  if (assignee === 'all') {
    return (
      <div className="flex items-center gap-3 py-3 mt-3">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
          <span className="text-[18px]">👨‍👩‍👦</span>
          <span className="text-[13px] text-gray-500 font-semibold">みんな合流</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }

  const config = ASSIGNEE_CONFIG[assignee];
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    parents: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    son:     { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
  };
  const c = colors[assignee] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  const avatarSrc = ASSIGNEE_COLORS[assignee]?.avatar;

  return (
    <div className="flex items-center gap-3 py-3 mt-3">
      <div className="flex-1 h-px bg-gray-200" />
      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border', c.bg, c.border)}>
        {avatarSrc && (
          <img src={avatarSrc} alt="" className="w-6 h-6 rounded-full object-cover" />
        )}
        <span className={cn('text-[13px] font-bold', c.text)}>
          {config?.label}だけ
        </span>
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
