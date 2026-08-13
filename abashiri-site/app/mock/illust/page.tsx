import Link from "next/link";

/* 人物イラスト スイング（ため→速い戻り→バウンス）比較 mock 一覧 */
export default function IllustMockIndex() {
  const items = [
    {
      href: "/mock/illust/1",
      title: "案1：スタンダード",
      desc: "ためゆっくり（全体の4割）→ シュッと戻って3回弾む。バランス型。",
    },
    {
      href: "/mock/illust/2",
      title: "案2：ためたっぷり",
      desc: "全体の半分を使ってじーっくりためる → 戻りの速さが際立つ。弾みも強め。",
    },
    {
      href: "/mock/illust/3",
      title: "案3：キレ重視",
      desc: "+16°まで大きくためて戻りは超速。弾みは小さく短く、スパッと止まる。",
    },
    {
      href: "/mock/illust/4",
      title: "案4：大振りコミカル",
      desc: "+18°の大振り＋たっぷり5回弾む、一番にぎやかで漫画っぽい動き。",
    },
    {
      href: "/mock/illust/5",
      title: "案5：小ぶり上品",
      desc: "同じ緩急のまま揺れ幅を+9°に抑えた、さりげない控えめ版。",
    },
  ];
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          人物スイング 比較mock（5案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          どの案も「息を吸うようにゆっくりため → 一気に戻る → 弾んで収まる」が共通で、
          ための長さ・角度・弾み方が違います。約15秒に1回動きます（登場直後に1回目）。
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
