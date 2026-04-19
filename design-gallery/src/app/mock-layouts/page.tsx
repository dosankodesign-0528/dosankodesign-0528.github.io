"use client";

import { useState } from "react";

/* ========================================================
   共通: 型・定数・ヘルパー
   ======================================================== */
type Source = "sankou" | "81web" | "muuuuu" | "webdesignclip";
type ViewMode = "unchecked" | "all" | "checked";

const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: "sankou", label: "SANKOU!", color: "#E85D75" },
  { id: "81web", label: "81-web.com", color: "#4A90D9" },
  { id: "muuuuu", label: "MUUUUU.ORG", color: "#2ECC71" },
  { id: "webdesignclip", label: "Web Design Clip", color: "#9B59B6" },
];
const MODES: { id: ViewMode; label: string }[] = [
  { id: "unchecked", label: "未確認" },
  { id: "all", label: "すべて" },
  { id: "checked", label: "確認済み" },
];

function useFilter() {
  const [mode, setMode] = useState<ViewMode>("unchecked");
  const [src, setSrc] = useState<Source[]>([]);
  const toggle = (s: Source) =>
    setSrc((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const clear = () => setSrc([]);
  return { mode, setMode, src, toggle, clear };
}

/* 共通 atoms */
function Logo() {
  return <h1 className="text-[15px] font-semibold tracking-tight">Design Gallery</h1>;
}
function Count({ small = false }: { small?: boolean }) {
  return (
    <span className={`${small ? "text-xs" : "text-sm"} text-gray-500 whitespace-nowrap`}>
      2,429 / 4,763 sites
    </span>
  );
}
function Search({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative flex-1 ${compact ? "max-w-[240px]" : "max-w-[420px]"} min-w-[120px]`}>
      <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"><path fill="currentColor" d="M9.5 3a6.5 6.5 0 015.25 10.34l4.96 4.95-1.42 1.42-4.95-4.96A6.5 6.5 0 119.5 3zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>
      <input placeholder="サイト名、URL、エージェンシーで検索..." className="w-full h-9 pl-8 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"/>
    </div>
  );
}
function Segment({ mode, setMode, size = "md" }: { mode: ViewMode; setMode: (v: ViewMode) => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7" : "h-8";
  const px = size === "sm" ? "px-2.5" : "px-3";
  const tx = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <div className={`inline-flex p-0.5 bg-gray-100 rounded-lg ${h}`}>
      {MODES.map((m) => (
        <button key={m.id} onClick={() => setMode(m.id)} className={`${px} ${tx} font-medium rounded-md transition-all ${mode === m.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
function SourcePill({ s, active, onClick, size = "md" }: { s: (typeof SOURCES)[0]; active: boolean; onClick: () => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs";
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 ${h} rounded-full border transition ${active ? "border-transparent text-white" : "border-gray-200 text-gray-700 hover:border-gray-300"}`} style={active ? { background: s.color } : {}}>
      {!active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
      {s.label}
    </button>
  );
}
function Sources({ src, toggle, clear, size = "md" }: { src: Source[]; toggle: (s: Source) => void; clear: () => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={clear} className={`${h} rounded-full border ${src.length === 0 ? "bg-gray-900 text-white border-gray-900" : "text-gray-700 border-gray-200 hover:border-gray-300"}`}>すべて</button>
      {SOURCES.map((s) => <SourcePill key={s.id} s={s} active={src.includes(s.id)} onClick={() => toggle(s.id)} size={size} />)}
    </div>
  );
}
function GhostBtn({ children, size = "md" }: { children: React.ReactNode; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs";
  return <button className={`${h} inline-flex items-center gap-1 border border-gray-200 rounded-md text-gray-700 hover:border-gray-300`}>{children}</button>;
}
function IconBtn({ title, children }: { title?: string; children: React.ReactNode }) {
  return <button title={title} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">{children}</button>;
}
function Slider() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400"><path fill="currentColor" d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
      <input type="range" className="w-16 accent-gray-700" />
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400"><path fill="currentColor" d="M3 3h4v4H3zm6 0h4v4H9zm6 0h4v4h-4zM3 9h4v4H3zm6 0h4v4H9zm6 0h4v4h-4zM3 15h4v4H3zm6 0h4v4H9zm6 0h4v4h-4z"/></svg>
    </div>
  );
}

/* ========================================================
   各パターン
   ======================================================== */

// 01: 現行（2段）- ベースライン
function P01() {
  const f = useFilter();
  return (
    <Wrap title="01. 現行（2段）- ベースライン" note="行1=アイデンティティ、行2=フィルタ">
      <div className="px-5 py-3 space-y-3 bg-white">
        <div className="flex items-center gap-4">
          <Logo /><Search /><Count /><IconBtn>↻</IconBtn><Slider />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Segment mode={f.mode} setMode={f.setMode} />
          <div className="w-px h-5 bg-gray-200" />
          <Sources {...f} />
          <div className="ml-auto flex items-center gap-1.5"><GhostBtn>↓ 新しい順</GhostBtn><GhostBtn>制作会社</GhostBtn><GhostBtn>▾ Date</GhostBtn><button className="text-xs text-blue-600">× クリア</button></div>
        </div>
      </div>
    </Wrap>
  );
}

// 02: ロゴ行の右端にセグメント
function P02() {
  const f = useFilter();
  return (
    <Wrap title="02. ロゴ行の右端にセグメント" note="行1右端にviewMode、行2はソース+ソート">
      <div className="px-5 py-3 space-y-3 bg-white">
        <div className="flex items-center gap-4"><Logo /><Search /><Count /><div className="ml-auto"><IconBtn>↻</IconBtn></div><Segment mode={f.mode} setMode={f.setMode} /></div>
        <div className="flex items-center gap-1.5 flex-wrap"><Sources {...f} /><div className="ml-auto flex items-center gap-1.5"><GhostBtn>↓ 新しい順</GhostBtn><GhostBtn>制作会社</GhostBtn><GhostBtn>▾ Date</GhostBtn></div></div>
      </div>
    </Wrap>
  );
}

// 03: フィルタ行の右端にセグメント
function P03() {
  const f = useFilter();
  return (
    <Wrap title="03. フィルタ行の右端にセグメント" note="セグメントは視線の最後に置き“確定アクション”化">
      <div className="px-5 py-3 space-y-3 bg-white">
        <div className="flex items-center gap-4"><Logo /><Search /><Count /><Slider /></div>
        <div className="flex items-center gap-1.5 flex-wrap"><Sources {...f} /><div className="ml-auto flex items-center gap-2"><GhostBtn>↓</GhostBtn><GhostBtn>制作会社</GhostBtn><GhostBtn>Date</GhostBtn><Segment mode={f.mode} setMode={f.setMode} /></div></div>
      </div>
    </Wrap>
  );
}

// 04: 状態をトップタブ化
function P04() {
  const f = useFilter();
  return (
    <Wrap title="04. 状態をトップタブ化" note="未確認/すべて/確認済み がメインナビ">
      <div className="bg-white">
        <div className="flex items-center gap-4 px-5 py-3"><Logo /><Search /><Count /><Slider /></div>
        <div className="flex items-end px-5 border-b border-gray-200">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => f.setMode(m.id)} className={`relative px-4 py-2 text-sm ${f.mode === m.id ? "text-gray-900" : "text-gray-500"}`}>
              {m.label}{f.mode === m.id && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-gray-900"/>}
            </button>
          ))}
          <div className="ml-auto pb-2"><Sources {...f} size="sm" /></div>
        </div>
      </div>
    </Wrap>
  );
}

// 05: メディアをトップタブ化
function P05() {
  const f = useFilter();
  const [tab, setTab] = useState<Source | "all">("all");
  return (
    <Wrap title="05. メディアをトップタブ化" note="ソース切替がメインナビ。状態は右に">
      <div className="bg-white">
        <div className="flex items-center gap-4 px-5 py-3"><Logo /><Search /><Count /><Slider /></div>
        <div className="flex items-end px-5 border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setTab("all")} className={`px-4 py-2 text-sm relative shrink-0 ${tab === "all" ? "text-gray-900" : "text-gray-500"}`}>すべて{tab === "all" && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-gray-900"/>}</button>
          {SOURCES.map((s) => (
            <button key={s.id} onClick={() => setTab(s.id)} className={`relative px-4 py-2 text-sm flex items-center gap-1.5 shrink-0 ${tab === s.id ? "text-gray-900" : "text-gray-500"}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }}/>{s.label}{tab === s.id && <span className="absolute left-2 right-2 -bottom-px h-0.5" style={{ background: s.color }}/>}
            </button>
          ))}
          <div className="ml-auto pb-2 pl-3 shrink-0"><Segment mode={f.mode} setMode={f.setMode} size="sm"/></div>
        </div>
      </div>
    </Wrap>
  );
}

