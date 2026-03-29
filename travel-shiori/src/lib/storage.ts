// ========================================
// データの保存・読み込み・削除を担当するファイル
// ブラウザの localStorage を使ってスマホ内にデータを保存する
// ========================================

import { Trip, Day, Spot } from './types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'travel-shiori-trips';

/** 保存されている全旅行プランを取得 */
export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/** 全旅行プランを保存（上書き） */
function saveTrips(trips: Trip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

/** IDを指定して1つの旅行プランを取得 */
export function getTrip(id: string): Trip | undefined {
  return getTrips().find(t => t.id === id);
}

/** 共有IDを指定して旅行プランを取得（閲覧用） */
export function getTripByShareId(shareId: string): Trip | undefined {
  return getTrips().find(t => t.shareId === shareId);
}

/** 新しい旅行プランを作成 */
export function createTrip(title: string, startDate: string, endDate: string): Trip {
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
  // tripIdをセット
  trip.days.forEach(d => { d.tripId = trip.id; });

  const trips = getTrips();
  trips.push(trip);
  saveTrips(trips);
  return trip;
}

/** 旅行プランを更新 */
export function updateTrip(updated: Trip): void {
  updated.updatedAt = new Date().toISOString();
  const trips = getTrips().map(t => t.id === updated.id ? updated : t);
  saveTrips(trips);
}

/** 旅行プランを削除 */
export function deleteTrip(id: string): void {
  const trips = getTrips().filter(t => t.id !== id);
  saveTrips(trips);
}

/** スポットを追加 */
export function addSpot(tripId: string, dayId: string, spot: Omit<Spot, 'id' | 'dayId' | 'sortOrder'>): Trip | undefined {
  const trip = getTrip(tripId);
  if (!trip) return undefined;
  const day = trip.days.find(d => d.id === dayId);
  if (!day) return undefined;

  const newSpot: Spot = {
    ...spot,
    id: nanoid(),
    dayId,
    sortOrder: day.spots.length,
  };
  day.spots.push(newSpot);
  updateTrip(trip);
  return trip;
}

/** スポットを更新 */
export function updateSpot(tripId: string, spotId: string, updates: Partial<Spot>): Trip | undefined {
  const trip = getTrip(tripId);
  if (!trip) return undefined;

  for (const day of trip.days) {
    const idx = day.spots.findIndex(s => s.id === spotId);
    if (idx !== -1) {
      day.spots[idx] = { ...day.spots[idx], ...updates };
      updateTrip(trip);
      return trip;
    }
  }
  return undefined;
}

/** スポットを削除 */
export function deleteSpot(tripId: string, spotId: string): Trip | undefined {
  const trip = getTrip(tripId);
  if (!trip) return undefined;

  for (const day of trip.days) {
    const idx = day.spots.findIndex(s => s.id === spotId);
    if (idx !== -1) {
      day.spots.splice(idx, 1);
      // sortOrderを振り直す
      day.spots.forEach((s, i) => { s.sortOrder = i; });
      updateTrip(trip);
      return trip;
    }
  }
  return undefined;
}

/** 日程の見出しを更新 */
export function updateDayHeadline(tripId: string, dayId: string, headline: string): Trip | undefined {
  const trip = getTrip(tripId);
  if (!trip) return undefined;
  const day = trip.days.find(d => d.id === dayId);
  if (!day) return undefined;
  day.headline = headline;
  updateTrip(trip);
  return trip;
}
