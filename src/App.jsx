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
  const [newImpression, setNewImpression] = useState("");
  const [honne, setHonne] = useState(null);
  const [memos, setMemos] = useState([]);
  const [newMemo, setNewMemo] = useState("");
  const [requirementMatches, setRequirementMatches] = useState([]);
  const [isRematching, setIsRematching] = useState(false);
  const [records, setRecords] = useState([]); // 記録ログの一覧（全企業分）
  const [companyRecords, setCompanyRecords] = useState([]); // 選択中の企業のタイムライン
  const [showAllRecords, setShowAllRecords] = useState(false); // タイムラインを全件表示するかどうか

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

  // いいな・気になる(その会社の一覧を取得)
  const fetchImpressions = async (companyId) => {
    const res = await fetch(`http://127.0.0.1:8787/impressions?company_id=${companyId}`);
    const data = await res.json();
    setImpressions(data);
  };

  // (いいな・気になるを追加)
  const addImpression = async (type) => {
    if (!newImpression.trim()) return;

    const body = JSON.stringify({
      company_id: selectedCompany.id,
      type: type,
      content: newImpression,
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://127.0.0.1:8787/impressions", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    setNewImpression("");
    fetchImpressions(selectedCompany.id);
    fetchCompanies();
    fetchCompanyRecords(selectedCompany.id);
    fetchRecords();
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
  };

  // 確認したいこと・選考メモの取得・追加・削除
  const fetchMemos = async (companyId) => {
    const res = await fetch(`http://127.0.0.1:8787/memos?company_id=${companyId}`);
    const data = await res.json();
    setMemos(data);
  };

  const addMemo = async () => {
    if (!newMemo.trim()) return;

    const body = JSON.stringify({
      company_id: selectedCompany.id,
      content: newMemo,
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://127.0.0.1:8787/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    setNewMemo("");
    fetchMemos(selectedCompany.id);
    fetchCompanies();
    fetchCompanyRecords(selectedCompany.id);
    fetchRecords();
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

  return (
    <div className="page">
      {screen === "detail" && selectedCompany ? (
        // ============ 企業詳細画面（タブの上に重ねて表示） ============
        <div className="detail-screen">
          <div className="screen-header">
            <button className="back-btn" onClick={closeDetail}>←</button>
          </div>

          <h2>{selectedCompany.company_name}</h2>
          <p className="row-status">
            <span className="stage-icon">{STAGE_DISPLAY[selectedCompany.growth_stage]}</span>
            {selectedCompany.status}
          </p>

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

          <div className="requirement-block">
            <p className="field-label">希望条件との照合</p>
            <table className="req-table">
              <tbody>
                {requirementMatches.map((m) => (
                  <tr key={m.condition_id}>
                    <td>{m.label}</td>
                    <td className={`mark ${m.mark}`}>
                      {m.mark === "yes" ? "○" : m.mark === "mid" ? "△" : "×"} {m.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="rematch-btn" onClick={rematch} disabled={isRematching}>
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
          </div>

          <div className="impression-block">
            <p className="field-label">いいな・気になる</p>
            <ul className="impression-list">
              {impressions.map((imp) => (
                <li key={imp.id} className={imp.type === "good" ? "imp-good" : "imp-concern"}>
                  {imp.content}
                  <span onClick={() => deleteImpression(imp.id)} className="imp-delete">×</span>
                </li>
              ))}
            </ul>

            <input
              className="form-input"
              value={newImpression}
              onChange={(e) => setNewImpression(e.target.value)}
              placeholder="気づいたことを書く"
            />
            <div className="imp-buttons">
              <button onClick={() => addImpression("good")}>いいな に追加</button>
              <button onClick={() => addImpression("concern")}>気になる に追加</button>
            </div>
          </div>

          <div className="honne-block">
            <p className="field-label">本音</p>
            <textarea
              className="form-textarea"
              value={honne || ""}
              onChange={(e) => setHonne(e.target.value)}
              onBlur={saveHonne}
              placeholder="ここだけの本音"
            />
          </div>

          <div className="memo-block">
            <p className="field-label">確認したいこと・選考メモ</p>
            <ul className="memo-list">
              {memos.map((memo) => (
                <li key={memo.id} className="memo-item">
                  {memo.content}
                  <span onClick={() => deleteMemo(memo.id)} className="imp-delete">×</span>
                </li>
              ))}
            </ul>

            <input
              className="form-input"
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="確認したいこと・選考メモを書く"
            />
            <button onClick={addMemo}>追加</button>
          </div>

          <div className="section-block">
            <p
              className="field-label timeline-header"
              onClick={() => setShowAllRecords(!showAllRecords)}
            >
              <span>記録</span>
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
                <h1 className="page-title">企業一覧</h1>
                <button className="add-btn" onClick={() => setScreen("plant-new")}>＋植える</button>
              </div>
              <ul className="company-list">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className="company-row"
                    onClick={() => openDetail(company)}
                  >
                    <span className="stage-icon">{STAGE_DISPLAY[company.growth_stage]}</span>
                    <div className="row-main">
                      <div className="row-name">{company.company_name}</div>
                      <div className="row-status">{company.status}</div>
                    </div>
                    <div className="row-stars">
                      {"★".repeat(company.interest_level)}
                      {"☆".repeat(5 - company.interest_level)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "records" && (
            <div className="records-screen">
              <h1 className="page-title">庭の様子</h1>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-num">{growingCount}</div>
                  <div className="stat-label">育てている苗</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{interviewingCount}</div>
                  <div className="stat-label">面接・最終選考</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{offerCount}</div>
                  <div className="stat-label">内定の花</div>
                </div>
              </div>

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
                {records.map((r) => (
                  <div
                    className="log-row"
                    key={r.id}
                    onClick={() => {
                      const c = companies.find((co) => co.id === r.company_id);
                      if (c) openDetail(c);
                    }}
                  >
                    <div className="log-d">
                      {new Date(r.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </div>
                    <div className="log-body">
                      <span className="log-company">{r.company_name}</span> —{" "}
                      <span className="log-note">
                        {r.title}
                        {r.note ? `・${r.note}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-screen">
              <h1 className="page-title">設定</h1>
              <p className="settings-placeholder">設定項目は準備中です。</p>
            </div>
          )}

          <div className="bottom-nav">
            <button
              className={activeTab === "home" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("home")}
            >
              ホーム
            </button>
            <button
              className={activeTab === "companies" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("companies")}
            >
              企業
            </button>
            <button
              className={activeTab === "records" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("records")}
            >
              記録
            </button>
            <button
              className={activeTab === "settings" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("settings")}
            >
              設定
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
