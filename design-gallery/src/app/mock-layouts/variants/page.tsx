"use client";

import { useState } from "react";

/* ========================================================
   P02 ベースの見た目バリエーション 10案
   - 段組みは固定（1段目: Logo / Search / Count / ↻ / Segment）
                 （2段目: Sources / Sort）
   - 違いはセグメントとソートの見た目のみ
   - 目的: セグメント（未確認/すべて/確認済み）と
          ソート（↓新しい順/制作会社/Date）の識別性を上げる
   ======================================================== */
type Source = "sankou" | "81web" | "muuuuu" | "webdesignclip";
type ViewMode = "unchecked" | "all" | "checked";

const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: "sankou", label: "SANKOU!", color: "#E85D75" },
  { id: "81web", label: "81-web.com", color: "#4A90D9" },
  { id: "muuuuu", label: "MUUUUU.ORG", color: "#2ECC71" },
  { id: "webdesignclip", label: "Web Design Clip", color: "#9B59B6" },
];
const MODES: { id: ViewMode; label: string; count: number }[] = [
  { id: "unchecked", label: "未確認", count: 2429 },
  { id: "all", label: "すべて", count: 4763 },
  { id: "checked", label: "確認済み", count: 2334 },
];

function useFilter() {
  const [mode, setMode] = useState<ViewMode>("unchecked");
  const [src, setSrc] = useState<Source[]>([]);
  const toggle = (s: Source) =>
    setSrc((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const clear = () => setSrc([]);
  return { mode, setMode, src, toggle, clear };
}

/* ---------- 共通 atoms ---------- */
function Logo() {
  return <h1 className="text-[15px] font-semibold tracking-tight whitespace-nowrap">Design Gallery</h1>;
}
function Count() {
  return <span className="text-sm text-gray-500 whitespace-nowrap">2,429 / 4,763 sites</span>;
}
function Search() {
  return (
    <div className="relative flex-1 max-w-[420px] min-w-[120px]">
      <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
        <path fill="currentColor" d="M9.5 3a6.5 6.5 0 015.25 10.34l4.96 4.95-1.42 1.42-4.95-4.96A6.5 6.5 0 119.5 3zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
      </svg>
      <input placeholder="サイト名、URL、エージェンシーで検索..." className="w-full h-9 pl-8 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200" />
    </div>
  );
}
function ReloadBtn() {
  return (
    <button title="再読み込み" className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">↻</button>
  );
}
function SourcePill({ s, active, onClick }: { s: (typeof SOURCES)[0]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-full border transition ${active ? "border-transparent text-white" : "border-gray-200 text-gray-700 hover:border-gray-300"}`} style={active ? { background: s.color } : {}}>
      {!active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
      {s.label}
    </button>
  );
}
function Sources({ src, toggle, clear }: { src: Source[]; toggle: (s: Source) => void; clear: () => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={clear} className={`h-8 px-3 text-xs rounded-full border ${src.length === 0 ? "bg-gray-900 text-white border-gray-900" : "text-gray-700 border-gray-200 hover:border-gray-300"}`}>すべて</button>
      {SOURCES.map((s) => <SourcePill key={s.id} s={s} active={src.includes(s.id)} onClick={() => toggle(s.id)} />)}
    </div>
  );
}

/* ---------- Wrap ---------- */
function Wrap({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-[11px] text-gray-500">{note}</span>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">{children}</div>
    </section>
  );
}

/* ---------- 1段目フレーム（Segmentだけ差し替え） ---------- */
function Row1({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Logo /><Search /><Count /><div className="ml-auto"><ReloadBtn /></div>{children}
    </div>
  );
}
/* ---------- 2段目フレーム（Sort部分だけ差し替え） ---------- */
function Row2({ f, sort }: { f: ReturnType<typeof useFilter>; sort: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Sources {...f} />
      <div className="ml-auto flex items-center gap-2">{sort}</div>
    </div>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-3 space-y-3 bg-white">{children}</div>;
}

/* ========================================================
   V01: 現行ベース（比較用）
   セグメント＝連結グループ、ソート＝ボーダー付きテキストボタン
   ======================================================== */
function V01() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex p-0.5 bg-gray-100 rounded-lg h-8">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`px-3 text-xs font-medium rounded-md transition-all ${f.mode === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>{m.label}</button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button className="h-8 px-3 text-xs inline-flex items-center gap-1 border border-gray-200 rounded-md text-gray-700 hover:border-gray-300">↓ 新しい順</button>
      <button className="h-8 px-3 text-xs inline-flex items-center gap-1 border border-gray-200 rounded-md text-gray-700 hover:border-gray-300">制作会社</button>
      <button className="h-8 px-3 text-xs inline-flex items-center gap-1 border border-gray-200 rounded-md text-gray-700 hover:border-gray-300">▾ Date</button>
    </>
  );
  return (
    <Wrap title="V01. 現行ベース（比較用）" note="セグメント＝連結グループ、ソート＝ボーダー付きボタン">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V02: セグメントに状態ドット、ソートは小型テキストリンク
   ======================================================== */
function V02() {
  const f = useFilter();
  const dot = (id: ViewMode) => id === "unchecked" ? "#EF4444" : id === "checked" ? "#10B981" : "#6B7280";
  const seg = (
    <div className="inline-flex p-0.5 bg-gray-100 rounded-lg h-8">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`px-3 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-all ${f.mode === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot(m.id) }} />{m.label}
        </button>
      ))}
    </div>
  );
  const sort = (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <button className="hover:text-gray-900 hover:underline underline-offset-2">↓ 新しい順</button>
      <span className="text-gray-300">/</span>
      <button className="hover:text-gray-900 hover:underline underline-offset-2">制作会社</button>
      <span className="text-gray-300">/</span>
      <button className="hover:text-gray-900 hover:underline underline-offset-2">▾ Date</button>
    </div>
  );
  return (
    <Wrap title="V02. 状態ドット＋テキストリンクソート" note="セグメントに赤/緑ドットで状態を視覚化。ソートはテキストリンクに格下げ">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V03: 大型ピル×小型ゴーストソート
   ======================================================== */
function V03() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex gap-1.5">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`h-9 px-4 text-[13px] font-semibold rounded-full transition ${f.mode === m.id ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{m.label}</button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button className="h-7 px-2 text-[11px] text-gray-600 hover:bg-gray-100 rounded inline-flex items-center gap-1">↓ 新しい順</button>
      <button className="h-7 px-2 text-[11px] text-gray-600 hover:bg-gray-100 rounded">制作会社</button>
      <button className="h-7 px-2 text-[11px] text-gray-600 hover:bg-gray-100 rounded inline-flex items-center gap-1">▾ Date</button>
    </>
  );
  return (
    <Wrap title="V03. 大型ピル × 小型ゴーストソート" note="セグメント＝大きく主張、ソート＝脇役に徹底。サイズ差で役割が一目瞭然">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V04: アイコン接頭辞セグメント × chevronソート
   ======================================================== */
function V04() {
  const f = useFilter();
  const ico = { unchecked: "◐", all: "○", checked: "●" } as const;
  const seg = (
    <div className="inline-flex p-0.5 bg-gray-100 rounded-lg h-8">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`px-3 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-all ${f.mode === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          <span className="text-sm leading-none">{ico[m.id]}</span>{m.label}
        </button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button className="h-8 px-2.5 text-xs inline-flex items-center gap-1 text-gray-700 hover:bg-gray-100 rounded-md">新しい順 <span className="text-gray-400">▾</span></button>
      <button className="h-8 px-2.5 text-xs inline-flex items-center gap-1 text-gray-700 hover:bg-gray-100 rounded-md">制作会社 <span className="text-gray-400">▾</span></button>
    </>
  );
  return (
    <Wrap title="V04. アイコン接頭辞セグメント × chevronソート" note="◐○●で状態を象徴。ソートは▾で「展開できる」をほのめかす">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V05: 下線タブ式セグメント × ソートはピル
   ======================================================== */
function V05() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex h-8 gap-4 border-b border-gray-200 items-end pb-0.5">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`relative text-xs font-medium pb-1.5 ${f.mode === m.id ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          {m.label}
          {f.mode === m.id && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}
        </button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button className="h-8 px-3 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">↓ 新しい順</button>
      <button className="h-8 px-3 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">制作会社</button>
      <button className="h-8 px-3 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">▾ Date</button>
    </>
  );
  return (
    <Wrap title="V05. 下線タブ式セグメント × 丸ピルソート" note="形が完全に別物。タブとピルは並んでも混同しない">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V06: カウントバッジ付きセグメント × 単一ソートドロップダウン
   ======================================================== */
function V06() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex p-0.5 bg-gray-100 rounded-lg h-8">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`px-3 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-all ${f.mode === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          {m.label}
          <span className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full ${f.mode === m.id ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"}`}>{m.count.toLocaleString()}</span>
        </button>
      ))}
    </div>
  );
  const sort = (
    <button className="h-8 px-3 text-xs inline-flex items-center gap-1.5 border border-gray-200 rounded-md text-gray-700 hover:border-gray-300">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-500"><path fill="currentColor" d="M3 6h18v2H3zm4 5h10v2H7zm4 5h2v2h-2z" /></svg>
      並び順: 新しい順 <span className="text-gray-400">▾</span>
    </button>
  );
  return (
    <Wrap title="V06. カウントバッジ × ソートは1ボタンに集約" note="セグメントに情報量を与え、ソートは押せば開くドロップダウンへ統合">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V07: アクティブ色違いセグメント × アイコンのみソート
   ======================================================== */
function V07() {
  const f = useFilter();
  const palette: Record<ViewMode, string> = { unchecked: "#EF4444", all: "#111827", checked: "#10B981" };
  const seg = (
    <div className="inline-flex gap-1.5">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className="h-8 px-3 text-xs font-medium rounded-md transition-colors"
          style={f.mode === m.id ? { background: palette[m.id], color: "#fff" } : { background: "#F3F4F6", color: "#4B5563" }}>
          {m.label}
        </button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button title="新しい順" className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">↓</button>
      <button title="制作会社" className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h10v2H3z" /></svg>
      </button>
      <button title="Date" className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M7 2v2H3v18h18V4h-4V2h-2v2H9V2H7zm0 4v2h2V6h6v2h2V6h2v4H5V6h2zM5 12h14v8H5v-8z" /></svg>
      </button>
    </>
  );
  return (
    <Wrap title="V07. 意味色セグメント × アイコンのみソート" note="未確認=赤、確認済み=緑で意味を色に込める。ソートはアイコン化で完全に別物に">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V08: チェックボックス風セグメント × chip風ソート
   ======================================================== */
function V08() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex gap-2">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`h-8 pl-2 pr-3 text-xs inline-flex items-center gap-1.5 rounded-md border transition ${f.mode === m.id ? "border-gray-900 bg-white text-gray-900 font-semibold" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
          <span className={`w-3.5 h-3.5 rounded-[3px] inline-flex items-center justify-center ${f.mode === m.id ? "bg-gray-900 text-white" : "border border-gray-300 bg-white"}`}>
            {f.mode === m.id && <svg viewBox="0 0 24 24" className="w-2.5 h-2.5"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z" /></svg>}
          </span>
          {m.label}
        </button>
      ))}
    </div>
  );
  const sort = (
    <div className="inline-flex items-center gap-1 h-8 px-1 bg-gray-50 border border-gray-200 rounded-md text-xs">
      <span className="text-gray-400 px-1.5">Sort</span>
      <button className="px-2 py-0.5 rounded bg-white shadow-sm text-gray-800">新しい順</button>
      <button className="px-2 py-0.5 rounded text-gray-500 hover:bg-white">制作会社</button>
      <button className="px-2 py-0.5 rounded text-gray-500 hover:bg-white">Date</button>
    </div>
  );
  return (
    <Wrap title="V08. チェック風セグメント × Sortラベル付き入れ物" note="セグメントは「選べる感」を強調、ソートは“Sort:”という前置きで役割を明示">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V09: セグメントは独立ボックス × ソートはアイコン付きピル
   ======================================================== */
function V09() {
  const f = useFilter();
  const seg = (
    <div className="inline-flex items-center h-8 rounded-lg border border-gray-300 overflow-hidden">
      <span className="h-full px-2.5 inline-flex items-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 border-r border-gray-300">状態</span>
      {MODES.map((m, i) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`h-full px-3 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${f.mode === m.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{m.label}</button>
      ))}
    </div>
  );
  const sort = (
    <>
      <button className="h-8 px-3 text-xs inline-flex items-center gap-1 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-3 h-3"><path fill="currentColor" d="M3 18h6v-2H3v2zm0-5h12v-2H3v2zm0-7v2h18V6H3z" /></svg>新しい順
      </button>
      <button className="h-8 px-3 text-xs bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100">制作会社</button>
      <button className="h-8 px-3 text-xs bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100">Date</button>
    </>
  );
  return (
    <Wrap title="V09. 「状態:」ラベル付きセグメント × 薄色ピルソート" note="前置きラベルでセグメントが何かを明示。ソートは薄いピルで別グループ感を出す">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   V10: 縦書きでっかいセグメント × 極小ソート
   ======================================================== */
function V10() {
  const f = useFilter();
  const seg = (
    <div className="relative inline-flex p-1 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 h-10">
      {MODES.map((m) => (
        <button key={m.id} onClick={() => f.setMode(m.id)} className={`relative px-4 text-[13px] font-semibold rounded-lg transition-all ${f.mode === m.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          {m.label}
        </button>
      ))}
    </div>
  );
  const sort = (
    <div className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
      <span className="px-1">↓ 新しい順</span>
      <span className="text-gray-300">·</span>
      <span className="px-1 hover:text-gray-900 cursor-pointer">制作会社</span>
      <span className="text-gray-300">·</span>
      <span className="px-1 hover:text-gray-900 cursor-pointer">Date</span>
    </div>
  );
  return (
    <Wrap title="V10. ヒーロー級セグメント × 超ミニマルソート" note="セグメントを一番目立つ主役に昇格。ソートはテキスト並びまで落として完全に脇役">
      <Shell><Row1>{seg}</Row1><Row2 f={f} sort={sort} /></Shell>
    </Wrap>
  );
}

/* ========================================================
   ページ本体
   ======================================================== */
export default function VariantsPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-gray-50">
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">P02 見た目バリエーション 10案</h1>
          <p className="text-sm text-gray-600 mt-1">段組みは共通（1段目: Logo / Search / Count / ↻ / セグメント、2段目: ソース / ソート）。セグメントとソートの識別性を上げる案を並べてる。</p>
        </header>
        <V01 /><V02 /><V03 /><V04 /><V05 />
        <V06 /><V07 /><V08 /><V09 /><V10 />
      </div>
    </div>
  );
}
