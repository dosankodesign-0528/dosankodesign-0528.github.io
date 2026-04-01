'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronLeft, MoreHorizontal, Plus, Share2, Trash2, Map, List } from 'lucide-react';
import { Trip, Day, Spot } from '../../../lib/types';
import {
  getTripByShareId, updateTrip, addSpot, updateSpot, deleteSpot,
  deleteTrip as removeTripFromStorage, updateDayHeadline,
} from '../../../lib/storage';
import { SpotFormData } from '../../../components/SpotEditModal';
import Timeline from '../../../components/Timeline';
import { cn } from '../../../lib/utils';

const MapView = dynamic(() => import('../../../components/MapView'), { ssr: false });
const SpotEditModal = dynamic(() => import('../../../components/SpotEditModal'), { ssr: false });

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function formatShortDate(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateWithDay(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_OF_WEEK[d.getDay()]})`;
}

export default function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [editSpotId, setEditSpotId] = useState<string | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [mapHeight, setMapHeight] = useState(35);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(35);
  const headerRef = useRef<HTMLElement>(null);

  const handleDragStart = useCallback((clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragStartHeight.current = mapHeight;
    document.body.style.userSelect = 'none';
  }, [mapHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const deltaVh = ((clientY - dragStartY.current) / window.innerHeight) * 100;
    const newHeight = Math.min(70, Math.max(10, dragStartHeight.current + deltaVh));
    setMapHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY);
    const onEnd = () => handleDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  useEffect(() => {
    getTripByShareId(shareId).then((t) => {
      if (t) setTrip(t);
      else setNotFound(true);
    });
  }, [shareId]);

  const displaySpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap((d) => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  const currentDay: Day | null = trip && selectedDayIdx > 0
    ? trip.days[selectedDayIdx - 1] ?? null
    : null;

  const spotDateMap: Record<string, string> = {};
  if (trip) {
    trip.days.forEach((day, idx) => {
      const label = `Day${day.dayNum} ${formatDateWithDay(trip.startDate, idx)}`;
      day.spots.forEach((s) => { spotDateMap[s.id] = label; });
    });
  }

  const dayOptions = trip
    ? trip.days.map((day, idx) => ({
        id: day.id,
        label: `Day${day.dayNum} ${formatDateWithDay(trip.startDate, idx)}`,
      }))
    : [];

  const refreshTrip = useCallback(async () => {
    const t = await getTripByShareId(shareId);
    if (t) setTrip(t);
  }, [shareId]);

  const handleAddSpot = async (data: SpotFormData) => {
    if (!trip) return;
    const targetDayId = data.dayId
      || (selectedDayIdx > 0 ? trip.days[selectedDayIdx - 1]?.id : trip.days[0]?.id);
    if (!targetDayId) return;
    const updated = await addSpot(trip.shareId, targetDayId, data);
    if (updated) setTrip(updated);
    setShowAddSpot(false);
  };

  const handleEditSpot = async (data: SpotFormData) => {
    if (!trip || !editSpotId) return;
    const updated = await updateSpot(trip.shareId, editSpotId, data);
    if (updated) setTrip(updated);
    setEditSpotId(null);
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!trip) return;
    const updated = await deleteSpot(trip.shareId, spotId);
    if (updated) setTrip(updated);
    if (selectedSpotId === spotId) setSelectedSpotId(null);
  };

  const handleSpotTap = (spotId: string) => {
    setSelectedSpotId(spotId);
    setEditSpotId(spotId);
  };

  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  useEffect(() => {
    if (trip) {
      setEditTitle(trip.title);
      setEditStart(trip.startDate);
      setEditEnd(trip.endDate);
    }
  }, [trip]);

  const handleSaveSettings = async () => {
    if (!trip || !editTitle.trim() || !editStart || !editEnd) return;
    const newStart = new Date(editStart);
    const newEnd = new Date(editEnd);
    const newDayCount = Math.max(1, Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const updated = { ...trip, title: editTitle.trim(), startDate: editStart, endDate: editEnd };
    while (updated.days.length < newDayCount) {
      const n = updated.days.length + 1;
      updated.days.push({ id: crypto.randomUUID(), tripId: trip.id, dayNum: n, headline: '', spots: [] });
    }
    if (updated.days.length > newDayCount) updated.days = updated.days.slice(0, newDayCount);
    updated.days.forEach((d, i) => { d.dayNum = i + 1; });
    await updateTrip(updated);
    setTrip(updated);
    setShowSettings(false);
    if (selectedDayIdx > newDayCount) setSelectedDayIdx(0);
  };

  const handleDeleteTrip = async () => {
    if (!trip) return;
    if (confirm('この旅行プランを削除しますか？')) {
      await removeTripFromStorage(trip.shareId);
      router.push('/');
    }
  };

  const handleCopyShareUrl = () => {
    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2500);
  };

  const editingSpot = editSpotId
    ? trip?.days.flatMap(d => d.spots).find(s => s.id === editSpotId)
    : undefined;

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
      {/* ── ヘッダー ── */}
      <header
        ref={headerRef}
        className="ios-nav sticky top-0 z-50 px-4 py-3.5 flex items-center flex-shrink-0"
      >
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold truncate mx-3 flex-1 text-center">{trip.title}</h1>
        <button
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center"
        >
          {viewMode === 'map' ? <List className="w-[18px] h-[18px] text-gray-700" /> : <Map className="w-[18px] h-[18px] text-gray-700" />}
        </button>
      </header>

      {/* ── 地図エリア ── */}
      {viewMode === 'map' && (
        <div className="flex-shrink-0 relative" style={{ height: `${mapHeight}vh`, minHeight: 100 }}>
          <MapView
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={(spotId) => setSelectedSpotId(spotId)}
          />
        </div>
      )}

      {/* ── 日程タブ＋工程リスト ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-t-2xl -mt-3 relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {/* ドラッグハンドル + 日程タブ（まとめてドラッグ可能） */}
        <div
          className={cn(
            'flex-shrink-0',
            viewMode === 'map' && 'cursor-row-resize touch-none select-none'
          )}
          onMouseDown={viewMode === 'map' ? (e) => handleDragStart(e.clientY) : undefined}
          onTouchStart={viewMode === 'map' ? (e) => handleDragStart(e.touches[0].clientY) : undefined}
        >
        {viewMode === 'map' && (
          <div className="flex justify-center items-center py-1.5">
            <div className="w-9 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
        {/* 日程タブ + 設定 */}
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-100">
          {currentDay && currentDay.headline && (
            <div className="text-[12px] text-gray-400 truncate mb-1">
              {currentDay.headline}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedDayIdx(0)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap',
                selectedDayIdx === 0
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              )}
            >
              All
            </button>
            {trip.days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx + 1)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap',
                  selectedDayIdx === idx + 1
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                )}
              >
                Day {day.dayNum}
                <span className={cn(
                  'ml-1',
                  selectedDayIdx === idx + 1 ? 'text-white/60' : 'text-gray-400'
                )}>
                  {formatShortDate(trip.startDate, idx)}
                </span>
              </button>
            ))}
            </div>
            {/* 設定ボタン */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1 active:bg-gray-200 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        </div>

        {/* 工程リスト */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
          <Timeline
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={handleSpotTap}
            onSpotEdit={setEditSpotId}
            onSpotDelete={handleDeleteSpot}
            onAdd={() => setShowAddSpot(true)}
            readOnly={false}
            spotDateMap={spotDateMap}
          />
        </div>
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[1024px] pointer-events-none">
        <button
          onClick={() => setShowAddSpot(true)}
          className="absolute bottom-0 right-5 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform pointer-events-auto"
          aria-label="スポットを追加"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── モーダル類 ── */}
      {showAddSpot && (
        <SpotEditModal isOpen={showAddSpot} onClose={() => setShowAddSpot(false)} onSave={handleAddSpot} dayOptions={dayOptions} />
      )}
      {editSpotId && editingSpot && (
        <SpotEditModal isOpen={true} onClose={() => setEditSpotId(null)} onSave={handleEditSpot} initialData={editingSpot} dayOptions={dayOptions} />
      )}

      {/* ── スナックバー ── */}
      {showSnackbar && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-gray-900 text-white text-[14px] font-medium rounded-2xl shadow-xl animate-[fadeInUp_0.3s_ease]">
          共有リンクをコピーしました
        </div>
      )}

      {/* ── 設定モーダル ── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl modal-sheet pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={() => setShowSettings(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3c3c43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <span className="text-[16px] font-bold">設定</span>
              <button
                onClick={handleSaveSettings}
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 space-y-4">
              <div>
                <label className="text-[12px] text-gray-400 mb-1 block font-medium">タイトル</label>
                <input type="text" className="ios-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] text-gray-400 mb-1 block font-medium">出発日</label>
                  <input type="date" className="ios-input" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] text-gray-400 mb-1 block font-medium">帰着日</label>
                  <input type="date" className="ios-input" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-400 mb-1 block font-medium">共有リンク</label>
                <button onClick={handleCopyShareUrl} className="flex items-center justify-center gap-2 w-full h-[44px] bg-blue-50 text-blue-600 rounded-xl text-[14px] font-medium active:bg-blue-100 transition-colors">
                  <Share2 className="w-4 h-4" />
                  共有リンクをコピー
                </button>
              </div>
              <button onClick={handleDeleteTrip} className="flex items-center justify-center gap-2 w-full h-[44px] bg-red-50 text-red-600 rounded-xl text-[15px] font-medium mt-4">
                <Trash2 className="w-4 h-4" />
                旅行プランを削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
