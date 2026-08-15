"use client";

/*
 * 人物イラストをマウス（指）に反応させるための hook。
 *
 * イラストは pointer-events-none（クリックがすり抜ける）のままにしたいので、
 * CSS の :hover は使えない。使うと後ろのキービジュアルのボタンを
 * イラストが覆ってしまう。なので window でカーソルを監視して、
 * イラストの矩形に入ったかどうかを自前で判定している。
 *
 * - 眉: カーソルがイラストに乗っている間だけ持ち上がる
 * - 目: follow ならページのどこにいてもその方向を見る／front なら乗った時だけ正面
 * - スマホ: 指で触っている間だけ反応する（離すと戻る）
 */
import { useEffect, useRef, useState } from "react";
import { EYE_CENTER } from "./illustMainPaths";
import type { FaceConfig } from "./faceConfig";

/** イラストに渡す「いまの顔の状態」。単位は画面px */
export type FaceState = { browLift: number; eyeX: number; eyeY: number };

const REST: FaceState = { browLift: 0, eyeX: 0, eyeY: 0 };
const same = (a: FaceState, b: FaceState) =>
  a.browLift === b.browLift && a.eyeX === b.eyeX && a.eyeY === b.eyeY;
const clamp = (v: number, r: number) => Math.max(-r, Math.min(r, v));
const round = (v: number) => Math.round(v * 100) / 100;

export function useFaceReaction(
  ref: React.RefObject<HTMLElement | null>,
  config: FaceConfig,
): FaceState {
  const [face, setFace] = useState<FaceState>(REST);
  /* 設定が変わるたびにリスナーを付け直さなくていいように ref で持つ */
  const cfg = useRef(config);
  cfg.current = config;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    let touching = false;

    const compute = (x: number, y: number): FaceState => {
      const el = ref.current;
      if (!el) return REST;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return REST;

      const c = cfg.current;
      const p = c.hoverPad;
      const over =
        x >= r.left - p && x <= r.right + p && y >= r.top - p && y <= r.bottom + p;

      if (c.eyeMode === "front") {
        return over
          ? { browLift: c.browLift, eyeX: c.eyeFrontX, eyeY: c.eyeFrontY }
          : REST;
      }

      /* 目の位置からカーソルへの向き。画面の端まで行くと可動域いっぱいになる */
      const ex = r.left + r.width * EYE_CENTER.x;
      const ey = r.top + r.height * EYE_CENTER.y;
      return {
        browLift: over ? c.browLift : 0,
        eyeX: round(clamp((x - ex) / (window.innerWidth / 2), 1) * c.eyeRangeX),
        eyeY: round(clamp((y - ey) / (window.innerHeight / 2), 1) * c.eyeRangeY),
      };
    };

    const flush = () => {
      raf = 0;
      const next = pending ? compute(pending.x, pending.y) : REST;
      setFace((prev) => (same(prev, next) ? prev : next));
    };
    const queue = (pt: { x: number; y: number } | null) => {
      pending = pt;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || touching) queue({ x: e.clientX, y: e.clientY });
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      touching = true;
      queue({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => {
      touching = false;
      queue(null);
    };
    /* カーソルがウィンドウの外に出たら休める */
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) queue(null);
    };

    const opt = { passive: true } as const;
    window.addEventListener("pointermove", onMove, opt);
    window.addEventListener("pointerdown", onDown, opt);
    window.addEventListener("pointerup", onUp, opt);
    window.addEventListener("pointercancel", onUp, opt);
    document.addEventListener("pointerout", onOut, opt);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerout", onOut);
    };
  }, [ref]);

  /* 設定を変えた直後は、次にカーソルが動くまで古い値が残るので戻しておく */
  useEffect(() => setFace(REST), [config.eyeMode]);

  return face;
}
