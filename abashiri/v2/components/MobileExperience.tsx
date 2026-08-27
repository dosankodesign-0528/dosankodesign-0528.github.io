"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * スマホ（〜640px）用のぼーっと体験ページ。デスクトップの固定キャンバス
 * （Stage＋ExperienceFlow）とは別に、390px 向けに作る（2026-08-24 ヒデさん依頼）。
 *
 * 3ステップ：導入 → 場所えらび → 動画再生（ぼーっとTips付き）。
 * 動画は ryuhyo.mp4 の1本のみ（＝流氷クルーズだけ体験可。デスクトップと同じ）。
 * 導入の人物イラストは KV と同じ配置・サイズ（右下・w-90・-bottom-30）。
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BoTips, { DEFAULT_BO_TIPS } from "./BoTips";

const PICKS = [
  { id: "notoro", label: "能取岬", img: "/img/spot-notoro.jpg" },
  { id: "sangoso", label: "能取湖サンゴ草群落地", img: "/img/spot-sangoso.jpg" },
  { id: "eki", label: "網走駅", img: "/img/spot-eki.jpg" },
  { id: "ryuhyo", label: "流氷クルーズ", img: "/img/ice.jpg", video: "/video/ryuhyo.mp4" },
];
const VIDEO_IDX = PICKS.findIndex((p) => p.video);

export default function MobileExperience() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "pick" | "video">("intro");
  const [pick, setPick] = useState(VIDEO_IDX);
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(180);
  const [ui, setUi] = useState(true); // 再生UI（ボタン・タイマー）表示
  const [tipsVisible, setTipsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = PICKS[pick];

  /* 再生⇄映像の同期＋音量フェードイン */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || step !== "video") return;
    if (playing) {
      v.play().catch(() => setPlaying(false));
      v.volume = 0;
      const start = v.currentTime;
      const onTime = () => {
        const p = Math.min(1, (v.currentTime - start) / 3);
        v.volume = p;
        if (p >= 1) v.removeEventListener("timeupdate", onTime);
      };
      v.addEventListener("timeupdate", onTime);
      return () => v.removeEventListener("timeupdate", onTime);
    }
    v.pause();
  }, [playing, step]);

  /* タイマー */
  useEffect(() => {
    if (step !== "video" || !playing || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [step, playing, remaining]);

  /* 再生UIの自動非表示（2.4秒） */
  const poke = () => {
    setUi(true);
    if (hideT.current) clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setUi(false), 2400);
  };
  useEffect(() => {
    if (step === "video" && playing) poke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, playing]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const controls = (ui || !playing) && !tipsVisible;

  const glass =
    "flex items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/45 backdrop-blur-[12px] transition-transform active:scale-95";

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-brand text-white">
      {/* 背景（導入・場所えらびは景色、動画は映像） */}
      {step !== "video" && (
        <>
          <img
            src={step === "pick" ? active.img : "/img/bg-hero.jpg"}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand/55 via-brand/25 to-brand/60" />
        </>
      )}

      {/* 環境音トグルの置き場（無いと SoundUi が左下に出るため右上に固定）。KV同様に少し小さく */}
      <div
        id="abashiri-sound-slot"
        className="absolute right-4 top-5 z-40 flex h-[22px] origin-right scale-[0.72] items-center"
      />

      {/* 戻る（左上） */}
      <button
        type="button"
        aria-label="戻る"
        onClick={() => {
          if (step === "video") {
            setPlaying(false);
            setStep("pick");
          } else if (step === "pick") setStep("intro");
          else router.push("/");
        }}
        className="absolute left-5 top-5 z-40 flex size-9 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── 導入 ─────────────────────────── */}
      {step === "intro" && (
        <section className="relative z-10 flex h-full flex-col">
          <div className="flex flex-1 -translate-y-6 flex-col items-center justify-center px-6 text-center">
            <p className="text-[13px] font-light">網走に来る前に、まずやってみよう</p>
            <p className="mt-2 text-[34px] font-thin">ぼーっと体験</p>
            <div className="mt-10 space-y-5 text-[14px] font-light leading-[1.9]">
              <p>網走は何もないけど、それがたまらない。</p>
              <p>
                忙しなく過ごす、あなたの日常からそっと離れて、
                <br />
                何も考えず、「ぼーっとする」こと。
              </p>
              <p>
                それが最大の癒しであり、くつろぎです。
                <br />
                網走では、そんな体験が思う存分できる。
              </p>
              <p>
                ウェブサイトを通して、その空間を疑似体験しよう。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("pick")}
              className={`${glass} mt-10 px-8 py-[13px] text-[14px] font-medium leading-none`}
            >
              次へ進む
            </button>
          </div>
          {/* 人物イラスト（KVと同配置・同サイズ） */}
          <img
            src="/img/illust-main.png"
            alt=""
            className="pointer-events-none absolute -bottom-[30px] right-3 z-10 w-[90px]"
          />
        </section>
      )}

      {/* ── 場所えらび ───────────────────── */}
      {step === "pick" && (
        <section className="relative z-10 flex h-full flex-col justify-between px-6 pb-10 pt-20">
          <h2 className="text-center text-[24px] font-thin">どこでぼーっとする？</h2>

          <div className="flex flex-col items-center">
            <p className="text-[13px] font-extralight">ぼーっとスポット 0{VIDEO_IDX + 1}</p>
            <p className="mt-1 text-[26px] font-thin">{active.label}</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* サムネの帯（流氷を選択中。動画があるのは流氷だけ） */}
            <div className="flex w-full justify-center gap-2">
              {PICKS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPick(i)}
                  className={`h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                    i === pick ? "ring-white" : "ring-white/0 opacity-60"
                  }`}
                >
                  <img src={p.img} alt={p.label} className="size-full object-cover" />
                </button>
              ))}
            </div>

            {active.video ? (
              <button
                type="button"
                onClick={() => {
                  setStep("video");
                  setPlaying(true);
                }}
                className={`${glass} w-full max-w-[342px] py-[15px] text-[15px] font-medium leading-none`}
              >
                この場所にする
              </button>
            ) : (
              <p className="text-[12px] font-light text-white/70">
                この場所の体験は準備中です
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 動画再生 ─────────────────────── */}
      {step === "video" && (
        <div className="absolute inset-0" onClick={poke}>
          <video
            ref={videoRef}
            src={active.video}
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* ぼーっとTips（再生UIが消えたら＝何もない状態からカウント） */}
          <BoTips
            active={playing && !controls}
            tune={DEFAULT_BO_TIPS}
            onVisibleChange={setTipsVisible}
            compact
          />

          {/* 再生/一時停止 */}
          <button
            type="button"
            aria-label={playing ? "一時停止" : "再生"}
            onClick={(e) => {
              e.stopPropagation();
              setPlaying((v) => !v);
              poke();
            }}
            className={`absolute left-1/2 top-1/2 z-10 flex size-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-500 ${
              controls ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={playing ? "/img/icon-pause.svg" : "/img/play-circle.svg"}
              alt=""
              className="size-full"
            />
          </button>

          {/* ぼーっとタイマー（左下・数字のみ） */}
          <div
            className={`absolute bottom-8 left-6 z-10 rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-[65px] transition-opacity duration-500 ${
              controls ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-num text-[44px] font-thin leading-none">
              {mm}:{ss}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
