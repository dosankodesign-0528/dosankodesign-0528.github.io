'use client';

// ========================================
// 地図表示コンポーネント（Google Maps iOSアプリ風）
// ピンのデザインや操作感をGoogle Mapsに近づけている
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

// ─── 定数 ───
const DEFAULT_CENTER: L.LatLngExpression = [35.6762, 139.6503];
const DEFAULT_ZOOM = 6;

// Google Maps風のマップタイル（CartoDB Voyager = Google Mapsに近い見た目）
const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ─── 型定義 ───
interface MapViewProps {
  spots: Spot[];
  selectedSpotId: string | null;
  onSpotSelect: (spotId: string) => void;
}

// ========================================
// Google Maps風ピンアイコンの生成
// Google Mapsのピンは「丸い頭＋尖った下部」のドロップ型
// ========================================
function createGoogleStylePin(spot: Spot, isSelected: boolean): L.DivIcon {
  const config = SPOT_CONFIG[spot.type];
  const scale = isSelected ? 1.3 : 1;
  const shadow = isSelected
    ? '0 4px 12px rgba(0,0,0,0.4)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  // Google Maps風ドロップピンをSVGで描画
  const pinHtml = `
    <div style="
      transform: scale(${scale});
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(${shadow});
      cursor: pointer;
    ">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- ピン本体（ドロップ型） -->
        <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
              fill="${config.color}" />
        <!-- 内側の白い円 -->
        <circle cx="16" cy="15" r="8" fill="white" opacity="0.95"/>
      </svg>
      <!-- アイコン（中央に配置） -->
      <div style="
        position: absolute;
        top: 6px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 14px;
        line-height: 20px;
      ">${config.icon}</div>
    </div>
  `;

  return L.divIcon({
    className: '', // Leafletデフォルトのスタイルを無効化
    html: pinHtml,
    iconSize: [32, 42],
    iconAnchor: [16, 42],    // ピンの先端を座標に合わせる
    popupAnchor: [0, -38],   // ポップアップをピンの上に表示
  });
}

// Google Maps風のスポット番号付きピン（順番がわかるように）
function createNumberedPin(spot: Spot, index: number, isSelected: boolean): L.DivIcon {
  const config = SPOT_CONFIG[spot.type];
  const scale = isSelected ? 1.3 : 1;
  const shadow = isSelected
    ? '0 4px 12px rgba(0,0,0,0.4)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  const pinHtml = `
    <div style="
      transform: scale(${scale});
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(${shadow});
      cursor: pointer;
      position: relative;
    ">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
        <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
              fill="${config.color}" />
        <circle cx="16" cy="15" r="9" fill="white" opacity="0.95"/>
      </svg>
      <div style="
        position: absolute;
        top: 5px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
        line-height: 20px;
        color: ${config.color};
      ">${spot.isMain ? config.icon : index + 1}</div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html: pinHtml,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

// ========================================
// 地図の表示範囲をスポットに合わせて自動調整
// ========================================
function FitBounds({ spots }: { spots: Spot[] }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    const validSpots = spots.filter(
      (s): s is Spot & { lat: number; lng: number } => s.lat != null && s.lng != null
    );
    if (validSpots.length === 0) return;

    // スポット数が変わった時だけフィット（毎回動くとうっとうしい）
    if (validSpots.length !== prevCountRef.current) {
      if (validSpots.length === 1) {
        map.setView([validSpots[0].lat, validSpots[0].lng], 14, { animate: true, duration: 0.5 });
      } else {
        const bounds = L.latLngBounds(validSpots.map(s => [s.lat, s.lng] as L.LatLngTuple));
        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 0.5 });
      }
      prevCountRef.current = validSpots.length;
    }
  }, [spots, map]);

  return null;
}

// ========================================
// 選択したスポットにスムーズに移動
// ========================================
function PanToSelected({ spots, selectedSpotId }: { spots: Spot[]; selectedSpotId: string | null }) {
  const map = useMap();
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSpotId && selectedSpotId !== prevRef.current) {
      const spot = spots.find(s => s.id === selectedSpotId);
      if (spot?.lat != null && spot?.lng != null) {
        // Google Maps風のスムーズなパン
        map.panTo([spot.lat, spot.lng], { animate: true, duration: 0.4, easeLinearity: 0.5 });
      }
    }
    prevRef.current = selectedSpotId;
  }, [selectedSpotId, spots, map]);

  return null;
}

// ========================================
// メインの地図コンポーネント
// ========================================
export default function MapView({ spots, selectedSpotId, onSpotSelect }: MapViewProps) {
  const geoSpots = useMemo(
    () => spots.filter((s): s is Spot & { lat: number; lng: number } => s.lat != null && s.lng != null),
    [spots]
  );

  // スポット間を結ぶルート線の座標
  const polylinePositions = useMemo<L.LatLngTuple[]>(
    () => geoSpots.map(s => [s.lat, s.lng]),
    [geoSpots]
  );

  // SSR回避
  if (typeof window === 'undefined') {
    return <div style={{ width: '100%', height: '100%', background: '#E8EAED' }} />;
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl={false}           // デフォルトの+/-ボタンを非表示（Google Maps iOSアプリにはない）
      attributionControl={false}    // 著作権表示を非表示（後で小さく追加）
      inertia                       // 慣性スクロール（指を離してもスーッと動く）
      inertiaDeceleration={3000}    // 慣性の減速度
      zoomAnimation                 // ズームアニメーション有効
      markerZoomAnimation           // マーカーのズームアニメーション
    >
      {/* Google Maps風の地図タイル */}
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        maxZoom={19}
        subdomains="abcd"
      />

      {/* 小さめの著作権表示（右下に） */}
      <div
        className="leaflet-bottom leaflet-right"
        style={{ fontSize: 10, opacity: 0.5, padding: '2px 4px', pointerEvents: 'none' }}
      />

      {/* 表示範囲の自動調整 */}
      <FitBounds spots={geoSpots} />
      <PanToSelected spots={geoSpots} selectedSpotId={selectedSpotId} />

      {/* Google Maps風のルート線（実線、色付き、半透明） */}
      {polylinePositions.length >= 2 && (
        <>
          {/* 外側の太い線（影の役割） */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#4285F4',
              weight: 5,
              opacity: 0.3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* 内側の細い線（メインの線） */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#4285F4',
              weight: 3,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}

      {/* 各スポットのピン */}
      {geoSpots.map((spot, idx) => {
        const isSelected = spot.id === selectedSpotId;
        const config = SPOT_CONFIG[spot.type];

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={createNumberedPin(spot, idx, isSelected)}
            zIndexOffset={isSelected ? 1000 : spot.isMain ? 500 : 0}
            eventHandlers={{
              click: () => onSpotSelect(spot.id),
            }}
          >
            {/* Google Maps風の情報カードポップアップ */}
            <Popup
              closeButton={false}
              className="google-maps-popup"
              autoPan
              autoPanPadding={L.point(40, 40)}
            >
              <div style={{
                padding: '8px 12px',
                minWidth: 150,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}>
                  <span style={{
                    background: config.color,
                    color: 'white',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {config.icon} {config.label}
                  </span>
                  {spot.time && (
                    <span style={{ fontSize: 13, color: '#5F6368', fontWeight: 500 }}>
                      {spot.time}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1A1A1A',
                  lineHeight: 1.3,
                }}>
                  {spot.name}
                </div>
                {spot.memo && (
                  <div style={{
                    fontSize: 12,
                    color: '#70757A',
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}>
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
