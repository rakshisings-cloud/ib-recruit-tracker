"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const TYPE_OPTIONS = [
  { value: "bulge_bracket", label: "Bulge Bracket" },
  { value: "elite_boutique", label: "Elite Boutique" },
  { value: "private_equity", label: "Private Equity" },
  { value: "middle_market", label: "Middle Market" },
];

export type FirmFormValues = {
  id?: string;
  name: string;
  ticker: string;
  institutionType: string;
  targetLocation: string;
  historicalOpenDate: string;
  notes: string;
};

export default function FirmForm({ initial }: { initial?: FirmFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<FirmFormValues>(
    initial ?? {
      name: "",
      ticker: "",
      institutionType: "bulge_bracket",
      targetLocation: "",
      historicalOpenDate: "",
      notes: "",
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FirmFormValues>(key: K, value: FirmFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: values.name,
      ticker: values.ticker || null,
      institutionType: values.institutionType,
      targetLocation: values.targetLocation || null,
      historicalOpenDate: values.historicalOpenDate || null,
      notes: values.notes || null,
    };

    try {
      const res = await fetch(initial?.id ? `/api/firms/${initial.id}` : "/api/firms", {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error?.formErrors?.join(", ") ?? "Save failed");
      const saved = await res.json();
      router.push(`/firms/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="form-grid">
        <div className="form-row">
          <label>Institution Name</label>
          <input required value={values.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Ticker</label>
          <input value={values.ticker} onChange={(e) => set("ticker", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Institution Type</label>
          <select
            value={values.institutionType}
            onChange={(e) => set("institutionType", e.target.value)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Target Location</label>
          <input
            value={values.targetLocation}
            onChange={(e) => set("targetLocation", e.target.value)}
            placeholder="City, State"
          />
        </div>
        <div className="form-row">
          <label>Historical Open Date (last cycle)</label>
          <input
            type="date"
            value={values.historicalOpenDate}
            onChange={(e) => set("historicalOpenDate", e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Notes</label>
        <textarea rows={3} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : initial?.id ? "Save Changes" : "Create Firm"}
      </button>
    </form>
  );
}
