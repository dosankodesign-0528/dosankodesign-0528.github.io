// =============================================================
//  Anyflow Embed — 開発者体験のモック画面
//  ⚠️ 手書きではありません。anyflow-embed/index.html から機械的に抽出しています。
//     HTML: <section id="dev"> の中身
//     CSS : 上記で使われているクラスに関わるルール 66件
//     元を直したら、この生成をやり直してください。
//
//  Framer の Code に丸ごと貼り付けてください。
//  Insert メニューに「DevMock」として出てきます。
//
//  ⚠️ アニメーションは含まれていません（Framer 側で付けます）。
//     これは「最終状態の見た目」を丸ごと持ち込むための部品です。
// =============================================================

import { useState } from "react"
import { addPropertyControls, ControlType } from "framer"

const CSS = `
  #dev .pin-vp { will-change: opacity; }
  .pin-vp {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      background: #f2f2f2;
    }
  .pin-stage {
      position: absolute;
      left: 0;
      top: 50%;
      width: var(--swp, 1440px);
      height: var(--dh, 921px);
      transform: translateY(-50%) scale(var(--sp));
      transform-origin: left center;
    }
  #dev .pin-stage { background: transparent; }
  .dev-center .dc-one {
      display: block;
      font-weight: 100;      /* カンプ: Noto Sans JP Thin */
      font-size: 40px;       /* カンプ 14937:23888 で 44px → 40px に変更 */
      line-height: normal;
    }
  .dev-mock {
      position: absolute;
      /* 0.9046 倍で描くと左右に 40.1px ずつ余るので、その分を戻してカンプの左119.9に合わせる */
      left: -40.35px;
      top: 0;
      width: 840.6px;
      height: 504.37px;
      z-index: 3;                 /* 文字より前に重ねる */
    }
  .dev-center { z-index: 1; }
  .dl-item {
      display: flex;
      align-items: center;
      gap: 28px;
      cursor: pointer;
      will-change: opacity;
    }
  .dl-bar {
      align-self: stretch;
      width: 1px;
      background: #fff;
      opacity: 0;
      transform: scaleY(.3);
      transform-origin: 50% 50%;
      /* 反応感のいいオーバーアクション: 少し行き過ぎてから戻る */
      transition: opacity .18s var(--e-fast), transform .32s cubic-bezier(.2,1.5,.35,1);
    }
  .dl-item.is-on .dl-bar { opacity: 1; transform: scaleY(1); }
  .dl-head { position: relative; padding-bottom: 6px; }
  .dl-head::after {
      content: "";
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 1px;
      background: #fff;
      transform: scaleX(0);
      transform-origin: 0 50%;
      /* 行き過ぎてから戻る = 反応がいい */
      transition: transform .34s cubic-bezier(.2,1.4,.3,1);
    }
  .dl-item.is-on .dl-head::after { transform: scaleX(1); }
  .dl-item.is-on .dl-head b, .dl-item.is-on .dl-head span { color: #fff; }
  .dl-body { width: 301.383px; display: flex; flex-direction: column; gap: 13px; }
  .dl-head { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
  .dm-editor { flex: 1 0 0; min-width: 0; display: flex; align-items: stretch; position: relative; }
  .dm-side .dm-logo { width: 8px; height: 40px; display: block; }
  .dm-side .dm-divider { width: 24px; height: 1px; background: rgba(255,255,255,.1); }
  .dm-side .dm-icons { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
  .dm-side .dm-icons img { width: 16px; height: 16px; display: block; }
  .dm-load .sk {
      height: 6px;
      border-radius: 4px;
      background: linear-gradient(100deg,
        rgba(255,255,255,.06) 30%, rgba(255,255,255,.34) 50%, rgba(255,255,255,.06) 70%);
      background-size: 260% 100%;
    }
  .dm-chat-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,.1);
      flex: 0 0 auto;
    }
  .dm-chat-head .ttl {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', var(--font-en);
      font-weight: 600;
      font-size: 14px;
      color: #fff;
    }
  .dm-chat-head img { width: 16px; height: 16px; display: block; }
  .dm-history {
      flex: 1 0 0;
      min-height: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
      overflow: hidden;
    }
  .dm-msg { display: flex; gap: 12px; align-items: flex-start; width: 100%; opacity: 0; }
  .dm-msg.dm-user p {
      max-width: 86%;
      padding: 10px 14px;
      border-radius: 14px 14px 4px 14px;
      background: rgba(255,255,255,.14);
      font-size: 12px;
      line-height: 1.7;
      color: rgba(255,255,255,.92);
    }
  .dm-msg .av {
      flex: 0 0 28px;
      width: 28px; height: 28px;
      border-radius: 14px;
      background: #0EBBFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  .dm-msg .av.pk { background: #FF5D97; }
  .dm-msg .av img { width: 14px; height: 14px; display: block; }
  .dm-msg .lines {
      flex: 1 0 0;
      min-width: 0;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
  .dm-msg .lines i { display: block; height: 6px; border-radius: 4px; background: #fff; }
  .dm-input-c {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid rgba(255,255,255,.1);
      flex: 0 0 auto;
    }
  .dm-input {
      flex: 1 0 0;
      min-width: 0;
      font-family: 'Inter', var(--font-en);
      font-weight: 400;
      font-size: 14px;
      color: rgba(255,255,255,.16);   /* カンプ: プレースホルダは 10% 相当 */
      white-space: nowrap;
      overflow: hidden;
    }
  .dm-input .dm-typed { color: rgba(255,255,255,.92); }
  .dm-input .dm-cursor {
      display: inline-block;
      width: 1px;
      height: 13px;
      margin-left: 1px;
      background: rgba(255,255,255,.85);
      vertical-align: -2px;
      opacity: 0;
    }
  .dm-send {
      flex: 0 0 28px;
      width: 28px; height: 28px;
      border-radius: 14px;
      background: rgba(255,255,255,.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  .dm-send img { width: 12px; height: 12px; display: block; }
  .dm-send { transition: transform .18s var(--e-fast), background-color .18s var(--e-fast); }
  .dm-send.is-hit { transform: scale(.84); background: #0EBBFF; }
  .dm-panel.is-term { background: #080a0e; }
  .dm-panel.is-term .dm-code { padding: 28px 36px; }
  .dm-term-bar {
      display: none;
      position: absolute; left: 0; right: 0; top: 0; height: 40px;
      align-items: center; gap: 8px; padding: 0 18px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      font-size: 12px; font-weight: 300; color: rgba(255,255,255,.4);
    }
  .dm-panel.is-term .dm-term-bar { display: flex; }
  .dm-panel.is-term .dm-code { padding-top: 62px; }
  .dm-term-bar i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.18); }
  .dm-panel.is-sdk .dm-sdk { display: flex; }
  .dm-panel.is-sdk .dm-chat { display: none; }
  .dm-sdk-list { flex: 1 0 0; min-height: 0; padding: 20px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
  .dm-sdk-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.06);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px; color: rgba(255,255,255,.82);
      opacity: 0;
    }
  .dm-sdk-row .k { color: #0EBBFF; }
  .dm-sdk-row .t { margin-left: auto; font-size: 10px; color: rgba(255,255,255,.34); }
  .dm-sdk-row .dot { width: 6px; height: 6px; border-radius: 50%; background: #FF5D97; flex: none; }
  .dm-think-b { display: flex !important; flex-direction: row !important; gap: 5px; }
  .dm-think-b i { width: 5px; height: 5px; border-radius: 50%; background: #fff; }
  #devH2 { top: 118px !important; }
  .dev-center { top: 88px; }
  .dev-center .dc-label { font-size: 12px; margin-bottom: 8px; }
  .dev-center .dc-one { font-size: 24px; line-height: 36px; }
  .dev-mock { left: 50%; }
  .dm-ghost { display: none; }
  .dev-list { left: 24px; top: 470px; width: 342px; padding-top: 0; gap: 22px; align-items: flex-start; }
  .dl-body { width: 314px; }
  .dl-head b { font-size: 22px; }
  .dl-head span { font-size: 16px; }
`

