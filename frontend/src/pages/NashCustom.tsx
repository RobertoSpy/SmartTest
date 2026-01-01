import React, { useEffect, useState } from "react";
import api from "../api";
import NeonButton from "../components/ui/NeonButton";
import GlassCard from "../components/ui/GlassCard";

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
          throw new Error(`Cell ${i + 1},${j + 1} has invalid values`);
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
      const claimed = parseClaimedEquilibria(claimedText);
      setSubmitting(true);
      const res = await api.submitCustomMatrix(question.id, submissionMatrix, claimed, claimedText);
      setResult(res.result);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const targetHasPure = question?.data?.target_has_pure;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <h2 className="text-gradient" style={{ marginTop: 0 }}>{question.prompt}</h2>
      <div style={{ marginBottom: 20, color: "var(--text-secondary)", fontSize: '0.9rem' }}>
        Dimensions: {rows} x {cols} — Requirement:{" "}
        <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>
          {targetHasPure === true ? "Must have Pure Nash" :
            targetHasPure === false ? "Must NOT have Pure Nash" :
              "Can have or not (explain)"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ borderCollapse: "separate", borderSpacing: "8px" }}>
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: cols }).map((_, j) => (
                  <th key={j} style={{ color: 'var(--text-secondary)', fontWeight: 500, paddingBottom: 8 }}>Col {j + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  <th style={{ color: 'var(--text-secondary)', fontWeight: 500, paddingRight: 12 }}>Row {i + 1}</th>
                  {Array.from({ length: cols }).map((_, j) => (
                    <td key={j}>
                      <div style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '6px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <input
                          type="number"
                          placeholder="R"
                          value={matrix[i][j][0]}
                          onChange={(e) => updateCell(i, j, 0, e.target.value)}
                          style={{
                            width: 50,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--neon-red)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                          }}
                        />
                        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
                        <input
                          type="number"
                          placeholder="C"
                          value={matrix[i][j][1]}
                          onChange={(e) => updateCell(i, j, 1, e.target.value)}
                          style={{
                            width: 50,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--neon-blue)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {targetHasPure === false ? (
          <div style={{ marginTop: 12, color: "var(--text-secondary)", fontStyle: 'italic' }}>
            Target is NO Pure Nash — no need to declare equilibria.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Declare Equilibria (Optional), e.g., "(1,1) (2,2)"</label>
            <textarea
              value={claimedText}
              onChange={(e) => setClaimedText(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <div style={{ fontSize: '0.8rem', color: "#666", marginTop: 6 }}>
              Note: Unclaimed equilibria (when expected) result in partial credit (75%).
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <NeonButton type="submit" disabled={submitting} glow>
            {submitting ? "Sending..." : "Submit Matrix"}
          </NeonButton>
        </div>
      </form>

      {error && <GlassCard style={{ marginTop: 20, borderColor: 'var(--neon-red)', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</GlassCard>}

      {result && (
        <GlassCard
          style={{
            marginTop: 24,
            borderColor: result.correct ? 'var(--neon-green)' : 'var(--neon-red)',
            background: result.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, marginRight: 12, color: '#fff' }}>Result: <span className={result.correct ? 'text-green-400' : 'text-red-400'}>{result.score_percent}%</span></h3>
            {result.correct ?
              <span style={{ color: "var(--neon-green)", fontWeight: "bold" }}>Correct!</span> :
              <span style={{ color: "var(--neon-red)", fontWeight: "bold" }}>Incomplete or Incorrect</span>
            }
          </div>

          <div style={{ fontSize: '1rem', marginBottom: 16 }}>
            <strong>Note:</strong> {result.explanation}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "12px 0" }} />

          {result.result?.justification && (
            <div style={{ marginBottom: 16 }}>
              <strong style={{ display: "block", marginBottom: 4, color: 'var(--neon-cyan)' }}>Analysis:</strong>
              {result.result.justification.split("\n").map((line: string, idx: number) => (
                <div key={idx} style={{ marginBottom: 2, color: 'var(--text-secondary)' }}>{line}</div>
              ))}
            </div>
          )}

          {result.result?.equilibria && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--neon-cyan)' }}>System Calculated Equilibria: </strong>
              {result.result.equilibria.length > 0 ? (
                <span className="text-white font-mono">
                  {result.result.equilibria.map((e: any) => `(${e[0]},${e[1]})`).join(", ")}
                </span>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>None</span>
              )}
            </div>
          )}

          {result.missing && result.missing.length > 0 && (
            <div style={{ color: "var(--neon-red)", marginTop: 8, fontWeight: 500 }}>
              ⚠ Missed: {result.missing.map((e: any) => `(${e[0]},${e[1]})`).join(", ")}
            </div>
          )}
          {result.extra && result.extra.length > 0 && (
            <div style={{ color: "var(--neon-red)", marginTop: 8, fontWeight: 500 }}>
              ⚠ Incorrectly Claimed: {result.extra.map((e: any) => `(${e[0]},${e[1]})`).join(", ")}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}