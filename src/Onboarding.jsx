// ============================================================
// 初回起動時の「使い方」ポップアップ
//   4枚の説明を「次へ」でめくっていく。最後の「はじめる」か「スキップ」で閉じる。
//   「もう見たかどうか」の記録は、呼び出す側（App.jsx）で行う。
// ============================================================
import { useState } from "react";
import { PlantIcon, SproutIcon } from "./Garden.jsx";

// 2枚目で並べる、成長段階の見本（id: 0 の企業として、植物のアイコンだけ借りる）
const STAGE_SAMPLES = [
    { stage: "seed", label: "たね" },
    { stage: "sprout", label: "双葉" },
    { stage: "bud", label: "つぼみ" },
    { stage: "flower", label: "花" },
];

// 3枚目で見せる、照合結果の見本
const MATCH_SAMPLES = [
    { label: "リモート勤務あり", mark: "yes", symbol: "○", note: "週3日まで可" },
    { label: "自社開発", mark: "mid", symbol: "△", note: "受託もあり" },
    { label: "年間休日120日以上", mark: "no", symbol: "×", note: "記載なし" },
];

const STEP_COUNT = 4; // 説明の枚数

// isDemo: デモの人かどうか（最後の1枚の文言を変える）
// rematchLimit: デモでAI照合を使える回数
// onClose: 閉じる時に呼ぶ関数
export function Onboarding({ isDemo, rematchLimit, onClose }) {
    const [step, setStep] = useState(0); // 今見ている説明（0から数える）
    const isLast = step === STEP_COUNT - 1;

    return (
        // 外側をタップしても閉じない（うっかり閉じてしまうのを防ぐため、onClick は付けていない）
        <div className="modal-overlay">
            <div className="modal-box onboarding-box" role="dialog" aria-modal="true" aria-label="めばえの使い方">
                {/* 最後の1枚以外には、右上に「スキップ」を出す */}
                {!isLast && (
                    <button className="onboarding-skip" onClick={onClose}>スキップ</button>
                )}

                {/* key を付けて、めくるたびにふわっと出るアニメーションを最初から再生する */}
                <div className="onboarding-body" key={step}>
                    {step === 0 && (
                        <>
                            <div className="onboarding-art">
                                <SproutIcon size={72} />
                            </div>
                            <p className="onboarding-title">めばえへようこそ</p>
                            <p className="onboarding-text">
                                気になる会社を、1鉢の植物として庭に植えて育てる、転職活動の記録アプリです。
                            </p>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <div className="onboarding-art onboarding-stages">
                                {STAGE_SAMPLES.map((s, i) => (
                                    <div className="onboarding-stage" key={s.stage}>
                                        <PlantIcon company={{ id: 0, growth_stage: s.stage }} size={44} />
                                        <span className="onboarding-stage-label">{s.label}</span>
                                        {/* 最後の「花」以外には、次の段階への矢印を出す */}
                                        {i < STAGE_SAMPLES.length - 1 && <span className="onboarding-stage-arrow">›</span>}
                                    </div>
                                ))}
                            </div>
                            <p className="onboarding-title">記録を重ねると、育ちます</p>
                            <p className="onboarding-text">
                                気になる会社を見つけたら、求人票や「いいな・気になる」、本音、メモなどを記録してみてください。
                                記録を重ねると、植物も少しずつ育っていきます。
                                選考の結果ではなく、その会社とどれだけ向き合えたかが、成長につながります。
                            </p>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="onboarding-art">
                                <div className="onboarding-match">
                                    {MATCH_SAMPLES.map((m) => (
                                        <div className="onboarding-match-row" key={m.label}>
                                            <span className="onboarding-match-label">{m.label}</span>
                                            <span className={`mark ${m.mark}`}>{m.symbol}</span>
                                            <span className="onboarding-match-note">{m.note}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="onboarding-title">AIが求人票と照らし合わせます</p>
                            <p className="onboarding-text">
                                希望条件を登録しておくと、貼り付けた求人票をAIが読んで、○・△・×で整理します。
                                結果は、タップして自分で直すこともできます。
                            </p>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="onboarding-art">
                                {isDemo ? (
                                    <PlantIcon company={{ id: 0, growth_stage: "flower" }} size={72} />
                                ) : (
                                    // ホーム右上の「＋植える」ボタンと同じ見た目の見本（押せない）
                                    <span className="onboarding-plant-pill">＋ 植える</span>
                                )}
                            </div>
                            {isDemo ? (
                                <>
                                    <p className="onboarding-title">見本の庭を用意しました</p>
                                    <p className="onboarding-text">
                                        鉢をタップすると会社の名前が出て、もう一度タップすると詳細が開きます。
                                        AI照合は{rematchLimit}回まで試せます。自由に触ってみてください。
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="onboarding-title">まずは1社、植えてみましょう</p>
                                    <p className="onboarding-text">
                                        ホームの右上にある「＋植える」から、気になる会社を登録できます。
                                        会社名だけでも植えられます。
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* 今、何枚目かを示す点 */}
                <div className="onboarding-dots">
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <span key={i} className={i === step ? "onboarding-dot active" : "onboarding-dot"} />
                    ))}
                </div>

                <div className="modal-buttons">
                    {step > 0 && (
                        <button className="modal-cancel-btn" onClick={() => setStep(step - 1)}>
                            もどる
                        </button>
                    )}
                    <button
                        className="modal-ok-btn"
                        onClick={() => (isLast ? onClose() : setStep(step + 1))}
                    >
                        {isLast ? "はじめる" : "次へ"}
                    </button>
                </div>
            </div>
        </div>
    );
}