"use client";

/**
 * Eagleトグル UX 検討モック。
 *
 * 問題: 現状、Eagle重複フィルタをON/OFF切替すると
 *   「〇件非表示中」チップの有無によりヘッダー右側のレイアウトが
 *   横にずれる（リロード/モード切替/スライダの位置が変わる）。
 *
 * 各バリエーションで、OFF⇄ON時のずれ方を比較できるようにしている。
 */

import { useState } from "react";

/* ========================================================
   共通UIパーツ
   ======================================================== */
function ReloadBtn() {
  return (
    <button
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white"
      title="再読み込み"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
function ModeSeg() {
  return (
    <div className="inline-flex p-0.5 bg-white rounded-lg">
      {["未確認", "すべて", "確認済み"].map((l, i) => (
        <div
          key={l}
          className={`px-3 h-7 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 ${
            i === 0 ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background:
                i === 0 ? "#EF4444" : i === 1 ? "#6B7280" : "#10B981",
            }}
          />
          {l}
        </div>
      ))}
    </div>
  );
}
function Cols() {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="3" height="3" rx="0.5" />
        <rect x="6" y="1" width="3" height="3" rx="0.5" />
        <rect x="11" y="1" width="3" height="3" rx="0.5" />
        <rect x="1" y="6" width="3" height="3" rx="0.5" />
        <rect x="6" y="6" width="3" height="3" rx="0.5" />
        <rect x="11" y="6" width="3" height="3" rx="0.5" />
      </svg>
      <input
        type="range"
        className="w-[80px] accent-blue-500"
        defaultValue={4}
        min={2}
        max={8}
        readOnly
      />
    </div>
  );
}
function Search() {
  return (
    <div className="relative flex-1 max-w-[280px]">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        placeholder="検索..."
        className="w-full h-8 pl-9 pr-3 text-[13px] bg-white border border-gray-200 rounded-lg"
      />
    </div>
  );
}
function Count() {
  return (
    <span className="text-[12px] text-gray-500 whitespace-nowrap">
      3,905 / 4,763 sites
    </span>
  );
}
function EagleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`relative w-8 h-5 rounded-full transition-colors ${
        on ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          on ? "left-[14px]" : "left-0.5"
        }`}
      />
    </div>
  );
}
function StatusDot() {
  return <span className="w-2 h-2 rounded-full bg-emerald-500" />;
}

/* ========================================================
   バリエーション（それぞれの Right Cluster 実装）
   ======================================================== */

/** A. 現行 — チップが後から追加され、右側が左にずれる */
function VariantA({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      {on && (
        <button className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-600 text-[12px] font-medium">
          <EagleIcon />
          858 件非表示中
        </button>
      )}
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** B. 固定プレースホルダ — チップ枠は常に存在、OFF時は透明扱い */
function VariantB({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      {/* 固定幅のチップ枠 */}
      <button
        className={`h-8 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
          on
            ? "border-blue-300 bg-blue-50 text-blue-600"
            : "border-transparent text-transparent pointer-events-none select-none"
        }`}
      >
        <EagleIcon />
        858 件非表示中
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** C. ピル内カウント統合 — 件数をEagleピルの中へ */
function VariantC({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
        title={on ? "クリックで除外一覧を見る" : ""}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        {on && (
          <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded-full bg-white border border-blue-200 text-blue-600 text-[11px] font-medium tabular-nums">
            <EagleIcon className="w-3 h-3" />
            858
          </span>
        )}
        <Toggle on={on} />
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** D. アイコン+バッジのみ — テキストなし、超コンパクト */
function VariantD({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      {/* バッジ付きアイコンボタン（固定サイズ・OFF時は非活性） */}
      <button
        className={`relative w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${
          on ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed"
        }`}
        disabled={!on}
        title={on ? "除外858件の一覧" : ""}
      >
        <EagleIcon className="w-4 h-4" />
        {on && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold inline-flex items-center justify-center tabular-nums">
            858
          </span>
        )}
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** E. 件数はEagleピル横のインフォ欄(左寄せ配置)へ移動 — 右側は不動 */
function VariantE({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** F. トグル自体にカウントを内包 — スイッチの上に件数が乗る */
function VariantF({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-2 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <span className="w-px h-4 bg-gray-200" />
        <span
          className={`text-[11px] tabular-nums min-w-[56px] text-right ${
            on ? "text-blue-600 font-semibold" : "text-gray-400"
          }`}
        >
          {on ? "858件" : "全件表示"}
        </span>
        <Toggle on={on} />
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/* ========================================================
   Variant Frame（カード表示）
   ======================================================== */
interface VariantProps {
  id: string;
  title: string;
  tldr: string;
  pros: string[];
  cons: string[];
  Component: React.FC<{ on: boolean }>;
  recommended?: boolean;
}

function VariantFrame({ id, title, tldr, pros, cons, Component, recommended }: VariantProps) {
  return (
    <section className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <header className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-semibold inline-flex items-center justify-center shrink-0">
          {id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
            {recommended && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                おすすめ
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5">{tldr}</p>
        </div>
      </header>

      <div className="p-5 space-y-3 bg-gray-50/50">
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            OFF
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 h-[56px] flex items-center justify-end">
            <Component on={false} />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            ON（Eagle重複を隠す）
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 h-[56px] flex items-center justify-end">
            <Component on={true} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
        <div className="p-4 border-r border-gray-100">
          <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-2">
            Pros
          </h4>
          <ul className="space-y-1">
            {pros.map((p, i) => (
              <li key={i} className="text-[12px] text-gray-700 flex gap-1.5">
                <span className="text-emerald-500">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-wide mb-2">
            Cons
          </h4>
          <ul className="space-y-1">
            {cons.map((c, i) => (
              <li key={i} className="text-[12px] text-gray-700 flex gap-1.5">
                <span className="text-rose-400">–</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ========================================================
   Page
   ======================================================== */
export default function Page() {
  const [secondaryOn, setSecondaryOn] = useState(false);

  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Eagleトグル 切替時レイアウトシフト改善案
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            現状、Eagleトグルを ON にすると「〇件非表示中」チップが突如現れてヘッダー右側が左にずれる。
            6案を比較して、切替時のガタつきを最小にしたい。
            <br />
            <span className="text-gray-500">
              各カード: ヘッダー右側の <b>OFF</b> / <b>ON</b> を並べて表示、位置ズレが一目で比較できる。
            </span>
          </p>
        </div>

        {/* 案E 用の特別版：ヘッダー全体デモ（セカンダリバー配置） */}
        <section className="mb-10 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <header className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-semibold inline-flex items-center justify-center shrink-0">
              E
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-gray-900">
                  ヘッダー下にセカンダリバー
                </h3>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                ヘッダーには常に「Eagle + トグル」だけ。ON時は下の薄いバーに「N件非表示中」と「一覧を見る」ボタンが生える。ヘッダー内は何も動かない。
              </p>
            </div>
            <button
              onClick={() => setSecondaryOn((v) => !v)}
              className="text-[12px] px-3 py-1 rounded bg-gray-900 text-white"
            >
              トグル: {secondaryOn ? "ON" : "OFF"}
            </button>
          </header>

          <div className="bg-gray-50/50 p-5">
            {/* ヘッダー再現 */}
            <div className="bg-white border border-gray-200 rounded-t-lg">
              <div className="h-[56px] flex items-center px-5 gap-4 border-b border-gray-100">
                <Search />
                <Count />
                <div className="ml-auto">
                  <VariantE on={secondaryOn} />
                </div>
              </div>
              {/* セカンダリバー: ON時のみ出現 */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  secondaryOn ? "h-10 opacity-100" : "h-0 opacity-0"
                }`}
              >
                <div className="h-10 flex items-center px-5 gap-3 bg-blue-50/50 border-b border-blue-100 text-[12px]">
                  <EagleIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-blue-700 font-medium">
                    Eagle重複 858件を非表示中
                  </span>
                  <button className="text-blue-600 underline">一覧を見る</button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
            <div className="p-4 border-r border-gray-100">
              <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Pros</h4>
              <ul className="space-y-1 text-[12px] text-gray-700">
                <li>✓ ヘッダー内のレイアウトは一切動かない</li>
                <li>✓ 情報量豊富に書ける（件数、案内、ボタン等）</li>
                <li>✓ 通常OFFで邪魔にならない、ON時だけ存在感</li>
              </ul>
            </div>
            <div className="p-4">
              <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-wide mb-2">Cons</h4>
              <ul className="space-y-1 text-[12px] text-gray-700">
                <li>– 縦方向にコンテンツ領域が1行削られる</li>
                <li>– 画面全体の縦スクロール位置がズレる</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 比較グリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VariantFrame
            id="A"
            title="現行（問題あり）"
            tldr="ON時にチップが追加され、右側の要素が左にずれる。"
            pros={["実装シンプル", "情報量豊富"]}
            cons={[
              "切替時にガタつく（ユーザビリティ問題）",
              "右側要素の位置が変わるので目が追いづらい",
            ]}
            Component={VariantA}
          />
          <VariantFrame
            id="B"
            title="固定スペース確保"
            tldr="チップ枠を常に存在させ、OFF時は透明にする。"
            pros={[
              "レイアウトが1ミリも動かない",
              "ON化したときに視線誘導がスムーズ",
              "実装もシンプル",
            ]}
            cons={[
              "OFF時に余白がちょっと不自然（情報密度の無駄）",
            ]}
            Component={VariantB}
            recommended
          />
          <VariantFrame
            id="C"
            title="ピル内統合"
            tldr="件数バッジを Eagle ピルの中に含める。ピル自体の幅は増えるが、ピル右側の要素の相対位置は保たれる。"
            pros={[
              "1つの関連情報として凝集している",
              "情報と操作が同じピル内で完結",
            ]}
            cons={[
              "ピル全体の幅がON/OFFで変わる → 他要素はやはり少しずれる",
              "クリック領域の用途(トグルvsモーダル)が曖昧になりがち",
            ]}
            Component={VariantC}
          />
          <VariantFrame
            id="D"
            title="アイコン＋バッジ"
            tldr="件数はテキスト無しでバッジ数字のみ。ボタンは常に同じ枠サイズ。"
            pros={[
              "超コンパクト、レイアウト完全固定",
              "通知感があり気づきやすい",
            ]}
            cons={[
              "「何の件数か」が初見で分かりにくい（要ツールチップ）",
              "ボタン役割がEagleピルと分離してて混乱の可能性",
            ]}
            Component={VariantD}
          />
          <VariantFrame
            id="F"
            title="トグル内にカウント内包"
            tldr="Eagle ピル内にカウント表示を固定幅で配置、OFF時は『全件表示』と出す。"
            pros={[
              "ピル幅が常に一定（min-width固定）",
              "ON/OFFで状態が明確に切り替わる",
              "全ての情報が1ピルに凝集",
            ]}
            cons={[
              "ピル自体がやや横長になる",
              "『一覧を見る』動線が弱い（ピル全体クリックで開く設計が必要）",
            ]}
            Component={VariantF}
          />
        </div>

        <div className="mt-10 p-5 rounded-xl bg-white border border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">個人的な推し</h2>
          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
            <b className="text-gray-900">B（固定スペース確保）</b> が最も無難で実装コストも低い。
            <br />
            情報性と見た目のリッチさを両立したいなら <b className="text-gray-900">E（セカンダリバー）</b> が有力。OFF時は完全に消えるが、ON時は「一覧を見る」動線と件数が同居できる。
            <br />
            コンパクトさ最優先なら <b className="text-gray-900">F（ピル内統合 + min-width）</b>。
          </p>
        </div>
      </div>
    </main>
  );
}
