import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import { KAMI_PATTERNS } from "@/components/kamiPatterns";

export function generateStaticParams() {
  return Object.keys(KAMI_PATTERNS).map((n) => ({ n }));
}

export default async function KamiMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  const p = KAMI_PATTERNS[num] ?? KAMI_PATTERNS[1];
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        <TopMock intro={2} kami={num} />
      </Stage>
      <div className="fixed left-3 top-3 z-50 flex items-center gap-2">
        <Link
          href="/mock/kami"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          案{num}：{p.name}（リロードで再生）
        </p>
      </div>
    </>
  );
}
