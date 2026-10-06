// ============================================================
// 初回起動時の「使い方」ポップアップ
//   4枚の説明を、指で左右にスライドするか「次へ」でめくっていく。
//   最後の「はじめる」か「スキップ」で閉じる。
//   「もう見たかどうか」の記録は、呼び出す側（App.jsx）で行う。
//
//   仕組みは庭のページ送りと同じ：4枚を横に並べて、横スクロールで見せる。
//   スマホの指でのスライドは、ブラウザが元々やってくれる。PCのマウスでのドラッグだけ、自前で動かす。
// ============================================================
import { useRef, useState } from "react";
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

    const scrollRef = useRef(null); // 横にスクロールする入れ物
    const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false }); // マウスでつかんでいる間の情報

    // 指定した説明まで、なめらかに移動する
    const goToStep = (index) => {
        const el = scrollRef.current;
        if (!el) return;
        const target = Math.max(0, Math.min(STEP_COUNT - 1, index)); // 0〜最後の枚数の範囲に収める
        // 動きを減らす設定にしている人には、なめらかに動かさず、すぐ切り替える
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollTo({ left: target * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    };

    // スクロールした位置から、今どの説明を見ているかを計算する（点とボタンの表示に使う）
    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el || el.clientWidth === 0) return;
        setStep(Math.round(el.scrollLeft / el.clientWidth));
    };

    // ---- マウスでつかんで横に動かす（PC用。スマホの指は、ブラウザに任せる） ----
    const handlePointerDown = (e) => {
        if (e.pointerType !== "mouse") return;
        const el = scrollRef.current;
        dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    };

    const handlePointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag.active) return;
        const dx = e.clientX - drag.startX;
        if (Math.abs(dx) > 6 && !drag.moved) {
            drag.moved = true;
            scrollRef.current.classList.add("dragging"); // つかんでいる間は、ぴたっと止まる動きを切る
        }
        if (drag.moved) scrollRef.current.scrollLeft = drag.startScroll - dx;
    };

    const handlePointerEnd = () => {
        const drag = dragRef.current;
        if (!drag.active) return;
        drag.active = false;
        const el = scrollRef.current;
        el.classList.remove("dragging");
        if (drag.moved) goToStep(Math.round(el.scrollLeft / el.clientWidth)); // 近いほうの説明で止める
    };

    return (
        // 外側をタップしても閉じない（うっかり閉じてしまうのを防ぐため、onClick は付けていない）
        <div className="modal-overlay">
            <div className="modal-box onboarding-box" role="dialog" aria-modal="true" aria-label="めばえの使い方">
                {/* 最後の1枚以外には、右上に「スキップ」を出す */}
                {!isLast && (
                    <button className="onboarding-skip" onClick={onClose}>スキップ</button>
                )}

                {/* 4枚を横に並べた入れ物。指のスライド・マウスのドラッグ・「次へ」で動く */}
                <div
                    className="onboarding-scroll"
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerLeave={handlePointerEnd}
                >
                    {/* ---- 1枚目：ようこそ ---- */}
                    <div className="onboarding-page">
                        <div className="onboarding-art">
                            <SproutIcon size={72} />
                        </div>
                        <p className="onboarding-title">めばえへようこそ</p>
                        <p className="onboarding-text">
                            気になる会社を、1鉢の植物として庭に植えて育てる、転職活動の記録アプリです。
                        </p>
                    </div>

                    {/* ---- 2枚目：育ち方 ---- */}
                    <div className="onboarding-page">
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
                    </div>

                    {/* ---- 3枚目：AI照合 ---- */}
                    <div className="onboarding-page">
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
                    </div>

                    {/* ---- 4枚目：最初の一歩（デモの人には、文言を変える） ---- */}
                    <div className="onboarding-page">
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
                    </div>
                </div>

                {/* 今、何枚目かを示す点 */}
                <div className="onboarding-dots">
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <span key={i} className={i === step ? "onboarding-dot active" : "onboarding-dot"} />
                    ))}
                </div>

                <div className="modal-buttons">
                    {step > 0 && (
                        <button className="modal-cancel-btn" onClick={() => goToStep(step - 1)}>
                            もどる
                        </button>
                    )}
                    <button
                        className="modal-ok-btn"
                        onClick={() => (isLast ? onClose() : goToStep(step + 1))}
                    >
                        {isLast ? "はじめる" : "次へ"}
                    </button>
                </div>
            </div>
        </div>
    );
}