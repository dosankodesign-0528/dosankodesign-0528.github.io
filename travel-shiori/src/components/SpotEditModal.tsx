'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spot, SpotType, TransportType, SPOT_CONFIG, TRANSPORT_LABELS } from '../lib/types';

export interface SpotFormData {
  name: string;
  type: SpotType;
  isMain: boolean;
  time: string;
  endTime?: string;
  transport?: TransportType;
  lat?: number;
  lng?: number;
  memo?: string;
}

interface SpotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spot: SpotFormData) => void;
  initialData?: Partial<Spot>;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// ==============================
// DrumPicker Sub-component
// ==============================
function DrumPicker({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const ITEM_HEIGHT = 40;
  const VISIBLE_COUNT = 5;

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isScrollingRef.current) return;
    el.scrollTo({ top: selectedIndex * ITEM_HEIGHT, behavior: 'smooth' });
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isScrollingRef.current = true;

    // Use a timeout to detect when scrolling has stopped (snap settled)
    clearTimeout((el as any)._scrollTimer);
    (el as any)._scrollTimer = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      isScrollingRef.current = false;
      if (clamped !== selectedIndex) {
        onChange(clamped);
      }
    }, 80);
  }, [items.length, selectedIndex, onChange]);

  return (
    <div
      className="drum-picker"
      style={{
        position: 'relative',
        height: ITEM_HEIGHT * VISIBLE_COUNT,
        overflow: 'hidden',
      }}
    >
      {/* Highlight bar */}
      <div
        className="drum-highlight"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          background: 'rgba(120,120,128,0.12)',
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Top gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Bottom gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* Top padding (2 empty slots) */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              height: ITEM_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              scrollSnapAlign: 'start',
              fontSize: i === selectedIndex ? 20 : 16,
              fontWeight: i === selectedIndex ? 600 : 400,
              color: i === selectedIndex ? '#000' : '#8e8e93',
              transition: 'font-size 0.15s, color 0.15s',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => {
              onChange(i);
              containerRef.current?.scrollTo({
                top: i * ITEM_HEIGHT,
                behavior: 'smooth',
              });
            }}
          >
            {item}
          </div>
        ))}
        {/* Bottom padding (2 empty slots) */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
}

// ==============================
// TimePicker component using DrumPicker
// ==============================
function TimePicker({
  value,
  onChange,
}: {
  value: string; // "HH:MM"
  onChange: (val: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  const [h, m] = value.split(':');
  const hourIndex = hours.indexOf(h) >= 0 ? hours.indexOf(h) : 0;
  const minuteIndex = minutes.indexOf(m) >= 0 ? minutes.indexOf(m) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1 }}>
        <DrumPicker
          items={hours}
          selectedIndex={hourIndex}
          onChange={(i) => onChange(`${hours[i]}:${minutes[minuteIndex]}`)}
        />
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#000',
          paddingBottom: 2,
        }}
      >
        :
      </div>
      <div style={{ flex: 1 }}>
        <DrumPicker
          items={minutes}
          selectedIndex={minuteIndex}
          onChange={(i) => onChange(`${hours[hourIndex]}:${minutes[i]}`)}
        />
      </div>
    </div>
  );
}

