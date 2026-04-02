'use client';

// ========================================
// 地図表示コンポーネント（Google Maps iOSアプリ風）
// ピンのデザインや操作感をGoogle Mapsに近づけている
// ========================================

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import { Spot, getSpotConfig } from '../lib/types';

// ─── 定数 ───
// デフォルト: 日本中心
const DEFAULT_CENTER: L.LatLngExpression = [36.5, 137.5];
const DEFAULT_ZOOM = 6;

// 日本語ラベルのマップタイル（OpenStreetMap Japan）
const TILE_URL =
  'https://tile.openstreetmap.jp/styles/osm-bright-ja/512/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
  const config = getSpotConfig(spot.type);
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
  const config = getSpotConfig(spot.type);
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
// 初回表示時にピンが全部見える範囲に自動ズーム
// ========================================
function FitBounds({ spots }: { spots: Spot[] }) {
  const map = useMap();
  const fittedRef = useRef(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const validSpots = spots.filter(
      (s): s is Spot & { lat: number; lng: number } => s.lat != null && s.lng != null
    );
    if (validSpots.length === 0) return;

    // 初回 or スポット数変更時にフィット
    if (!fittedRef.current || validSpots.length !== prevCountRef.current) {
      if (validSpots.length === 1) {
        map.setView([validSpots[0].lat, validSpots[0].lng], 14, { animate: true, duration: 0.5 });
      } else {
        const bounds = L.latLngBounds(validSpots.map(s => [s.lat, s.lng] as L.LatLngTuple));
        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 0.5 });
      }
      fittedRef.current = true;
      prevCountRef.current = validSpots.length;
    }
  }, [spots, map]);

  return null;
}

// ========================================
// 現在地ボタン（Google Maps風 右下）
// ========================================
function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('このブラウザでは位置情報を取得できません');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15, { animate: true, duration: 0.5 });
        onLocate(latitude, longitude);
        setLocating(false);
      },
      () => {
        alert('位置情報を取得できませんでした。\n設定で位置情報の許可を確認してください。');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, onLocate]);

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: 16, marginRight: 10, zIndex: 1000 }}>
      <div className="leaflet-control">
        <button
          onClick={handleLocate}
          disabled={locating}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'white',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: locating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: locating ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
          aria-label="現在地を表示"
        >
          {/* Google Maps風の現在地アイコン（十字＋丸） */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" fill={locating ? '#4285F4' : 'none'} stroke={locating ? '#4285F4' : '#666'} />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
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
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const geoSpots = useMemo(
    () => spots.filter((s): s is Spot & { lat: number; lng: number } => s.lat != null && s.lng != null),
    [spots]
  );

  // 初期表示の中心: ピンがあればその中心、なければ日本
  const initialCenter = useMemo<L.LatLngExpression>(() => {
    if (geoSpots.length === 0) return DEFAULT_CENTER;
    if (geoSpots.length === 1) return [geoSpots[0].lat, geoSpots[0].lng];
    const avgLat = geoSpots.reduce((s, p) => s + p.lat, 0) / geoSpots.length;
    const avgLng = geoSpots.reduce((s, p) => s + p.lng, 0) / geoSpots.length;
    return [avgLat, avgLng];
  }, [geoSpots]);

  const initialZoom = useMemo(() => geoSpots.length > 0 ? 10 : DEFAULT_ZOOM, [geoSpots]);

  // スポット間を結ぶルート線の座標
  const polylinePositions = useMemo<L.LatLngTuple[]>(
    () => geoSpots.map(s => [s.lat, s.lng]),
    [geoSpots]
  );

  const handleLocate = useCallback((lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
  }, []);

  // SSR回避
  if (typeof window === 'undefined') {
    return <div style={{ width: '100%', height: '100%', background: '#E8EAED' }} />;
  }

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      inertia
      inertiaDeceleration={3000}
      zoomAnimation
      markerZoomAnimation
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        maxZoom={19}
      />

      {/* 表示範囲の自動調整 */}
      <FitBounds spots={geoSpots} />
      <PanToSelected spots={geoSpots} selectedSpotId={selectedSpotId} />

      {/* 現在地ボタン（右下） */}
      <LocateButton onLocate={handleLocate} />

      {/* 現在地の青い丸マーカー（Google Maps風） */}
      {currentLocation && (
        <>
          {/* 外側の薄い円（精度範囲） */}
          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            radius={20}
            pathOptions={{
              color: '#4285F4',
              weight: 0,
              fillColor: '#4285F4',
              fillOpacity: 0.1,
            }}
          />
          {/* 内側の青い丸 */}
          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            radius={7}
            pathOptions={{
              color: 'white',
              weight: 2.5,
              fillColor: '#4285F4',
              fillOpacity: 1,
            }}
          />
        </>
      )}

      {/* ルート線 */}
      {polylinePositions.length >= 2 && (
        <>
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
        const config = getSpotConfig(spot.type);

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
