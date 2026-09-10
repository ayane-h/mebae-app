import { useState, useEffect } from "react";
import './App.css';

const STAGE_DISPLAY = {
  seed: "🌱",
  sprout: "🌿",
  bud: "🌸",
  flower: "🌼",
};

// --- 【データの準備】 ---
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
  const [view, setView] = useState("home"); // "home"(庭のみんな) か "records"(記録) を切り替える
  const [records, setRecords] = useState([]); // 記録ログの一覧（全企業分）

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
    setIsRematching(true); // ボタンを押せない状態にする

    try {
      const body = JSON.stringify({ company_id: selectedCompany.id });
      const bodyBytes = new TextEncoder().encode(body); // 日本語データはないが、既存コードと書き方を統一

      const res = await fetch("http://localhost:8787/requirement-matches/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: bodyBytes,
      });

      if (!res.ok) {
        // 「求人票が空」「希望条件が0件」などのエラーをそのまま表示
        const err = await res.json();
        alert(err.error || "照合に失敗しました");
        return;
      }

      // Gemini照合が終わったら、DBに保存された最新の結果を取り直す
      await fetchRequirementMatches(selectedCompany.id);
      fetchCompanies();
    } finally {
      setIsRematching(false); // 成功しても失敗しても、必ずボタンを元に戻す
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
  };

  const deleteMemo = async (id) => {
    await fetch(`http://127.0.0.1:8787/memos/${id}`, { method: "DELETE" });
    fetchMemos(selectedCompany.id);
  };

  // 【自動実行・副作用】画面が最初に表示された時に1回だけ実行される
  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (view === "records") {
      fetchRecords();
    }
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- 【送信データの準備】 ---
    const body = JSON.stringify({
      company_name: companyName,
      job_url: jobUrl,
      job_text: jobText,
      interest_level: 3,
    });
    const bodyBytes = new TextEncoder().encode(body);

    await fetch("http://localhost:8787/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: bodyBytes,
    });

    // --- 【送信完了後の後処理】フォームの初期化＆画面の会社一覧を最新状態に更新 ---
    setCompanyName("");
    setJobUrl("");
    setJobText("");
    fetchCompanies();
  };

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

  return (
    <div className="page">
      <div className="view-nav">
        <button
          className={view === "home" ? "nav-btn active" : "nav-btn"}
          onClick={() => setView("home")}
        >
          庭のみんな
        </button>
        <button
          className={view === "records" ? "nav-btn active" : "nav-btn"}
          onClick={() => setView("records")}
        >
          記録
        </button>
      </div>

      {view === "home" ? (
        <>
          <h1 className="page-title">庭のみんな</h1>
          <ul className="company-list">
            {companies.map((company) => (
              <li
                key={company.id}
                className="company-row"
                onClick={() => {
                  setSelectedCompany(company);
                  fetchImpressions(company.id);
                  fetchHonne(company.id);
                  fetchMemos(company.id);
                  fetchRequirementMatches(company.id);
                }}
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
          {selectedCompany && (
            <div className="detail-panel">
              <h2>{selectedCompany.company_name}</h2>
              <p className="row-status">{selectedCompany.status}</p>

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

              <button onClick={() => setSelectedCompany(null)}>閉じる</button>
            </div>
          )}

          <h2 className="section-title">＋植える</h2>
          <form onSubmit={handleSubmit} className="plant-form">
            <div className="form-block">
              <label>会社名</label>
              <input
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="form-block">
              <label>求人ページ</label>
              <input
                className="form-input"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
            <div className="form-block">
              <label>求人情報</label>
              <textarea
                className="form-textarea"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
              <p className="form-hint">
                Ctrl+Aで全選択すると他社の情報も混ざることがあります。求人本文だけを範囲選択してコピペしてください。
              </p>
            </div>
            <button type="submit" className="plant-submit-btn">植える</button>
          </form>
        </>
      ) : (
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
              <div className="log-row" key={r.id}>
                <div className="log-d">
                  {new Date(r.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                </div>
                <div className="log-body">
                  <span className="log-company">{r.company_name}</span> — <span className="log-note">{r.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;