// ==============================
// Main SpotEditModal
// ==============================
export default function SpotEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: SpotEditModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<SpotType>(initialData?.type ?? 'destination');
  const [isMain, setIsMain] = useState(initialData?.isMain ?? false);
  const [time, setTime] = useState(initialData?.time ?? '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime ?? '');
  const [showEndTime, setShowEndTime] = useState(!!initialData?.endTime);
  const [transport, setTransport] = useState<TransportType | undefined>(initialData?.transport);
  const [lat, setLat] = useState<number | undefined>(initialData?.lat);
  const [lng, setLng] = useState<number | undefined>(initialData?.lng);
  const [memo, setMemo] = useState(initialData?.memo ?? '');

  // Search state
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation state
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Reset form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? '');
      setType(initialData?.type ?? 'destination');
      setIsMain(initialData?.isMain ?? false);
      setTime(initialData?.time ?? '09:00');
      setEndTime(initialData?.endTime ?? '');
      setShowEndTime(!!initialData?.endTime);
      setTransport(initialData?.transport);
      setLat(initialData?.lat);
      setLng(initialData?.lng);
      setMemo(initialData?.memo ?? '');
      setSearchResults([]);
      setShowResults(false);

      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData]);

  // Nominatim search with debounce
  const handleNameChange = (val: string) => {
    setName(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&accept-language=ja`
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
  };

  const selectSearchResult = (result: NominatimResult) => {
    // Use the short part of display_name (first segment)
    const shortName = result.display_name.split(',')[0].trim();
    setName(shortName);
    setLat(parseFloat(result.lat));
    setLng(parseFloat(result.lon));
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data: SpotFormData = {
      name: name.trim(),
      type,
      isMain,
      time,
      ...(showEndTime && endTime ? { endTime } : {}),
      ...(type === 'transit' && transport ? { transport } : {}),
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
      ...(memo.trim() ? { memo: memo.trim() } : {}),
    };
    onSave(data);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!visible) return null;

  const spotTypes = Object.keys(SPOT_CONFIG) as SpotType[];
  const transportTypes = Object.keys(TRANSPORT_LABELS) as TransportType[];

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transition: opacity 0.3s ease;
        }
        .modal-sheet {
          background: #f2f2f7;
          border-radius: 12px 12px 0 0;
          width: 100%;
          max-width: 500px;
          max-height: 92vh;
          overflow-y: auto;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          padding-bottom: env(safe-area-inset-bottom, 20px);
          -webkit-overflow-scrolling: touch;
        }
        .modal-sheet.open {
          transform: translateY(0);
        }
        .ios-input {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          background: #fff;
          font-size: 17px;
          color: #000;
          outline: none;
          -webkit-appearance: none;
        }
        .ios-input::placeholder {
          color: #c7c7cc;
        }
        .ios-input:focus {
          box-shadow: 0 0 0 2px rgba(0,122,255,0.3);
        }
        .ios-button {
          padding: 8px 16px;
          border: none;
          background: none;
          font-size: 17px;
          cursor: pointer;
          color: #007aff;
        }
        .drum-picker div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        className="modal-overlay"
        style={{ opacity: animateIn ? 1 : 0 }}
        onClick={handleBackdropClick}
      >
        <div className={`modal-sheet ${animateIn ? 'open' : ''}`}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div
              style={{
                width: 36,
                height: 5,
                borderRadius: 2.5,
                background: '#c7c7cc',
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px 12px',
              borderBottom: '0.5px solid #c6c6c8',
            }}
          >
            <button className="ios-button" onClick={onClose} style={{ fontWeight: 400 }}>
              キャンセル
            </button>
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              {initialData?.id ? 'スポット編集' : 'スポット追加'}
            </span>
            <button
              className="ios-button"
              onClick={handleSave}
              style={{ fontWeight: 600, opacity: name.trim() ? 1 : 0.4 }}
              disabled={!name.trim()}
            >
              保存
            </button>
          </div>

          {/* Form body */}
          <div style={{ padding: '16px' }}>
            {/* Name field */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6, display: 'block', paddingLeft: 4 }}>
                スポット名
              </label>
              <input
                className="ios-input"
                type="text"
                placeholder="場所を検索..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    zIndex: 10,
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  {searchResults.map((result, i) => (
                    <div
                      key={i}
                      onMouseDown={() => selectSearchResult(result)}
                      style={{
                        padding: '12px 16px',
                        fontSize: 15,
                        color: '#000',
                        cursor: 'pointer',
                        borderBottom: i < searchResults.length - 1 ? '0.5px solid #e5e5ea' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f2f7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <div style={{ fontWeight: 500 }}>{result.display_name.split(',')[0]}</div>
                      <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.display_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spot type selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6, display: 'block', paddingLeft: 4 }}>
                タイプ
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  WebkitOverflowScrolling: 'touch',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {spotTypes.map((st) => {
                  const config = SPOT_CONFIG[st];
                  const selected = type === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setType(st)}
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: 'none',
                        background: selected ? config.color : '#fff',
                        color: selected ? '#fff' : '#000',
                        fontSize: 15,
                        fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selected ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Is Main toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 17 }}>メイン目的地</span>
              <button
                onClick={() => setIsMain(!isMain)}
                style={{
                  width: 51,
                  height: 31,
                  borderRadius: 15.5,
                  border: 'none',
                  background: isMain ? '#34c759' : '#e9e9eb',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 27,
                    height: 27,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    position: 'absolute',
                    top: 2,
                    left: isMain ? 22 : 2,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>

            {/* Time picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6, display: 'block', paddingLeft: 4 }}>
                開始時刻
              </label>
              <div style={{ background: '#fff', borderRadius: 10, padding: '8px 16px' }}>
                <TimePicker value={time} onChange={setTime} />
              </div>
            </div>

            {/* End time - collapsible */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => {
                  setShowEndTime(!showEndTime);
                  if (!endTime) setEndTime(time);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: '#007aff',
                  cursor: 'pointer',
                  padding: '4px 4px',
                  marginBottom: showEndTime ? 6 : 0,
                }}
              >
                <span style={{
                  display: 'inline-block',
                  transform: showEndTime ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  ▶
                </span>
                終了時刻を{showEndTime ? '非表示' : '追加'}
              </button>
              {showEndTime && (
                <div style={{ background: '#fff', borderRadius: 10, padding: '8px 16px' }}>
                  <TimePicker value={endTime || time} onChange={setEndTime} />
                </div>
              )}
            </div>

            {/* Transport selector (only for transit) */}
            {type === 'transit' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6, display: 'block', paddingLeft: 4 }}>
                  移動手段
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {transportTypes.map((tt) => {
                    const selected = transport === tt;
                    return (
                      <button
                        key={tt}
                        onClick={() => setTransport(tt)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 20,
                          border: 'none',
                          background: selected ? '#007aff' : '#fff',
                          color: selected ? '#fff' : '#000',
                          fontSize: 15,
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: selected ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                        }}
                      >
                        {TRANSPORT_LABELS[tt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Memo field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6, display: 'block', paddingLeft: 4 }}>
                メモ
              </label>
              <textarea
                className="ios-input"
                placeholder="メモを入力..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                style={{
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
