import { useState, useEffect } from "react";
import './App.css';

// 成長段階 → 表示する内容、の対応表
// 今は絵文字だが、後で画像やSVGに差し替える時はここだけ直せばよい
const STAGE_DISPLAY = {
  seed: "🌱",
  sprout: "🌿",
  bud: "🌸",
  flower: "🌼",
};

function App() {
  const [companies, setCompanies] = useState([]);

  // ＋植えるフォームの入力内容を覚えておく箱
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const statusOptions = ["応募前", "書類選考", "一次面接", "二次面接", "最終選考", "内定", "見送り", "辞退"];
  const [impressions, setImpressions] = useState([]);
  const [addingImpressionType, setAddingImpressionType] = useState(null); // "good" | "concern" | null：どちらの＋追加チップが入力中か
  const [newChipValue, setNewChipValue] = useState(""); // 新規チップの入力中の文字
  const [editingImpressionId, setEditingImpressionId] = useState(null); // タップして編集中のいいな・気になるのid
  const [editingImpressionValue, setEditingImpressionValue] = useState(""); // 編集中の文字
  const [editingHonne, setEditingHonne] = useState(false); // 本音を編集中かどうか（モックアップのhonne-box）
  const [honne, setHonne] = useState(null);
  const [memos, setMemos] = useState([]);
  const [addingMemo, setAddingMemo] = useState(false); // メモの＋追加チップが入力中かどうか
  const [newMemoValue, setNewMemoValue] = useState(""); // 新規メモの入力中の文字
  const [editingMemoId, setEditingMemoId] = useState(null); // タップして編集中のメモのid
  const [editingMemoValue, setEditingMemoValue] = useState(""); // 編集中の文字
  const [requirementMatches, setRequirementMatches] = useState([]);
  const [isRematching, setIsRematching] = useState(false);
  const [records, setRecords] = useState([]); // 記録ログの一覧（全企業分）
  const [companyRecords, setCompanyRecords] = useState([]); // 選択中の企業のタイムライン
  const [showAllRecords, setShowAllRecords] = useState(false); // タイムラインを全件表示するかどうか
  const [showJobTextEditor, setShowJobTextEditor] = useState(false); // 求人票本文の編集欄を開いているか
  const [jobTextDraft, setJobTextDraft] = useState(""); // 求人票本文の編集中の下書き
  const [showAllLog, setShowAllLog] = useState(false); // 「最近の記録」を全件表示するかどうか

  // ＋植える画面の「この会社、今どんな感じ？」（1つだけ選べる）
  const [moodChip, setMoodChip] = useState(null);
  const moodOptions = ["ちょっと気になる", "応募してみたい", "選考が進んでいる"];

  // ＋植える画面の「気になった理由は？」（複数選べる）
  const [reasonChips, setReasonChips] = useState([]); // 選ばれたチップの配列
  const reasonOptions = ["仕事内容が面白そう", "雰囲気が好き", "条件が合っている", "なんとなく気になる"];
  const [freeReason, setFreeReason] = useState(""); // 自由記述欄

  // 複数選択チップの選択・解除を切り替える
  const toggleReasonChip = (label) => {
    setReasonChips((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]
    );
  };

  // どのタブを表示しているか（下部ナビゲーションに対応）
  const [activeTab, setActiveTab] = useState("home"); // "home" | "companies" | "records" | "settings"
  // タブの上に重ねて表示する「画面」（null = 何も重ねていない）
  const [screen, setScreen] = useState(null); // null | "detail" | "plant-new"

  // --- 【関数の準備】 ---
  const fetchCompanies = () => {
    fetch("http://localhost:8787/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data));
  };

  const fetchRecords = () => {
    fetch("http://localhost:8787/records")
      .then((res) => res.json())
      .then((data) => setRecords(data));
  };

  const fetchCompanyRecords = async (companyId) => {
    const res = await fetch(`http://localhost:8787/records?company_id=${companyId}`);
    const data = await res.json();
    setCompanyRecords(data);
  };

  // 企業詳細画面を開く（一覧・ホームどちらから呼んでも同じ動きになるようまとめておく）
  const openDetail = (company) => {
    setSelectedCompany(company);
    fetchImpressions(company.id);
    fetchHonne(company.id);
    fetchMemos(company.id);
    fetchRequirementMatches(company.id);
    fetchCompanyRecords(company.id);
    setShowAllRecords(false);
    setShowJobTextEditor(false);
    setJobTextDraft(company.job_text || "");
    setAddingImpressionType(null);
    setEditingImpressionId(null);
    setEditingHonne(false);
    setAddingMemo(false);
    setEditingMemoId(null);
    setScreen("detail");
  };

  // 企業詳細画面を閉じて、タブ表示に戻る
  const closeDetail = () => {
    setScreen(null);
    setSelectedCompany(null);
  };

  // ★
  const updateInterestLevel = async (id, newLevel) => {
    await fetch(`http://localhost:8787/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ interest_level: newLevel }),
    });
    fetchCompanies(); // 最新の状態を取り直す

    // 詳細画面に表示中の内容も更新する
    setSelectedCompany((prev) => prev && { ...prev, interest_level: newLevel });
  };

  // 選考ステータス
  const updateStatus = async (id, newStatus) => {
    await fetch(`http://localhost:8787/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCompanies();
    setSelectedCompany((prev) => prev && { ...prev, status: newStatus });
    fetchCompanyRecords(id);
    fetchRecords();
  };

  // お気に入りの切り替え（クリックが親要素（一覧の行など）まで伝わらないようにする）
  const toggleFavorite = async (company, e) => {
    if (e) e.stopPropagation();
    const newValue = company.is_favorite ? 0 : 1;

    await fetch(`http://localhost:8787/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ is_favorite: newValue }),
    });
    fetchCompanies();
    setSelectedCompany((prev) => prev && prev.id === company.id ? { ...prev, is_favorite: newValue } : prev);
  };

  // 「眠らせる」の切り替え
  const toggleSleeping = async (company) => {
    const newValue = company.is_sleeping ? 0 : 1;
    await fetch(`http://localhost:8787/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ is_sleeping: newValue }),
    });
    fetchCompanies();
    setSelectedCompany((prev) => prev && { ...prev, is_sleeping: newValue });
  };

  // いいな・気になる(その会社の一覧を取得)
  const fetchImpressions = async (companyId) => {
    const res = await fetch(`http://127.0.0.1:8787/impressions?company_id=${companyId}`);
    const data = await res.json();
    setImpressions(data);
  };

  // (いいな・気になるを追加。contentを引数で受け取る形に変更)
  const addImpression = async (type, content) => {
    if (!content.trim()) return;

    const body = JSON.stringify({
      company_id: selectedCompany.id,
      type: type,
      content: content.trim(),
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://127.0.0.1:8787/impressions", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    fetchImpressions(selectedCompany.id);
    fetchCompanies();
    fetchCompanyRecords(selectedCompany.id);
    fetchRecords();
  };

  // ＋追加チップをタップして、新規入力を始める
  const startAddImpression = (type) => {
    setAddingImpressionType(type);
    setNewChipValue("");
  };

  // 新規チップの入力を確定する（空文字なら何もしない）
  const commitAddImpression = async () => {
    if (newChipValue.trim()) {
      await addImpression(addingImpressionType, newChipValue);
    }
    setAddingImpressionType(null);
    setNewChipValue("");
  };

  // 既存のチップをタップして、編集を始める
  const startEditImpression = (imp) => {
    setEditingImpressionId(imp.id);
    setEditingImpressionValue(imp.content);
  };

  // 編集中の内容を確定して保存する
  const commitEditImpression = async () => {
    const trimmed = editingImpressionValue.trim();
    if (trimmed && editingImpressionId) {
      await fetch(`http://localhost:8787/impressions/${editingImpressionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ content: trimmed }),
      });
      fetchImpressions(selectedCompany.id);
    }
    setEditingImpressionId(null);
  };

  // (いいな・気になるから1件削除)
  const deleteImpression = async (id) => {
    await fetch(`http://127.0.0.1:8787/impressions/${id}`, { method: "DELETE" });
    fetchImpressions(selectedCompany.id);
  };

  // 照合結果を取得する
  const fetchRequirementMatches = async (companyId) => {
    const res = await fetch(`http://localhost:8787/requirement-matches?company_id=${companyId}`);
    const data = await res.json();
    setRequirementMatches(data);
  };

  // 「AIに再照合してもらう」を実行する関数
  const rematch = async () => {
    setIsRematching(true);

    try {
      const body = JSON.stringify({ company_id: selectedCompany.id });
      const bodyBytes = new TextEncoder().encode(body);

      const res = await fetch("http://localhost:8787/requirement-matches/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: bodyBytes,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "照合に失敗しました");
        return;
      }

      await fetchRequirementMatches(selectedCompany.id);
      fetchCompanies();
      fetchCompanyRecords(selectedCompany.id);
      fetchRecords();
    } finally {
      setIsRematching(false);
    }
  };

  // 求人票の本文を保存してから、続けてAIに再照合してもらう
  const saveJobTextAndRematch = async () => {
    await fetch(`http://localhost:8787/companies/${selectedCompany.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ job_text: jobTextDraft }),
    });
    setSelectedCompany((prev) => prev && { ...prev, job_text: jobTextDraft });
    await rematch();
  };

  // 希望条件の表をタップして、手動で○△×を切り替える（yes → mid → no → yes …の順）
  // noteは書き換えない：AIがつけた具体的な根拠（「リモート勤務の記載あり」など）は残したまま、
  // markだけ（自分の判断として）上書きする。手動で変えたことが分かるよう manually_edited を立てる
  const MARK_CYCLE = { yes: "mid", mid: "no", no: "yes" };
  const cycleMark = async (match) => {
    const nextMark = MARK_CYCLE[match.mark] || "yes";

    // 先に画面の表示だけ切り替える（サーバーの返事を待たずに反応させるため）
    setRequirementMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, mark: nextMark, manually_edited: 1 } : m))
    );

    await fetch(`http://localhost:8787/requirement-matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ mark: nextMark }),
    });
  };

  // 本音の取得・保存
  const fetchHonne = async (companyId) => {
    const res = await fetch(`http://127.0.0.1:8787/honne?company_id=${companyId}`);
    const data = await res.json();
    setHonne(data ? data.content : "");
  };

  const saveHonne = async () => {
    const body = JSON.stringify({
      company_id: selectedCompany.id,
      content: honne,
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://127.0.0.1:8787/honne", {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    fetchCompanies();
    fetchCompanyRecords(selectedCompany.id);
    fetchRecords();
    setEditingHonne(false);
  };

  // 確認したいこと・選考メモの取得・追加・削除
  const fetchMemos = async (companyId) => {
    const res = await fetch(`http://127.0.0.1:8787/memos?company_id=${companyId}`);
    const data = await res.json();
    setMemos(data);
  };

  // (メモを追加。contentを引数で受け取る形に変更)
  const addMemo = async (content) => {
    if (!content.trim()) return;

    const body = JSON.stringify({
      company_id: selectedCompany.id,
      content: content.trim(),
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://127.0.0.1:8787/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    fetchMemos(selectedCompany.id);
    fetchCompanies();
    fetchCompanyRecords(selectedCompany.id);
    fetchRecords();
  };

  // ＋追加チップをタップして、新規メモの入力を始める
  const startAddMemo = () => {
    setAddingMemo(true);
    setNewMemoValue("");
  };

  // 新規メモの入力を確定する
  const commitAddMemo = async () => {
    if (newMemoValue.trim()) {
      await addMemo(newMemoValue);
    }
    setAddingMemo(false);
    setNewMemoValue("");
  };

  // 既存のメモをタップして、編集を始める
  const startEditMemo = (memo) => {
    setEditingMemoId(memo.id);
    setEditingMemoValue(memo.content);
  };

  // 編集中のメモを確定して保存する
  const commitEditMemo = async () => {
    const trimmed = editingMemoValue.trim();
    if (trimmed && editingMemoId) {
      await fetch(`http://localhost:8787/memos/${editingMemoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ content: trimmed }),
      });
      fetchMemos(selectedCompany.id);
    }
    setEditingMemoId(null);
  };

  const deleteMemo = async (id) => {
    await fetch(`http://127.0.0.1:8787/memos/${id}`, { method: "DELETE" });
    fetchMemos(selectedCompany.id);
  };

  // 【自動実行・副作用】画面が最初に表示された時に1回だけ実行される
  useEffect(() => {
    fetchCompanies();
  }, []);

  // ホーム・記録タブを表示する時に、記録ログを取得する
  useEffect(() => {
    if (activeTab === "home" || activeTab === "records") {
      fetchRecords();
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = JSON.stringify({
      company_name: companyName,
      job_url: jobUrl,
      job_text: jobText,
      interest_level: 3,
    });
    const bodyBytes = new TextEncoder().encode(body);

    const res = await fetch("http://localhost:8787/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });
    const data = await res.json();
    const newCompanyId = data.id;

    // チップで選んだ内容・自由記述を、まとめて「いいな」として登録する
    // （バッチ用のAPIを使うことで、記録(records)も1件にまとまる）
    const impressionContents = [
      ...(moodChip ? [moodChip] : []),
      ...reasonChips,
      ...(freeReason.trim() ? [freeReason.trim()] : []),
    ];

    if (impressionContents.length > 0) {
      const impBody = JSON.stringify({
        company_id: newCompanyId,
        contents: impressionContents,
      });
      await fetch("http://127.0.0.1:8787/impressions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: new TextEncoder().encode(impBody),
      });
    }

    // フォームの中身を全部リセットする
    setCompanyName("");
    setJobUrl("");
    setJobText("");
    setMoodChip(null);
    setReasonChips([]);
    setFreeReason("");

    fetchCompanies();
    fetchRecords();
    setScreen(null); // 登録が終わったら、画面を閉じてタブ表示に戻る
  };

  // --- 集計（記録タブ・ホームタブで使う） ---
  const growingCount = companies.length;
  const interviewingCount = companies.filter((c) =>
    ["一次面接", "二次面接", "最終選考"].includes(c.status)
  ).length;
  const offerCount = companies.filter((c) => c.status === "内定").length;

  const stageCount = { seed: 0, sprout: 0, bud: 0, flower: 0 };
  companies.forEach((c) => {
    stageCount[c.growth_stage] = (stageCount[c.growth_stage] || 0) + 1;
  });
  const stageTotal = companies.length || 1;

  const visibleRecords = showAllRecords ? companyRecords : companyRecords.slice(0, 2);

  // ホームの「最近、気持ちが動いた企業」用に、最新の記録1件から企業を割り出す
  const latestRecord = records[0];
  const latestRecordCompany = latestRecord
    ? companies.find((c) => c.id === latestRecord.company_id)
    : null;

  // 「最近の記録」用：同じ日・同じ企業の記録を1行にまとめる
  // （recordsはすでに新しい順に並んでいるので、上から順に処理すれば自然と新しい順のグループになる）
  const groupedRecords = [];
  const groupIndexByKey = {}; // "日付_企業id" → groupedRecordsの何番目か、を覚えておく地図
  records.forEach((r) => {
    const dateLabel = new Date(r.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
    const key = `${dateLabel}_${r.company_id}`;

    if (groupIndexByKey[key] === undefined) {
      // まだ出てきていない日付×企業の組み合わせなら、新しいグループを作る
      groupIndexByKey[key] = groupedRecords.length;
      groupedRecords.push({
        key,
        date: dateLabel,
        company_id: r.company_id,
        company_name: r.company_name,
        titles: [r.title],
      });
    } else {
      // すでにあるグループなら、タイトルだけ追加する（同じタイトルの重複は避ける）
      const group = groupedRecords[groupIndexByKey[key]];
      if (!group.titles.includes(r.title)) {
        group.titles.push(r.title);
      }
    }
  });

  const visibleLogGroups = showAllLog ? groupedRecords : groupedRecords.slice(0, 4);

  // 「しばらく記録がありません」の案内用：各企業の最後の活動日を調べて、
  // 一番長く放置されている企業を1社だけ選ぶ（7日以上動きがなければ対象）
  let nudgeCompany = null;
  {
    const lastActivityByCompany = {};
    records.forEach((r) => {
      if (!lastActivityByCompany[r.company_id] || r.created_at > lastActivityByCompany[r.company_id]) {
        lastActivityByCompany[r.company_id] = r.created_at;
      }
    });
    let maxDays = 0;
    companies.forEach((c) => {
      const lastDate = lastActivityByCompany[c.id] || c.created_at;
      const days = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 7 && days > maxDays) {
        maxDays = days;
        nudgeCompany = c;
      }
    });
  }

  return (
    <div className="page">
      {screen === "detail" && selectedCompany ? (
        // ============ 企業詳細画面（タブの上に重ねて表示） ============
        <div className="detail-screen">
          <div className="detail-header">
            <button className="back-btn" onClick={closeDetail}>←</button>
            <div className="detail-title-wrap">
              <p className="detail-company">{selectedCompany.company_name}</p>
              <p className="detail-meta">
                {selectedCompany.status} ・ 志望度 {"★".repeat(selectedCompany.interest_level)}
              </p>
            </div>
            {selectedCompany.job_url && (
              <a className="job-url-link" href={selectedCompany.job_url} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M9 15 L15 9" />
                  <path d="M10 7 L12 5 A3.5 3.5 0 0 1 17.5 9.5 L15.5 11.5" />
                  <path d="M14 17 L12 19 A3.5 3.5 0 0 1 6.5 14.5 L8.5 12.5" />
                </svg>
                求人ページ
              </a>
            )}
          </div>

          <div className="detail-plant">
            <span className="detail-plant-icon">{STAGE_DISPLAY[selectedCompany.growth_stage]}</span>
            <p className="stage-caption">
              この会社について、{impressions.length + memos.length + (honne && honne.trim() ? 1 : 0)}つのことを知りました
            </p>
            <button
              className={selectedCompany.is_favorite ? "fav-btn active" : "fav-btn"}
              onClick={(e) => toggleFavorite(selectedCompany, e)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 20 C6 15 3 11.5 3 8 C3 5 5.2 3 8 3 C10 3 11.3 4.3 12 5.5 C12.7 4.3 14 3 16 3 C18.8 3 21 5 21 8 C21 11.5 18 15 12 20 Z" />
              </svg>
            </button>
          </div>

          <div className="detail-body">

            <div className="section-block">
              <div className="block">
                <p className="section-h">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20 V11" />
                    <path d="M12 14 C7 14 6 10 6 7 C10 7 12 9.5 12 14 Z" />
                    <path d="M12 12 C17 12 18 8.5 18 6 C14 6 12 8 12 12 Z" />
                  </svg>
                  この会社について
                </p>
                <p className="field-label">
                  希望条件との照合<span className="field-label-sub">（タップで直せます）</span>
                </p>
                <table className="req-table">
                  <tbody>
                    {requirementMatches.map((m) => (
                      <tr key={m.condition_id}>
                        <td>{m.label}</td>
                        <td
                          className={`mark ${m.mark} editable`}
                          onClick={() => cycleMark(m)}
                        >
                          {m.mark === "yes" ? "○" : m.mark === "mid" ? "△" : "×"}{" "}
                          <span className={m.manually_edited ? "mark-note dimmed" : "mark-note"}>
                            {m.note}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="rematch-btn" onClick={saveJobTextAndRematch} disabled={isRematching}>
                  {isRematching ? (
                    <>
                      <span className="spinner"></span>
                      照合中...
                    </>
                  ) : requirementMatches.length === 0 ? (
                    "AIに求人内容と希望条件を照らし合わせてもらう"
                  ) : (
                    "AIにもう一度照らし合わせてもらう"
                  )}
                </button>

                <div className="job-text-block">
                  <p
                    className="field-label job-text-toggle"
                    onClick={() => setShowJobTextEditor(!showJobTextEditor)}
                  >
                    <span>求人票の本文</span>
                    <span className="job-text-chevron">
                      {showJobTextEditor ? "閉じる ▴" : "編集する ▾"}
                    </span>
                  </p>
                  {showJobTextEditor && (
                    <div className="job-text-editor">
                      <textarea
                        className="form-textarea"
                        value={jobTextDraft}
                        onChange={(e) => setJobTextDraft(e.target.value)}
                      />
                      <p className="job-text-warning">
                        貼り直しただけでは上の照合結果は変わりません。反映するには上部の「AIにもう一度照らし合わせてもらう」ボタンを押してください
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="section-block">
              <div className="block">
                <p className="section-h">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13 C5 8 8.5 5 13 5 C17 5 20 7.8 20 11.5 C20 15.2 17 18 13 18 C11.8 18 10.7 17.8 9.7 17.4 L6 19 L7 15.8 C5.7 14.8 5 13.5 5 13 Z" />
                  </svg>
                  私が感じたこと
                </p>

                <p className="field-label">志望度</p>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={n <= selectedCompany.interest_level ? "star filled" : "star"}
                      onClick={() => updateInterestLevel(selectedCompany.id, n)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p className="field-label" style={{ marginTop: "14px" }}>いいなと思ったこと</p>
                <div className="chip-row">
                  {impressions.filter((imp) => imp.type === "good").map((imp) =>
                    editingImpressionId === imp.id ? (
                      <input
                        key={imp.id}
                        className="chip-edit-input"
                        autoFocus
                        value={editingImpressionValue}
                        onChange={(e) => setEditingImpressionValue(e.target.value)}
                        onBlur={commitEditImpression}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      />
                    ) : (
                      <div className="chip removable" key={imp.id} onClick={() => startEditImpression(imp)}>
                        <span className="chip-text">{imp.content}</span>
                        <span
                          className="chip-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImpression(imp.id);
                          }}
                        >
                          ×
                        </span>
                      </div>
                    )
                  )}
                  {addingImpressionType === "good" ? (
                    <input
                      className="chip-edit-input"
                      autoFocus
                      value={newChipValue}
                      onChange={(e) => setNewChipValue(e.target.value)}
                      onBlur={commitAddImpression}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    />
                  ) : (
                    <div className="chip add-chip" onClick={() => startAddImpression("good")}>＋ 追加</div>
                  )}
                </div>

                <p className="field-label" style={{ marginTop: "14px" }}>気になること</p>
                <div className="chip-row">
                  {impressions.filter((imp) => imp.type === "concern").map((imp) =>
                    editingImpressionId === imp.id ? (
                      <input
                        key={imp.id}
                        className="chip-edit-input"
                        autoFocus
                        value={editingImpressionValue}
                        onChange={(e) => setEditingImpressionValue(e.target.value)}
                        onBlur={commitEditImpression}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      />
                    ) : (
                      <div className="chip removable" key={imp.id} onClick={() => startEditImpression(imp)}>
                        <span className="chip-text">{imp.content}</span>
                        <span
                          className="chip-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImpression(imp.id);
                          }}
                        >
                          ×
                        </span>
                      </div>
                    )
                  )}
                  {addingImpressionType === "concern" ? (
                    <input
                      className="chip-edit-input"
                      autoFocus
                      value={newChipValue}
                      onChange={(e) => setNewChipValue(e.target.value)}
                      onBlur={commitAddImpression}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    />
                  ) : (
                    <div className="chip add-chip" onClick={() => startAddImpression("concern")}>＋ 追加</div>
                  )}
                </div>

                <p className="field-label" style={{ marginTop: "14px" }}>本音</p>
                {editingHonne ? (
                  <textarea
                    className="honne-edit"
                    autoFocus
                    value={honne || ""}
                    onChange={(e) => setHonne(e.target.value)}
                    onBlur={saveHonne}
                    onFocus={(e) => {
                      const len = e.target.value.length;
                      e.target.setSelectionRange(len, len); // カーソルを文字の最後に移動させる
                    }}
                    placeholder="ここだけの本音"
                  />
                ) : (
                  <div className="honne-box" onClick={() => setEditingHonne(true)}>
                    <span className="honne-text">{honne && honne.trim() ? honne : "ここだけの本音を書いてみましょう"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="section-block">
              <div className="block">
                <p className="section-h">
                  <svg className="section-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="2.2" fill="var(--ink)" />
                    <circle cx="12" cy="7" r="3" fill="#8574A3" />
                    <circle cx="16.5" cy="9.5" r="3" fill="#E8A9A0" />
                    <circle cx="14.8" cy="15" r="3" fill="#E8A9A0" />
                    <circle cx="9.2" cy="15" r="3" fill="#E8A9A0" />
                    <circle cx="7.5" cy="9.5" r="3" fill="#E8A9A0" />
                  </svg>
                  選考
                </p>

                <p className="field-label">選考ステータス</p>
                <div className="status-picker">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      className={s === selectedCompany.status ? "status-btn active" : "status-btn"}
                      onClick={() => updateStatus(selectedCompany.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <p className="field-label" style={{ marginTop: "14px" }}>確認したいこと・選考メモ</p>
                <div className="chip-row">
                  {memos.map((memo) =>
                    editingMemoId === memo.id ? (
                      <input
                        key={memo.id}
                        className="chip-edit-input"
                        autoFocus
                        value={editingMemoValue}
                        onChange={(e) => setEditingMemoValue(e.target.value)}
                        onBlur={commitEditMemo}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      />
                    ) : (
                      <div className="chip removable" key={memo.id} onClick={() => startEditMemo(memo)}>
                        <span className="chip-text">{memo.content}</span>
                        <span
                          className="chip-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMemo(memo.id);
                          }}
                        >
                          ×
                        </span>
                      </div>
                    )
                  )}
                  {addingMemo ? (
                    <input
                      className="chip-edit-input"
                      autoFocus
                      value={newMemoValue}
                      onChange={(e) => setNewMemoValue(e.target.value)}
                      onBlur={commitAddMemo}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    />
                  ) : (
                    <div className="chip add-chip" onClick={startAddMemo}>＋ 追加</div>
                  )}
                </div>
              </div>
            </div>

            <div className="section-block" style={{ marginBottom: "8px" }}>
              <div className="block" style={{ marginBottom: 0 }}>
                <p
                  className="section-h timeline-header"
                  onClick={() => setShowAllRecords(!showAllRecords)}
                >
                  <span>
                    <svg className="section-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 4.5 H16 L18.5 7 V19.5 H6 Z" />
                      <path d="M16 4.5 V7 H18.5" />
                      <path d="M9 11 H15 M9 14 H15 M9 17 H12.5" />
                    </svg>
                    記録
                  </span>
                  <span className="timeline-toggle">
                    {showAllRecords ? "閉じる ▴" : "すべて見る ▾"}
                  </span>
                </p>
                <ul className="timeline">
                  {visibleRecords.map((r) => (
                    <li key={r.id} className={r.category === "status" ? "status" : ""}>
                      <div className="t-title">{r.title}</div>
                      {new Date(r.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                      {r.note ? `・${r.note}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rest-btn" onClick={() => toggleSleeping(selectedCompany)}>
              <svg className="inline-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 12.5 A7 7 0 1 1 10.8 5.2 A5.6 5.6 0 0 0 17 12.5 Z" />
              </svg>
              {selectedCompany.is_sleeping ? "眠りから起こす" : "いったん眠らせる"}
            </div>
          </div>
        </div>
      ) : screen === "plant-new" ? (
        // ============ ＋植える画面（タブの上に重ねて表示） ============
        <div className="plant-new-screen">
          <div className="screen-header">
            <button className="back-btn" onClick={() => setScreen(null)}>←</button>
            <span className="screen-title">新しい企業を植える</span>
          </div>

          <form onSubmit={handleSubmit} className="plant-form">
            <div className="form-block">
              <label>会社名 <span className="required-label">必須</span></label>
              <input
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例：株式会社アオバ"
                required
              />
            </div>
            <div className="form-block">
              <label>求人ページ</label>
              <input
                className="form-input"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="URLを貼り付け"
              />
            </div>
            <div className="form-block">
              <label>求人情報</label>
              <textarea
                className="form-textarea"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="求人票の本文を貼り付けてください"
              />
              <p className="form-hint">
                Ctrl+Aで全選択すると他社の情報も混ざることがあります。求人本文だけを範囲選択してコピペしてください。
              </p>
            </div>

            <div className="form-block">
              <label>この会社、今どんな感じ？</label>
              <div className="form-chip-row">
                {moodOptions.map((label) => (
                  <div
                    key={label}
                    className={moodChip === label ? "form-chip selected" : "form-chip"}
                    onClick={() => setMoodChip(moodChip === label ? null : label)}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-block">
              <label>気になった理由は？</label>
              <div className="form-chip-row">
                {reasonOptions.map((label) => (
                  <div
                    key={label}
                    className={reasonChips.includes(label) ? "form-chip selected" : "form-chip"}
                    onClick={() => toggleReasonChip(label)}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <textarea
                className="form-textarea"
                style={{ marginTop: "8px" }}
                value={freeReason}
                onChange={(e) => setFreeReason(e.target.value)}
                placeholder="自由に書いてもOK"
              />
            </div>

            <button type="submit" className="plant-submit-btn">植える</button>
          </form>
        </div>
      ) : (
        // ============ タブ表示（ホーム／企業一覧／記録／設定） ============
        <>
          {activeTab === "home" && (
            <div className="home-screen">
              <div className="page-header">
                <div>
                  <p className="eyebrow">おかえりなさい</p>
                  <h1 className="page-title">今日の庭</h1>
                  <p className="home-summary">
                    育てている{growingCount}社・選考中{interviewingCount}社・内定{offerCount}社
                  </p>
                </div>
                <button className="add-btn" onClick={() => setScreen("plant-new")}>＋植える</button>
              </div>

              <div className="mini-garden">
                {companies.map((c) => (
                  <span
                    key={c.id}
                    className="mini-garden-icon"
                    onClick={() => openDetail(c)}
                    title={c.company_name}
                  >
                    {STAGE_DISPLAY[c.growth_stage]}
                  </span>
                ))}
              </div>

              {latestRecordCompany && (
                <>
                  <div className="section-label">
                    <span>最近、気持ちが動いた企業</span>
                  </div>
                  <div
                    className="plant-row"
                    onClick={() => openDetail(latestRecordCompany)}
                  >
                    <span className="stage-icon">{STAGE_DISPLAY[latestRecordCompany.growth_stage]}</span>
                    <div className="row-main">
                      <div className="row-name">{latestRecordCompany.company_name}</div>
                      <div className="row-status">
                        {latestRecord.title}
                        {latestRecord.note ? `・${latestRecord.note}` : ""}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <p className="toggle-note">下のタブから、企業一覧や記録もまとめて見られます</p>
            </div>
          )}

          {activeTab === "companies" && (
            <div className="companies-screen">
              <div className="page-header">
                <div>
                  <p className="eyebrow">企業</p>
                  <h1 className="page-title">庭のみんな・全{companies.length}社</h1>
                </div>
                <button className="add-btn" onClick={() => setScreen("plant-new")}>＋植える</button>
              </div>
              <ul className="company-list">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className="company-row"
                    onClick={() => openDetail(company)}
                  >
                    <span className="mini-plant">{STAGE_DISPLAY[company.growth_stage]}</span>
                    <div className="row-main">
                      <div className="row-name">{company.company_name}</div>
                      <div className="row-status">{company.status}</div>
                    </div>
                    <div className="row-stars">
                      {"★".repeat(company.interest_level)}
                      {"☆".repeat(5 - company.interest_level)}
                    </div>
                    <button
                      className={company.is_favorite ? "fav-btn active" : "fav-btn"}
                      onClick={(e) => toggleFavorite(company, e)}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 20 C6 15 3 11.5 3 8 C3 5 5.2 3 8 3 C10 3 11.3 4.3 12 5.5 C12.7 4.3 14 3 16 3 C18.8 3 21 5 21 8 C21 11.5 18 15 12 20 Z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "records" && (
            <div className="records-screen">
              <div className="page-header">
                <div>
                  <p className="eyebrow">記録</p>
                  <h1 className="page-title">庭の様子</h1>
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-card c-sprout">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4F7A55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20 V11" />
                      <path d="M12 14 C7 14 6 10 6 7 C10 7 12 9.5 12 14 Z" />
                      <path d="M12 12 C17 12 18 8.5 18 6 C14 6 12 8 12 12 Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-num">{growingCount}</div>
                    <div className="stat-label">育てている苗</div>
                  </div>
                </div>
                <div className="stat-card c-talk">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#C08A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 5.5 H20 V16 H9 L5 19.5 V16 H4 Z" />
                      <path d="M8 9.5 H16 M8 12.5 H13" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-num">{interviewingCount}</div>
                    <div className="stat-label">面接・最終選考</div>
                  </div>
                </div>
                <div className="stat-card c-flower">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" fill="#8574A3" />
                      <circle cx="12" cy="6" r="4" fill="#E8A9A0" />
                      <circle cx="17" cy="9.5" r="4" fill="#E8A9A0" />
                      <circle cx="15" cy="16" r="4" fill="#E8A9A0" />
                      <circle cx="9" cy="16" r="4" fill="#E8A9A0" />
                      <circle cx="7" cy="9.5" r="4" fill="#E8A9A0" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-num">{offerCount}</div>
                    <div className="stat-label">内定の花</div>
                  </div>
                </div>
                <div className="stat-card c-rest">
                  <div className="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8A8A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 12.5 A7 7 0 1 1 10.8 5.2 A5.6 5.6 0 0 0 17 12.5 Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="stat-num">{companies.filter((c) => c.is_sleeping).length}</div>
                    <div className="stat-label">眠っている</div>
                  </div>
                </div>
              </div>
              <p className="stat-note">
                「眠っている」は自分で「いったん眠らせる」を選んだ企業です。アプリが自動で判定することはありません。
              </p>

              {nudgeCompany && (
                <div className="nudge-card">
                  <span className="nudge-dot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8A8A7C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
                      <path d="M17 12.5 A7 7 0 1 1 10.8 5.2 A5.6 5.6 0 0 0 17 12.5 Z" />
                    </svg>
                  </span>
                  <div>
                    <span style={{ fontWeight: 700 }}>{nudgeCompany.company_name}</span>
                    、しばらく記録がありません。
                    <br />
                    ちょっと様子を見てみる？
                  </div>
                </div>
              )}

              <div className="dist-block">
                <p className="field-label">成長段階の分布</p>
                {[
                  { key: "seed", label: "たね" },
                  { key: "sprout", label: "双葉" },
                  { key: "bud", label: "つぼみ" },
                  { key: "flower", label: "花" },
                ].map((s) => (
                  <div className="dist-row" key={s.key}>
                    <span className="dist-label">{s.label}</span>
                    <div className="dist-track">
                      <div
                        className="dist-fill"
                        style={{ width: `${(stageCount[s.key] / stageTotal) * 100}%` }}
                      ></div>
                    </div>
                    <span className="dist-num">{stageCount[s.key]}</span>
                  </div>
                ))}
              </div>

              <div className="section-label">最近の記録</div>
              <div className="log-list">
                {visibleLogGroups.map((g) => (
                  <div
                    className="log-row"
                    key={g.key}
                    onClick={() => {
                      const c = companies.find((co) => co.id === g.company_id);
                      if (c) openDetail(c);
                    }}
                  >
                    <div className="log-d">{g.date}</div>
                    <div className="log-body">
                      <span className="log-company">{g.company_name}</span> —{" "}
                      <span className="log-note">{g.titles.join("、")}</span>
                    </div>
                  </div>
                ))}
              </div>
              {groupedRecords.length > 4 && (
                <div className="log-more-btn" onClick={() => setShowAllLog(!showAllLog)}>
                  {showAllLog ? "閉じる" : "すべての記録を見る"}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-screen">
              <div className="page-header">
                <div>
                  <p className="eyebrow">設定</p>
                  <h1 className="page-title">設定</h1>
                </div>
              </div>
              <p className="settings-placeholder">設定項目は準備中です。</p>
            </div>
          )}

          <div className="bottom-nav">
            <div
              className={activeTab === "home" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("home")}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12 L12 5 L20 12" />
                  <path d="M6.5 10.5 V19 H17.5 V10.5" />
                  <path d="M10 19 V14.5 H14 V19" />
                </svg>
              </span>
              ホーム
            </div>
            <div
              className={activeTab === "companies" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("companies")}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20 V11" />
                  <path d="M12 14 C7 14 6 10 6 7 C10 7 12 9.5 12 14 Z" />
                  <path d="M12 12 C17 12 18 8.5 18 6 C14 6 12 8 12 12 Z" />
                </svg>
              </span>
              企業
            </div>
            <div
              className={activeTab === "records" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("records")}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4.5 H16 L18.5 7 V19.5 H6 Z" />
                  <path d="M16 4.5 V7 H18.5" />
                  <path d="M9 11 H15 M9 14 H15 M9 17 H12.5" />
                </svg>
              </span>
              記録
            </div>
            <div
              className={activeTab === "settings" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab("settings")}
            >
              <span className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3.5 V6 M12 18 V20.5 M3.5 12 H6 M18 12 H20.5 M6 6 L7.7 7.7 M16.3 16.3 L18 18 M18 6 L16.3 7.7 M7.7 16.3 L6 18" />
                </svg>
              </span>
              設定
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
