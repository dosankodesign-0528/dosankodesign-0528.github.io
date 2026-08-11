import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";

const TITLES: Record<string, string> = {
  "1": "案1:なぞり書き",
  "2": "案2:筆順ワイプ",
  "3": "案3:インクがにじむ",
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((n) => ({ n }));
}

export default async function WriteMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  return (
    <>
      <Stage illustration="tamannee">
        <TopMock intro={2} write={num} />
      </Stage>
      <div className="fixed left-3 top-3 z-50 flex items-center gap-2">
        <Link
          href="/mock/write"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          {TITLES[n] ?? TITLES["1"]}（リロードで再生）
        </p>
      </div>
    </>
  );
}
