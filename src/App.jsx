import { useState, useEffect } from "react";

function App() {
  const [companies, setCompanies] = useState([]);

  // ＋植えるフォームの入力内容を覚えておく箱
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");

  const fetchCompanies = () => {
    fetch("http://localhost:8787/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    setCompanyName("");
    setJobUrl("");
    setJobText("");
    fetchCompanies();
  };

  return (
    <div>
      <h1>庭のみんな</h1>
      <ul>
        {companies.map((company) => (
          <li key={company.id}>{company.company_name}</li>
        ))}
      </ul>

      <h2>＋植える</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>会社名</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>求人ページ</label>
          <input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
        </div>
        <div>
          <label>求人情報</label>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />
        </div>
        <button type="submit">植える</button>
      </form>
    </div>
  );
}

export default App;