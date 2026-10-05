// ============================================================
// 企業詳細の「問いかけカード」
//   まだ書いていない種類の記録を1つだけ選んで、問いかけの形で案内する。
//   ボタンを押すと、その入力欄を開く（開く処理は App.jsx の goToKind）。
//   「欄を埋める」ではなく「考えるきっかけ」に見えるよう、チェックリストや数字は出さない。
// ============================================================

// 案内する順番（企業詳細の画面で、上から並んでいる順）
const KIND_ORDER = ["job_text", "impression", "honne", "memo"];

// 種類ごとの、問いかけとボタンの文言
const KIND_GUIDE = {
    job_text: { question: "どんな仕事か、求人票を貼っておきませんか？", action: "求人票を貼る" },
    impression: { question: "この会社の、いいなと思ったところは？", action: "書いてみる" },
    honne: { question: "この会社のこと、正直どう感じていますか？", action: "本音を書いてみる" },
    memo: { question: "面接で聞いてみたいことはありますか？", action: "メモしてみる" },
};

// 今の成長段階ごとの、ひとこと（次の段階が近いことを伝える）
const NEXT_STAGE_LINE = {
    seed: "もう少しで、双葉が出そうです",
    sprout: "もう少しで、つぼみがつきそうです",
    bud: "もう少しで、花が咲きそうです",
};

// company: 表示中の企業
// onAction: ボタンを押した時に呼ぶ関数（どの種類かを渡す）
export function NextStepCard({ company, onAction }) {
    const recorded = company.recorded_kinds;

    // 出さない場合：
    //   ・Workerがまだ recorded_kinds を返していない（古いWorkerのまま）
    //   ・眠らせた企業
    //   ・花が咲いた企業
    if (!Array.isArray(recorded)) return null;
    if (company.is_sleeping) return null;
    if (company.growth_stage === "flower") return null;

    // まだ書いていない種類のうち、いちばん上にあるものを1つ選ぶ
    const nextKind = KIND_ORDER.find((kind) => !recorded.includes(kind));
    if (!nextKind) return null;

    const guide = KIND_GUIDE[nextKind];
    // まだ何も記録が無い時は「もう少しで」とは言えないので、別の文にする
    const line =
        recorded.length === 0
            ? "まずは、この会社のことを書きとめてみましょう"
            : NEXT_STAGE_LINE[company.growth_stage] || NEXT_STAGE_LINE.seed;

    return (
        <div className="next-step-card">
            <p className="next-step-line">{line}</p>
            <p className="next-step-question">{guide.question}</p>
            <button className="next-step-btn" onClick={() => onAction(nextKind)}>
                {guide.action} →
            </button>
        </div>
    );
}