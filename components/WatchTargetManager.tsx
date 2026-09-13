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

const DEFAULT_KEYWORDS =
  "2028 Summer Analyst Program, 2028 Summer Investment Banking Internship, 2028 M&A, 2028 Summer Analyst, 2028";

type TargetFormValues = {
  url: string;
  cssSelector: string;
  keywords: string;
  fetchStrategy: string;
};

function TargetFields({
  values,
  onChange,
}: {
  values: TargetFormValues;
  onChange: (values: TargetFormValues) => void;
}) {
  return (
    <>
      <div className="form-row">
        <label>Careers Page URL</label>
        <input
          required
          type="url"
          value={values.url}
          onChange={(e) => onChange({ ...values, url: e.target.value })}
          placeholder="https://careers.example.com/students"
        />
      </div>
      <div className="form-row">
        <label>CSS Selector (optional, narrows the check)</label>
        <input
          value={values.cssSelector}
          onChange={(e) => onChange({ ...values, cssSelector: e.target.value })}
        />
      </div>
      <div className="form-row">
        <label>Keywords (comma-separated)</label>
        <input value={values.keywords} onChange={(e) => onChange({ ...values, keywords: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Fetch Strategy</label>
        <select
          value={values.fetchStrategy}
          onChange={(e) => onChange({ ...values, fetchStrategy: e.target.value })}
        >
          <option value="http">http (fast, static pages)</option>
          <option value="browser">browser (JS-rendered pages, e.g. Workday)</option>
        </select>
      </div>
    </>
  );
}

export default function WatchTargetManager({
  firmId,
  targets,
}: {
  firmId: string;
  targets: WatchTarget[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(targets.length === 0);
  const [addValues, setAddValues] = useState<TargetFormValues>({
    url: "",
    cssSelector: "",
    keywords: DEFAULT_KEYWORDS,
    fetchStrategy: "http",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<TargetFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function parseKeywords(raw: string): string[] {
    return raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/firms/${firmId}/watch-targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: addValues.url,
          cssSelector: addValues.cssSelector || null,
          keywords: parseKeywords(addValues.keywords),
          fetchStrategy: addValues.fetchStrategy,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.formErrors?.join(", ") ?? "Save failed");
      setAddValues({ url: "", cssSelector: "", keywords: DEFAULT_KEYWORDS, fetchStrategy: "http" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(target: WatchTarget) {
    setEditingId(target.id);
    setEditValues({
      url: target.url,
      cssSelector: target.cssSelector ?? "",
      keywords: target.keywords.join(", "),
      fetchStrategy: target.fetchStrategy,
    });
    setError(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId || !editValues) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/watch-targets/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: editValues.url,
          cssSelector: editValues.cssSelector || null,
          keywords: parseKeywords(editValues.keywords),
          fetchStrategy: editValues.fetchStrategy,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.formErrors?.join(", ") ?? "Save failed");
      setEditingId(null);
      setEditValues(null);
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
    if (!confirm(`Remove watch target ${target.url}? This also erases its check history.`)) return;
    await fetch(`/api/watch-targets/${target.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: "0.75rem" }}>Watch Targets</h3>
      {targets.map((t) =>
        editingId === t.id && editValues ? (
          <form key={t.id} onSubmit={handleSaveEdit} style={{ marginBottom: "1rem" }}>
            <TargetFields values={editValues} onChange={setEditValues} />
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingId(null);
                  setEditValues(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="watch-target-row" key={t.id}>
            <div>
              <div className="watch-target-url">{t.url}</div>
              <div className="muted">
                {t.fetchStrategy} · {t.keywords.join(", ") || "no keywords"}{" "}
                {!t.isActive && "· inactive"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn" onClick={() => startEdit(t)}>
                Edit
              </button>
              <button className="btn" onClick={() => toggleActive(t)}>
                {t.isActive ? "Deactivate" : "Activate"}
              </button>
              <button className="btn btn-danger" onClick={() => remove(t)}>
                Delete
              </button>
            </div>
          </div>
        )
      )}

      {!showForm && (
        <button className="btn" style={{ marginTop: "0.75rem" }} onClick={() => setShowForm(true)}>
          + Add Watch Target
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginTop: "1rem" }}>
          <TargetFields values={addValues} onChange={setAddValues} />
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
