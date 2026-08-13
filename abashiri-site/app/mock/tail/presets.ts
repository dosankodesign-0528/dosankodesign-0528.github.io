import { DEFAULT_BUBBLE, type BubbleTune } from "@/components/bubbleConfig";

/*
 * 「吹き出しのしっぽが伸びる（＝しゃべり出す）」演出の比較用プリセット。
 * 引っ込んだ丸い吹き出しで登場 → しっぽが下へ伸びる → 「たまらない」が出る、
 * という流れは共通で、伸びはじめのタイミング・伸びる速さ・ぽよん具合だけが違う。
 *
 * 参考：登場アニメは 0.5秒後に吹き出し → 約1.15秒で「な〜んにもない」
 *       → 約1.95秒で「たまらない」。しっぽの時間は吹き出しの出はじめが起点。
 */
export type TailPreset = {
  title: string;
  desc: string;
  tail: BubbleTune["tail"];
};

export const TAIL_PRESETS: Record<string, TailPreset> = {
  "1": {
    title: "案1：すーっと伸びる",
    desc: "ぽよんなし。「な〜んにもない」が出るのと同時にじわーっと伸びて、そのまま静かに止まる。いちばん上品で控えめ。",
    tail: { delay: 600, duration: 1150, retract: 100, overshoot: 0 },
  },
  "2": {
    title: "案2：伸びきってぷるん（採用中）",
    desc: "じわーっと伸びて、伸びきったところで少しだけ行き過ぎて戻る。「たまらない」が出るのとぴたり重なる、いまの本番と同じ設定。",
    tail: DEFAULT_BUBBLE.tail,
  },
  "3": {
    title: "案3：ぽよんと弾む",
    desc: "案2より少し速く伸びて、行き過ぎが大きい。ぽよんと弾むぶん「しゃべった！」感がいちばん強い。",
    tail: { delay: 550, duration: 800, retract: 100, overshoot: 32 },
  },
  "4": {
    title: "案4：ためてから、ぽん",
    desc: "「な〜んにもない」を読ませてから伸ばしはじめる遅出し。しっぽが伸びきるのと「たまらない」の出現が重なって、返事をしたように見える。",
    tail: { delay: 1050, duration: 700, retract: 100, overshoot: 20 },
  },
  "5": {
    title: "案5：半分だけ引っ込め",
    desc: "最初からしっぽが半分だけ出ている状態でスタートして、残りが伸びる。動きがいちばん小さい安全案。",
    tail: { delay: 600, duration: 1000, retract: 50, overshoot: 10 },
  },
};
