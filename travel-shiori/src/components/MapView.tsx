'use client';

// ========================================
// 地図表示コンポーネント
// Leafletを使って旅行スポットをマーカー付きで表示する
// ========================================

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import { Spot, SPOT_CONFIG } from '../lib/types';

// ========================================
// 定数
// ========================================

/** スポットがない場合のデフォルト中心座標（東京） */
const DEFAULT_CENTER: L.LatLngExpression = [35.6762, 139.6503];

/** デフォルトのズームレベル */
const DEFAULT_ZOOM = 6;

/** CartoDB Voyager タイルURL */
const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

/** タイルのアトリビューション */
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ========================================
// Props定義
// ========================================

interface MapViewProps {
  /** 表示するスポット一覧 */
  spots: Spot[];
  /** 現在選択中のスポットID */
  selectedSpotId: string | null;
  /** スポットが選択された時のコールバック */
  onSpotSelect: (spotId: string) => void;
}

// ========================================
// カスタムマーカーアイコン生成
// ========================================

/**
 * スポットの種類に応じた色付きピンアイコンを生成する
 * 選択中のスポットは少し大きく表示する
 */
function createSpotIcon(spot: Spot, isSelected: boolean): L.DivIcon {
  const config = SPOT_CONFIG[spot.type];
  const size = isSelected ? 32 : 24;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: 'custom-spot-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${config.color};
        border: ${borderWidth}px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${isSelected ? '0 0 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)'};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${isSelected ? 14 : 11}px;
          line-height: 1;
        ">${config.icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// ========================================
// 地図の表示範囲を自動調整するサブコンポーネント
// ========================================

/**
 * スポット一覧が変わったら、全マーカーが収まるように地図をフィットさせる
 */
function FitBounds({ spots }: { spots: Spot[] }) {
  const map = useMap();

  useEffect(() => {
    // 座標を持つスポットだけ抽出
    const validSpots = spots.filter(
      (s): s is Spot & { lat: number; lng: number } =>
        s.lat != null && s.lng != null
    );

    if (validSpots.length === 0) return;

    if (validSpots.length === 1) {
      // スポットが1つだけの場合はそこにズーム
      map.setView([validSpots[0].lat, validSpots[0].lng], 14, {
        animate: true,
      });
    } else {
      // 複数スポットがある場合は全体が収まるようにフィット
      const bounds = L.latLngBounds(
        validSpots.map((s) => [s.lat, s.lng] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [spots, map]);

  return null;
}

// ========================================
// 選択されたスポットにパンするサブコンポーネント
// ========================================

/**
 * 選択中のスポットが変わったら、そのスポットの位置にスムーズに移動する
 */
function PanToSelected({
  spots,
  selectedSpotId,
}: {
  spots: Spot[];
  selectedSpotId: string | null;
}) {
  const map = useMap();
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    // 選択が変わった時だけ実行（初期表示時はFitBoundsに任せる）
    if (
      selectedSpotId &&
      selectedSpotId !== prevSelectedRef.current
    ) {
      const spot = spots.find((s) => s.id === selectedSpotId);
      if (spot?.lat != null && spot?.lng != null) {
        map.panTo([spot.lat, spot.lng], { animate: true });
      }
    }
    prevSelectedRef.current = selectedSpotId;
  }, [selectedSpotId, spots, map]);

  return null;
}

// ========================================
// メインコンポーネント
// ========================================

export default function MapView({
  spots,
  selectedSpotId,
  onSpotSelect,
}: MapViewProps) {
  // 座標を持つスポットのみ抽出
  const geoSpots = useMemo(
    () =>
      spots.filter(
        (s): s is Spot & { lat: number; lng: number } =>
          s.lat != null && s.lng != null
      ),
    [spots]
  );

  // スポット同士を結ぶポリライン座標
  const polylinePositions = useMemo<L.LatLngTuple[]>(
    () => geoSpots.map((s) => [s.lat, s.lng]),
    [geoSpots]
  );

  // SSR回避: サーバーサイドでは何も描画しない
  // （Leafletはwindowオブジェクトに依存するため）
  if (typeof window === 'undefined') {
    return (
      <div
        style={{ width: '100%', height: '100%', background: '#f0f0f0' }}
        aria-label="地図を読み込み中..."
      />
    );
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      {/* 地図タイル（CartoDB Voyager） */}
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {/* 全マーカーが収まるように自動調整 */}
      <FitBounds spots={geoSpots} />

      {/* 選択スポットへのパン */}
      <PanToSelected spots={geoSpots} selectedSpotId={selectedSpotId} />

      {/* スポット間を結ぶ線 */}
      {polylinePositions.length >= 2 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#6B7280',
            weight: 2,
            opacity: 0.6,
            dashArray: '6, 8',
          }}
        />
      )}

      {/* 各スポットのマーカー */}
      {geoSpots.map((spot) => {
        const isSelected = spot.id === selectedSpotId;
        const config = SPOT_CONFIG[spot.type];

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={createSpotIcon(spot, isSelected)}
            eventHandlers={{
              click: () => onSpotSelect(spot.id),
            }}
          >
            <Popup>
              <div style={{ minWidth: 120 }}>
                <strong>
                  {config.icon} {spot.name}
                </strong>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: config.color,
                      color: '#fff',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 11,
                      marginRight: 4,
                    }}
                  >
                    {config.label}
                  </span>
                  {spot.time && <span>{spot.time}</span>}
                </div>
                {spot.memo && (
                  <div style={{ fontSize: 12, marginTop: 4, color: '#444' }}>
                    {spot.memo}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
