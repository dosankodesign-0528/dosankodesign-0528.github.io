import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import { DEFAULT_BUBBLE } from "@/components/bubbleConfig";
import { TAIL_PRESETS } from "../presets";

export function generateStaticParams() {
  return Object.keys(TAIL_PRESETS).map((n) => ({ n }));
}

export default async function TailMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const preset = TAIL_PRESETS[n] ?? TAIL_PRESETS["2"];
  return (
    <>
      <Stage illustration="tamannee" illustEntrance>
        {/* 本番と同じく、環境音のON/OFFに答えてから再生する */}
        <TopMock
          intro={2}
          blurSeq
          waitConsent
          bubbleTune={{ ...DEFAULT_BUBBLE, tail: preset.tail }}
        />
      </Stage>
      <div className="fixed left-3 top-3 z-[70] flex items-center gap-2">
        <Link
          href="/mock/tail"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          {preset.title}（吹き出しの下に注目）
        </p>
      </div>
    </>
  );
}
