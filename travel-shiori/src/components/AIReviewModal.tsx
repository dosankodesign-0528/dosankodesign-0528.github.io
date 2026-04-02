'use client';

import { useState, useEffect } from 'react';
import { ReviewSuggestion } from '../lib/trip-review';
import { getDayColor, SPOT_CONFIG } from '../lib/types';
import { cn } from '../lib/utils';

/** 提案タイプごとのアイコンとラベル */
const SUGGESTION_META: Record<string, { icon: string; label: string }> = {
  missing_transport: { icon: '🚃', label: '移動' },
  missing_time:      { icon: '⏰', label: '時刻' },
  missing_hotel:     { icon: '🏨', label: '宿泊' },
  missing_meal:      { icon: '🍽️', label: '食事' },
  missing_headline:  { icon: '📝', label: 'タイトル' },
  long_gap:          { icon: '⏳', label: '空き時間' },
};

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: ReviewSuggestion[];
  loading: boolean;
  onApply: (selected: ReviewSuggestion[]) => void;
}

export default function AIReviewModal({
  isOpen,
  onClose,
  suggestions,
  loading,
  onApply,
}: AIReviewModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 全選択のデフォルト
  useEffect(() => {
    if (suggestions.length > 0) {
      setSelected(new Set(suggestions.map(s => s.id)));
    }
  }, [suggestions]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    const sel = suggestions.filter(s => selected.has(s.id));
    onApply(sel);
  };

  // Day ごとにグループ化
  const grouped = suggestions.reduce<Record<number, ReviewSuggestion[]>>((acc, s) => {
    (acc[s.dayNum] = acc[s.dayNum] || []).push(s);
    return acc;
  }, {});

  const warningCount = suggestions.filter(s => s.severity === 'warning').length;
  const infoCount = suggestions.filter(s => s.severity === 'info').length;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl modal-sheet pb-8 max-h-[85vh] flex flex-col">
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3c3c43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="text-center">
            <span className="text-[16px] font-bold">AIレビュー</span>
            {!loading && suggestions.length > 0 && (
              <p className="text-[12px] text-gray-400 mt-0.5">
                {warningCount > 0 && <span className="text-orange-500">{warningCount}件の注意</span>}
                {warningCount > 0 && infoCount > 0 && ' · '}
                {infoCount > 0 && <span>{infoCount}件の提案</span>}
              </p>
            )}
          </div>
          {!loading && suggestions.length > 0 ? (
            <button
              onClick={handleApply}
              disabled={selected.size === 0}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                selected.size > 0 ? 'bg-blue-500' : 'bg-gray-200'
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selected.size > 0 ? '#fff' : '#999'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <SkeletonLoading />
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-1">完璧な旅程です！</h3>
              <p className="text-[14px] text-gray-400">改善点は見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-5 pb-4">
              {Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([dayNumStr, items]) => {
                  const dayNum = Number(dayNumStr);
                  const color = getDayColor(dayNum);
                  return (
                    <div key={dayNum}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className={cn('text-[15px] font-black', color.text)}>
                          {dayNum}日目
                        </span>
                        <span className="text-[12px] text-gray-400">{items.length}件</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <SuggestionCard
                            key={item.id}
                            item={item}
                            isSelected={selected.has(item.id)}
                            onToggle={() => toggleItem(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 提案カード（破線ボーダー） */
function SuggestionCard({
  item,
  isSelected,
  onToggle,
}: {
  item: ReviewSuggestion;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const meta = SUGGESTION_META[item.type] || { icon: '💡', label: '提案' };
  const isWarning = item.severity === 'warning';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left rounded-xl p-3.5 transition-all duration-150',
        'border-2 border-dashed',
        isSelected
          ? isWarning
            ? 'border-orange-300 bg-orange-50/50'
            : 'border-blue-300 bg-blue-50/50'
          : 'border-gray-200 bg-gray-50/50',
      )}
    >
      <div className="flex items-center gap-3">
        {/* チェック */}
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          isSelected
            ? isWarning ? 'bg-orange-500 border-orange-500' : 'bg-blue-500 border-blue-500'
            : 'border-gray-300'
        )}>
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        {/* アイコン */}
        <span className="text-[20px] flex-shrink-0">{meta.icon}</span>

        {/* テキスト */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-[11px] px-1.5 py-0.5 rounded-full font-medium',
              isWarning ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            )}>
              {isWarning ? '注意' : '提案'}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {meta.label}
            </span>
          </div>
          <p className="text-[14px] text-gray-700 mt-1 leading-snug">{item.message}</p>
        </div>
      </div>
    </button>
  );
}

/** スケルトンローディング */
function SkeletonLoading() {
  return (
    <div className="space-y-5 py-2 animate-pulse">
      {[1, 2, 3].map((dayNum) => (
        <div key={dayNum}>
          <div className="h-5 w-16 bg-gray-200 rounded-md mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl p-3.5 border-2 border-dashed border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-4 w-10 bg-gray-200 rounded-full" />
                      <div className="h-4 w-12 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
