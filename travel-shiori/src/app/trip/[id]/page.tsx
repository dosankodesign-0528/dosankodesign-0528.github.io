'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronLeft, Settings, Plus, Copy, Trash2, Map, List, GripHorizontal } from 'lucide-react';
import { Trip, Day, Spot, SPOT_CONFIG } from '../../../lib/types';
import {
  getTrip, updateTrip, addSpot, updateSpot, deleteSpot,
  deleteTrip as removeTripFromStorage, updateDayHeadline,
} from '../../../lib/storage';
import { SpotFormData } from '../../../components/SpotEditModal';
import Timeline from '../../../components/Timeline';
import { cn } from '../../../lib/utils';

const MapView = dynamic(() => import('../../../components/MapView'), { ssr: false });
const SpotEditModal = dynamic(() => import('../../../components/SpotEditModal'), { ssr: false });

function formatShortDate(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [editSpotId, setEditSpotId] = useState<string | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // マップの高さ（ドラッグで変更可能）
  const [mapHeight, setMapHeight] = useState(35); // vh単位
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(35);

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
    const t = getTrip(id);
    if (t) {
      setTrip(t);
      setShareUrl(`${window.location.origin}/share/${t.shareId}`);
    }
  }, [id]);

  const displaySpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap((d) => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  const currentDay: Day | null = trip && selectedDayIdx > 0
    ? trip.days[selectedDayIdx - 1] ?? null
    : null;

  const refreshTrip = useCallback(() => {
    const t = getTrip(id);
    if (t) setTrip(t);
  }, [id]);

  const handleAddSpot = (data: SpotFormData) => {
    if (!trip) return;
    const targetDayId = selectedDayIdx > 0
      ? trip.days[selectedDayIdx - 1]?.id
      : trip.days[0]?.id;
    if (!targetDayId) return;
    addSpot(trip.id, targetDayId, data);
    refreshTrip();
    setShowAddSpot(false);
  };

  const handleEditSpot = (data: SpotFormData) => {
    if (!trip || !editSpotId) return;
    updateSpot(trip.id, editSpotId, data);
    refreshTrip();
    setEditSpotId(null);
  };

  const handleDeleteSpot = (spotId: string) => {
    if (!trip) return;
    deleteSpot(trip.id, spotId);
    refreshTrip();
    if (selectedSpotId === spotId) setSelectedSpotId(null);
  };

  // カードタップ → 編集モーダルを開く（readOnlyでなければ）
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

  const handleSaveSettings = () => {
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
    updateTrip(updated);
    refreshTrip();
    setShowSettings(false);
    if (selectedDayIdx > newDayCount) setSelectedDayIdx(0);
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    if (confirm('この旅行プランを削除しますか？')) {
      removeTripFromStorage(trip.id);
      router.push('/');
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('共有URLをコピーしました！');
  };

  const editingSpot = editSpotId
    ? trip?.days.flatMap(d => d.spots).find(s => s.id === editSpotId)
    : undefined;

  if (!trip) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)] overflow-hidden">
      {/* ── ナビゲーションバー ── */}
      <header className="ios-nav sticky top-0 z-50 px-3 h-[48px] flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-0.5 text-[var(--color-primary)] text-[15px] min-w-[50px]"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>
        <h1 className="text-[16px] font-semibold truncate mx-2">{trip.title}</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="text-[var(--color-primary)] min-w-[40px] flex justify-end"
        >
          <Settings className="w-[22px] h-[22px]" />
        </button>
      </header>

      {/* ── 地図エリア（ドラッグで高さ変更可能） ── */}
      {viewMode === 'map' && (
        <div className="flex-shrink-0 relative" style={{ height: `${mapHeight}vh`, minHeight: 100 }}>
          <MapView
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={(spotId) => setSelectedSpotId(spotId)}
          />
        </div>
      )}

      {/* ── 日程タブ＋工程リスト（マップ下にドッキング） ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-t-2xl -mt-3 relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {/* ドラッグハンドル（上下にスワイプして地図サイズを変える） */}
        {viewMode === 'map' && (
          <div
            className="flex justify-center items-center py-1.5 cursor-row-resize touch-none select-none"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className="w-9 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
        {/* 表示モード切替 + 日程タブ */}
        <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-gray-100">
          {/* 表示切替 */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-[12px]">
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all',
                  viewMode === 'map' ? 'bg-white font-semibold shadow-sm text-gray-900' : 'text-gray-500'
                )}
              >
                <Map className="w-3.5 h-3.5" />
                地図
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md transition-all',
                  viewMode === 'list' ? 'bg-white font-semibold shadow-sm text-gray-900' : 'text-gray-500'
                )}
              >
                <List className="w-3.5 h-3.5" />
                リスト
              </button>
            </div>
            {currentDay && (
              <span className="text-[12px] text-gray-400 truncate ml-2">
                {currentDay.headline}
              </span>
            )}
          </div>

          {/* 日程タブ（コンパクトなピル型、横スクロール制御） */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3">
            <button
              onClick={() => setSelectedDayIdx(0)}
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-all whitespace-nowrap',
                selectedDayIdx === 0
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
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
                  selectedDayIdx === idx + 1
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                )}
              >
                Day{day.dayNum}
                <span className={cn(
                  'ml-1',
                  selectedDayIdx === idx + 1 ? 'text-white/70' : 'text-gray-400'
                )}>
                  {formatShortDate(trip.startDate, idx)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 工程リスト（スクロールエリア） */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
          <Timeline
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={handleSpotTap}
            onSpotEdit={setEditSpotId}
            onSpotDelete={handleDeleteSpot}
            readOnly={false}
          />
        </div>
      </div>

      {/* ── FAB（スポット追加ボタン） ── */}
      <button
        onClick={() => setShowAddSpot(true)}
        className="fixed bottom-6 right-5 z-40 w-13 h-13 bg-[var(--color-primary)] text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="スポットを追加"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* ── モーダル類 ── */}
      {showAddSpot && (
        <SpotEditModal isOpen={showAddSpot} onClose={() => setShowAddSpot(false)} onSave={handleAddSpot} />
      )}
      {editSpotId && editingSpot && (
        <SpotEditModal isOpen={true} onClose={() => setEditSpotId(null)} onSave={handleEditSpot} initialData={editingSpot} />
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
              <button onClick={() => setShowSettings(false)} className="text-[var(--color-primary)] text-[15px]">
                キャンセル
              </button>
              <span className="text-[15px] font-semibold">設定</span>
              <button onClick={handleSaveSettings} className="text-[var(--color-primary)] text-[15px] font-bold">
                保存
              </button>
            </div>
            <div className="px-4 space-y-4">
              <div>
                <label className="text-[12px] text-gray-500 mb-1 block">タイトル</label>
                <input type="text" className="ios-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] text-gray-500 mb-1 block">出発日</label>
                  <input type="date" className="ios-input" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] text-gray-500 mb-1 block">帰着日</label>
                  <input type="date" className="ios-input" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 mb-1 block">共有URL（閲覧専用）</label>
                <div className="flex gap-2">
                  <input type="text" className="ios-input flex-1 text-[13px]" value={shareUrl} readOnly />
                  <button onClick={handleCopyShareUrl} className="flex items-center gap-1 px-3 h-[44px] bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-medium flex-shrink-0">
                    <Copy className="w-4 h-4" />
                    コピー
                  </button>
                </div>
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