// 06: 左サイドバー（Pinterest風）
function P06() {
  const f = useFilter();
  return (
    <Wrap title="06. 左サイドバー" note="フィルタは左側に常時表示、本文エリア広く">
      <div className="flex bg-white min-h-[280px]">
        <aside className="w-[200px] border-r border-gray-200 p-4 space-y-5 shrink-0">
          <Logo />
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">状態</div><div className="flex flex-col gap-1">{MODES.map((m) => <button key={m.id} onClick={() => f.setMode(m.id)} className={`text-left px-2 py-1 text-xs rounded-md ${f.mode === m.id ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>{m.label}</button>)}</div></div>
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">メディア</div><div className="flex flex-col gap-1">{SOURCES.map((s) => <label key={s.id} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-gray-50 rounded-md"><input type="checkbox" checked={f.src.includes(s.id)} onChange={() => f.toggle(s.id)} className="accent-gray-700"/><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }}/>{s.label}</label>)}</div></div>
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">並び</div><GhostBtn size="sm">↓ 新しい順</GhostBtn></div>
        </aside>
        <main className="flex-1 p-4"><div className="flex items-center gap-3"><Search /><Count /><Slider /></div></main>
      </div>
    </Wrap>
  );
}

// 07: 「フィルタ」ボタン1つに集約
function P07() {
  const [open, setOpen] = useState(false);
  const f = useFilter();
  const activeCount = (f.mode !== "unchecked" ? 1 : 0) + f.src.length;
  return (
    <Wrap title="07. フィルタボタンに集約" note="“フィルタ”をクリックでパネル展開。適用数をバッジ表示">
      <div className="relative bg-white">
        <div className="flex items-center gap-3 px-5 py-3"><Logo /><Search /><button onClick={() => setOpen(!open)} className="h-8 px-3 text-xs inline-flex items-center gap-1.5 border border-gray-200 rounded-md hover:border-gray-300"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>フィルタ{activeCount > 0 && <span className="w-4 h-4 text-[10px] bg-gray-900 text-white rounded-full inline-flex items-center justify-center">{activeCount}</span>}</button><GhostBtn>↓ 新しい順</GhostBtn><Count /><Slider /></div>
        {open && (
          <div className="absolute left-5 top-14 w-[380px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4 z-10">
            <div><div className="text-xs text-gray-500 mb-2">状態</div><Segment mode={f.mode} setMode={f.setMode}/></div>
            <div><div className="text-xs text-gray-500 mb-2">メディア</div><Sources {...f} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100"><button onClick={f.clear} className="text-xs text-gray-500">クリア</button><button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded">適用</button></div>
          </div>
        )}
      </div>
    </Wrap>
  );
}

