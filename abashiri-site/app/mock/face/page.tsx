"use client";

/*
 * 人物イラストの眉がマウスに反応する動きの調整パネル
 * - 本物のTOPページを表示したまま、動く量をスライダーで調整できる
 * - 動きが細かくて実機だと見づらいので、顔を拡大した「のぞき窓」を付けてある
 * - 値はその場で反映される（保存して再生は不要）
 */
import { useRef, useState } from "react";
import Link from "next/link";
import Stage from "@/components/Stage";
import TopPage from "@/components/TopPage";
import TunePanel from "@/components/TunePanel";
import IllustTamannee, { ILLUST_RENDER } from "@/components/IllustTamannee";
import { DEFAULT_FACE, type FaceConfig } from "@/components/faceConfig";
import { useFaceReaction } from "@/components/useFaceReaction";

/* のぞき窓の中心。イラスト（284x357表示）上での目のあたり */
const LOUPE = { x: 128, y: 112, zoom: 2.4, h: 165 };

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

export default function FaceTunePage() {
  const [face, setFace] = useState<FaceConfig>(DEFAULT_FACE);
  const upd = (patch: Partial<FaceConfig>) => setFace((f) => ({ ...f, ...patch }));

  /* のぞき窓のイラストも、本番と同じようにカーソルへ反応させる */
  const loupeRef = useRef<HTMLDivElement>(null);
  const loupeLift = useFaceReaction(loupeRef, face);

  return (
    <>
      <Stage illustration="tamannee" face={face}>
        <TopPage intro={2} />
      </Stage>

      <TunePanel title="🤨 顔の反応 調整">
        <div className="mb-3 overflow-hidden rounded-lg border border-[#bcd6ea] bg-white">
          {/* 当たり判定は「窓」の方で取る。中身は拡大されていて、
              getBoundingClientRect が窓からはみ出した大きさを返すため */}
          <div ref={loupeRef} className="relative w-full" style={{ height: LOUPE.h }}>
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: ILLUST_RENDER.w,
                height: ILLUST_RENDER.h,
                /* 目のあたりを窓のまん中に固定したまま拡大する */
                transformOrigin: `${LOUPE.x}px ${LOUPE.y}px`,
                transform: `translate(${-LOUPE.x}px, ${-LOUPE.y}px) scale(${LOUPE.zoom})`,
              }}
            >
              <IllustTamannee lift={loupeLift} className="size-full" />
            </div>
          </div>
          <p className="bg-[#e6f3ff] px-2 py-1 text-[10px] font-bold text-[#0070c9]">
            ↑ 顔を{LOUPE.zoom}倍にした確認用。この窓にもカーソルを乗せると眉が動きます
          </p>
        </div>

        <Slider
          label="眉が持ち上がる量"
          value={face.browLift} min={0} max={20} step={0.5} unit="px"
          onChange={(v) => upd({ browLift: v })}
        />

        <Slider
          label="反応する範囲の広げ幅"
          value={face.hoverPad} min={0} max={120} step={5} unit="px"
          onChange={(v) => upd({ hoverPad: v })}
        />

        <div className="mt-3 rounded-lg bg-[#f4f9ff] p-2">
          <p className="text-[10px] font-bold text-[#7ba7cc]">いまの設定</p>
          <code className="block text-[11px] font-black leading-relaxed text-[#0070c9]">
            browLift: {face.browLift}, hoverPad: {face.hoverPad}
          </code>
        </div>

        <button
          onClick={() => setFace(DEFAULT_FACE)}
          className="mt-2 w-full cursor-pointer rounded-full bg-[#e6f3ff] py-2 text-[12px] font-bold text-[#0070c9]"
        >
          初期値にもどす
        </button>
        <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#7ba7cc]">
          決まったら「いまの設定」の数字をClaudeに伝えてください（本番に反映します）
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
