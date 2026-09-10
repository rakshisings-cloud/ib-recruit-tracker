"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type WatchTarget = {
  id: string;
  url: string;
  cssSelector: string | null;
  keywords: string[];
  fetchStrategy: string;
  isActive: boolean;
};

export default function WatchTargetManager({
  firmId,
  targets,
}: {
  firmId: string;
  targets: WatchTarget[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(targets.length === 0);
  const [url, setUrl] = useState("");
  const [cssSelector, setCssSelector] = useState("");
  const [keywords, setKeywords] = useState(
    "2028, Class of 2028, Summer 2028, Summer Analyst, Investment Banking Summer Analyst, IB Summer Analyst, Summer Internship, Investment Banking Internship, Full-Time Analyst, Analyst Program, Applications Open, Apply Now"
  );
  const [fetchStrategy, setFetchStrategy] = useState("http");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/firms/${firmId}/watch-targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          cssSelector: cssSelector || null,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          fetchStrategy,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.formErrors?.join(", ") ?? "Save failed");
      setUrl("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(target: WatchTarget) {
    await fetch(`/api/watch-targets/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !target.isActive }),
    });
    router.refresh();
  }

  async function remove(target: WatchTarget) {
    if (!confirm(`Remove watch target ${target.url}?`)) return;
    await fetch(`/api/watch-targets/${target.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: "0.75rem" }}>Watch Targets</h3>
      {targets.map((t) => (
        <div className="watch-target-row" key={t.id}>
          <div>
            <div className="watch-target-url">{t.url}</div>
            <div className="muted">
              {t.fetchStrategy} · {t.keywords.join(", ") || "no keywords"}{" "}
              {!t.isActive && "· inactive"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn" onClick={() => toggleActive(t)}>
              {t.isActive ? "Deactivate" : "Activate"}
            </button>
            <button className="btn btn-danger" onClick={() => remove(t)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {!showForm && (
        <button className="btn" style={{ marginTop: "0.75rem" }} onClick={() => setShowForm(true)}>
          + Add Watch Target
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginTop: "1rem" }}>
          <div className="form-row">
            <label>Careers Page URL</label>
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://careers.example.com/students"
            />
          </div>
          <div className="form-row">
            <label>CSS Selector (optional, narrows the check)</label>
            <input value={cssSelector} onChange={(e) => setCssSelector(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Keywords (comma-separated)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Fetch Strategy</label>
            <select value={fetchStrategy} onChange={(e) => setFetchStrategy(e.target.value)}>
              <option value="http">http (fast, static pages)</option>
              <option value="browser">browser (JS-rendered pages, e.g. Workday)</option>
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add"}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
