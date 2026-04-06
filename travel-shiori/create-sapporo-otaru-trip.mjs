import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  'https://rcmyvakuxlvvlmpbytwu.supabase.co',
  'sb_publishable_pfVC19htteCH7UCGuu10bw_StQs4GJ1'
);

function spot(dayId, order, opts) {
  return {
    id: nanoid(),
    dayId,
    name: opts.name,
    type: opts.type,
    isMain: opts.isMain || false,
    time: opts.time || '',
    endTime: opts.endTime || '',
    transport: opts.transport || undefined,
    assignee: opts.assignee || undefined,
    lat: opts.lat || undefined,
    lng: opts.lng || undefined,
    memo: opts.memo || '',
    sortOrder: order,
  };
}

const tripId = nanoid();
const shareId = nanoid(12);
const viewId = nanoid(12);
const now = new Date().toISOString();
const d1id = nanoid();
const d2id = nanoid();
const d3id = nanoid();

const trip = {
  id: tripId,
  title: '札幌・小樽旅行',
  startDate: '2026-05-02',
  endDate: '2026-05-04',
  shareId,
  viewId,
  days: [
    // ==========================================
    // Day 1 (5/2 金) 旭川 → 札幌 / HANAライブ
    // ==========================================
    {
      id: d1id, tripId, dayNum: 1,
      headline: '旭川→札幌 HANAライブ',
      spots: [
        spot(d1id, 0, {
          name: '自宅（旭川）出発',
          type: 'destination',
          memo: '自家用車で札幌へ',
          lat: 43.7706, lng: 142.3650,
        }),
        spot(d1id, 1, {
          name: '自家用車 → 札幌',
          type: 'transit',
          transport: 'car',
          memo: '道央自動車道 約2時間〜2時間30分',
        }),
        spot(d1id, 2, {
          name: 'HANA ライブ',
          type: 'destination', isMain: true, time: '17:00',
          memo: 'アーティスト「HANA」のライブ\n会場・チケット情報はブランク',
        }),
        spot(d1id, 3, {
          name: 'ニコーリフレ（札幌）',
          type: 'hotel',
          memo: 'サウナ付き宿泊施設\n住所・チェックイン時間はブランク',
          lat: 43.0563, lng: 141.3523,
        }),
      ],
    },

    // ==========================================
    // Day 2 (5/3 土) 札幌 → 小樽
    // ==========================================
    {
      id: d2id, tripId, dayNum: 2,
      headline: '札幌→小樽',
      spots: [
        spot(d2id, 0, {
          name: 'ニコーリフレ 出発',
          type: 'hotel',
          memo: 'チェックアウト時間はブランク',
          lat: 43.0563, lng: 141.3523,
        }),
        spot(d2id, 1, {
          name: '札幌 → 小樽',
          type: 'transit',
          memo: '移動手段はブランク（JR／車など）',
        }),
        spot(d2id, 2, {
          name: '裏小樽モンパルナスイン',
          type: 'hotel', isMain: true,
          memo: 'チェックイン時間はブランク',
          lat: 43.1907, lng: 140.9947,
        }),
      ],
    },

    // ==========================================
    // Day 3 (5/4 日) 小樽 → 帰路（詳細ブランク）
    // ==========================================
    {
      id: d3id, tripId, dayNum: 3,
      headline: '小樽→帰路',
      spots: [
        spot(d3id, 0, {
          name: '裏小樽モンパルナスイン 出発',
          type: 'hotel',
          memo: 'チェックアウト時間はブランク',
          lat: 43.1907, lng: 140.9947,
        }),
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
};

const { error } = await supabase
  .from('trips')
  .insert({ share_id: shareId, view_id: viewId, data: trip });

if (error) {
  console.error('Insert error:', error);
  process.exit(1);
}

console.log(`\n✓ Created: ${trip.title}`);
console.log(`  Share URL: /share/${shareId}`);
console.log(`  View URL:  /share/${viewId}`);
trip.days.forEach(d => {
  console.log(`\n  Day ${d.dayNum}: ${d.headline} (${d.spots.length} spots)`);
  d.spots.forEach(s => {
    const time = s.time ? `${s.time}` : '（時間ブランク）';
    console.log(`    ${time} ${s.name}`);
  });
});
