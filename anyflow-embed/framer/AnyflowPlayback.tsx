// =============================================================
//  Anyflow Embed — 「アニメが終わるまでスクロールさせない」部品
//  Framer の Code に丸ごと貼り付けて使います。
//
//  中身は2つ:
//   1. PlaybackController  … Insert メニューから置く部品（見えません）
//   2. with〇〇Chapters     … 中身のコンポーネントに掛ける Override
//
//  使い方は同フォルダの README.md を参照。
// =============================================================

import type { ComponentType } from "react"
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType, createStore } from "framer"

// -------------------------------------------------------------
// 共有の再生状態。Controller が書き込み、Override が読み取ります。
// -------------------------------------------------------------
const usePlayback = createStore({
    section: "" as string, // いま再生中のセクション名
    chapter: 0 as number, // 何章目か（0 始まり）
    locked: false as boolean, // スクロールを止めているか
})

// -------------------------------------------------------------
// スクロールの止め方
//   body に overflow:hidden を掛けると位置が飛ぶので、
//   スクロール操作そのもの（ホイール / 指 / キー）を無効化します。
// -------------------------------------------------------------
const SCROLL_KEYS = new Set([
    "ArrowDown",
    "ArrowUp",
    "PageDown",
    "PageUp",
    "Home",
    "End",
    " ",
])

function blockEvent(e: Event) {
    e.preventDefault()
}
function blockKey(e: KeyboardEvent) {
    if (SCROLL_KEYS.has(e.key)) e.preventDefault()
}

let lockCount = 0

function lockScroll() {
    if (lockCount++ > 0) return
    window.addEventListener("wheel", blockEvent, { passive: false })
    window.addEventListener("touchmove", blockEvent, { passive: false })
    window.addEventListener("keydown", blockKey as EventListener, {
        passive: false,
    })
}

function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount > 0) return
    window.removeEventListener("wheel", blockEvent)
    window.removeEventListener("touchmove", blockEvent)
    window.removeEventListener("keydown", blockKey as EventListener)
}

// =============================================================
//  1. PlaybackController
//     貼りつけたい Sticky フレームの「中の一番上」に置いてください。
//     高さ 1px・透明なので、レイアウトには影響しません。
// =============================================================
interface ControllerProps {
    name: string
    chapters: string
    tolerance: number
    advance: number
    enabled: boolean
}

export default function PlaybackController(props: Partial<ControllerProps>) {
    const {
        name = "vision",
        chapters = "6.6",
        tolerance = 8,
        advance = 120,
        enabled = true,
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const [, setStore] = usePlayback()
    const st = useRef({
        chapter: -1,
        playing: false,
        timer: 0 as number | ReturnType<typeof setTimeout>,
        unlockY: 0,
    })

    useEffect(() => {
        if (!enabled) return
        // Framer のキャンバス編集中は動かさない（プレビューと公開ページでのみ動く）
        if (typeof window === "undefined") return

        const secs = String(chapters)
            .split(",")
            .map((s) => parseFloat(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0)
        if (secs.length === 0) return

        let raf = 0
        let cancelled = false

        const finish = (i: number) => {
            st.current.playing = false
            st.current.unlockY = window.scrollY
            unlockScroll()
            setStore({ section: name, chapter: i, locked: false })
        }

        const start = (i: number) => {
            st.current.chapter = i
            st.current.playing = true
            setStore({ section: name, chapter: i, locked: true })
            lockScroll()
            st.current.timer = setTimeout(() => {
                if (!cancelled) finish(i)
            }, secs[i] * 1000)
        }

        const tick = () => {
            if (cancelled) return
            raf = requestAnimationFrame(tick)

            const el = ref.current
            if (!el || st.current.playing) return
            const top = el.getBoundingClientRect().top

            // 上に大きく戻ったら、最初から流し直せるように巻き戻す
            if (top > window.innerHeight) {
                st.current.chapter = -1
                return
            }

            if (st.current.chapter < 0) {
                // まだ1章も再生していない → 所定の位置に着いたら開始
                if (Math.abs(top) <= tolerance) start(0)
                return
            }

            // 次の章がある → 指定量スクロールしたら次を開始
            const next = st.current.chapter + 1
            if (next < secs.length) {
                if (window.scrollY - st.current.unlockY >= advance) start(next)
            }
        }

        raf = requestAnimationFrame(tick)

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            clearTimeout(st.current.timer as ReturnType<typeof setTimeout>)
            if (st.current.playing) unlockScroll()
        }
    }, [name, chapters, tolerance, advance, enabled, setStore])

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: 1,
                opacity: 0,
                pointerEvents: "none",
            }}
        />
    )
}

addPropertyControls(PlaybackController, {
    name: {
        type: ControlType.Enum,
        title: "セクション",
        options: ["vision", "results", "dev", "cases"],
        optionTitles: ["Our Vision", "実績", "開発者体験", "導入事例"],
        defaultValue: "vision",
    },
    chapters: {
        type: ControlType.String,
        title: "章の秒数",
        description: "カンマ区切り。開発者体験は 6.0, 5.6",
        defaultValue: "6.6",
    },
    tolerance: {
        type: ControlType.Number,
        title: "開始の許容ズレ",
        description: "画面上端から何pxの範囲で再生を始めるか",
        min: 2,
        max: 40,
        defaultValue: 8,
    },
    advance: {
        type: ControlType.Number,
        title: "次章までの送り量",
        description: "章と章の間、何pxスクロールしたら次を始めるか",
        min: 40,
        max: 600,
        defaultValue: 120,
    },
    enabled: {
        type: ControlType.Boolean,
        title: "有効",
        defaultValue: true,
    },
})

// =============================================================
//  2. Override
//     章に合わせてバリアントを切り替えます。
//     中身をまとめたコンポーネントに掛けてください。
//     ※ 配列の中のバリアント名は、Framer 側の名前と必ず一致させること
// =============================================================
function chapterVariant(section: string, variantNames: string[]) {
    return function (Component): ComponentType {
        return function WithChapter(props: any) {
            const [store] = usePlayback()
            if (store.section !== section) return <Component {...props} />
            const v = variantNames[store.chapter] ?? variantNames[0]
            return <Component {...props} variant={v} />
        }
    }
}

export const withVisionChapters = chapterVariant("vision", ["再生"])
export const withResultsChapters = chapterVariant("results", ["再生"])
export const withDevChapters = chapterVariant("dev", ["章1", "章2"])
export const withCasesChapters = chapterVariant("cases", ["再生"])

// =============================================================
//  3. おまけ: 再生中だけ何かを隠したいとき
//     （スクロールを促す矢印などに掛ける）
// =============================================================
export function withHideWhilePlaying(Component): ComponentType {
    return function HideWhilePlaying(props: any) {
        const [store] = usePlayback()
        return (
            <Component
                {...props}
                style={{
                    ...props.style,
                    opacity: store.locked ? 0 : 1,
                    transition: "opacity .25s ease",
                }}
            />
        )
    }
}
