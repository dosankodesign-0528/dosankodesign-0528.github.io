import Stage from "@/components/Stage";
import TopPage from "@/components/TopPage";

export default function Home() {
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 決定版：吹き出し→な〜んにもない→たまらない を順にブラー
            →ボタン→イラスト（ブラー後にクルンと一回転） */}
        <TopPage intro={2} blurSeq waitConsent />
      </Stage>
    </>
  );
}
