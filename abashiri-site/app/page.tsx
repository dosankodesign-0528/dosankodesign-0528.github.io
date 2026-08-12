import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import SoundUi from "@/components/SoundUi";

export default function Home() {
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 決定版：吹き出し→な〜んにもない→たまらない を順にブラー
            →ボタン→イラスト（ブラー後にクルンと一回転） */}
        <TopMock intro={2} blurSeq waitConsent />
      </Stage>
      {/* 網走の環境音：初回はON/OFF確認、以降は左下のスピーカーで切替 */}
      <SoundUi askConsent />
    </>
  );
}
