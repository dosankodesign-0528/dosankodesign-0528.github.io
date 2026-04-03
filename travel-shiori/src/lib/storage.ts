// ========================================
// データの保存・読み込み・削除を担当するファイル
// Supabase を使ってクラウドにデータを保存する
// ========================================

import { Trip, Day, Spot } from './types';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

/** 保存されている全旅行プランを取得（ゴミ箱除外） */
export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('data')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getTrips error:', error);
    return [];
  }
  return (data ?? [])
    .map((row) => row.data as Trip)
    .filter((trip) => !trip.deletedAt);
}

/** ゴミ箱にある旅行プランを取得 */
export async function getTrashedTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('data')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getTrashedTrips error:', error);
    return [];
  }
  return (data ?? [])
    .map((row) => row.data as Trip)
    .filter((trip) => !!trip.deletedAt);
}

/** 共有IDを指定して旅行プランを取得 */
export async function getTripByShareId(shareId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('data')
    .eq('share_id', shareId)
    .single();

  if (error) {
    console.error('getTripByShareId error:', error);
    return null;
  }
  return (data?.data as Trip) ?? null;
}

/** 編集用 or 閲覧用IDで旅行プランを取得（どちらのIDか判定付き） */
export async function getTripByAnyShareId(id: string): Promise<{ trip: Trip; readOnly: boolean } | null> {
  // まず編集用IDで検索
  const { data: editData } = await supabase
    .from('trips')
    .select('share_id, view_id, data')
    .eq('share_id', id)
    .single();

  if (editData) {
    const trip = editData.data as Trip;
    // viewIdが未設定の既存データを補完
    if (!trip.viewId && editData.view_id) {
      trip.viewId = editData.view_id;
    }
    return { trip, readOnly: false };
  }

  // 閲覧用IDで検索
  const { data: viewData } = await supabase
    .from('trips')
    .select('share_id, view_id, data')
    .eq('view_id', id)
    .single();

  if (viewData) {
    const trip = viewData.data as Trip;
    if (!trip.viewId && viewData.view_id) {
      trip.viewId = viewData.view_id;
    }
    return { trip, readOnly: true };
  }

  return null;
}

/** 新しい旅行プランを作成 */
export async function createTrip(title: string, startDate: string, endDate: string): Promise<Trip> {
  const now = new Date().toISOString();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const trip: Trip = {
    id: nanoid(),
    title,
    startDate,
    endDate,
    shareId: nanoid(12),
    viewId: nanoid(12),
    days: Array.from({ length: dayCount }, (_, i) => ({
      id: nanoid(),
      tripId: '',
      dayNum: i + 1,
      headline: '',
      spots: [],
    })),
    createdAt: now,
    updatedAt: now,
  };
  trip.days.forEach(d => { d.tripId = trip.id; });

  const { error } = await supabase
    .from('trips')
    .insert({ share_id: trip.shareId, view_id: trip.viewId, data: trip });

  if (error) {
    console.error('createTrip error:', error);
    throw new Error('旅行プランの作成に失敗しました');
  }
  return trip;
}

/** 旅行プランを更新（shareIdで特定） */
export async function updateTrip(updated: Trip): Promise<void> {
  updated.updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from('trips')
    .update({ data: updated, updated_at: new Date().toISOString() })
    .eq('share_id', updated.shareId);

  if (error) {
    console.error('updateTrip error:', error);
  }
}

/** 旅行プランを複製 */
export async function duplicateTrip(shareId: string): Promise<Trip | null> {
  const original = await getTripByShareId(shareId);
  if (!original) return null;

  const now = new Date().toISOString();
  const newTrip: Trip = {
    ...original,
    id: nanoid(),
    title: `${original.title}（コピー）`,
    shareId: nanoid(12),
    viewId: nanoid(12),
    createdAt: now,
    updatedAt: now,
    days: original.days.map(day => ({
      ...day,
      id: nanoid(),
      tripId: '',
      spots: day.spots.map(spot => ({
        ...spot,
        id: nanoid(),
        dayId: '',
      })),
    })),
  };
  // IDを付け直す
  newTrip.days.forEach(d => {
    d.tripId = newTrip.id;
    d.spots.forEach(s => { s.dayId = d.id; });
  });

  const { error } = await supabase
    .from('trips')
    .insert({ share_id: newTrip.shareId, view_id: newTrip.viewId, data: newTrip });

  if (error) {
    console.error('duplicateTrip error:', error);
    return null;
  }
  return newTrip;
}

/** 旅行プランをゴミ箱に移動（ソフトデリート） */
export async function deleteTrip(shareId: string): Promise<void> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return;
  trip.deletedAt = new Date().toISOString();
  await updateTrip(trip);
}

/** ゴミ箱から復元 */
export async function restoreTrip(shareId: string): Promise<void> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return;
  delete trip.deletedAt;
  await updateTrip(trip);
}

/** 完全に削除（ゴミ箱から） */
export async function permanentlyDeleteTrip(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('share_id', shareId);

  if (error) {
    console.error('permanentlyDeleteTrip error:', error);
  }
}

/** 日内のスポットを時刻順にソート */
function sortSpotsByTime(spots: Spot[]): void {
  spots.sort((a, b) => {
    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    return timeA.localeCompare(timeB);
  });
  spots.forEach((s, i) => { s.sortOrder = i; });
}

/** スポットを追加 */
export async function addSpot(shareId: string, dayId: string, spot: Omit<Spot, 'id' | 'dayId' | 'sortOrder'>): Promise<Trip | null> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return null;
  const day = trip.days.find(d => d.id === dayId);
  if (!day) return null;

  const newSpot: Spot = {
    ...spot,
    id: nanoid(),
    dayId,
    sortOrder: day.spots.length,
  };
  day.spots.push(newSpot);
  sortSpotsByTime(day.spots);
  await updateTrip(trip);
  return trip;
}

/** スポットを更新（dayIdが変わった場合は日をまたいで移動） */
export async function updateSpot(shareId: string, spotId: string, updates: Partial<Spot>): Promise<Trip | null> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return null;

  for (const day of trip.days) {
    const idx = day.spots.findIndex(s => s.id === spotId);
    if (idx !== -1) {
      const updatedSpot = { ...day.spots[idx], ...updates };

      if (updates.dayId && updates.dayId !== day.id) {
        const targetDay = trip.days.find(d => d.id === updates.dayId);
        if (targetDay) {
          day.spots.splice(idx, 1);
          sortSpotsByTime(day.spots);
          updatedSpot.sortOrder = targetDay.spots.length;
          targetDay.spots.push(updatedSpot);
          sortSpotsByTime(targetDay.spots);
        }
      } else {
        day.spots[idx] = updatedSpot;
        sortSpotsByTime(day.spots);
      }

      await updateTrip(trip);
      return trip;
    }
  }
  return null;
}

/** スポットを削除 */
export async function deleteSpot(shareId: string, spotId: string): Promise<Trip | null> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return null;

  for (const day of trip.days) {
    const idx = day.spots.findIndex(s => s.id === spotId);
    if (idx !== -1) {
      day.spots.splice(idx, 1);
      day.spots.forEach((s, i) => { s.sortOrder = i; });
      await updateTrip(trip);
      return trip;
    }
  }
  return null;
}

/** 日程の見出しを更新 */
export async function updateDayHeadline(shareId: string, dayId: string, headline: string): Promise<Trip | null> {
  const trip = await getTripByShareId(shareId);
  if (!trip) return null;
  const day = trip.days.find(d => d.id === dayId);
  if (!day) return null;
  day.headline = headline;
  await updateTrip(trip);
  return trip;
}
