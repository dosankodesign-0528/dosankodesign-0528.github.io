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
    time: opts.time,
    endTime: opts.endTime || '',
    transport: opts.transport || undefined,
    assignee: opts.assignee || undefined,
    lat: opts.lat || undefined,
    lng: opts.lng || undefined,
    memo: opts.memo || '',
    sortOrder: order,
  };
}

// ============================================================
// 両方のshareIdを更新（古い方と新しい方）
// ============================================================
const SHARE_IDS = ['20YzDEbQZIDp', 'SeoPSUV4efvZ'];

for (const targetShareId of SHARE_IDS) {
  const { data: rows } = await supabase
    .from('trips')
    .select('*')
    .eq('share_id', targetShareId);

  const existing = rows?.[0];
  if (!existing) {
    console.log(`Share ID ${targetShareId} not found, skipping.`);
    continue;
  }

  const tripId = existing.data.id;
  const now = new Date().toISOString();
  const d1id = nanoid(), d2id = nanoid(), d3id = nanoid(), d4id = nanoid();

  const trip = {
    id: tripId,
    title: '誓願勤行会並びに東京方面旅行',
    startDate: '2026-05-28',
    endDate: '2026-05-31',
    shareId: targetShareId,
    days: [
      // ==========================================
      // Day 1 (5/28 木) 女満別/旭川 → 東京
      // ==========================================
      {
        id: d1id, tripId, dayNum: 1,
        headline: '女満別/旭川→東京 大誓堂・屋形船',
        spots: [
          // ─── 両親: 女満別空港 9:20発 ───
          spot(d1id, 0, {
            name: '女満別空港 出発',
            type: 'destination', time: '09:20',
            assignee: 'parents',
            memo: 'JAL便 ≪@15,665×2≫\n所要120分',
            lat: 43.8806, lng: 144.1644,
          }),
          spot(d1id, 1, {
            name: 'JAL便 女満別→羽田',
            type: 'transit', time: '09:20', endTime: '11:20',
            assignee: 'parents',
            memo: '120分',
          }),
          // ─── 息子: 旭川空港 9:50発 ───
          spot(d1id, 2, {
            name: '旭川空港 出発',
            type: 'destination', time: '09:50',
            assignee: 'son',
            memo: 'JAL便 ≪@15,790≫\n所要110分',
            lat: 43.6708, lng: 142.4475,
          }),
          spot(d1id, 3, {
            name: 'JAL便 旭川→羽田',
            type: 'transit', time: '09:50', endTime: '11:40',
            assignee: 'son',
            memo: '110分',
          }),
          // ─── 羽田空港で合流 → 全員行動 ───
          spot(d1id, 4, {
            name: '羽田空港（合流）',
            type: 'destination', time: '11:20', endTime: '11:40',
            memo: '両親 11:20着 / 息子 11:40着',
            lat: 35.5494, lng: 139.7798,
          }),
          spot(d1id, 5, {
            name: 'タクシー → 信濃町駅',
            type: 'transit', time: '11:40', endTime: '12:10',
            transport: 'taxi',
            memo: '50分 ≪@9,000≫',
          }),
          spot(d1id, 6, {
            name: '信濃町駅',
            type: 'destination', time: '12:10', endTime: '13:00',
            memo: '【コインロッカー】(大) @800×2',
            lat: 35.6801, lng: 139.7215,
          }),
          spot(d1id, 7, {
            name: '徒歩 → 大誓堂',
            type: 'transit', time: '13:00',
            transport: 'walk',
            memo: '13:45受付',
          }),
          spot(d1id, 8, {
            name: '大誓堂',
            type: 'destination', isMain: true, time: '13:00', endTime: '16:00',
            memo: '【総合案内センター】～ ※発券:1F案内カウンター\n入場開始 13:45、集合完了 14:15\n14:30 開始 → 15:30 終了',
            lat: 35.6805, lng: 139.7185,
          }),
          spot(d1id, 9, {
            name: '徒歩 → 信濃町駅',
            type: 'transit', time: '15:30',
            transport: 'walk',
          }),
          spot(d1id, 10, {
            name: 'JR総武線 → 両国',
            type: 'transit', time: '16:00',
            transport: 'subway',
            memo: '両国駅:西口 徒歩1分\n20分 ≪@210×3≫',
          }),
          spot(d1id, 11, {
            name: '両国リバーホテル',
            type: 'hotel', time: '16:00', endTime: '16:20',
            memo: '墨田区両国2-13-8\nチェックイン',
            lat: 35.6963, lng: 139.7936,
          }),
          spot(d1id, 12, {
            name: '徒歩 → 屋形船乗り場',
            type: 'transit', time: '16:20',
            transport: 'walk',
            memo: '15分',
          }),
          spot(d1id, 13, {
            name: '屋形船（釣新）',
            type: 'food', isMain: true, time: '17:15', endTime: '21:00',
            memo: '17:15〜17:30 乗船\n18:30 出発 → 21:00 到着\n≪@13,000×3≫',
            lat: 35.6935, lng: 139.7942,
          }),
          spot(d1id, 14, {
            name: '徒歩 → 両国リバーホテル',
            type: 'transit', time: '21:00',
            transport: 'walk',
            memo: '15分',
          }),
          spot(d1id, 15, {
            name: '両国リバーホテル（泊）',
            type: 'hotel', time: '21:15', endTime: '21:30',
            lat: 35.6963, lng: 139.7936,
          }),
        ],
      },

      // ==========================================
      // Day 2 (5/29 金) 創価大学・熱海
      // ==========================================
      {
        id: d2id, tripId, dayNum: 2,
        headline: '創価大学・熱海へ移動',
        spots: [
          spot(d2id, 0, {
            name: '両国リバーホテル 出発',
            type: 'hotel', time: '08:00',
            lat: 35.6963, lng: 139.7936,
          }),
          spot(d2id, 1, {
            name: 'JR総武線→中央線特快 → 八王子',
            type: 'transit', time: '08:00', endTime: '09:20',
            transport: 'subway',
            memo: '御茶ノ水駅乗換+徒歩 → JR中央線 ※特快\n80分 ≪@900×3≫',
          }),
          spot(d2id, 2, {
            name: '八王子駅',
            type: 'destination', time: '09:20',
            memo: '【コインロッカー】(大) @600×2',
            lat: 35.6554, lng: 139.3389,
          }),
          spot(d2id, 3, {
            name: 'タクシー → 創価大学',
            type: 'transit', time: '09:20',
            transport: 'taxi',
            memo: '20分 ≪@3,000≫',
          }),
          spot(d2id, 4, {
            name: '創価大学',
            type: 'destination', isMain: true, time: '10:00', endTime: '13:30',
            memo: '※校内敷地入車',
            lat: 35.6294, lng: 139.3463,
          }),
          spot(d2id, 5, {
            name: 'タクシー → 八王子駅',
            type: 'transit', time: '13:30',
            transport: 'taxi',
            memo: '20分 ≪@3,000≫',
          }),
          spot(d2id, 6, {
            name: 'JR横浜線 → 新横浜駅',
            type: 'transit', time: '13:30',
            transport: 'subway',
            memo: '東神奈川行き or 桜木町行き\n50分 ≪@700×3≫',
          }),
          spot(d2id, 7, {
            name: '新横浜駅',
            type: 'destination', time: '13:30', endTime: '14:30',
            lat: 35.5065, lng: 139.6177,
          }),
          spot(d2id, 8, {
            name: '新幹線 → 熱海',
            type: 'transit', time: '14:30',
            transport: 'shinkansen',
            memo: '30分 ≪@3,700×3≫',
          }),
          spot(d2id, 9, {
            name: '熱海駅（五味八珍でランチ）',
            type: 'food', time: '14:30', endTime: '15:00',
            memo: '【浜松餃子】駅ビル3階\n「五味八珍 ラスカ熱海店」',
            lat: 35.1042, lng: 139.0777,
          }),
          spot(d2id, 10, {
            name: 'JR伊東線 → 網代駅',
            type: 'transit', time: '15:00', endTime: '15:15',
            transport: 'subway',
            memo: '伊東行き or 伊豆急下田行き（3駅下車）\n15分 ≪(@200×3)+(@2,000)≫',
          }),
          spot(d2id, 11, {
            name: 'タクシー → ホテル',
            type: 'transit', time: '15:15',
            transport: 'taxi',
            memo: '網代駅から10分',
          }),
          spot(d2id, 12, {
            name: 'ホテルニューとみよし',
            type: 'hotel', time: '15:30', endTime: '16:00',
            memo: '熱海市下多賀1472-1',
            lat: 35.0668, lng: 139.0598,
          }),
        ],
      },

      // ==========================================
      // Day 3 (5/30 土) 八景島・中華街
      // ==========================================
      {
        id: d3id, tripId, dayNum: 3,
        headline: '八景島シーパラ・横浜中華街',
        spots: [
          spot(d3id, 0, {
            name: 'ホテルニューとみよし 出発',
            type: 'hotel', time: '10:00',
            lat: 35.0668, lng: 139.0598,
          }),
          spot(d3id, 1, {
            name: 'タクシー+JR → 熱海駅',
            type: 'transit', time: '10:00', endTime: '10:30',
            transport: 'taxi',
            memo: 'タクシー(10分) + JR網代駅(15分)\n≪(@2,000)+(@200×3)≫',
          }),
          spot(d3id, 2, {
            name: '熱海駅',
            type: 'destination', time: '10:30', endTime: '11:00',
            lat: 35.1042, lng: 139.0777,
          }),
          spot(d3id, 3, {
            name: '特急踊り子2号 → 横浜',
            type: 'transit', time: '11:29', endTime: '12:23',
            transport: 'subway',
            memo: 'JR東海道本線 55分 ≪@2,900×3≫',
          }),
          spot(d3id, 4, {
            name: '横浜駅',
            type: 'destination', time: '12:30', endTime: '13:30',
            memo: '【コインロッカー】(大) @600×2',
            lat: 35.4660, lng: 139.6223,
          }),
          spot(d3id, 5, {
            name: '京急線+シーサイドライン → 八景島',
            type: 'transit', time: '13:00',
            transport: 'subway',
            memo: '金沢八景駅経由 45分 ≪@600×3≫',
          }),
          spot(d3id, 6, {
            name: '八景島シーサイドパラダイス',
            type: 'destination', isMain: true, time: '13:30', endTime: '16:30',
            memo: '横浜市金沢区八景島\n【アクアリゾーツパス】(水族館4施設パス)\n(大人) @3,500×1、(シニア) @3,000×2',
            lat: 35.3385, lng: 139.6467,
          }),
          spot(d3id, 7, {
            name: 'シーサイドライン+京急線 → 横浜駅',
            type: 'transit', time: '16:30',
            transport: 'subway',
            memo: '金沢八景駅経由 45分 ≪@600×3≫',
          }),
          spot(d3id, 8, {
            name: '横浜駅',
            type: 'destination', time: '16:30', endTime: '17:30',
            lat: 35.4660, lng: 139.6223,
          }),
          spot(d3id, 9, {
            name: 'みなとみらい線 → 中華街',
            type: 'transit', time: '17:30',
            transport: 'subway',
            memo: '東急東横線直通 元町・中華街駅+徒歩1分\n10分 ≪@230×3≫',
          }),
          spot(d3id, 10, {
            name: '横浜中華街',
            type: 'food', isMain: true, time: '17:30', endTime: '19:30',
            lat: 35.4425, lng: 139.6453,
          }),
          spot(d3id, 11, {
            name: 'みなとみらい線+JR → 東京',
            type: 'transit', time: '19:30',
            transport: 'subway',
            memo: '徒歩+元町・中華街→横浜(1分+10分) ≪@230×3≫\n横浜→東京 JR東海道本線(30分) ≪@5,300×3≫',
          }),
          spot(d3id, 12, {
            name: '東京駅',
            type: 'destination', time: '19:30', endTime: '20:00',
            lat: 35.6812, lng: 139.7671,
          }),
          spot(d3id, 13, {
            name: '徒歩 → ホテル',
            type: 'transit', time: '20:00',
            transport: 'walk',
            memo: '日本橋口より徒歩2分',
          }),
          spot(d3id, 14, {
            name: 'ホテルメトロポリタン丸の内',
            type: 'hotel', time: '20:00',
            memo: '千代田区丸の内1-7-12',
            lat: 35.6828, lng: 139.7666,
          }),
        ],
      },

      // ==========================================
      // Day 4 (5/31 日) 築地・帰路
      // ==========================================
      {
        id: d4id, tripId, dayNum: 4,
        headline: '築地市場・帰路',
        spots: [
          spot(d4id, 0, {
            name: 'ホテルメトロポリタン丸の内 出発',
            type: 'hotel', time: '09:30',
            lat: 35.6828, lng: 139.7666,
          }),
          spot(d4id, 1, {
            name: 'タクシー → 築地',
            type: 'transit', time: '09:30',
            transport: 'taxi',
            memo: '10分 ≪@1,500≫',
          }),
          spot(d4id, 2, {
            name: '築地市場',
            type: 'food', isMain: true, time: '10:00', endTime: '12:30',
            lat: 35.6654, lng: 139.7707,
          }),
          spot(d4id, 3, {
            name: 'タクシー → 浜松町',
            type: 'transit', time: '12:30',
            transport: 'taxi',
            memo: '15分 ≪@2,000≫',
          }),
          spot(d4id, 4, {
            name: '浜松町',
            type: 'destination', time: '13:00', endTime: '13:15',
            lat: 35.6555, lng: 139.7571,
          }),
          spot(d4id, 5, {
            name: 'モノレール → 羽田空港',
            type: 'transit', time: '13:15',
            transport: 'subway',
            memo: '快速 20分 ≪@520×3≫',
          }),
          spot(d4id, 6, {
            name: '羽田空港（第1ターミナル）',
            type: 'destination', time: '13:30', endTime: '17:15',
            memo: '出発まで待機',
            lat: 35.5494, lng: 139.7798,
          }),
          // ─── 両親: 羽田→女満別→網走 ───
          spot(d4id, 7, {
            name: 'JAL便 羽田→女満別',
            type: 'transit', time: '17:15', endTime: '19:05',
            assignee: 'parents',
            memo: '110分 ≪@15,665×2≫',
          }),
          spot(d4id, 8, {
            name: '女満別空港 到着',
            type: 'destination', time: '19:05',
            assignee: 'parents',
            lat: 43.8806, lng: 144.1644,
          }),
          spot(d4id, 9, {
            name: '自家用車 → 自宅（網走市）',
            type: 'transit', time: '19:05',
            assignee: 'parents',
            memo: '20分',
          }),
          spot(d4id, 10, {
            name: '自宅（網走市）到着',
            type: 'destination', time: '19:45',
            assignee: 'parents',
          }),
          // ─── 息子: 羽田→旭川→旭川市 ───
          spot(d4id, 11, {
            name: 'JAL便 羽田→旭川',
            type: 'transit', time: '17:25', endTime: '19:15',
            assignee: 'son',
            memo: '110分 ≪@15,790≫',
          }),
          spot(d4id, 12, {
            name: '旭川空港 到着',
            type: 'destination', time: '19:15',
            assignee: 'son',
            lat: 43.6708, lng: 142.4475,
          }),
          spot(d4id, 13, {
            name: '自家用車 → 自宅（旭川市）',
            type: 'transit', time: '19:15',
            assignee: 'son',
            memo: '30分',
          }),
          spot(d4id, 14, {
            name: '自宅（旭川市）到着',
            type: 'destination', time: '20:00',
            assignee: 'son',
          }),
        ],
      },
    ],
    createdAt: existing.data.createdAt || now,
    updatedAt: now,
  };

  const { error } = await supabase
    .from('trips')
    .update({ data: trip, updated_at: now })
    .eq('share_id', targetShareId);

  if (error) {
    console.error(`Update error (${targetShareId}):`, error);
  } else {
    console.log(`\n✓ Updated: /share/${targetShareId}`);
    trip.days.forEach(d => {
      console.log(`  Day ${d.dayNum}: ${d.headline} (${d.spots.length} spots)`);
      d.spots.forEach(s => {
        const tag = s.assignee ? ` [${s.assignee}]` : '';
        console.log(`    ${s.time} ${s.name}${tag}`);
      });
    });
  }
}
