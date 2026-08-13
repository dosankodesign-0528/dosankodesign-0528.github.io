import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

const TITLES: Record<string, string> = {
  "1": "案1:ふんわりハロー",
  "2": "案2:二層リアル",
  "3": "案3:斜め光",
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((n) => ({ n }));
}

export default async function ShadowMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        <TopMock intro={2} blurSeq mockShadow={num} />
      </Stage>
      <div className="fixed left-3 top-3 z-[70] flex items-center gap-2">
        <Link
          href="/mock/shadow"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          {TITLES[n] ?? TITLES["1"]}（タブレットの影に注目）
        </p>
      </div>
    </>
  );
}
