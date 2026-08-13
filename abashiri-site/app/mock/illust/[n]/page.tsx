import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

const TITLES: Record<string, string> = {
  "1": "案1:くるん一回転（現行）",
  "2": "案2:ゆらゆらスイング",
  "3": "案3:ぷるんと弾む",
  "4": "案2-B:スイング キレ鋭め",
  "5": "案2-C:スイング 振り子減衰",
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((n) => ({ n }));
}

export default async function IllustMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  return (
    <>
      <Stage illustration="tamannee" illustEntrance illustAnim={num}>
        <TopMock intro={2} blurSeq />
      </Stage>
      <div className="fixed left-3 top-3 z-[70] flex items-center gap-2">
        <Link
          href="/mock/illust"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          {TITLES[n] ?? TITLES["1"]}（右下の人物に注目・約15秒ごと）
        </p>
      </div>
    </>
  );
}
