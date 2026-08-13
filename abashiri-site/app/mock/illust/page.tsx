import Link from "next/link";

/* 人物イラストの繰り返しアニメ 比較 mock 一覧 */
export default function IllustMockIndex() {
  const items = [
    {
      href: "/mock/illust/1",
      title: "案1：くるん一回転（現行）",
      desc: "15秒に1回、横軸でクルンと一回転。今入っているアニメです。",
    },
    {
      href: "/mock/illust/2",
      title: "案2：ゆらゆらスイング",
      desc: "足元を支点に左右へ大きめの角度でゆらゆら。メトロノームみたいな揺れ方。",
    },
    {
      href: "/mock/illust/3",
      title: "案3：ぷるんと弾む",
      desc: "ゼリーみたいに縦横へむにっと伸び縮み。弾力のあるコミカルな動き。",
    },
    {
      href: "/mock/illust/4",
      title: "案2-B：スイング（キレ鋭め）",
      desc: "最初にビュッと振れて、あとはスッと収まる。緩急がはっきりした揺れ。",
    },
    {
      href: "/mock/illust/5",
      title: "案2-C：スイング（振り子減衰）",
      desc: "振り子みたいに大きく振れて、だんだん小さくなって止まる。",
    },
  ];
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          人物イラストアニメ 比較mock（1〜3案＋スイング変化形）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          どの案も約15秒に1回動きます。登場直後に1回目が始まるので、開いてすぐ確認できます。
          <br />
          （文字「たまんねーっ」とキラキラは動かさず、人物だけが動きます）
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
