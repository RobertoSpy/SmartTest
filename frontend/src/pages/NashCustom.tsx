import React, { useEffect, useState } from "react";
import api from "../api";

export default function CustomNash({ question }: { question: any }) {
  const rows = question?.data?.rows || question?.data?.row_labels?.length || 2;
  const cols = question?.data?.cols || question?.data?.col_labels?.length || 2;

  const [matrix, setMatrix] = useState<string[][][]>(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ["", ""])
    )
  );
  const [claimedText, setClaimedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMatrix(Array.from({ length: rows }, () => Array.from({ length: cols }, () => ["", ""])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols]);

  function updateCell(i: number, j: number, which: 0 | 1, value: string) {
    setMatrix((m) => {
      const copy = m.map((r) => r.map((c) => [...c]));
      copy[i][j][which] = value;
      return copy;
    });
  }

  function parseClaimedEquilibria(text: string): Array<[number, number]> | undefined {
    const cleaned = text.trim();
    if (!cleaned) return undefined;
    const tokens = cleaned.split(/[\s;]+/).map((t) => t.trim()).filter(Boolean);
    const out: Array<[number, number]> = [];
    for (const t of tokens) {
      const m = t.match(/^\(?\s*([0-9]+)\s*[, ]\s*([0-9]+)\s*\)?$/);
      if (m) out.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
    }
    return out;
  }

  function buildSubmissionMatrix(): number[][][] {
    const sm: number[][][] = [];
    for (let i = 0; i < rows; i++) {
      const rowVals: number[][] = [];
      for (let j = 0; j < cols; j++) {
        const [rStr, cStr] = matrix[i][j];
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        if (Number.isNaN(r) || Number.isNaN(c)) {
          throw new Error(`Celula ${i + 1},${j + 1} are valori invalide`);
        }
        rowVals.push([r, c]);
      }
      sm.push(rowVals);
    }
    return sm;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    try {
      const submissionMatrix = buildSubmissionMatrix();
      // if task target is NO NASH, we don't need claimed equilibria; parseClaimedEquilibria will return undefined if empty
      const claimed = parseClaimedEquilibria(claimedText);
      setSubmitting(true);
      const res = await api.submitCustomMatrix(question.id, submissionMatrix, claimed, claimedText);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // convenience boolean
  const targetHasPure = question?.data?.target_has_pure;

  return (
    <section>
      <h2>{question.prompt}</h2>
      <div style={{ marginBottom: 12, color: "#666" }}>
        Dimensiune: {rows} x {cols} — Cerință:{" "}
        {targetHasPure === true ? "Să aibă Nash pur" :
         targetHasPure === false ? "Să NU aibă Nash pur" :
         "Poate avea sau nu; explicați"}
      </div>

      <form onSubmit={handleSubmit}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: cols }).map((_, j) => <th key={j}>Col {j + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <th>Row {i + 1}</th>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j}>
                    <input type="number" placeholder="R" value={matrix[i][j][0]} onChange={(e) => updateCell(i,j,0,e.target.value)} style={{width:60}} />
                    <input type="number" placeholder="C" value={matrix[i][j][1]} onChange={(e) => updateCell(i,j,1,e.target.value)} style={{width:60, marginLeft:6}} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* If target is explicitly "no Nash", hide the claimed equilibria input */}
        {targetHasPure === false ? (
          <div style={{ marginTop: 12, color: "#333" }}>
            <em>Acest task cere o matrice fără Nash pur — nu e nevoie să indici echilibria.</em>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <label>Declarați echilibria (opțional), ex: "(1,1) (2,2)"</label>
            <textarea value={claimedText} onChange={(e) => setClaimedText(e.target.value)} rows={2} style={{width:"100%"}} />
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Observație: dacă nu indicați echilibria când sunt așteptate, primiți credit parțial (75%) dacă matricea e corectă.
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={submitting}>{submitting ? "Se trimite..." : "Trimite matricea"}</button>
        </div>
      </form>

      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 12 }}>
          <h3>Rezultat: {result.score_percent}%</h3>
          <div style={{ color: "#333", marginBottom: 8 }}>{result.explanation}</div>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 10 }}>{JSON.stringify(result.result ?? result, null, 2)}</pre>
          {result.missing && result.missing.length > 0 && (
            <div style={{ color: "#c33", marginTop: 8 }}>
              Lipsesc echilibria: {JSON.stringify(result.missing)}
            </div>
          )}
          {result.extra && result.extra.length > 0 && (
            <div style={{ color: "#c33", marginTop: 8 }}>
              Ai indicat echilibria inexistent(e): {JSON.stringify(result.extra)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}