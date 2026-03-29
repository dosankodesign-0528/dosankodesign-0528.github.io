'use client';

/**
 * 共有閲覧画面
 * URLを受け取った人（両親など）がログイン不要で旅行プランを見られる画面。
 * 編集機能は一切なし、閲覧のみ。
 */

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { Trip, Spot } from '../../../lib/types';
import { getTripByShareId } from '../../../lib/storage';
import Timeline from '../../../components/Timeline';

const MapView = dynamic(() => import('../../../components/MapView'), { ssr: false });

function formatShortDate(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

export default function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    const t = getTripByShareId(shareId);
    if (t) {
      setTrip(t);
    } else {
      setNotFound(true);
    }
  }, [shareId]);

  const displaySpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap(d => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  if (notFound) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-[20px] font-bold mb-2">プランが見つかりません</h1>
        <p className="text-[15px] text-[var(--color-subtext)]">
          このURLの旅行プランは存在しないか、削除された可能性があります。
        </p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-subtext)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">
      {/* ナビゲーションバー */}
      <header className="ios-nav sticky top-0 z-50 px-4 h-[56px] flex items-center justify-center">
        <h1 className="text-[17px] font-semibold">{trip.title}</h1>
      </header>

      {/* 日程情報 */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 pt-2">
          <p className="text-[13px] text-[var(--color-subtext)]">
            {formatShortDate(trip.startDate, 0)} 〜 {formatShortDate(trip.endDate, 0)} · {trip.days.length}日間
          </p>
          <div className="flex bg-[var(--color-bg)] rounded-lg p-0.5 text-[13px]">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'map' ? 'bg-white font-semibold shadow-sm' : 'text-[var(--color-subtext)]'}`}
            >
              🗺️ 地図
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white font-semibold shadow-sm' : 'text-[var(--color-subtext)]'}`}
            >
              📋 リスト
            </button>
          </div>
        </div>

        {/* Day切り替えタブ */}
        <div className="flex overflow-x-auto no-scrollbar px-2 pb-1 pt-2 gap-1">
          <button
            onClick={() => setSelectedDayIdx(0)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[72px] transition-all ${
              selectedDayIdx === 0 ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-subtext)]'
            }`}
          >
            <div className="text-[13px] font-bold">全日程</div>
          </button>
          {trip.days.map((day, idx) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIdx(idx + 1)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[72px] transition-all ${
                selectedDayIdx === idx + 1 ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-subtext)]'
              }`}
            >
              <div className="text-[13px] font-bold">Day {day.dayNum}</div>
              <div className={`text-[11px] ${selectedDayIdx === idx + 1 ? 'text-white/80' : ''}`}>
                {formatShortDate(trip.startDate, idx)}
              </div>
              {day.headline && (
                <div className={`text-[10px] truncate max-w-[60px] ${selectedDayIdx === idx + 1 ? 'text-white/70' : 'text-[var(--color-subtext)]'}`}>
                  {day.headline}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'map' && (
          <div className="h-[40vh] min-h-[200px] flex-shrink-0">
            <MapView spots={displaySpots} selectedSpotId={selectedSpotId} onSpotSelect={setSelectedSpotId} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto pb-8">
          <Timeline
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={setSelectedSpotId}
            onSpotEdit={() => {}}
            onSpotDelete={() => {}}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
