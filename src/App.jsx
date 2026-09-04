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

  // --- 【関数の準備】 ---
  const fetchCompanies = () => {
    fetch("http://localhost:8787/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data));
  };

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
            onClick={() => setSelectedCompany(company)}>
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