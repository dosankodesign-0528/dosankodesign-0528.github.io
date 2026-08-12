"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Bird from "./Bird";
import MockNav from "./MockNav";

export type Step = 1 | 2 | 3;

const FEELINGS = [
  ["疲れた", "焦ってる", "イライラ"],
  ["忙しすぎる", "眠い", "ちょっと不安"],
];

const SCENES = [
  [
    { id: "tento", label: "天都山展望台", src: "/img/scene-tento.jpg", tint: "rgba(3,31,172,0.4)" },
    { id: "sango", label: "さんご草", src: "/img/scene-sango.jpg", tint: "rgba(172,51,3,0.4)" },
  ],
  [
    { id: "himawari", label: "ひまわり畑", src: "/img/scene-himawari.jpg", tint: "rgba(93,192,0,0.4)" },
    { id: "ryuhyo", label: "流氷クルーズ", src: "/img/scene-ryuhyo.jpg", tint: "rgba(3,104,172,0.4)" },
  ],
];

/* STEP インジケーター */
function StepIndicator({ step }: { step: Step }) {
  const states = [1, 2, 3].map((n) => {
    if (n < step) return "done";
    if (n === step) return "active";
    return "idle";
  });
  return (
    <div className="absolute left-1/2 top-[72px] h-[104px] w-[666px] -translate-x-1/2">
      <div className="absolute left-[20px] top-[74px] h-[5px] w-[626px] rounded-full bg-[#cce4fa]" />
      {states.map((state, i) => (
        <div
          key={i}
          className="absolute top-0 flex w-[56px] flex-col items-center gap-px"
          style={{ left: i * 305 }}
        >
          <div
            className={`font-rounded flex flex-col items-center text-center font-extrabold leading-none ${
              state === "idle" ? "text-[#adcdea] opacity-60" : "text-[#0070c9]"
            }`}
          >
            <p className="text-[14px] leading-[1.2]">STEP</p>
            <p className="text-[28px]">0{i + 1}</p>
          </div>
          <img
            src={
              state === "active"
                ? "/img/step-active.svg"
                : state === "done"
                  ? "/img/step-done.svg"
                  : "/img/step-idle.svg"
            }
            alt=""
            className="size-[56px]"
          />
        </div>
      ))}
    </div>
  );
}

/* 次へ／もどる */
function StepButtons({
  canProceed,
  onNext,
  onBack,
}: {
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="absolute left-1/2 top-[660px] flex w-[250px] -translate-x-1/2 flex-col items-center gap-[20px]">
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`w-full rounded-full bg-[#0070c9] px-[44px] py-[16px] text-[20px] font-black text-white transition-all duration-300 ${
          canProceed
            ? "cursor-pointer hover:scale-105 hover:bg-[#0080e4]"
            : "cursor-default opacity-30"
        }`}
      >
        次へ
      </button>
      <button
        onClick={onBack}
        className="cursor-pointer text-[20px] font-bold text-[#1e1e1e] transition-opacity hover:opacity-60"
      >
        もどる
      </button>
    </div>
  );
}

