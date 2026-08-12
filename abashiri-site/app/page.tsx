import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

export default function Home() {
  return (
    <Stage illustration="tamannee" illustEntrance>
      {/* 出現アニメ=案2「じんわり深め」／手書き=案1なぞり書き（速さは暫定「のんびり」） */}
      <TopMock intro={2} write={1} writePace={2} />
    </Stage>
  );
}
