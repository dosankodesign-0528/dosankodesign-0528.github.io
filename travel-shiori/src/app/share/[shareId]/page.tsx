'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { Map, List } from 'lucide-react';
import { Trip, Spot } from '../../../lib/types';
import { getTripByShareId } from '../../../lib/storage';
import Timeline from '../../../components/Timeline';
import { cn } from '../../../lib/utils';

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
    if (t) setTrip(t);
    else setNotFound(true);
  }, [shareId]);

  const displaySpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap(d => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  if (notFound) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-[18px] font-bold mb-1">プランが見つかりません</h1>
        <p className="text-[14px] text-gray-500">このURLの旅行プランは存在しないか、削除された可能性があります。</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)] overflow-hidden">
      <header className="ios-nav sticky top-0 z-50 px-4 h-[48px] flex items-center justify-center">
        <h1 className="text-[16px] font-semibold">{trip.title}</h1>
      </header>

      {viewMode === 'map' && (
        <div className="h-[35vh] min-h-[180px] flex-shrink-0 relative">
          <MapView spots={displaySpots} selectedSpotId={selectedSpotId} onSpotSelect={setSelectedSpotId} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-t-2xl -mt-3 relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-gray-400">
              {formatShortDate(trip.startDate, 0)} 〜 {formatShortDate(trip.endDate, 0)} · {trip.days.length}日間
            </span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-[12px]">
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all',
                  viewMode === 'map' ? 'bg-white font-semibold shadow-sm text-gray-900' : 'text-gray-500'
                )}
              >
                <Map className="w-3.5 h-3.5" /> 地図
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all',
                  viewMode === 'list' ? 'bg-white font-semibold shadow-sm text-gray-900' : 'text-gray-500'
                )}
              >
                <List className="w-3.5 h-3.5" /> リスト
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3">
            <button
              onClick={() => setSelectedDayIdx(0)}
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-all whitespace-nowrap',
                selectedDayIdx === 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              全日程
            </button>
            {trip.days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx + 1)}
                className={cn(
                  'flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-all whitespace-nowrap',
                  selectedDayIdx === idx + 1 ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600'
                )}
              >
                Day{day.dayNum}
                <span className={cn('ml-1', selectedDayIdx === idx + 1 ? 'text-white/70' : 'text-gray-400')}>
                  {formatShortDate(trip.startDate, idx)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
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
