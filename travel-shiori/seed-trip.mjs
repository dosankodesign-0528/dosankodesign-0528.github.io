import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  'https://rcmyvakuxlvvlmpbytwu.supabase.co',
  'sb_publishable_pfVC19htteCH7UCGuu10bw_StQs4GJ1'
);

const now = new Date().toISOString();
const shareId = nanoid(12);
const tripId = nanoid();

function spot(dayId, order, { name, type, isMain = false, time, endTime, transport, memo, lat, lng }) {
  return {
    id: nanoid(),
    dayId,
    name,
    type,
    isMain,
    time,
    endTime: endTime || '',
    transport: transport || undefined,
    lat: lat || undefined,
    lng: lng || undefined,
    memo: memo || '',
    sortOrder: order,
  };
}

// Day IDs
const d1id = nanoid(), d2id = nanoid(), d3id = nanoid(), d4id = nanoid();

const trip = {
  id: tripId,
  title: '誓願勤行会並びに東京方面旅行',
  startDate: '2026-05-28',
  endDate: '2026-05-31',
  shareId,
  days: [
    // ========== Day 1 (5/28 木) ==========
    {
      id: d1id, tripId, dayNum: 1,
      headline: '女満別→東京 大誓堂・屋形船',
      spots: [
        spot(d1id, 0, {
          name: '女満別空港（旭川空港）',
          type: 'transit', time: '09:20', endTime: '09:50',
          memo: 'JAL ≪@15,665×2≫ ≪@15,790≫\n所要120分',
          lat: 43.8806, lng: 144.1644,
        }),
        spot(d1id, 1, {
          name: '羽田空港',
          type: 'transit', time: '11:20', endTime: '11:40',
          transport: 'taxi',
          memo: 'タクシー(50分) ≪@9,000≫',
          lat: 35.5494, lng: 139.7798,
        }),
        spot(d1id, 2, {
          name: '信濃町駅',
          type: 'transit', time: '12:10', endTime: '13:00',
          memo: '【コインロッカー】(大)@800×2',
          lat: 35.6801, lng: 139.7215,
        }),
        spot(d1id, 3, {
          name: '大誓堂',
          type: 'destination', isMain: true, time: '13:00', endTime: '16:00',
          memo: '【総合案内センター】※発券:1F案内カウンター\n入場開始13:45、集合完了14:15\n13:45受付 → 14:30開始 → 15:30終了',
          lat: 35.6805, lng: 139.7185,
        }),
        spot(d1id, 4, {
          name: '両国リバーホテル',
          type: 'hotel', time: '16:20',
          transport: 'subway',
          memo: '信濃町駅→JR総武線+徒歩1分(20分) ≪@210×3≫\n墨田区両国2-13-8',
          lat: 35.6963, lng: 139.7936,
        }),
        spot(d1id, 5, {
          name: '屋形船（釣新）',
          type: 'food', isMain: true, time: '17:15', endTime: '21:00',
          transport: 'walk',
          memo: '徒歩15分\n18:30発 → 21:00着\n≪@13,000×3≫',
          lat: 35.6935, lng: 139.7942,
        }),
        spot(d1id, 6, {
          name: '両国リバーホテル（戻り）',
          type: 'hotel', time: '21:15',
          transport: 'walk',
          memo: '徒歩15分',
          lat: 35.6963, lng: 139.7936,
        }),
      ],
    },
    // ========== Day 2 (5/29 金) ==========
    {
      id: d2id, tripId, dayNum: 2,
      headline: '創価大学・熱海へ移動',
      spots: [
        spot(d2id, 0, {
          name: '両国リバーホテル',
          type: 'hotel', time: '08:00', endTime: '09:20',
          transport: 'subway',
          memo: 'JR総武線(御茶ノ水駅)+徒歩→JR中央線 ※特快\n≪@900×3≫ (80分)',
          lat: 35.6963, lng: 139.7936,
        }),
        spot(d2id, 1, {
          name: '八王子駅',
          type: 'transit', time: '09:20',
          memo: '【コインロッカー】(大)@600×2',
          lat: 35.6554, lng: 139.3389,
        }),
        spot(d2id, 2, {
          name: '創価大学',
          type: 'destination', isMain: true, time: '10:00', endTime: '13:30',
          transport: 'taxi',
          memo: 'タクシー(20分) ≪@3,000≫\n※校内敷地入車',
          lat: 35.6294, lng: 139.3463,
        }),
        spot(d2id, 3, {
          name: '八王子駅',
          type: 'transit', time: '13:30', endTime: '14:30',
          transport: 'taxi',
          memo: 'タクシー(20分) ≪@3,000≫\nJR横浜線(東神奈川行き or 桜木町行き)\n≪@700×3≫ (50分)',
          lat: 35.6554, lng: 139.3389,
        }),
        spot(d2id, 4, {
          name: '新横浜駅',
          type: 'transit', time: '14:30', endTime: '15:00',
          transport: 'shinkansen',
          memo: '新幹線 ≪@3,700×3≫ (30分)',
          lat: 35.5065, lng: 139.6177,
        }),
        spot(d2id, 5, {
          name: '熱海駅',
          type: 'food', time: '15:00',
          memo: '【浜松餃子】駅ビル3階「五味八珍 ラスカ熱海店」\nJR伊東線(3駅下車)(15分)\n≪(@200×3)+(@2,000)≫',
          lat: 35.1042, lng: 139.0777,
        }),
        spot(d2id, 6, {
          name: '網代駅',
          type: 'transit', time: '15:30', endTime: '16:00',
          transport: 'taxi',
          memo: 'タクシー(10分)',
          lat: 35.0728, lng: 139.0622,
        }),
        spot(d2id, 7, {
          name: 'ホテルニューとみよし',
          type: 'hotel', time: '16:00',
          memo: '熱海市下多賀1472-1',
          lat: 35.0668, lng: 139.0598,
        }),
      ],
    },
    // ========== Day 3 (5/30 土) ==========
    {
      id: d3id, tripId, dayNum: 3,
      headline: '八景島シーパラ・横浜中華街',
      spots: [
        spot(d3id, 0, {
          name: 'ホテルニューとみよし',
          type: 'hotel', time: '10:30', endTime: '11:00',
          transport: 'taxi',
          memo: 'タクシー+JR(網代駅)\n≪(@2,000)+(@200×3)≫ (10分+15分)',
          lat: 35.0668, lng: 139.0598,
        }),
        spot(d3id, 1, {
          name: '熱海駅',
          type: 'transit', time: '11:29', endTime: '12:23',
          transport: 'subway',
          memo: '特急踊り子2号 JR東海道本線\n≪@2,900×3≫ (55分)',
          lat: 35.1042, lng: 139.0777,
        }),
        spot(d3id, 2, {
          name: '横浜駅',
          type: 'transit', time: '12:30', endTime: '13:30',
          transport: 'subway',
          memo: '京急線+シーサイドライン(金沢八景駅)\n≪@600×3≫ (45分)\n【コインロッカー】(大)@600×2',
          lat: 35.4660, lng: 139.6223,
        }),
        spot(d3id, 3, {
          name: '八景島シーサイドパラダイス',
          type: 'destination', isMain: true, time: '13:30', endTime: '16:30',
          memo: '横浜市金沢区八景島\n【アクアリゾーツパス】(水族館4施設パス)\n(大人)@3,500×1、(シニア)@3,000×2',
          lat: 35.3385, lng: 139.6467,
        }),
        spot(d3id, 4, {
          name: '横浜駅',
          type: 'transit', time: '16:30', endTime: '17:30',
          transport: 'subway',
          memo: 'シーサイドライン+京急線(金沢八景駅)\n≪@600×3≫ (45分)',
          lat: 35.4660, lng: 139.6223,
        }),
        spot(d3id, 5, {
          name: '横浜中華街',
          type: 'food', isMain: true, time: '17:30', endTime: '19:30',
          transport: 'subway',
          memo: 'みなとみらい線(元町・中華街駅)+徒歩\n≪@230×3≫ (10分+1分)',
          lat: 35.4425, lng: 139.6453,
        }),
        spot(d3id, 6, {
          name: '東京駅',
          type: 'transit', time: '19:30', endTime: '20:00',
          transport: 'subway',
          memo: 'みなとみらい線→横浜駅→JR東海道本線\n≪@230×3≫ + ≪@5,300×3≫ (10分+30分)',
          lat: 35.6812, lng: 139.7671,
        }),
        spot(d3id, 7, {
          name: 'ホテルメトロポリタン丸の内',
          type: 'hotel', time: '20:00',
          transport: 'walk',
          memo: '日本橋口→徒歩2分\n千代田区丸の内1-7-12',
          lat: 35.6828, lng: 139.7666,
        }),
      ],
    },
    // ========== Day 4 (5/31 日) ==========
    {
      id: d4id, tripId, dayNum: 4,
      headline: '築地市場・帰路',
      spots: [
        spot(d4id, 0, {
          name: 'ホテルメトロポリタン丸の内',
          type: 'hotel', time: '10:00',
          transport: 'taxi',
          memo: 'タクシー(10分) ≪@1,500≫',
          lat: 35.6828, lng: 139.7666,
        }),
        spot(d4id, 1, {
          name: '築地市場',
          type: 'food', isMain: true, time: '10:00', endTime: '13:00',
          memo: 'タクシー(15分) ≪@2,000≫',
          lat: 35.6654, lng: 139.7707,
        }),
        spot(d4id, 2, {
          name: '浜松町',
          type: 'transit', time: '13:00', endTime: '13:15',
          memo: 'モノレール(20分)快速 ≪@520×3≫',
          lat: 35.6555, lng: 139.7571,
        }),
        spot(d4id, 3, {
          name: '羽田空港（第1ターミナル）',
          type: 'transit', time: '13:30', endTime: '17:15',
          memo: 'JAL ≪@15,665×2≫ ≪@15,790≫\n(17:15発/17:25発) 所要110分',
          lat: 35.5494, lng: 139.7798,
        }),
        spot(d4id, 4, {
          name: '女満別空港（旭川空港）',
          type: 'transit', time: '19:05', endTime: '19:15',
          memo: '自家用車(20分/30分)',
          lat: 43.8806, lng: 144.1644,
        }),
        spot(d4id, 5, {
          name: '自宅（網走市/旭川市）',
          type: 'destination', time: '19:45', endTime: '20:00',
          memo: '網走市 19:45着\n旭川市 20:00着',
          lat: 43.7707, lng: 144.2925,
        }),
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
};

const { error } = await supabase
  .from('trips')
  .insert({ share_id: trip.shareId, data: trip });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Trip created!');
  console.log(`Share URL: /share/${trip.shareId}`);
}
