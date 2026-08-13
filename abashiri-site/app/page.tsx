import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

export default function Home() {
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 決定版：吹き出し→な〜んにもない→たまらない を順にブラー
            →ボタン→イラスト（ブラー後にクルンと一回転） */}
        <TopMock intro={2} blurSeq waitConsent />
      </Stage>
    </>
  );
}