// 08: 適用フィルタをチップ列で表示
function P08() {
  const f = useFilter();
  return (
    <Wrap title="08. 適用フィルタをチップ列で表示" note="選んだ条件が水平リストに。×でひとつずつ外せる">
      <div className="px-5 py-3 bg-white space-y-2.5">
        <div className="flex items-center gap-3"><Logo /><Search /><Count /><Slider /></div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <GhostBtn>＋ フィルタ追加</GhostBtn>
          <Chip color="#374151">状態: {MODES.find((m) => m.id === f.mode)?.label}</Chip>
          {f.src.map((s) => <Chip key={s} color={SOURCES.find((x) => x.id === s)!.color} onRemove={() => f.toggle(s)}>{SOURCES.find((x) => x.id === s)!.label}</Chip>)}
          {f.src.length === 0 && <span className="text-xs text-gray-400">メディアフィルタなし（全ソース表示中）</span>}
          <div className="ml-auto flex items-center gap-1.5"><GhostBtn>↓ 新しい順</GhostBtn><GhostBtn>▾ Date</GhostBtn></div>
        </div>
        <div className="flex gap-1 flex-wrap">{SOURCES.map((s) => !f.src.includes(s.id) && <button key={s.id} onClick={() => f.toggle(s.id)} className="text-[11px] text-gray-400 hover:text-gray-700 px-1">+ {s.label}</button>)}</div>
      </div>
    </Wrap>
  );
}

