"use client";

/*
 * ぼーっとTips の「閉じる」デザイン5案の比較mock（2026-08-23 ヒデさん依頼）
 * 実物と同じモーダル（カンプ 15564:22022）を流氷の写真の上に置き、
 * ×を押すとフェードアウトで消える感触まで確かめられる。
 * 採用が決まったらこのページは削除する。
 */
import { useState } from "react";

const VARIANTS = [
  {
    n: 1,
    name: "外側右上の丸ガラス×",
    desc: "モーダルの右上角に、ピルと同じすりガラスの丸ボタンが半分乗る。Tipsピルと対の意匠。",
  },
  {
    n: 2,
    name: "内側右上のシンプル×",
    desc: "モーダルの中、右上にほそい×だけ。いちばん控えめで、映像の邪魔をしない。",
  },
  {
    n: 3,
    name: "下中央の「とじる」ピル",
    desc: "本文の下、中央に「とじる」の文字ピル。上のTipsピルと上下対称のつくり。",
  },
  {
    n: 4,
    name: "右上の「✕ とじる」ラベル",
    desc: "×印と「とじる」の文字をセットで右上に。何が起きるか一番わかりやすい。",
  },
  {
    n: 5,
    name: "枠の外・右上の×",
    desc: "モーダルの外、右上のななめ上に浮かぶ×。写真アプリでよくある形。",
  },
];

function CloseUi({ n, onClose }: { n: number; onClose: () => void }) {
  const x = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 2L14 14M14 2L2 14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
  switch (n) {
    case 1:
      return (
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          className="absolute -right-[16px] -top-[16px] flex size-[44px] cursor-pointer items-center justify-center rounded-full bg-white/40 text-white backdrop-blur-[90px] transition-all duration-300 hover:bg-white/60"
        >
          {x}
        </button>
      );
    case 3:
      return (
        <button
          type="button"
          onClick={onClose}
          className="absolute -bottom-[15px] left-1/2 flex w-[120px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-white/40 px-4 py-[6px] text-body-14 text-white backdrop-blur-[90px] transition-all duration-300 hover:bg-white/60"
        >
          とじる
        </button>
      );
    case 4:
      return (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex cursor-pointer items-center gap-1.5 text-body-14 text-white/70 transition-colors duration-300 hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          とじる
        </button>
      );
    case 5:
      return (
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          className="absolute -right-[52px] -top-[8px] flex size-[36px] cursor-pointer items-center justify-center text-white/80 transition-colors duration-300 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      );
    default: /* 2 */
      return (
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center text-white/70 transition-colors duration-300 hover:text-white"
        >
          {x}
        </button>
      );
  }
}

function TipsModal({ n }: { n: number }) {
  const [shown, setShown] = useState(true);
  const [fading, setFading] = useState(false);
  const close = () => {
    setFading(true);
    setTimeout(() => setShown(false), 1200);
  };
  return (
    <div className="relative h-[560px] overflow-hidden rounded-2xl bg-[url('/img/spot-ryuhyo.jpg')] bg-cover bg-center">
      {!shown && (
        <button
          type="button"
          onClick={() => {
            setShown(true);
            setFading(false);
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/40 px-6 py-2 text-body-14 text-ink backdrop-blur-lg"
        >
          もう一度出す
        </button>
      )}
      {shown && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* カンプ 15564:22022 実寸（幅700・白10%・ブラー65・p44） */}
          <div className="relative w-[620px] rounded-2xl bg-white/10 p-[44px] backdrop-blur-[65px]">
            <div className="absolute -top-[22px] left-1/2 flex w-[186px] -translate-x-1/2 items-center justify-center rounded-full bg-white/40 px-4 py-[6px] backdrop-blur-[90px]">
              <p className="text-body-16 leading-[1.2] text-white">ぼーっとTips</p>
            </div>
            <CloseUi n={n} onClose={close} />
            <div className="flex flex-col items-center gap-6 text-center text-white">
              <div className="flex flex-col items-center gap-2 leading-[1.2]">
                <p className="text-[20px] font-extralight">五感を使おう</p>
                <p className="whitespace-nowrap text-[40px] font-extralight">
                  今、何が聞こえる？
                </p>
              </div>
              <p className="text-left text-body-14 font-light leading-[1.8]">
                音に集中して、耳を澄ませましょう。どんな音が聞こえてくるでしょうか。船のエンジン音、鳥のなく声、流氷が軋む音などでも構いません。その音に集中してみよう。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TipsCloseMock() {
  return (
    /* サイト全体は overflow:hidden なので、mockは自前でスクロールする（SCROLL-RULES.md） */
    <main className="h-screen overflow-y-auto bg-[#f4f6f8] pb-40 font-sans">
      <div className="mx-auto max-w-[1100px] px-8 pt-16">
        <h1 className="text-[22px] font-light text-ink">
          ぼーっとTips「閉じる」5案（×を押すとフェードアウト）
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
          実物と同じすりガラスのモーダルを流氷の写真に重ねています。閉じたあとは「もう一度出す」で戻せます。採用する番号を教えてください。
        </p>
        <div className="mt-10 space-y-10">
          {VARIANTS.map((v) => (
            <section key={v.n}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="text-[15px] font-medium text-ink">
                  案{v.n} {v.name}
                </span>
                <span className="text-[12px] text-ink/55">{v.desc}</span>
              </div>
              <TipsModal n={v.n} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
