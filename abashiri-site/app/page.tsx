import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

export default function Home() {
  return (
    <Stage illustration="tamannee">
      {/* 出現アニメーションは案2「じんわり深め」を採用 */}
      <TopMock intro={2} />
    </Stage>
  );
}
