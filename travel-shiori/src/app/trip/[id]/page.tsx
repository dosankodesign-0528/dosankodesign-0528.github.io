'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Trip, Day, Spot, SPOT_CONFIG } from '../../../lib/types';
import {
  getTrip, updateTrip, addSpot, updateSpot, deleteSpot,
  deleteTrip as removeTripFromStorage, updateDayHeadline,
} from '../../../lib/storage';
import { SpotFormData } from '../../../components/SpotEditModal';
import Timeline from '../../../components/Timeline';

// 地図コンポーネントはブラウザ専用（サーバー側では動かない）なので動的読み込み
const MapView = dynamic(() => import('../../../components/MapView'), { ssr: false });

// スポット編集モーダルも動的読み込み
const SpotEditModal = dynamic(() => import('../../../components/SpotEditModal'), { ssr: false });

/** 日付を "3/29" のように整形 */
function formatShortDate(dateStr: string, dayOffset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + dayOffset);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // --- 状態管理（この画面で使う情報を全部ここで持つ） ---
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);       // 0 = 全日程, 1 = Day1 ...
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // 地図+リスト or リストのみ
  const [editSpotId, setEditSpotId] = useState<string | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // 画面表示時にlocalStorageから旅行プランを読み込む
  useEffect(() => {
    const t = getTrip(id);
    if (t) {
      setTrip(t);
      setShareUrl(`${window.location.origin}/share/${t.shareId}`);
    }
  }, [id]);

  // 表示するスポット（選択中の日程のもの）を計算
  const displaySpots: Spot[] = trip
    ? selectedDayIdx === 0
      ? trip.days.flatMap((d) => d.spots)
      : (trip.days[selectedDayIdx - 1]?.spots ?? [])
    : [];

  // 表示する日程
  const currentDay: Day | null = trip && selectedDayIdx > 0
    ? trip.days[selectedDayIdx - 1] ?? null
    : null;

  // tripデータを最新に更新する共通処理
  const refreshTrip = useCallback(() => {
    const t = getTrip(id);
    if (t) setTrip(t);
  }, [id]);

  // --- スポット操作 ---
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

  // --- 旅行プラン設定 ---
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

    // 日数が変わった場合、日程を増減する
    while (updated.days.length < newDayCount) {
      const n = updated.days.length + 1;
      updated.days.push({ id: crypto.randomUUID(), tripId: trip.id, dayNum: n, headline: '', spots: [] });
    }
    if (updated.days.length > newDayCount) {
      updated.days = updated.days.slice(0, newDayCount);
    }
    updated.days.forEach((d, i) => { d.dayNum = i + 1; });

    updateTrip(updated);
    refreshTrip();
    setShowSettings(false);
    if (selectedDayIdx > newDayCount) setSelectedDayIdx(0);
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    if (confirm('この旅行プランを削除しますか？この操作は取り消せません。')) {
      removeTripFromStorage(trip.id);
      router.push('/');
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('共有URLをコピーしました！');
  };

  // 編集中のスポットデータを取得
  const editingSpot = editSpotId
    ? trip?.days.flatMap(d => d.spots).find(s => s.id === editSpotId)
    : undefined;

  if (!trip) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-subtext)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">
      {/* ═══════ iOSナビゲーションバー ═══════ */}
      <header className="ios-nav sticky top-0 z-50 px-4 h-[56px] flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-[var(--color-primary)] text-[17px] min-w-[60px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <h1 className="text-[17px] font-semibold truncate mx-2">{trip.title}</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="text-[var(--color-primary)] min-w-[60px] text-right"
          aria-label="設定"
        >
          <svg className="w-6 h-6 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* ═══════ Day切り替えタブ + 表示モード切替 ═══════ */}
      <div className="bg-white border-b border-[var(--color-border)] flex-shrink-0">
        {/* 表示モード切替（地図+リスト / リストのみ） */}
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="flex bg-[var(--color-bg)] rounded-lg p-0.5 text-[13px]">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'map' ? 'bg-white font-semibold shadow-sm' : 'text-[var(--color-subtext)]'}`}
            >
              🗺️ 地図＋リスト
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white font-semibold shadow-sm' : 'text-[var(--color-subtext)]'}`}
            >
              📋 リストのみ
            </button>
          </div>
        </div>

        {/* Day切り替えタブ（横スクロール） */}
        <div className="flex overflow-x-auto no-scrollbar px-2 pb-1 pt-2 gap-1">
          {/* 「全日程」タブ */}
          <button
            onClick={() => setSelectedDayIdx(0)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[72px] transition-all ${
              selectedDayIdx === 0
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-subtext)] active:bg-gray-100'
            }`}
          >
            <div className="text-[13px] font-bold">全日程</div>
          </button>

          {/* 各日のタブ */}
          {trip.days.map((day, idx) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIdx(idx + 1)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[72px] transition-all ${
                selectedDayIdx === idx + 1
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-subtext)] active:bg-gray-100'
              }`}
            >
              <div className="text-[13px] font-bold">Day {day.dayNum}</div>
              <div className={`text-[11px] ${selectedDayIdx === idx + 1 ? 'text-white/80' : 'text-[var(--color-subtext)]'}`}>
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

      {/* ═══════ メインコンテンツ（地図＋タイムライン） ═══════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 地図エリア（表示モードが"map"の時だけ表示） */}
        {viewMode === 'map' && (
          <div className="h-[40vh] min-h-[200px] flex-shrink-0 relative">
            <MapView
              spots={displaySpots}
              selectedSpotId={selectedSpotId}
              onSpotSelect={setSelectedSpotId}
            />
          </div>
        )}

        {/* タイムラインエリア（スクロール可能） */}
        <div className="flex-1 overflow-y-auto pb-24">
          {/* 日のヘッドライン編集 */}
          {currentDay && (
            <div className="px-4 pt-3 pb-1">
              <input
                type="text"
                className="text-[15px] text-[var(--color-subtext)] bg-transparent border-none outline-none w-full placeholder:text-gray-300"
                placeholder="この日のテーマを入力（例：富士サファリパーク）"
                value={currentDay.headline}
                onChange={(e) => {
                  updateDayHeadline(trip.id, currentDay.id, e.target.value);
                  refreshTrip();
                }}
              />
            </div>
          )}

          <Timeline
            spots={displaySpots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={setSelectedSpotId}
            onSpotEdit={setEditSpotId}
            onSpotDelete={handleDeleteSpot}
            readOnly={false}
          />
        </div>
      </div>

      {/* ═══════ スポット追加ボタン（右下の青い丸いボタン） ═══════ */}
      <button
        onClick={() => setShowAddSpot(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="スポットを追加"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* ═══════ スポット追加モーダル ═══════ */}
      {showAddSpot && (
        <SpotEditModal
          isOpen={showAddSpot}
          onClose={() => setShowAddSpot(false)}
          onSave={handleAddSpot}
        />
      )}

      {/* ═══════ スポット編集モーダル ═══════ */}
      {editSpotId && editingSpot && (
        <SpotEditModal
          isOpen={true}
          onClose={() => setEditSpotId(null)}
          onSave={handleEditSpot}
          initialData={editingSpot}
        />
      )}

      {/* ═══════ 旅行設定モーダル ═══════ */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl modal-sheet pb-8 max-h-[85vh] overflow-y-auto">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 pb-4">
              <button onClick={() => setShowSettings(false)} className="text-[var(--color-primary)] text-[17px]">
                キャンセル
              </button>
              <span className="text-[17px] font-semibold">旅行の設定</span>
              <button onClick={handleSaveSettings} className="text-[var(--color-primary)] text-[17px] font-bold">
                保存
              </button>
            </div>

            <div className="px-4 space-y-5">
              {/* タイトル */}
              <div>
                <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">旅行タイトル</label>
                <input
                  type="text"
                  className="ios-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* 日程 */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">出発日</label>
                  <input type="date" className="ios-input" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">帰着日</label>
                  <input type="date" className="ios-input" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                </div>
              </div>

              {/* 共有URL */}
              <div>
                <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">共有URL（閲覧専用）</label>
                <div className="flex gap-2">
                  <input type="text" className="ios-input flex-1 text-[14px]" value={shareUrl} readOnly />
                  <button
                    onClick={handleCopyShareUrl}
                    className="px-4 h-[44px] bg-[var(--color-primary)] text-white rounded-lg text-[15px] font-medium flex-shrink-0"
                  >
                    コピー
                  </button>
                </div>
                <p className="text-[12px] text-[var(--color-subtext)] mt-1">
                  このURLを共有すると、ログインなしで閲覧できます
                </p>
              </div>

              {/* 削除ボタン */}
              <button
                onClick={handleDeleteTrip}
                className="ios-button bg-[var(--color-danger)] text-white w-full mt-6"
              >
                この旅行プランを削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
