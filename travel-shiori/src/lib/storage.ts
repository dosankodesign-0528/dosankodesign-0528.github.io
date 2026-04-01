// ========================================
// データの保存・読み込み・削除を担当するファイル
// Supabase を使ってクラウドにデータを保存する
// ========================================

import { Trip, Day, Spot } from './types';
import { nanoid } from 'nanoid';
import { supabase } from './supabase';

/** 保存されている全旅行プランを取得 */
export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('data')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getTrips error:', error);
    return [];
  }
  return (data ?? []).map((row) => row.data as Trip);
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
    .insert({ share_id: trip.shareId, data: trip });

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

/** 旅行プランを削除（shareIdで特定） */
export async function deleteTrip(shareId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('share_id', shareId);

  if (error) {
    console.error('deleteTrip error:', error);
  }
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
          day.spots.forEach((s, i) => { s.sortOrder = i; });
          updatedSpot.sortOrder = targetDay.spots.length;
          targetDay.spots.push(updatedSpot);
        }
      } else {
        day.spots[idx] = updatedSpot;
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
