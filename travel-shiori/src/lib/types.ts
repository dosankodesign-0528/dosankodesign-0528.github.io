// ========================================
// 旅行のしおりアプリで使うデータの「型」定義
// どんな情報を持つか、の設計図みたいなもの
// ========================================

/** スポットのカテゴリ（目的地、移動・経由、ホテル、食事） */
export type SpotType = 'destination' | 'transit' | 'hotel' | 'food';

/** 移動手段 */
export type TransportType = 'subway' | 'shinkansen' | 'taxi' | 'bus' | 'walk';

/** 人物フィルター */
export type AssigneeType = 'all' | 'parents' | 'son';

/** 人物フィルターの設定 */
export const ASSIGNEE_CONFIG: Record<AssigneeType, { label: string; icon: string }> = {
  all: { label: 'みんな', icon: '👨‍👩‍👦' },
  parents: { label: '両親', icon: '👫' },
  son: { label: '息子', icon: '🧑' },
};

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
  assignee?: AssigneeType; // 誰のスケジュールか（未設定=みんな）
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
  deletedAt?: string;       // ゴミ箱に入れた日時（未設定=通常、設定済み=ゴミ箱）
}

/** カテゴリごとの色とアイコン */
const SPOT_CONFIG_FALLBACK = { color: '#70757A', label: 'その他', icon: '📌' };
export const SPOT_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  destination: { color: '#EA4335', label: '目的地', icon: '📍' },
  transit:     { color: '#70757A', label: '移動・経由', icon: '🚃' },
  hotel:       { color: '#7C3AED', label: 'ホテル', icon: '🏨' },
  food:        { color: '#F59E0B', label: '食事', icon: '🍽️' },
};

/** カテゴリ設定を安全に取得（旧タイプのフォールバック付き） */
export function getSpotConfig(type: string) {
  return SPOT_CONFIG[type] ?? SPOT_CONFIG_FALLBACK;
}

/** Day ごとのカラーテーマ（ピン・見出し共通） */
export const DAY_COLORS = [
  { hex: '#2563EB', bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  { hex: '#059669', bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { hex: '#D97706', bg: 'bg-amber-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  { hex: '#9333EA', bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
];

/** dayNum（1始まり）からDay色を取得 */
export function getDayColor(dayNum: number) {
  return DAY_COLORS[(dayNum - 1) % DAY_COLORS.length];
}

/** 移動手段のラベル */
export const TRANSPORT_LABELS: Record<string, string> = {
  subway: '地下鉄',
  shinkansen: '新幹線',
  taxi: 'タクシー',
  bus: 'バス',
  walk: '徒歩',
  car: '車',
  plane: '飛行機',
  other: 'その他',
};