const stepTransition = {
  initial: { opacity: 0, y: 24, filter: "blur(12px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(12px)" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ExperienceMock({
  step,
  setStep,
}: {
  step: Step;
  setStep: (s: Step) => void;
}) {
  const router = useRouter();
  const [feelings, setFeelings] = useState<string[]>([]);
  const [scene, setScene] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(5 * 60);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* 再生ボタン・タイマーはマウス操作時だけ表示し、3秒放置で消える */
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeUi = () => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 3000);
  };
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );
  const controlsShown = uiVisible || !playing;

  /* playing の状態と <video> の再生を同期する */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      /* 音声ありで再生。ブラウザの自動再生ポリシーで拒否されたら
         一時停止表示にして、ユーザーの再生ボタン押下（ジェスチャ）で鳴らす */
      v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, step]);

  /* STEP03 に入ったら▶ボタン待ちの状態にする。
     再生ボタンを押すと動画が流れ始め、タイマーも同時に始動する */
  useEffect(() => {
    if (step === 3) {
      setRemaining(5 * 60);
      setPlaying(false);
      setUiVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* 動画が始まったらぼーっとタイマーがカウントダウン */
  useEffect(() => {
    if (step !== 3 || !playing || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [step, playing, remaining]);

  /* 動画の音声が優先：再生状態を環境音（SoundUi）へ知らせる */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abashiri:video-audio", {
        detail: { active: step === 3 && playing },
      })
    );
  }, [step, playing]);
  useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent("abashiri:video-audio", { detail: { active: false } })
      );
    },
    []
  );

  const toggleFeeling = (f: string) =>
    setFeelings((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const startVideo = () => setStep(3);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="absolute left-[76px] right-[206px] top-[87px] h-[960px] rounded-[60px] border-[30px] border-white shadow-[0px_28px_16px_0px_#0f98c2]">
      <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-[#e6f3ff]">
        <AnimatePresence mode="wait">
          {step !== 3 ? (
            <motion.div key="select" className="absolute inset-0" {...stepTransition}>
              <MockNav theme="dark" size="md" />
              <StepIndicator step={step} />

              {/* 装飾の青カモメ */}
              <div className="absolute left-[104px] top-[332px] h-[62px] w-[108px]">
                <Bird color="#b6dafc" flapDuration={0.62} driftDuration={9} />
              </div>
              <div className="absolute right-[63px] top-[199px] h-[86px] w-[160px]">
                <Bird color="#b6dafc" flapDuration={0.75} driftDuration={11} delay={0.6} />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* STEP01：気持ちの複数選択 */
                  <motion.div
                    key="step1"
                    className="absolute inset-x-0 top-[240px] flex flex-col items-center gap-[34px]"
                    {...stepTransition}
                  >
                    <p className="text-[32px] font-black leading-[1.2] text-[#1e1e1e]">
                      今、どんな気持ち？
                    </p>
                    <div className="flex flex-col items-center gap-[16px]">
                      {FEELINGS.map((row, ri) => (
                        <div key={ri} className="flex items-center gap-[12px]">
                          {row.map((f) => {
                            const active = feelings.includes(f);
                            return (
                              <button
                                key={f}
                                onClick={() => toggleFeeling(f)}
                                className={`cursor-pointer rounded-full px-[24px] py-[8px] text-[20px] font-black transition-all duration-300 hover:scale-105 ${
                                  active
                                    ? "bg-[#87d500] text-white shadow-[2px_3px_0.5px_rgba(0,96,189,0.25)]"
                                    : "bg-white/90 text-[#0070c9]"
                                }`}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* STEP02：場面の選択 */
                  <motion.div
                    key="step2"
                    className="absolute inset-x-0 top-[240px] flex flex-col items-center gap-[34px]"
                    {...stepTransition}
                  >
                    <p className="text-[32px] font-black leading-[1.2] text-[#1e1e1e]">
                      どこで、ぼーっとする？
                    </p>
                    <div className="flex flex-col gap-[30px]">
                      {SCENES.map((row, ri) => (
                        <div
                          key={ri}
                          className="flex items-center justify-center gap-[34px] drop-shadow-[2px_3px_0.5px_rgba(0,96,189,0.4)]"
                        >
                          {row.map((s) => {
                            const dimmed = scene !== null && scene !== s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setScene(s.id)}
                                className={`relative h-[120px] w-[300px] cursor-pointer overflow-hidden rounded-[12px] border-[10px] border-white transition-all duration-300 hover:scale-[1.03] ${
                                  dimmed ? "opacity-35" : "opacity-100"
                                }`}
                              >
                                <img
                                  src={s.src}
                                  alt=""
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div
                                  className="absolute inset-0"
                                  style={{ background: s.tint }}
                                />
                                <span className="relative z-10 flex h-full w-full items-center justify-center text-[20px] font-black text-white">
                                  {s.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <StepButtons
                canProceed={step === 1 ? feelings.length > 0 : scene !== null}
                onNext={() => (step === 1 ? setStep(2) : startVideo())}
                onBack={() => (step === 1 ? router.push("/") : setStep(1))}
              />
            </motion.div>
          ) : (
            /* STEP03：ぼーっと動画再生 */
            <motion.div
              key="video"
              className="absolute inset-0"
              onMouseMove={pokeUi}
              {...stepTransition}
            >
              <div className="absolute inset-0 overflow-hidden">
                <video
                  ref={videoRef}
                  src="/video/ryuhyo.mp4"
                  poster="/img/ice.jpg"
                  className="h-full w-full object-cover"
                  preload="auto"
                  loop
                  playsInline
                />
              </div>

              <MockNav theme="light" size="sm" />

              {/* 再生／一時停止 */}
              <button
                onClick={() => {
                  /* stateの反映を待たず、videoを直接叩いてラグをなくす */
                  const v = videoRef.current;
                  if (playing) {
                    v?.pause();
                  } else {
                    v?.play().catch(() => setPlaying(false));
                  }
                  setPlaying(!playing);
                  pokeUi();
                }}
                aria-label={playing ? "一時停止" : "再生"}
                className={`absolute left-1/2 top-1/2 size-[264px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-[opacity,transform] duration-700 hover:scale-105 ${
                  controlsShown ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <img
                  src={playing ? "/img/icon-pause.svg" : "/img/play-circle.svg"}
                  alt=""
                  className="size-full"
                />
              </button>

              {/* ぼーっとタイマー */}
              <div
                className={`absolute bottom-[76px] left-[52px] flex flex-col items-start gap-[8px] transition-opacity duration-700 ${
                  controlsShown ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="rounded-full bg-white px-[16px] py-[6px] text-[14px] font-black text-[#0070c9] backdrop-blur-[6px]">
                  ぼーっとタイマー
                </span>
                <p className="font-rounded text-[80px] font-bold leading-[1.2] text-white [font-variant-numeric:tabular-nums]">
                  {mm}:{ss}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
