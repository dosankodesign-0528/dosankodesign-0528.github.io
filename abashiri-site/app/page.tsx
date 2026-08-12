import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import Bgm from "@/components/Bgm";

export default function Home() {
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 決定版候補：吹き出しブラー→な なぞり書き→伸ばし棒ビヨーン→んにもない なぞり書き
            →たまらない まとめてブラー→ボタン→イラスト（開始0.5秒後） */}
        <TopMock intro={2} combo writePace={2} />
      </Stage>
      {/* 岬の環境音BGM（左下のボタンでオン/オフ） */}
      <Bgm />
    </>
  );
}
