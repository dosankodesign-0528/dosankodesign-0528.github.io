import { Trip, Spot, SpotType, TransportType } from './types';

/** ドラフトスポット = 通常の Spot + 挿入位置情報 */
export interface DraftSpot extends Spot {
  /** タイムライン上で「この spotId の後」に挿入（nullなら末尾） */
  afterSpotId: string | null;
}

/** 旅程を分析してドラフトスポットを生成 */
export function analyzeTrip(trip: Trip): DraftSpot[] {
  const drafts: DraftSpot[] = [];

  for (const day of trip.days) {
    const sorted = [...day.spots].sort((a, b) => a.sortOrder - b.sortOrder);

    // 1. 目的地が連続（間に移動スポットがない）→ 移動ドラフトを挿入
    const nonTransit = sorted.filter(s => s.type !== 'transit');
    const transits = sorted.filter(s => s.type === 'transit');
    for (let i = 0; i < nonTransit.length - 1; i++) {
      const current = nonTransit[i];
      const next = nonTransit[i + 1];
      const hasBetween = transits.some(t =>
        t.sortOrder > current.sortOrder && t.sortOrder < next.sortOrder
      );
      if (!hasBetween && current.type !== 'hotel' && next.type !== 'hotel') {
        drafts.push({
          id: `draft-transit-${day.id}-${i}`,
          dayId: day.id,
          name: `${current.name} → ${next.name}`,
          type: 'transit',
          isMain: false,
          time: '',
          sortOrder: current.sortOrder + 0.5,
          afterSpotId: current.id,
        });
      }
    }

    // 2. ホテルがない日（最終日以外）
    if (day.dayNum < trip.days.length) {
      const hasHotel = sorted.some(s => s.type === 'hotel');
      if (!hasHotel) {
        const lastSpot = sorted[sorted.length - 1];
        const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(s => s.sortOrder)) + 1 : 1;
        drafts.push({
          id: `draft-hotel-${day.id}`,
          dayId: day.id,
          name: '宿泊先',
          type: 'hotel',
          isMain: false,
          time: '',
          sortOrder: maxOrder,
          afterSpotId: lastSpot?.id ?? null,
        });
      }
    }

    // 3. 食事スポットがない日
    const hasFood = sorted.some(s => s.type === 'food');
    if (!hasFood && sorted.length >= 2) {
      // 昼食あたりの位置に挿入（中間付近のスポットの後）
      const midIdx = Math.floor(sorted.length / 2);
      const midSpot = sorted[midIdx];
      drafts.push({
        id: `draft-food-${day.id}`,
        dayId: day.id,
        name: '食事',
        type: 'food',
        isMain: false,
        time: '',
        sortOrder: midSpot.sortOrder + 0.5,
        afterSpotId: midSpot.id,
      });
    }
  }

  return drafts;
}

/** ドラフトスポットの不足情報を返す */
export function getMissingInfo(spot: Spot): string[] {
  const missing: string[] = [];
  if (!spot.time || spot.time.trim() === '') missing.push('時刻');
  if (spot.type === 'transit' && !spot.transport) missing.push('移動手段');
  if (spot.name === '宿泊先' || spot.name === '食事') missing.push('名前');
  return missing;
}
