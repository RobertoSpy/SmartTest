import React, { useEffect, useState } from "react";
import { getQuestion, submitAnswer } from "../api";
import CustomNash from "./NashCustom";

/**
 * QuestionView rămâne similar dar acum folosește navigation pentru back
 * (în App.tsx am trimis onBack ca navigate(-1))
 */
type PayoffCell = [number, number];

type Question = {
  id: string;
  prompt: string;
  type?: string;
  data?: {
    matrix_lines?: string[];
    payoff_matrix?: PayoffCell[][];
    row_labels?: string[];
    col_labels?: string[];
    rows?: number;
    cols?: number;
    target_has_pure?: boolean | null;
  };
  created_at?: string;
};

export default function QuestionView({ id, onBack }: { id: string; onBack: () => void }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasEquilibrium, setHasEquilibrium] = useState<"da" | "nu" | "">("");
  const [profilesText, setProfilesText] = useState<string>("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = await getQuestion(id);
        setQuestion(q);
        setHasEquilibrium("");
        setProfilesText("");
        setSelectedProfiles([]);
        setResult(null);
      } catch (err: any) {
        console.error(err);
        alert("Eroare la încărcare: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!question) return <div>Question not found</div>;

  // If this is a student-input custom task, render CustomNash component and exit.
  // CustomNash will handle building the matrix and submitting JSON to the backend.
  if (question.type === "normal_form_game_custom_student_input") {
    return <CustomNash question={question} />;
  }

  // --- existing view for standard questions (with payoff_matrix provided) ---
  const payoff = question.data?.payoff_matrix;
  const matrixLines = question.data?.matrix_lines;
  const rowLabels = question.data?.row_labels ?? [];
  const colLabels = question.data?.col_labels ?? [];

  function toggleCell(i: number, j: number) {
    const key = `(${i + 1},${j + 1})`;
    setSelectedProfiles(prev => {
      if (prev.includes(key)) return prev.filter(x => x !== key);
      return [...prev, key];
    });
  }

  function renderTableFromPayoff() {
    if (!payoff) return null;
    return (
      <div className="payoff-wrap">
        <table className="payoff-table" aria-label="payoff table">
          <thead>
            <tr>
              <th></th>
              {colLabels.map((c, j) => (
                <th key={j}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payoff.map((row, i) => (
              <tr key={i}>
                <td className="strategy-label">{rowLabels[i] ?? `R${i + 1}`}</td>
                {row.map((cell, j) => {
                  const key = `(${i + 1},${j + 1})`;
                  const selected = selectedProfiles.includes(key);
                  return (
                    <td
                      key={j}
                      className={`cell ${selected ? "selected" : ""}`}
                      onClick={() => toggleCell(i, j)}
                      title={`Click pentru a marca ca profil: ${key}`}
                    >
                      <div className="payoff">({cell[0]}, {cell[1]})</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{key}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let submission = "";
    if (hasEquilibrium === "da") submission = "Da";
    else if (hasEquilibrium === "nu") submission = "Nu";

    const profiles = selectedProfiles.length ? selectedProfiles.join(" ") : profilesText.trim();
    if (profiles) submission += " " + profiles;

    try {
      setLoading(true);
      const res = await submitAnswer(question!.id, submission, pdfFile || undefined);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert("Eroare la trimitere: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setPdfFile(f);
  }

  return (
    <div className="card" style={{ maxWidth: 1000, margin: "0 auto", padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{question.prompt}</h3>
        <div>
          <button className="btn" onClick={onBack} style={{ marginRight: 8 }}>Înapoi</button>
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>Reîncarcă</button>
        </div>
      </div>

      <div>
        {payoff ? renderTableFromPayoff() : matrixLines && <pre style={{ background: "#fafafa", padding: 8, borderRadius: 4 }}>{matrixLines.join("\n")}</pre>}

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ marginRight: 12 }}>
                <input type="radio" name="has" value="da" checked={hasEquilibrium === "da"} onChange={() => setHasEquilibrium("da")} />
                {" "}Da
              </label>
              <label>
                <input type="radio" name="has" value="nu" checked={hasEquilibrium === "nu"} onChange={() => setHasEquilibrium("nu")} />
                {" "}Nu
              </label>
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ display: "block", marginBottom: 6, color: "#333", fontSize: 14 }}>
                Profile (poți click pe celule pentru a le selecta; sau scrie manual):
              </label>
              <input
                type="text"
                value={profilesText}
                onChange={(e) => setProfilesText(e.target.value)}
                placeholder="(1,2) (2,1) sau 1,2;2,1"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #ccc" }}
              />
              <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                Selected: {selectedProfiles.join(", ") || "(none)"}
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 13, color: "#555" }}>Upload PDF (opțional):</label>
                <input type="file" accept="application/pdf" onChange={handlePdfChange} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary">Trimite</button>
            </div>
          </div>
        </form>

        {result && (
          <div className="result-box">
            <div className="score">Scor: {result.result?.score_percent ?? result.score_percent ?? "—"}%</div>
            <div><strong>Feedback:</strong> {result.result?.note ?? result.note ?? ""}</div>
            <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify(result.result ?? result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}