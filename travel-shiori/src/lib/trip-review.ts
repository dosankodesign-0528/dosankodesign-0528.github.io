import { Trip, Spot, SpotType, TransportType } from './types';

/** AIレビューの提案1件 */
export interface ReviewSuggestion {
  id: string;
  dayId: string;
  dayNum: number;
  type: 'missing_transport' | 'missing_time' | 'missing_hotel' | 'missing_meal' | 'missing_headline' | 'long_gap';
  severity: 'warning' | 'info';
  message: string;
  /** 提案するスポットデータ（確定時に追加） */
  suggestedSpot?: {
    name: string;
    type: SpotType;
    time?: string;
    endTime?: string;
    transport?: TransportType;
    sortOrder: number;
  };
}

/** 旅程を分析して改善提案を生成 */
export function analyzeTrip(trip: Trip): ReviewSuggestion[] {
  const suggestions: ReviewSuggestion[] = [];
  let idCounter = 0;
  const nextId = () => `review-${++idCounter}`;

  for (const day of trip.days) {
    const sorted = [...day.spots].sort((a, b) => a.sortOrder - b.sortOrder);

    // 1. ヘッドラインが空
    if (!day.headline || day.headline.trim() === '') {
      suggestions.push({
        id: nextId(),
        dayId: day.id,
        dayNum: day.dayNum,
        type: 'missing_headline',
        severity: 'info',
        message: `${day.dayNum}日目のタイトルが未設定です`,
      });
    }

    // 2. 時刻が未設定のスポット
    for (const spot of sorted) {
      if (!spot.time || spot.time.trim() === '') {
        suggestions.push({
          id: nextId(),
          dayId: day.id,
          dayNum: day.dayNum,
          type: 'missing_time',
          severity: 'warning',
          message: `「${spot.name}」の時刻が未設定です`,
        });
      }
    }

    // 3. 移動スポットで移動手段が未設定
    for (const spot of sorted) {
      if (spot.type === 'transit' && !spot.transport) {
        suggestions.push({
          id: nextId(),
          dayId: day.id,
          dayNum: day.dayNum,
          type: 'missing_transport',
          severity: 'warning',
          message: `「${spot.name}」の移動手段が未設定です`,
        });
      }
    }

    // 4. 目的地が2つ以上連続（間に移動スポットがない）
    const nonTransit = sorted.filter(s => s.type !== 'transit');
    const transits = sorted.filter(s => s.type === 'transit');
    for (let i = 0; i < nonTransit.length - 1; i++) {
      const current = nonTransit[i];
      const next = nonTransit[i + 1];
      // current と next の間に transit があるか確認
      const hasBetween = transits.some(t =>
        t.sortOrder > current.sortOrder && t.sortOrder < next.sortOrder
      );
      if (!hasBetween && current.type !== 'hotel' && next.type !== 'hotel') {
        const afterOrder = current.sortOrder + 0.5;
        suggestions.push({
          id: nextId(),
          dayId: day.id,
          dayNum: day.dayNum,
          type: 'missing_transport',
          severity: 'info',
          message: `「${current.name}」→「${next.name}」間の移動が未設定`,
          suggestedSpot: {
            name: `${current.name} → ${next.name}`,
            type: 'transit',
            sortOrder: afterOrder,
          },
        });
      }
    }

    // 5. ホテルがない日（最終日以外）
    if (day.dayNum < trip.days.length) {
      const hasHotel = sorted.some(s => s.type === 'hotel');
      if (!hasHotel) {
        const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(s => s.sortOrder)) + 1 : 1;
        suggestions.push({
          id: nextId(),
          dayId: day.id,
          dayNum: day.dayNum,
          type: 'missing_hotel',
          severity: 'info',
          message: `${day.dayNum}日目の宿泊先が未設定です`,
          suggestedSpot: {
            name: '宿泊先',
            type: 'hotel',
            sortOrder: maxOrder,
          },
        });
      }
    }

    // 6. 食事スポットがない日
    const hasFood = sorted.some(s => s.type === 'food');
    if (!hasFood && sorted.length >= 2) {
      suggestions.push({
        id: nextId(),
        dayId: day.id,
        dayNum: day.dayNum,
        type: 'missing_meal',
        severity: 'info',
        message: `${day.dayNum}日目の食事プランがありません`,
      });
    }

    // 7. 長い時間ギャップ（3時間以上）
    const withTime = sorted.filter(s => s.time && s.time.trim() !== '');
    for (let i = 0; i < withTime.length - 1; i++) {
      const current = withTime[i];
      const next = withTime[i + 1];
      const endT = current.endTime || current.time;
      const gap = timeToMinutes(next.time) - timeToMinutes(endT);
      if (gap >= 180) {
        const hours = Math.floor(gap / 60);
        suggestions.push({
          id: nextId(),
          dayId: day.id,
          dayNum: day.dayNum,
          type: 'long_gap',
          severity: 'info',
          message: `「${current.name}」→「${next.name}」間に${hours}時間の空きがあります`,
        });
      }
    }
  }

  return suggestions;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
