"use client";

/*
 * 眉毛ホバーの調整パネル
 * - 本物のTOPページを表示したまま、動く量をスライダーで調整できる
 * - 動きが細かくて実機だと見づらいので、顔を拡大した「のぞき窓」を付けてある
 * - 値はその場で反映される（保存して再生は不要）
 */
import { useRef, useState } from "react";
import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import TunePanel from "@/components/TunePanel";
import IllustTamannee from "@/components/IllustTamannee";
import { DEFAULT_BROW, type BrowConfig } from "@/components/browConfig";
import { useBrowHover } from "@/components/useBrowHover";

/* のぞき窓。イラスト（284x357表示）上での眉あたりを中心に拡大する */
const LOUPE = { x: 130, y: 100, zoom: 2.6, h: 160 };

function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block py-1.5 pl-1">
      <span className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#1e1e1e]">{label}</span>
        <span className="text-[12px] font-black text-[#0070c9]">
          {value}
          <span className="ml-0.5 text-[10px] text-[#7ba7cc]">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        className="mt-1 w-full accent-[#0070c9]"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function BrowTunePage() {
  const [brow, setBrow] = useState<BrowConfig>(DEFAULT_BROW);
  const upd = (patch: Partial<BrowConfig>) => setBrow((b) => ({ ...b, ...patch }));

  /* のぞき窓のイラストも、本番と同じようにカーソルへ反応させる。
     当たり判定は「窓」の方で取る（中身は拡大されていて、
     getBoundingClientRect が窓からはみ出した大きさを返すため） */
  const loupeRef = useRef<HTMLDivElement>(null);
  const loupeOver = useBrowHover(loupeRef, brow.hoverPad);

  return (
    <>
      <Stage illustration="tamannee" brow={brow}>
        <TopMock intro={2} />
      </Stage>

      <TunePanel title="🤨 眉毛ホバー調整">
        <div className="mb-3 overflow-hidden rounded-lg border border-[#bcd6ea] bg-white">
          <div ref={loupeRef} className="relative w-full" style={{ height: LOUPE.h }}>
            <div
              className="absolute left-1/2 top-1/2 h-[357px] w-[284px]"
              style={{
                /* 眉の中心を窓のまん中に固定したまま拡大する */
                transformOrigin: `${LOUPE.x}px ${LOUPE.y}px`,
                transform: `translate(${-LOUPE.x}px, ${-LOUPE.y}px) scale(${LOUPE.zoom})`,
              }}
            >
              <IllustTamannee
                browLift={loupeOver ? brow.lift : 0}
                className="size-full"
              />
            </div>
          </div>
          <p className="bg-[#e6f3ff] px-2 py-1 text-[10px] font-bold text-[#0070c9]">
            ↑ 眉のまわりを{LOUPE.zoom}倍にした確認用。この窓にもカーソルを乗せると動きます
          </p>
        </div>

        <Slider
          label="眉が持ち上がる量"
          value={brow.lift} min={0} max={20} step={0.5} unit="px"
          onChange={(v) => upd({ lift: v })}
        />
        <Slider
          label="反応する範囲の広げ幅"
          value={brow.hoverPad} min={0} max={120} step={5} unit="px"
          onChange={(v) => upd({ hoverPad: v })}
        />
        <p className="pl-1 text-[10px] font-bold leading-relaxed text-[#7ba7cc]">
          広げ幅を上げると、イラストの少し外にカーソルが来ただけで反応します
        </p>

        <div className="mt-3 rounded-lg bg-[#f4f9ff] p-2">
          <p className="text-[10px] font-bold text-[#7ba7cc]">いまの設定</p>
          <code className="text-[11px] font-black text-[#0070c9]">
            lift: {brow.lift}, hoverPad: {brow.hoverPad}
          </code>
        </div>

        <button
          onClick={() => setBrow(DEFAULT_BROW)}
          className="mt-2 w-full cursor-pointer rounded-full bg-[#e6f3ff] py-2 text-[12px] font-bold text-[#0070c9]"
        >
          初期値にもどす
        </button>
        <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#7ba7cc]">
          決まったら上の数字をClaudeに伝えてください（本番に反映します）
        </p>
        <Link
          href="/"
          className="mt-2 inline-block rounded-full bg-[#e6f3ff] px-4 py-1.5 text-[12px] font-black text-[#0070c9]"
        >
          ← TOPへ
        </Link>
      </TunePanel>
    </>
  );
}
