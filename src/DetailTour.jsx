// ============================================================
// 企業詳細の「2ステップツアー」
//   企業詳細を初めて開いた時に1回だけ、気づきにくい操作を2か所だけ案内する。
//   画面を少し暗くして、案内する場所だけ明るく見せる（スポットライト）。
//   「もう見たかどうか」の記録は、呼び出す側（App.jsx）で行う。
// ============================================================
import { useEffect, useState } from "react";

// 案内する場所（selector：画面の中からその場所を探すための目印）と、出す文
const TOUR_STEPS = [
    { selector: ".header-star-picker", text: "★をタップすると、志望度を変更できます" },
    { selector: '[data-tour="feelings"]', text: "記録した内容は、タップしていつでも書き直せます" },
];

const HOLE_PADDING = 6; // 明るく見せる範囲を、案内する場所より少しだけ広げる(px)
const TIP_SPACE = 150;  // 説明の箱を下に出すのに必要な、空きの高さの目安(px)

// onClose: 閉じる時に呼ぶ関数
export function DetailTour({ onClose }) {
    const [step, setStep] = useState(0);   // 今、何番目の案内か（0から数える）
    const [rect, setRect] = useState(null); // 案内する場所の、画面の中での位置と大きさ
    const current = TOUR_STEPS[step];
    const isLast = step === TOUR_STEPS.length - 1;

    // 案内が切り替わったら、その場所が画面に入るようにスクロールする
    useEffect(() => {
        const el = document.querySelector(current.selector);
        if (!el) return;
        // 動きを減らす設定にしている人には、なめらかに動かさず、すぐ移動する
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    // 案内する場所の位置を、表示している間ずっと測り続ける
    // （スクロール中や、データが読み込まれて画面の高さが変わった時にも、明るい範囲がずれないようにするため）
    useEffect(() => {
        let frameId;
        const measure = () => {
            const el = document.querySelector(current.selector);
            if (el) {
                const r = el.getBoundingClientRect();
                // 位置が変わった時だけ、画面を描き直す
                setRect((prev) =>
                    prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
                        ? prev
                        : { top: r.top, left: r.left, width: r.width, height: r.height }
                );
            }
            frameId = requestAnimationFrame(measure); // 次の描画のタイミングで、もう一度測る
        };
        frameId = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(frameId); // 閉じた時・切り替えた時に、測るのをやめる
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    // 説明の箱を出す場所：下に空きがあれば下、なければ上
    let tipStyle = {};
    if (rect) {
        const holeBottom = rect.top + rect.height + HOLE_PADDING;
        const showBelow = holeBottom + TIP_SPACE < window.innerHeight;
        tipStyle = showBelow
            ? { top: `${holeBottom + 12}px` }
            : { bottom: `${window.innerHeight - rect.top + HOLE_PADDING + 12}px` };
    }

    return (
        // 画面全体に透明な板を重ねて、案内の間は後ろの画面を触れないようにする
        <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="操作の案内">
            {rect ? (
                <>
                    {/* 明るく見せる範囲。まわりを、大きな影で暗くしている */}
                    <div
                        className="tour-hole"
                        style={{
                            top: `${rect.top - HOLE_PADDING}px`,
                            left: `${rect.left - HOLE_PADDING}px`,
                            width: `${rect.width + HOLE_PADDING * 2}px`,
                            height: `${rect.height + HOLE_PADDING * 2}px`,
                        }}
                    />
                    <div className="tour-tip" style={tipStyle}>
                        <p className="tour-text">{current.text}</p>
                        <div className="tour-footer">
                            <span className="tour-count">{step + 1} / {TOUR_STEPS.length}</span>
                            {!isLast && (
                                <button className="tour-skip" onClick={onClose}>スキップ</button>
                            )}
                            <button
                                className="tour-next"
                                onClick={() => (isLast ? onClose() : setStep(step + 1))}
                            >
                                {isLast ? "OK" : "次へ"}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                // 案内する場所がまだ見つからない間は、全体を暗くしておくだけ
                <div className="tour-dim" />
            )}
        </div>
    );
}