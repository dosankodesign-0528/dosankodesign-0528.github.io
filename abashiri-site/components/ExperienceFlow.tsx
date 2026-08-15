"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Bird from "./Bird";
import GlobalNav from "./GlobalNav";
import { devSilent } from "./devSound";
import { buildShadow, mergeShadow } from "./shadowConfig";
import { mergeLayout } from "./layoutConfig";

export type Step = 1 | 2 | 3;

const FEELINGS = [
  ["疲れた", "焦ってる", "イライラ"],
  ["忙しすぎる", "眠い", "ちょっと不安"],
];

/* 写真の上に 40% でのせる色。値は globals.css のトークンが唯一の出どころ */
const TINT = (v: string) => `color-mix(in srgb, var(${v}) 40%, transparent)`;

const SCENES = [
  [
    { id: "tento", label: "天都山展望台", src: "/img/scene-tento.jpg", tint: TINT("--color-tint-tento") },
    { id: "sango", label: "さんご草", src: "/img/scene-sango.jpg", tint: TINT("--color-tint-sango") },
  ],
  [
    { id: "himawari", label: "ひまわり畑", src: "/img/scene-himawari.jpg", tint: TINT("--color-tint-himawari") },
    { id: "ryuhyo", label: "流氷クルーズ", src: "/img/scene-ryuhyo.jpg", tint: TINT("--color-tint-ryuhyo") },
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
    <div className="absolute left-1/2 top-[120px] h-[104px] w-[666px] -translate-x-1/2">
      <div className="absolute left-[20px] top-[74px] h-[5px] w-[626px] rounded-full bg-track" />
      {states.map((state, i) => (
        <div
          key={i}
          className="absolute top-0 flex w-[56px] flex-col items-center gap-px"
          style={{ left: i * 305 }}
        >
          <div
            className={`font-num flex flex-col items-center text-center font-extrabold leading-none ${
              state === "idle" ? "text-sky-pale opacity-60" : "text-brand"
            }`}
          >
            <p className="text-label-sm leading-[1.2]">STEP</p>
            <p className="text-step">0{i + 1}</p>
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
    <div className="absolute left-1/2 top-[690px] flex w-[250px] -translate-x-1/2 flex-col items-center gap-5">
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`w-full rounded-full bg-brand px-11 py-4 text-action font-black text-white transition-all duration-300 ${
          canProceed
            ? "cursor-pointer hover:scale-105 hover:bg-brand-hover"
            : "cursor-default opacity-30"
        }`}
      >
        次へ
      </button>
      <button
        onClick={onBack}
        className="cursor-pointer text-action font-bold text-ink transition-opacity hover:opacity-60"
      >
        もどる
      </button>
    </div>
  );
}

const stepTransition = {
  initial: { opacity: 0, y: 24, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(10px)" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ExperienceFlow({
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
      v.muted = devSilent(); /* 開発中(localhost)は無音 */
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
    <div
      className="absolute left-[76px] right-[206px] top-[87px] h-[1005px] rounded-t-device border-[30px] border-white"
      style={{
        boxShadow: buildShadow(mergeShadow(null)),
        transform: `translate(${mergeLayout(null).tabletX}px, ${mergeLayout(null).tabletY}px)`,
      }}
    >
      {/* サウンドON/OFFの置き場：SoundUi がここへ描画する（白モック内の左上） */}
      <div id="abashiri-sound-slot" className="absolute left-[32px] top-[32px] z-40" />
      <div className="relative h-full w-full overflow-hidden rounded-t-device-inner bg-canvas">
        <AnimatePresence mode="wait">
          {step !== 3 ? (
            <motion.div key="select" className="absolute inset-0" {...stepTransition}>
              <GlobalNav theme="dark" size="md" />
              <StepIndicator step={step} />

              {/* 装飾の青カモメ */}
              <div className="absolute left-[134px] top-[362px] h-[64px] w-[110px]">
                <Bird color="var(--color-sky-pale)" flapDuration={0.62} driftDuration={9} strokeWidth={4.2} />
              </div>
              <div className="absolute right-[83px] top-[229px] h-[86px] w-[189px]">
                <Bird color="var(--color-sky-pale)" flapDuration={0.75} driftDuration={11} delay={0.6} strokeWidth={2.5} />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* STEP01：気持ちの複数選択 */
                  <motion.div
                    key="step1"
                    className="absolute inset-x-0 top-[270px] flex flex-col items-center gap-8"
                    {...stepTransition}
                  >
                    <p className="text-title font-black leading-[1.2] text-ink">
                      今、どんな気持ち？
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      {FEELINGS.map((row, ri) => (
                        <div key={ri} className="flex items-center gap-3">
                          {row.map((f) => {
                            const active = feelings.includes(f);
                            return (
                              <button
                                key={f}
                                onClick={() => toggleFeeling(f)}
                                className={`cursor-pointer rounded-full px-6 py-2 text-action font-black transition-all duration-300 hover:scale-105 ${
                                  active
                                    ? "bg-accent text-white shadow-press"
                                    : "bg-white/90 text-brand"
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
                    className="absolute inset-x-0 top-[270px] flex flex-col items-center gap-8"
                    {...stepTransition}
                  >
                    <p className="text-title font-black leading-[1.2] text-ink">
                      どこで、ぼーっとする？
                    </p>
                    <div className="flex flex-col gap-8">
                      {SCENES.map((row, ri) => (
                        <div
                          key={ri}
                          className="flex items-center justify-center gap-8 drop-shadow-press"
                        >
                          {row.map((s) => {
                            const dimmed = scene !== null && scene !== s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setScene(s.id)}
                                className={`relative h-[120px] w-[300px] cursor-pointer overflow-hidden rounded-thumb border-[10px] border-white transition-all duration-300 hover:scale-[1.03] ${
                                  dimmed ? "opacity-30" : "opacity-100"
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
                                <span className="relative z-10 flex h-full w-full items-center justify-center text-action font-black text-white">
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

              <GlobalNav theme="light" size="sm" />

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
                className={`absolute bottom-[76px] left-[52px] flex flex-col items-start gap-2 transition-opacity duration-700 ${
                  controlsShown ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="rounded-full bg-white px-4 py-2 text-label-sm font-black text-brand backdrop-blur-hover">
                  ぼーっとタイマー
                </span>
                <p className="font-num text-timer font-bold leading-[1.2] text-white [font-variant-numeric:tabular-nums]">
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