interface Props {
    screen: string
    chapter: string
}

export default function DevMock(props: Partial<Props>) {
    const { screen = "api", chapter = "章2" } = props
    const [active, setActive] = useState(screen)

    return (
        <div
            style={{ width: "100%", height: "100%", position: "relative" }}
            data-screen={active}
            data-chapter={chapter}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="pin-vp">
                <div className="dev-bg"></div>
                <div className="dev-bg2" id="devBg2"></div>
                <div className="pin-stage">
                  <div className="dev-center" id="devH1">
                    <span className="dc-label">Strength 01</span>
                    <span className="dc-one">自動生成で開発スピードを加速</span>
                  </div>
                  <div className="dev-center" id="devH2">
                    <span className="dc-label">Strength 02</span>
                    <span className="dc-one">開発環境に柔軟に適応</span>
                  </div>
                  <div className="dev-group">
                  <div className="dm-ghost" id="dmGhost0" aria-hidden="true">
                    <div className="dm-panel is-term">
                      <div className="dm-term-bar"><i></i><i></i><i></i><span>anyflow — zsh</span></div>
                      <div className="dm-editor"><div className="dm-code code" id="dmCodeCli"></div></div>
                    </div>
                  </div>
                  <div className="dm-ghost" id="dmGhost1" aria-hidden="true">
                    <div className="dm-panel is-sdk">
                      <div className="dm-editor">
                        <div className="dm-side">
                          <img className="dm-logo" src="assets/mock/logo.svg" alt="" />
                          <div className="dm-divider"></div>
                          <div className="dm-icons">
                            <img src="assets/mock/side1.svg" alt="" /><img src="assets/mock/side2.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" /><img src="assets/mock/side2.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" />
                          </div>
                        </div>
                        <div className="dm-code code" id="dmCodeSdk"></div>
                      </div>
                      <div className="dm-sdk">
                        <div className="dm-chat-head">
                          <span className="ttl"><img src="assets/mock/sparkles.svg" alt="" />SDK Reference</span>
                          <img src="assets/mock/ellipsis.svg" alt="" />
                        </div>
                        <div className="dm-sdk-list" id="dmSdkList2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="dev-mock" id="devMock">
                    <div className="dm-panel" id="dmPanel">
                      <div className="dm-term-bar"><i></i><i></i><i></i><span>anyflow — zsh</span></div>
                      <div className="dm-editor">
                        <div className="dm-side">
                          <img className="dm-logo" src="assets/mock/logo.svg" alt="" />
                          <div className="dm-divider"></div>
                          <div className="dm-icons">
                            <img src="assets/mock/side1.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" />
                            <img src="assets/mock/side2.svg" alt="" />
                          </div>
                        </div>
                        <div className="dm-code" id="dmCode"></div>
                        <div className="dm-load" id="dmLoad"></div>
                      </div>
                      <div className="dm-chat">
                        <div className="dm-chat-head">
                          <span className="ttl"><img src="assets/mock/sparkles.svg" alt="" />AI Assistant</span>
                          <img src="assets/mock/ellipsis.svg" alt="" />
                        </div>
                        <div className="dm-history">
                          <div className="dm-msg dm-user" id="dmUserMsg"><p id="dmUserText"></p></div>
                          <div className="dm-msg dm-bot" id="dmThink">
                            <span className="av"><img src="assets/mock/bot.svg" alt="" /></span>
                            <div className="lines dm-think-b"><i></i><i></i><i></i></div>
                          </div>
                          <div className="dm-msg dm-bot" id="dmBotMsg">
                            <span className="av"><img src="assets/mock/bot.svg" alt="" /></span>
                            <p id="dmBotText"></p>
                          </div>
                        </div>
                        <div className="dm-input-c">
                          <span className="dm-input"><span className="dm-typed" id="dmTyped"></span><span className="dm-cursor" id="dmCursor"></span><span id="dmPlaceholder">Ask anything...</span></span>
                          <span className="dm-send"><img src="assets/mock/arrow-up.svg" alt="" /></span>
                        </div>
                      </div>
                      <div className="dm-sdk">
                        <div className="dm-chat-head">
                          <span className="ttl"><img src="assets/mock/sparkles.svg" alt="" />SDK Reference</span>
                          <img src="assets/mock/ellipsis.svg" alt="" />
                        </div>
                        <div className="dm-sdk-list" id="dmSdkList"></div>
                      </div>
                    </div>
                  </div>
                  <div className="dev-list" id="devList">
                    <div className="dl-item is-on" data-screen="api">
                      <div className="dl-bar"></div>
                      <div className="dl-body">
                        <div className="dl-head"><b>API</b><span>の場合</span></div>
                        <p>テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。</p>
                      </div>
                    </div>
                    <div className="dl-item" data-screen="cli">
                      <div className="dl-bar"></div>
                      <div className="dl-body">
                        <div className="dl-head"><b>CLI</b><span>の場合</span></div>
                        <p>テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。</p>
                      </div>
                    </div>
                    <div className="dl-item" data-screen="sdk">
                      <div className="dl-bar"></div>
                      <div className="dl-body">
                        <div className="dl-head"><b>SDK</b><span>の場合</span></div>
                        <p>テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。テキストが入ります。</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
        </div>
    )
}

addPropertyControls(DevMock, {
    screen: {
        type: ControlType.Enum,
        title: "手前のモック",
        options: ["api", "cli", "sdk"],
        optionTitles: ["API の場合", "CLI の場合", "SDK の場合"],
        defaultValue: "api",
    },
    chapter: {
        type: ControlType.Enum,
        title: "章",
        options: ["章1", "章2"],
        defaultValue: "章2",
    },
})
