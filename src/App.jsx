import { useState, useEffect } from "react";
import './App.css';

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

  // --- 【関数の準備】 ---
  const fetchCompanies = () => {
    fetch("http://localhost:8787/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data));
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
  };

  // (いいな・気になるから1件削除)
  const deleteImpression = async (id) => {
    await fetch(`http://127.0.0.1:8787/impressions/${id}`, { method: "DELETE" });
    fetchImpressions(selectedCompany.id);
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
  };

  const deleteMemo = async (id) => {
    await fetch(`http://127.0.0.1:8787/memos/${id}`, { method: "DELETE" });
    fetchMemos(selectedCompany.id);
  };

  // 【自動実行・副作用】画面が最初に表示された時に1回だけ実行される
  useEffect(() => {
    fetchCompanies();
  }, []);

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

  return (
    <div className="page">
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
            }}
          >
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
        </div>
        <button type="submit" className="plant-submit-btn">植える</button>
      </form>
    </div>
  );
}

export default App;