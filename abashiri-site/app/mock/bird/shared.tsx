import Link from "next/link";

/* 比較mock共通：空のステージとサンプル配置 */
export function MockStage({
  title,
  children,
  css,
}: {
  title: string;
  children: React.ReactNode;
  css: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff]">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
        <Link
          href="/mock/bird"
          className="rounded-full bg-white/90 px-4 py-2 text-[13px] font-black text-[#0070c9]"
        >
          ← 一覧へ
        </Link>
        <p className="text-[15px] font-black text-white drop-shadow">{title}</p>
      </div>
      {children}
    </main>
  );
}
