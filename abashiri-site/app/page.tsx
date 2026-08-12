import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import SoundUi from "@/components/SoundUi";

export default function Home() {
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 決定版候補：吹き出しブラー→な なぞり書き→伸ばし棒ビヨーン→んにもない なぞり書き
            →たまらない まとめてブラー→ボタン→イラスト（開始0.5秒後） */}
        <TopMock intro={2} combo writePace={2} />
      </Stage>
      {/* 網走の環境音：初回はON/OFF確認、以降は左下ボタンで切替 */}
      <SoundUi variant={1} askConsent />
    </>
  );
}
