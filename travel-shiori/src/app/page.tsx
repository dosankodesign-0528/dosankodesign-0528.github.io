'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Trash2, MapPin, Calendar } from 'lucide-react';
import { Trip } from '../lib/types';
import { getTrips, createTrip, deleteTrip } from '../lib/storage';
import { cn } from '../lib/utils';

function getDayOfWeek(dateStr: string): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[new Date(dateStr).getDay()];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} (${getDayOfWeek(dateStr)})`;
}

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  useEffect(() => { setTrips(getTrips()); }, []);

  const handleCreate = () => {
    if (!newTitle.trim() || !newStart || !newEnd) return;
    const trip = createTrip(newTitle.trim(), newStart, newEnd);
    setTrips(getTrips());
    setShowCreate(false);
    setNewTitle(''); setNewStart(''); setNewEnd('');
    router.push(`/trip/${trip.id}`);
  };

  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips(getTrips());
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-full bg-[var(--color-bg)]">
      {/* ナビバー */}
      <header className="ios-nav sticky top-0 z-50 px-4 h-[48px] flex items-center justify-between">
        <div className="w-[50px]" />
        <h1 className="text-[16px] font-semibold">旅のしおり</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-[var(--color-primary)] text-[14px] font-medium"
        >
          <Plus className="w-4 h-4" />
          新規
        </button>
      </header>

      <main className="px-4 pt-3 pb-24 max-w-lg mx-auto">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">旅行プランがありません</h2>
            <p className="text-[14px] text-gray-500 mb-6">最初のプランを作成しましょう</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 h-[44px] px-6 bg-[var(--color-primary)] text-white rounded-xl text-[15px] font-semibold shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              旅行プランを作成
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => {
              const dayCount = trip.days.length;
              const spotCount = trip.days.reduce((sum, d) => sum + d.spots.length, 0);
              return (
                <div key={trip.id} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                  <button
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="w-full text-left p-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold text-gray-900 truncate">{trip.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[13px] text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(trip.startDate)} 〜 {formatDate(trip.endDate)}</span>
                      </div>
                      <p className="text-[12px] text-gray-400 mt-0.5">{dayCount}日間 · {spotCount}スポット</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </button>
                  <div className="border-t border-gray-50 px-3.5 py-1.5 flex justify-end">
                    <button
                      onClick={() => setDeleteConfirm(trip.id)}
                      className="flex items-center gap-1 text-[12px] text-red-400 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 新規作成モーダル */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl modal-sheet pb-8">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <button onClick={() => setShowCreate(false)} className="text-[var(--color-primary)] text-[15px]">
                キャンセル
              </button>
              <span className="text-[15px] font-semibold">新しい旅行</span>
              <button
                onClick={handleCreate}
                className={cn(
                  'text-[15px] font-bold',
                  !newTitle.trim() || !newStart || !newEnd ? 'text-gray-300' : 'text-[var(--color-primary)]'
                )}
                disabled={!newTitle.trim() || !newStart || !newEnd}
              >
                作成
              </button>
            </div>
            <div className="px-4 space-y-3">
              <div>
                <label className="text-[12px] text-gray-500 mb-1 block">タイトル</label>
                <input type="text" className="ios-input" placeholder="例：沖縄家族旅行" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] text-gray-500 mb-1 block">出発日</label>
                  <input type="date" className="ios-input" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] text-gray-500 mb-1 block">帰着日</label>
                  <input type="date" className="ios-input" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-center justify-center px-8"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-[270px] overflow-hidden text-center">
            <div className="pt-5 pb-4 px-4">
              <h3 className="text-[15px] font-semibold mb-1">旅行プランを削除</h3>
              <p className="text-[13px] text-gray-500">この操作は取り消せません</p>
            </div>
            <div className="border-t border-gray-100 flex">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 text-[15px] text-[var(--color-primary)] border-r border-gray-100">
                キャンセル
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 text-[15px] text-red-500 font-semibold">
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