// 09: ⌘K コマンドパレット（ヘッダー最小化）
function P09() {
  return (
    <Wrap title="09. ⌘K コマンドパレット" note="ヘッダーは最小。⌘Kでフルフィルタパネルを開く">
      <div className="flex items-center justify-between px-5 py-3 bg-white gap-3">
        <Logo />
        <button className="h-8 px-3 inline-flex items-center gap-2 text-xs text-gray-500 border border-gray-200 rounded-md flex-1 max-w-[360px] justify-between hover:border-gray-300">
          <span className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M9.5 3a6.5 6.5 0 015.25 10.34l4.96 4.95-1.42 1.42-4.95-4.96A6.5 6.5 0 119.5 3zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>サイト検索・フィルタ…</span>
          <kbd className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">⌘ K</kbd>
        </button>
        <div className="flex items-center gap-2"><Count small /><Slider /></div>
      </div>
    </Wrap>
  );
}

// 10: 右サイドバー（Figma風）
function P10() {
  const f = useFilter();
  return (
    <Wrap title="10. 右サイドバー" note="主役は一覧。フィルタは右に。詳細設定が多いときに">
      <div className="flex bg-white min-h-[280px]">
        <main className="flex-1 p-4"><div className="flex items-center gap-3"><Logo /><Search /><Count /><Slider /></div></main>
        <aside className="w-[220px] border-l border-gray-200 p-4 space-y-4 shrink-0">
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">状態</div><Segment mode={f.mode} setMode={f.setMode} size="sm"/></div>
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">メディア</div><div className="flex flex-wrap gap-1.5">{SOURCES.map((s) => <SourcePill key={s.id} s={s} active={f.src.includes(s.id)} onClick={() => f.toggle(s.id)} size="sm"/>)}</div></div>
          <div className="space-y-2"><div className="text-[11px] uppercase tracking-wider text-gray-400">並び</div><GhostBtn size="sm">↓ 新しい順</GhostBtn></div>
        </aside>
      </div>
    </Wrap>
  );
}

// 11: ラベル付き行分割
function P11() {
  const f = useFilter();
  return (
    <Wrap title="11. 機能別ラベル行" note="“状態：” “メディア：” のラベルで意味を明示">
      <div className="px-5 py-3 bg-white space-y-2">
        <div className="flex items-center gap-4"><Logo /><Search /><Count /><Slider /></div>
        <div className="flex items-center gap-3"><span className="text-[11px] text-gray-400 w-16">状態</span><Segment mode={f.mode} setMode={f.setMode} size="sm"/></div>
        <div className="flex items-center gap-3"><span className="text-[11px] text-gray-400 w-16">メディア</span><Sources {...f} size="sm"/></div>
        <div className="flex items-center gap-3"><span className="text-[11px] text-gray-400 w-16">並び</span><GhostBtn size="sm">↓ 新しい順</GhostBtn><GhostBtn size="sm">制作会社</GhostBtn><GhostBtn size="sm">Date</GhostBtn></div>
      </div>
    </Wrap>
  );
}

// 12: ミニマルヘッダー＋フローティングフィルタ
function P12() {
  const f = useFilter();
  return (
    <Wrap title="12. ミニマルヘッダー + フローティングフィルタ" note="ヘッダーは超小さく。フィルタは下部に浮くバー">
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100"><Logo /><div className="flex items-center gap-3"><Search compact /><Count small/></div></div>
        <div className="p-4 bg-gray-50 text-xs text-gray-400">← ページ本文 ↑がメイン、フィルタは下の浮きバー</div>
        <div className="mx-4 mb-4 p-1 bg-gray-900 text-white rounded-full inline-flex items-center gap-1 shadow-lg flex-wrap">
          <Segment mode={f.mode} setMode={f.setMode} size="sm"/>
          <div className="w-px h-5 bg-gray-700"/>
          <Sources {...f} size="sm"/>
        </div>
      </div>
    </Wrap>
  );
}

