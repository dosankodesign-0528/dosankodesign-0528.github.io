/**
 * サンプル旅行データ投入スクリプト
 * 「京都・大阪 2泊3日」— AI補完テスト用にあえて不完全なデータ
 *
 * 実行: node seed-sample-trip.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcmyvakuxlvvlmpbytwu.supabase.co';
const supabaseKey = 'sb_publishable_pfVC19htteCH7UCGuu10bw_StQs4GJ1';
const supabase = createClient(supabaseUrl, supabaseKey);

const tripId = crypto.randomUUID();
const shareId = 'sampleKyotoOsaka';
const now = new Date().toISOString();

// Day IDs
const day1Id = crypto.randomUUID();
const day2Id = crypto.randomUUID();
const day3Id = crypto.randomUUID();

let sortOrder = 0;
const spot = (dayId, overrides) => ({
  id: crypto.randomUUID(),
  dayId,
  name: '',
  type: 'destination',
  isMain: false,
  time: '',
  sortOrder: sortOrder++,
  ...overrides,
});

const trip = {
  id: tripId,
  title: '京都・大阪 2泊3日の旅',
  startDate: '2026-05-02',
  endDate: '2026-05-04',
  shareId,
  createdAt: now,
  updatedAt: now,
  days: [
    // ======== 1日目: 京都 ========
    {
      id: day1Id,
      tripId,
      dayNum: 1,
      headline: '京都の定番スポット巡り',
      spots: [
        spot(day1Id, {
          name: '東京駅 出発',
          type: 'destination',
          isMain: false,
          time: '07:30',
          memo: 'のぞみ207号 7:30発',
          lat: 35.6812,
          lng: 139.7671,
        }),
        spot(day1Id, {
          name: '新幹線で京都へ',
          type: 'transit',
          time: '07:30',
          endTime: '09:45',
          transport: 'shinkansen',
        }),
        spot(day1Id, {
          name: '京都駅 到着',
          type: 'destination',
          time: '09:45',
          lat: 34.9856,
          lng: 135.7583,
          // メモなし — AI補完ポイント
        }),
        spot(day1Id, {
          name: '伏見稲荷大社',
          type: 'destination',
          isMain: true,
          time: '10:30',
          lat: 34.9671,
          lng: 135.7727,
          memo: '千本鳥居を歩く。所要時間は約1時間',
        }),
        spot(day1Id, {
          name: '昼食',
          type: 'food',
          time: '12:00',
          // 店名なし、場所なし — AI補完ポイント
        }),
        spot(day1Id, {
          name: '清水寺',
          type: 'destination',
          isMain: true,
          time: '14:00',
          lat: 34.9949,
          lng: 135.7851,
          // 移動手段なし — AI補完ポイント
        }),
        spot(day1Id, {
          name: '八坂神社・祇園散策',
          type: 'destination',
          time: '16:00',
          lat: 34.9033,
          lng: 135.7785,
          // 時間が怪しい（清水寺からの移動時間考慮なし）— AI補完ポイント
        }),
        spot(day1Id, {
          name: '夕食',
          type: 'food',
          time: '',  // 時刻未定 — AI補完ポイント
          memo: '先斗町あたりで京料理？',
        }),
        spot(day1Id, {
          name: 'ホテルグランヴィア京都',
          type: 'hotel',
          time: '21:00',
          lat: 34.9852,
          lng: 135.7588,
          memo: 'チェックイン15:00〜',
        }),
      ],
    },

    // ======== 2日目: 京都→大阪 ========
    {
      id: day2Id,
      tripId,
      dayNum: 2,
      headline: '', // ヘッドラインなし — AI補完ポイント
      spots: [
        spot(day2Id, {
          name: 'ホテル出発',
          type: 'destination',
          time: '09:00',
        }),
        spot(day2Id, {
          name: '金閣寺',
          type: 'destination',
          isMain: true,
          time: '09:45',
          lat: 35.0394,
          lng: 135.7292,
          // メモなし
        }),
        spot(day2Id, {
          name: '嵐山・竹林の小径',
          type: 'destination',
          isMain: true,
          time: '', // 時刻未定 — AI補完ポイント
          lat: 35.0094,
          lng: 135.6719,
          memo: '渡月橋も見たい',
        }),
        spot(day2Id, {
          name: '昼食',
          type: 'food',
          time: '13:00',
          // 場所未定 — AI補完ポイント
        }),
        spot(day2Id, {
          name: '京都から大阪へ移動',
          type: 'transit',
          time: '14:30',
          // 移動手段未設定 — AI補完ポイント
        }),
        spot(day2Id, {
          name: '道頓堀',
          type: 'destination',
          isMain: true,
          time: '16:00',
          lat: 34.6687,
          lng: 135.5013,
          memo: 'グリコ看板の前で写真',
        }),
        spot(day2Id, {
          name: '夕食（たこ焼き・串カツ）',
          type: 'food',
          time: '18:00',
          lat: 34.6686,
          lng: 135.5026,
        }),
        spot(day2Id, {
          name: 'ホテル',
          type: 'hotel',
          time: '', // 時刻未定
          // ホテル名なし — AI補完ポイント
        }),
      ],
    },

    // ======== 3日目: 大阪 → 帰京 ========
    {
      id: day3Id,
      tripId,
      dayNum: 3,
      headline: '大阪観光と帰京',
      spots: [
        spot(day3Id, {
          name: 'ホテル チェックアウト',
          type: 'destination',
          time: '09:30',
        }),
        spot(day3Id, {
          name: '大阪城',
          type: 'destination',
          isMain: true,
          time: '10:00',
          lat: 34.6873,
          lng: 135.5262,
          memo: '天守閣に登る',
        }),
        spot(day3Id, {
          name: '通天閣',
          type: 'destination',
          time: '12:30',
          lat: 34.6525,
          lng: 135.5064,
          // 移動手段なし — AI補完ポイント
        }),
        spot(day3Id, {
          name: '昼食',
          type: 'food',
          time: '13:30',
          memo: '新世界でどこか', // 具体的な店なし
        }),
        spot(day3Id, {
          name: '新大阪駅へ移動',
          type: 'transit',
          time: '15:00',
          transport: 'subway',
        }),
        spot(day3Id, {
          name: '新幹線で東京へ',
          type: 'transit',
          time: '16:00',
          endTime: '18:30',
          transport: 'shinkansen',
        }),
        spot(day3Id, {
          name: '東京駅 到着',
          type: 'destination',
          time: '18:30',
          lat: 35.6812,
          lng: 139.7671,
        }),
      ],
    },
  ],
};

async function main() {
  console.log('🚀 サンプル旅行データを投入中...');
  console.log(`   タイトル: ${trip.title}`);
  console.log(`   shareId: ${shareId}`);

  // 既存データ削除（同じshareIdがあれば上書き）
  await supabase.from('trips').delete().eq('share_id', shareId);

  const { error } = await supabase.from('trips').insert({
    id: tripId,
    share_id: shareId,
    data: trip,
    updated_at: now,
  });

  if (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }

  console.log('✅ 投入完了!');
  console.log(`   URL: https://hideyuki-yamanaka.github.io/share/${shareId}`);
}

main();
