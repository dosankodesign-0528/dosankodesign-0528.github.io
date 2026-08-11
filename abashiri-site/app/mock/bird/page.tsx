import Link from "next/link";

/* カモメ羽ばたきアニメーション比較 mock 一覧 */
export default function BirdMockIndex() {
  const items = [
    {
      href: "/mock/bird/1",
      title: "案1：左右の羽を分割して回転",
      desc: "羽を左右半分ずつに分けて、体を支点にパタパタと逆位相で回転。GIF的な羽ばたき感が一番出る案。",
    },
    {
      href: "/mock/bird/2",
      title: "案2：紙飛行機風の3D羽ばたき",
      desc: "カモメ全体を奥行き方向にパタッと折るように回転。遠くを飛んでいる鳥の「チラチラ」した見え方に近い案。",
    },
    {
      href: "/mock/bird/3",
      title: "案3：変形なし・ふわふわ漂うだけ",
      desc: "イラストを一切変形させず、ゆっくり上下に揺れて傾くだけ。上品で背景に馴染む、大人しい案。",
    },
  ];
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          カモメ羽ばたき 比較mock
        </h1>
        <p className="mb-8 text-[14px] font-bold text-white/80">
          各案のページで実際の動きを確認できます（iPhoneでもOK）
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
