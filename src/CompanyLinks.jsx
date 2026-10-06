// ============================================================
// 企業詳細の「関連リンク」
//   採用ページ・企業HP・別の求人など、1社にいくつでもリンクを登録できる。
//   右上の「求人ページ」ボタン（メインの求人）とは別に持つ。
//
//   ふだん ……… リンクをタップすると、新しいタブで開く
//   「編集」中 … 名前をタップすると書き直せる。× で削除する
//
//   このアプリの基本は「タップ＝書き直す」だが、リンクは「タップ＝開く」にしたいので、
//   書き直す時だけ「編集」に切り替える形にしている（↗ の印で、開くものだと分かるようにする）
// ============================================================
import { useEffect, useState } from "react";

// 名前の候補（タップすると、名前の欄に入る。自分で書いてもよい）
const LABEL_PRESETS = ["採用ページ", "企業HP", "別の求人"];

// 名前の最大文字数（バックエンドの LINK_LABEL_MAX と同じ値にしておく）
const LINK_LABEL_MAX = 20;

// companyId: 表示中の企業のid
// apiFetch: APIを呼び出す関数（App.jsx のものを、そのまま受け取る）
export function CompanyLinks({ companyId, apiFetch }) {
  const [links, setLinks] = useState([]);       // 登録してあるリンクの一覧
  const [editing, setEditing] = useState(false); // 「編集」中かどうか
  const [form, setForm] = useState(null);       // 入力欄の中身（null = 入力欄を出していない）。{ id, label, url }
  const [formError, setFormError] = useState(""); // 入力に問題がある時のメッセージ
  const [saving, setSaving] = useState(false);  // 保存している最中かどうか（ボタンの連打を防ぐ）

  // リンクの一覧を取得する
  const fetchLinks = async () => {
    const res = await apiFetch(`/company-links?company_id=${companyId}`);
    if (!res.ok) return; // 取得できなかった時は、今の表示のままにする
    setLinks(await res.json());
  };

  // 企業詳細を開いた時に、その企業のリンクを取得する
  useEffect(() => {
    fetchLinks();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 入力欄を開く（link を渡すと書き直し、渡さなければ新しく追加）
  const openForm = (link) => {
    setForm(link ? { id: link.id, label: link.label, url: link.url } : { id: null, label: "", url: "" });
    setFormError("");
  };

  const closeForm = () => {
    setForm(null);
    setFormError("");
  };

  // 入力した内容を保存する
  const saveForm = async () => {
    if (saving) return;
    const label = form.label.trim();
    let url = form.url.trim();
    // 「example.com/...」のように https:// を省いて書いた時は、頭に付け足す
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;

    // 送る前に、画面側でも確かめる（すぐに気づけるように）
    if (!label) {
      setFormError("リンクの名前を入力してください");
      return;
    }
    if (!url) {
      setFormError("URLを入力してください");
      return;
    }

    setSaving(true);
    try {
      // id があれば書き直し（PATCH）、無ければ新しく追加（POST）
      const res = form.id
        ? await apiFetch(`/company-links/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ label, url }),
        })
        : await apiFetch("/company-links", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ company_id: companyId, label, url }),
        });

      if (!res.ok) {
        // Workerが返した理由（件数の上限など）を、そのまま見せる
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "リンクの保存に失敗しました");
        return;
      }

      await fetchLinks();
      closeForm();
    } catch (err) {
      console.error("リンクの保存に失敗しました:", err);
      setFormError("通信がうまくいきませんでした。もう一度お試しください");
    } finally {
      setSaving(false);
    }
  };

  // リンクを1件削除する
  const deleteLink = async (id) => {
    await apiFetch(`/company-links/${id}`, { method: "DELETE" });
    if (form && form.id === id) closeForm(); // 書き直している最中のリンクを消した時は、入力欄も閉じる
    // 最後の1件を消した時は、「編集」を終わらせる
    if (links.length <= 1) setEditing(false);
    fetchLinks();
  };

  // 「編集」と「完了」を切り替える
  const toggleEditing = () => {
    setEditing(!editing);
    closeForm();
  };

  return (
    <div className="company-links-block">
      <p className="field-label company-links-head">
        <span>関連リンク</span>
        {/* リンクが1件以上ある時だけ、「編集」を出す */}
        {links.length > 0 && (
          <span className="company-links-toggle" onClick={toggleEditing}>
            {editing ? "完了" : "編集"}
          </span>
        )}
      </p>

      <div className="chip-row">
        {links.map((link) =>
          editing ? (
            // 編集中：名前をタップすると書き直し、× で削除
            <div className="chip link-chip editing" key={link.id} onClick={() => openForm(link)}>
              <span className="link-chip-label">{link.label}</span>
              <span
                className="chip-x"
                onClick={(e) => {
                  e.stopPropagation(); // 「書き直し」まで伝わらないようにする
                  deleteLink(link.id);
                }}
              >
                ×
              </span>
            </div>
          ) : (
            // ふだん：タップすると、新しいタブで開く
            <a className="chip link-chip" key={link.id} href={link.url} target="_blank" rel="noreferrer">
              {/* くさりのアイコン（右上の「求人ページ」ボタンと同じ形）。開くものだと分かるようにする印 */}
              <svg className="link-chip-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 15 L15 9" />
                <path d="M10 7 L12 5 A3.5 3.5 0 0 1 17.5 9.5 L15.5 11.5" />
                <path d="M14 17 L12 19 A3.5 3.5 0 0 1 6.5 14.5 L8.5 12.5" />
              </svg>
              <span className="link-chip-label">{link.label}</span>
            </a>
          )
        )}
        {/* 入力欄を出している間は、「＋ 追加」を隠す */}
        {!form && (
          <div className="chip add-chip" onClick={() => openForm(null)}>＋ 追加</div>
        )}
      </div>

      {editing && !form && (
        <p className="edit-hint">名前をタップすると書き直せます。× で削除します</p>
      )}

      {form && (
        <div className="link-form">
          {/* 名前の候補。タップすると、下の名前の欄に入る */}
          <div className="link-form-presets">
            {LABEL_PRESETS.map((preset) => (
              <span
                key={preset}
                className={form.label === preset ? "link-preset selected" : "link-preset"}
                onClick={() => setForm({ ...form, label: preset })}
              >
                {preset}
              </span>
            ))}
          </div>
          <input
            className="form-input"
            maxLength={LINK_LABEL_MAX}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="名前（例：採用ページ）"
          />
          <input
            className="form-input"
            type="url"
            inputMode="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />
          {formError && <p className="link-form-error">{formError}</p>}
          <div className="link-form-buttons">
            <button className="link-form-cancel" onClick={closeForm}>キャンセル</button>
            <button className="link-form-save" onClick={saveForm} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