// 13: 分割レイアウト（2列ヘッダー）
function P13() {
  const f = useFilter();
  return (
    <Wrap title="13. 2カラムヘッダー" note="左=状態切替・右=メディア / 画面を機能で2分">
      <div className="grid grid-cols-2 bg-white divide-x divide-gray-200">
        <div className="p-4 space-y-3"><div className="flex items-center gap-3"><Logo /><Count small/></div><Segment mode={f.mode} setMode={f.setMode}/></div>
        <div className="p-4 space-y-3"><Search /><Sources {...f} size="sm"/></div>
      </div>
    </Wrap>
  );
}

// 14: カウントを主役にしたヒーローヘッダー
function P14() {
  const f = useFilter();
  return (
    <Wrap title="14. カウントヒーロー" note="大きな数字でスケール感を演出、フィルタは下に">
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-baseline gap-3 px-5 pt-5"><Logo /><span className="text-[11px] text-gray-400">— Webデザイン事例ギャラリー</span></div>
        <div className="flex items-center justify-between px-5 py-4 gap-3">
          <div><div className="text-3xl font-semibold tracking-tight">2,429<span className="text-base font-normal text-gray-400"> / 4,763 sites</span></div><div className="text-[11px] text-gray-500 mt-1">未確認 - SANKOU! のみ</div></div>
          <div className="flex items-center gap-2 shrink-0"><Search compact /><Slider /></div>
        </div>
        <div className="flex items-center gap-2 px-5 pb-4 flex-wrap"><Segment mode={f.mode} setMode={f.setMode} size="sm"/><div className="w-px h-5 bg-gray-200"/><Sources {...f} size="sm"/><div className="ml-auto"><GhostBtn size="sm">↓ 新しい順</GhostBtn></div></div>
      </div>
    </Wrap>
  );
}

// 15: スマート検索バー（検索がフィルタをすべて飲み込む）
function P15() {
  const f = useFilter();
  return (
    <Wrap title="15. スマート検索バー" note="検索バーの中に全フィルタを内包。Notion/Linear風">
      <div className="px-5 py-3 bg-white space-y-3">
        <div className="flex items-center gap-3"><Logo /><Count /><div className="ml-auto"><Slider /></div></div>
        <div className="min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg px-3 flex items-center gap-1.5 flex-wrap hover:border-gray-300">
          <span className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">状態: {MODES.find((m) => m.id === f.mode)?.label}</span>
          {f.src.map((s) => <span key={s} className="text-[11px] text-white rounded px-1.5 py-0.5" style={{ background: SOURCES.find((x) => x.id === s)!.color }}>{SOURCES.find((x) => x.id === s)!.label}</span>)}
          {f.src.length === 0 && <span className="text-[11px] text-gray-400">＋ メディア</span>}
          <input placeholder="キーワード検索…" className="flex-1 min-w-[120px] bg-transparent outline-none text-sm h-9"/>
        </div>
      </div>
    </Wrap>
  );
}

/* ========================================================
   Wrap + Chip ヘルパー
   ======================================================== */
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

function Chip({ color, children, onRemove }: { color: string; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2 pr-1.5 text-[11px] text-white rounded-full" style={{ background: color }}>
      {children}
      {onRemove && <button onClick={onRemove} className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-white/20">×</button>}
    </span>
  );
}

/* ========================================================
   ページ本体（body {overflow: hidden} を回避するため fixed + overflow-y-auto）
   ======================================================== */
export default function MockLayoutsPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-gray-50">
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">ヘッダーレイアウト 15パターン</h1>
          <p className="text-sm text-gray-600 mt-1">Design Gallery のヘッダー/フィルタバー案。クリックで動作します（状態・ソース選択は独立）。</p>
        </header>
        <P01 /><P02 /><P03 /><P04 /><P05 />
        <P06 /><P07 /><P08 /><P09 /><P10 />
        <P11 /><P12 /><P13 /><P14 /><P15 />
      </div>
    </div>
  );
}
