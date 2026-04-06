import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `あなたは旅行プランニングのアシスタントです。
ユーザーの旅行しおりデータを参考に、以下のような質問に答えてください：
- おすすめスポットの提案
- スケジュールの改善提案
- 移動手段のアドバイス
- 食事場所の提案
- 抜けている準備物のチェック

ユーザーが画像を送ってきた場合は、画像の内容を分析して旅行プランに役立つ情報を提供してください。
例：レストランのメニュー写真→おすすめ料理の提案、地図のスクショ→ルート提案、観光スポットの写真→関連情報の提供など。

回答は簡潔で親しみやすいトーンでお願いします。
箇条書きや改行を使って読みやすくしてください。

## スポット提案時のルール
スポットを提案するときは、通常のテキスト回答に加えて、末尾に以下のJSON配列を含めてください。
JSONは必ず %%%SPOTS_START%%% と %%%SPOTS_END%%% で囲ってください。

%%%SPOTS_START%%%
[
  {
    "name": "スポット名",
    "type": "destination",
    "time": "10:00",
    "endTime": "11:30",
    "dayNum": 1,
    "memo": "補足メモ",
    "transport": "subway"
  }
]
%%%SPOTS_END%%%

typeは destination, transit, hotel, food のいずれか。
transportは subway, shinkansen, taxi, bus, walk, car, plane, other のいずれか（移動手段が明確な場合のみ）。
dayNumは何日目かの数字（1始まり）。しおりの日数内で適切な日を選んでください。
timeは "HH:MM" 形式。
スポット提案がない一般的な質問の場合はJSONブロックを含めないでください。`;

type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: string } }>;

interface ChatRequestBody {
  messages: { role: 'user' | 'assistant'; content: MessageContent }[];
  tripContext: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, tripContext } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'メッセージが空です' }, { status: 400 });
    }

    // API設定を決定（Gemini優先、次にOpenAI）
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const apiKey = geminiKey || openaiKey;

    if (apiKey) {
      const isGemini = !!geminiKey;
      const apiUrl = isGemini
        ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = process.env.AI_MODEL
        || (isGemini ? 'gemini-3.1-pro-preview' : 'gpt-4o-mini');

      const systemMessage = {
        role: 'system' as const,
        content: `${SYSTEM_PROMPT}\n\n--- 現在の旅行データ ---\n${tripContext}`,
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [systemMessage, ...messages],
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`${isGemini ? 'Gemini' : 'OpenAI'} API error:`, res.status, errText);
        return Response.json(
          { error: `AI APIエラー (${res.status}): ${errText.slice(0, 200)}` },
          { status: 502 },
        );
      }

      // SSEストリームをそのままプロキシ
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // --- APIキー未設定: モックストリーミング ---
    const lastContent = messages[messages.length - 1].content;
    const lastMessage = typeof lastContent === 'string'
      ? lastContent
      : lastContent.find((p) => p.type === 'text')?.text || '';
    const hasImages = typeof lastContent !== 'string' && lastContent.some((p) => p.type === 'image_url');
    const mockReply = hasImages
      ? `📷 画像を受け取りました！\n\n画像の内容を分析して旅行プランに活用したいところですが、これはモック応答です。\n\n⚠️ .env に OPENAI_API_KEY を設定すると、実際のAIが画像を分析してアドバイスしてくれます。`
      : generateMockReply(lastMessage, tripContext);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // モックは文字ごとに少し遅延させてストリーミング感を出す
        const chars = [...mockReply];
        for (let i = 0; i < chars.length; i++) {
          const chunk = {
            choices: [{ delta: { content: chars[i] }, finish_reason: null }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          // 10文字ごとに少し待つ
          if (i % 10 === 0) {
            await new Promise((r) => setTimeout(r, 20));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

/** APIキー未設定時のモック応答 */
function generateMockReply(userMessage: string, tripContext: string): string {
  const titleMatch = tripContext.match(/旅行: (.+)/);
  const title = titleMatch?.[1] || '旅行';

  // 日数を取得
  const dayMatches = tripContext.match(/■ Day(\d+)/g);
  const totalDays = dayMatches ? dayMatches.length : 1;

  if (userMessage.includes('おすすめ') || userMessage.includes('提案') || userMessage.includes('プラン')) {
    return `「${title}」のプランを見させてもらいました！\n\nいくつかおすすめスポットを提案しますね：\n\n📍 **地元の人気観光スポット** - 午前中に訪れるのがベスト\n🍽️ **ご当地グルメランチ** - お昼はぜひ地元の名物を\n🏛️ **歴史・文化スポット** - 午後にゆっくり散策\n\n⚠️ これはモック応答です。.env に OPENAI_API_KEY を設定すると、実際のAIが具体的な場所を提案します。\n\n%%%SPOTS_START%%%\n[{"name":"観光スポット（サンプル）","type":"destination","time":"10:00","endTime":"12:00","dayNum":1,"memo":"モック提案です"},{"name":"ランチ（サンプル）","type":"food","time":"12:30","endTime":"13:30","dayNum":1,"memo":"モック提案です"}]\n%%%SPOTS_END%%%`;
  }

  if (userMessage.includes('空いて') || userMessage.includes('暇') || userMessage.includes('午後')) {
    const dayNum = Math.min(2, totalDays);
    return `空き時間があるんですね！\n\n午後のおすすめプランを提案します：\n\n☕ **カフェで一休み** - 14:00〜15:00\n📍 **周辺散策** - 15:00〜17:00\n\n⚠️ これはモック応答です。\n\n%%%SPOTS_START%%%\n[{"name":"カフェ（サンプル）","type":"food","time":"14:00","endTime":"15:00","dayNum":${dayNum},"memo":"モック提案"},{"name":"周辺散策（サンプル）","type":"destination","time":"15:00","endTime":"17:00","dayNum":${dayNum},"memo":"モック提案"}]\n%%%SPOTS_END%%%`;
  }

  if (userMessage.includes('チェック') || userMessage.includes('抜け') || userMessage.includes('忘れ')) {
    return `「${title}」の旅程をチェックしました！\n\n✅ **移動手段**: 各スポット間の移動手段が設定されているか確認しましょう\n✅ **食事**: 各日に食事スポットがあるか確認しましょう\n✅ **宿泊**: 最終日以外にホテルが設定されているか確認しましょう\n✅ **持ち物**: パスポート、充電器、常備薬なども忘れずに\n\n⚠️ これはモック応答です。`;
  }

  return `「${title}」について承知しました！\n\nご質問の内容をもとに、プランの改善をお手伝いしますね。\n\n💡 こんなことも聞けます：\n・「おすすめスポットを提案して」\n・「2日目の午後が空いてる」\n・「旅程の抜けをチェックして」\n\n⚠️ これはモック応答です。.env に OPENAI_API_KEY を設定すると、本物のAIが回答します。`;
}
