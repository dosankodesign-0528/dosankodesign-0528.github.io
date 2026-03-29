'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '../lib/types';
import { getTrips, createTrip, deleteTrip } from '../lib/storage';

/** 曜日を日本語で取得する（日〜土） */
function getDayOfWeek(dateStr: string): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[new Date(dateStr).getDay()];
}

/** 日付を「3/29 (土)」のように整形する */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} (${getDayOfWeek(dateStr)})`;
}

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 新規作成フォームの入力値
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // 画面表示時にlocalStorageから旅行プランを読み込む
  useEffect(() => {
    setTrips(getTrips());
  }, []);

  // 新しい旅行プランを作成する
  const handleCreate = () => {
    if (!newTitle.trim() || !newStart || !newEnd) return;
    const trip = createTrip(newTitle.trim(), newStart, newEnd);
    setTrips(getTrips());
    setShowCreate(false);
    setNewTitle('');
    setNewStart('');
    setNewEnd('');
    router.push(`/trip/${trip.id}`);
  };

  // 旅行プランを削除する
  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips(getTrips());
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-full bg-[var(--color-bg)]">
      {/* ─── iOSスタイルのナビゲーションバー ─── */}
      <header className="ios-nav sticky top-0 z-50 px-4 h-[56px] flex items-center justify-between">
        <div className="w-[60px]" />
        <h1 className="text-[17px] font-semibold">旅のしおり</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-[60px] text-right text-[var(--color-primary)] text-[17px] font-medium"
          aria-label="新しい旅行を作成"
        >
          ＋ 新規
        </button>
      </header>

      {/* ─── 旅行プランの一覧 ─── */}
      <main className="px-4 pt-4 pb-24">
        {trips.length === 0 ? (
          // プランがまだない時の表示
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-[20px] font-bold text-[var(--color-text)] mb-2">
              旅行プランがありません
            </h2>
            <p className="text-[15px] text-[var(--color-subtext)] mb-8 leading-relaxed">
              右上の「＋ 新規」ボタンから
              <br />
              最初の旅行プランを作成しましょう！
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="ios-button bg-[var(--color-primary)] text-white w-auto px-8"
            >
              旅行プランを作成
            </button>
          </div>
        ) : (
          // プラン一覧のカード表示
          <div className="space-y-3">
            {trips.map((trip) => {
              const dayCount = trip.days.length;
              const spotCount = trip.days.reduce((sum, d) => sum + d.spots.length, 0);
              return (
                <div key={trip.id} className="ios-card overflow-hidden">
                  <button
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="w-full text-left p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
                  >
                    {/* 左側：旅行情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[18px] font-bold text-[var(--color-text)] truncate">
                        {trip.title}
                      </h3>
                      <p className="text-[15px] text-[var(--color-subtext)] mt-1">
                        {formatDate(trip.startDate)} 〜 {formatDate(trip.endDate)}
                      </p>
                      <p className="text-[13px] text-[var(--color-subtext)] mt-0.5">
                        {dayCount}日間 · {spotCount}スポット
                      </p>
                    </div>

                    {/* 右側：矢印アイコン */}
                    <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* 削除ボタン */}
                  <div className="border-t border-[var(--color-border)] px-4 py-2 flex justify-end">
                    <button
                      onClick={() => setDeleteConfirm(trip.id)}
                      className="text-[13px] text-[var(--color-danger)] py-1 px-3"
                      aria-label={`${trip.title}を削除`}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── 新規作成モーダル（下からスッと出てくるiOS風シート） ─── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl modal-sheet pb-8">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={() => setShowCreate(false)}
                className="text-[var(--color-primary)] text-[17px]"
              >
                キャンセル
              </button>
              <span className="text-[17px] font-semibold">新しい旅行</span>
              <button
                onClick={handleCreate}
                className="text-[var(--color-primary)] text-[17px] font-bold"
                disabled={!newTitle.trim() || !newStart || !newEnd}
              >
                作成
              </button>
            </div>

            {/* 入力フォーム */}
            <div className="px-4 space-y-4">
              <div>
                <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">旅行タイトル</label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="例：沖縄家族旅行 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">出発日</label>
                  <input
                    type="date"
                    className="ios-input"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[13px] text-[var(--color-subtext)] mb-1 block">帰着日</label>
                  <input
                    type="date"
                    className="ios-input"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 削除確認ダイアログ（iOS風アラート） ─── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 modal-overlay flex items-center justify-center px-8"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-[270px] overflow-hidden text-center">
            <div className="pt-5 pb-4 px-4">
              <h3 className="text-[17px] font-semibold mb-1">旅行プランを削除</h3>
              <p className="text-[13px] text-[var(--color-subtext)]">
                この操作は取り消せません。本当に削除しますか？
              </p>
            </div>
            <div className="border-t border-[var(--color-border)] flex">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 text-[17px] text-[var(--color-primary)] border-r border-[var(--color-border)]"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 text-[17px] text-[var(--color-danger)] font-semibold"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
