"use client";

/*
 * 「もっと見る」ホバーアクション 5案の比較mock（2026-08-23 ヒデさん依頼）
 * 実物と同じ書体・サイズ・アイコンで、青背景（スポット系）と白背景（グルメ系）の
 * 両方の文脈に置いて比較できる。採用が決まったらこのページは削除する。
 */

const PATTERNS = [
  {
    n: 1,
    name: "まるごと右へ10px",
    desc: "ボタン全体（文字＋アイコン）がスッと右へ10px動く。いちばんシンプル。",
    cls: "vm-p1",
  },
  {
    n: 2,
    name: "アイコンだけ右へ",
    desc: "文字は動かず、アイコンだけ右へ8px。今のトップの採用案に近い動き。",
    cls: "vm-p2",
  },
  {
    n: 3,
    name: "下線がスッと伸びる",
    desc: "文字の下に細い線が左から伸びる＋アイコンが2pxだけ付いてくる。",
    cls: "vm-p3",
  },
  {
    n: 4,
    name: "字間がふわっと開く",
    desc: "文字間がゆっくり広がって、全体が少し明るくなる。動きは小さく上品。",
    cls: "vm-p4",
  },
  {
    n: 5,
    name: "アイコンが流れてループ",
    desc: "ホバー中、アイコンが右へ抜けて左から戻る動きを繰り返す。遊びが強め。",
    cls: "vm-p5",
  },
];

function More({
  cls,
  dark,
}: {
  cls: string;
  dark?: boolean;
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={`vm ${cls} flex w-max cursor-pointer items-center gap-4 font-extralight ${
        dark ? "text-ink" : "text-white"
      }`}
      style={{ fontSize: 16 }}
    >
      <span className="vm-label">もっと見る</span>
      <span className="vm-ico-clip">
        <img
          src={dark ? "/img/icon-view-more-black.svg" : "/img/icon-view-more.svg"}
          alt=""
          className="vm-ico size-[18px]"
        />
      </span>
    </a>
  );
}

export default function ViewMoreMock() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] pb-40 font-sans">
      <style>{`
        .vm-label { position: relative; display: inline-block; }
        .vm-ico-clip { display: inline-flex; }

        /* 案1: まるごと右へ10px */
        .vm-p1 { transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .vm-p1:hover { transform: translateX(10px); }

        /* 案2: アイコンだけ右へ8px */
        .vm-p2 .vm-ico { transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .vm-p2:hover .vm-ico { transform: translateX(8px); }

        /* 案3: 下線がスッと伸びる＋アイコン2px */
        .vm-p3 .vm-label::after {
          content: ""; position: absolute; left: 0; bottom: -3px; height: 1px; width: 100%;
          background: currentColor; transform: scaleX(0); transform-origin: left;
          transition: transform .35s cubic-bezier(.22,1,.36,1);
        }
        .vm-p3:hover .vm-label::after { transform: scaleX(1); }
        .vm-p3 .vm-ico { transition: transform .35s cubic-bezier(.22,1,.36,1); }
        .vm-p3:hover .vm-ico { transform: translateX(2px); }

        /* 案4: 字間がふわっと開く＋少し明るく */
        .vm-p4 { opacity: .82; transition: opacity .4s ease; }
        .vm-p4 .vm-label { transition: letter-spacing .4s cubic-bezier(.22,1,.36,1); }
        .vm-p4:hover { opacity: 1; }
        .vm-p4:hover .vm-label { letter-spacing: 1.5px; }

        /* 案5: アイコンが流れてループ */
        .vm-p5 .vm-ico-clip { overflow: hidden; }
        .vm-p5:hover .vm-ico { animation: vm-flow 0.9s ease-in-out infinite; }
        @keyframes vm-flow {
          0% { transform: translateX(0); opacity: 1; }
          45% { transform: translateX(22px); opacity: 0; }
          50% { transform: translateX(-22px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-[1100px] px-8 pt-16">
        <h1 className="text-[22px] font-light text-ink">
          「もっと見る」ホバー 5案（マウスを乗せて比較）
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
          上段＝青背景（ぼーっとスポットなどの文脈）／下段＝白背景（グルメの文脈）。
          実物と同じ書体・サイズ・アイコンです。採用する番号を教えてください。
        </p>

        <div className="mt-10 space-y-8">
          {PATTERNS.map((p) => (
            <section key={p.n} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-baseline gap-3 px-6 pt-5">
                <span className="text-[15px] font-medium text-ink">案{p.n} {p.name}</span>
                <span className="text-[12px] text-ink/55">{p.desc}</span>
              </div>
              <div className="mt-4 grid grid-cols-2">
                {/* 青背景（スポット系） */}
                <div className="flex items-center justify-center bg-gradient-to-b from-brand to-[#7fb8e8] py-12">
                  <More cls={p.cls} />
                </div>
                {/* 白背景（グルメ系） */}
                <div className="flex items-center justify-center bg-white py-12">
                  <More cls={p.cls} dark />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
