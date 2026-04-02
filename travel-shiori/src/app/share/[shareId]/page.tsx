'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronLeft, MoreHorizontal, Plus, Share2, Trash2, Map, List } from 'lucide-react';
import { Trip, Day, Spot, AssigneeType, ASSIGNEE_CONFIG } from '../../../lib/types';
import {
  getTripByShareId, updateTrip, addSpot, updateSpot, deleteSpot,
  deleteTrip as removeTripFromStorage, updateDayHeadline,
} from '../../../lib/storage';
import { SpotFormData } from '../../../components/SpotEditModal';
import Timeline from '../../../components/Timeline';
import { cn } from '../../../lib/utils';

import type { MapViewHandle } from '../../../components/MapView';
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
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeType>('all');

  const mapRef = useRef<MapViewHandle>(null);
  const [locating, setLocating] = useState(false);

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

  const allSpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap((d) => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  // 人物フィルター適用（「みんな」なら全表示、それ以外は該当 or 未設定/all のスポットのみ）
  const displaySpots: Spot[] = assigneeFilter === 'all'
    ? allSpots
    : allSpots.filter((s) => !s.assignee || s.assignee === 'all' || s.assignee === assigneeFilter);

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

  // ボトムシートの高さ（vhで管理、100 - mapHeight がシートの高さ）
  const sheetTopVh = viewMode === 'map' ? mapHeight : 0;

  return (
    <div className="h-full relative bg-[var(--color-bg)] overflow-hidden">
      {/* ── ヘッダー（マップの上にオーバーレイ） ── */}
      <header
        ref={headerRef}
        className="absolute top-0 left-0 right-0 z-30 px-4 py-3.5 flex items-center"
      >
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="mx-3 flex-1 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-[15px] font-bold text-gray-900 truncate max-w-[200px]">
            {trip.title}
          </span>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
        >
          {viewMode === 'map' ? <List className="w-[18px] h-[18px] text-gray-700" /> : <Map className="w-[18px] h-[18px] text-gray-700" />}
        </button>
      </header>

      {/* ── 全画面マップ ── */}
      {viewMode === 'map' && (
        <div className="absolute inset-0 z-0">
          <MapView
            ref={mapRef}
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={(spotId) => setSelectedSpotId(spotId)}
          />
        </div>
      )}

      {/* ── 現在地ボタン（マップの右下、ボトムシートの上）── */}
      {viewMode === 'map' && (
        <button
          onClick={() => {
            setLocating(true);
            mapRef.current?.locateMe();
            setTimeout(() => setLocating(false), 3000);
          }}
          className="absolute z-10 right-4 flex items-center justify-center"
          style={{ top: `calc(${mapHeight}vh - 52px)` }}
          aria-label="現在地を表示"
        >
          <div className="w-10 h-10 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] flex items-center justify-center active:bg-gray-100 transition-colors">
            {/* Google Maps「my_location」アイコン */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill={locating ? '#4285F4' : '#666'}>
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          </div>
        </button>
      )}

      {/* ── ボトムシート ── */}
      <div
        className="absolute left-0 right-0 bottom-0 z-20 flex flex-col bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
        style={{
          top: viewMode === 'map' ? `${sheetTopVh}vh` : '56px',
          transition: isDragging.current ? 'none' : 'top 0.2s ease-out',
        }}
      >
        {/* ドラッグハンドル + 日程タブ */}
        <div
          className={cn(
            'flex-shrink-0',
            viewMode === 'map' && 'cursor-row-resize touch-none select-none'
          )}
          onMouseDown={viewMode === 'map' ? (e) => handleDragStart(e.clientY) : undefined}
          onTouchStart={viewMode === 'map' ? (e) => handleDragStart(e.touches[0].clientY) : undefined}
        >
          {viewMode === 'map' && (
            <div className="flex justify-center items-center py-2">
              <div className="w-9 h-1 bg-gray-300 rounded-full" />
            </div>
          )}
          {/* 日程タブ + 設定 */}
          <div className="px-3 pt-1 pb-1.5 border-b border-gray-100">
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
            {/* 人物フィルター */}
            <div className="flex gap-1.5 mt-1.5 pb-0.5">
              {(Object.keys(ASSIGNEE_CONFIG) as AssigneeType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setAssigneeFilter(key)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium transition-all',
                    assigneeFilter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200 active:bg-gray-100'
                  )}
                >
                  <span className="text-[13px]">{ASSIGNEE_CONFIG[key].icon}</span>
                  {ASSIGNEE_CONFIG[key].label}
                </button>
              ))}
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
