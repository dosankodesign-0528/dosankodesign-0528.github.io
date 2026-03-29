// ========================================
// 旅行のしおりアプリで使うデータの「型」定義
// どんな情報を持つか、の設計図みたいなもの
// ========================================

/** スポットの種類（目的地、移動、ホテル、グルメ、空港） */
export type SpotType = 'destination' | 'transit' | 'hotel' | 'food' | 'airport';

/** 移動手段 */
export type TransportType = 'train' | 'car' | 'walk' | 'bus' | 'plane' | 'ferry' | 'taxi' | 'other';

/** 1つのスポット（行き先・立ち寄り場所）の情報 */
export interface Spot {
  id: string;
  dayId: string;
  name: string;
  type: SpotType;
  isMain: boolean;        // メイン目的地かどうか
  time: string;           // 到着予定時間 (HH:MM)
  endTime?: string;       // 出発予定時間 (HH:MM)
  transport?: TransportType;
  lat?: number;           // 緯度
  lng?: number;           // 経度
  memo?: string;
  sortOrder: number;
}

/** 1日分の日程 */
export interface Day {
  id: string;
  tripId: string;
  dayNum: number;         // 何日目か (1, 2, 3...)
  headline: string;       // その日のタイトル（例: 富士サファリパーク）
  spots: Spot[];
}

/** 旅行プラン全体 */
export interface Trip {
  id: string;
  title: string;
  startDate: string;      // 出発日 (YYYY-MM-DD)
  endDate: string;        // 帰着日 (YYYY-MM-DD)
  shareId: string;        // 共有用のランダムID
  days: Day[];
  createdAt: string;
  updatedAt: string;
}

/** スポット種類ごとの色とアイコン */
export const SPOT_CONFIG: Record<SpotType, { color: string; label: string; icon: string }> = {
  destination: { color: '#EA4335', label: '目的地', icon: '📍' },
  transit:     { color: '#70757A', label: '移動・経由', icon: '🚃' },
  hotel:       { color: '#7C3AED', label: '宿泊', icon: '🏨' },
  food:        { color: '#F59E0B', label: 'グルメ', icon: '🍽️' },
  airport:     { color: '#1A73E8', label: '空港', icon: '✈️' },
};

/** 移動手段のラベル */
export const TRANSPORT_LABELS: Record<TransportType, string> = {
  train: '電車',
  car: '車',
  walk: '徒歩',
  bus: 'バス',
  plane: '飛行機',
  ferry: 'フェリー',
  taxi: 'タクシー',
  other: 'その他',
};
