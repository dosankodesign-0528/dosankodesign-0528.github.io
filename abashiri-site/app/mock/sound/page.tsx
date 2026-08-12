import Link from "next/link";

/* 環境音UI（初回確認＋ON/OFF切替）比較 mock 一覧 */
export default function SoundMockIndex() {
  const items = [
    {
      href: "/mock/sound/1",
      title: "案1：白カードのモーダル",
      desc: "画面中央に丁寧に確認を出す、いちばんスタンダードな案。切替は左下の丸ボタン（🔊/🔇）。",
    },
    {
      href: "/mock/sound/2",
      title: "案2：下部のスリムバー",
      desc: "画面を遮らずに下からスッと聞く控えめ案。切替は「環境音 ON/OFF」のピル型ボタン。",
    },
    {
      href: "/mock/sound/3",
      title: "案3：左下のふきだしポップ",
      desc: "サイトの世界観に寄せた、ふきだしでちょこんと聞く案。切替は♪マークの丸ボタン。",
    },
  ];
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          環境音UI 比較mock（3案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          初回の「再生しますか？」確認と、ON/OFF切替ボタンのセットです。
          <br />
          どれも本物のTOPページ。mockでは毎回確認が出ます（ONを押すと音が流れます）。
        </p>
        <div className="flex flex-col gap-4">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="rounded-2xl bg-white/90 p-5 backdrop-blur transition-transform hover:scale-[1.02]"
            >
              <p className="mb-1 text-[18px] font-black text-[#0070c9]">{it.title}</p>
              <p className="text-[13px] font-medium leading-relaxed text-[#1e1e1e]">
                {it.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
