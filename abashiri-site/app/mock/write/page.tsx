import Link from "next/link";

/* 手書きパスアニメーション比較 mock 一覧 */
export default function WriteMockIndex() {
  const items = [
    {
      href: "/mock/write/1",
      title: "案1：なぞり書き",
      desc: "サインペンの先が線をなぞって走るように、一画ずつ書き進んでいく。いちばん「書いてる感」が強い案。",
    },
    {
      href: "/mock/write/2",
      title: "案2：筆順ワイプ",
      desc: "画ごとに左からサッと書き上がっていく。テンポがよく軽快な案。",
    },
    {
      href: "/mock/write/3",
      title: "案3：インクがにじむ",
      desc: "画ごとにインクがじわっと紙に染みるように現れる。やわらかく上品な案。",
    },
  ];
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          手書きアニメーション 比較mock（3案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          「な〜んにもない たまらない」が書かれていく様子の比較です。
          <br />
          どれも本物のTOPページ。リロードすると何度でも見られます。
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
