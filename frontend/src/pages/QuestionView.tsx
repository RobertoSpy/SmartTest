import React, { useEffect, useState } from "react";
import { getQuestion, submitAnswer, submitGameTheoryAnswer } from "../api";
import CustomNash from "./NashCustom";
import SearchQuestion from "../components/SearchQuestion";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import { ArrowLeft, RefreshCw, Upload } from "lucide-react";

type PayoffCell = [number, number];

type Question = {
  id: string;
  prompt: string;
  type?: string;
  data?: {
    matrix?: PayoffCell[][]; // fallback for legacy custom saves
    matrix_lines?: string[];
    payoff_matrix?: PayoffCell[][];
    row_labels?: string[];
    col_labels?: string[];
    rows?: number;
    cols?: number;
    target_has_pure?: boolean | null;
    metadata?: any;
    is_solver?: boolean;
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

        // If it's a solved custom question, show the result immediately
        if (q.data?.solution && q.data?.explanation) {
          setResult({
            result: {
              feedback: "Analysis from Solver",
              score_percent: 100, // It's a solver result, so it's "correct"
              explanation: q.data.explanation,
              // We can also show the solution text somewhere? 
              // The explanation usually contains the solution in our generator. 
              // But let's append solution to explanation if needed or just rely on explanation.
              // In custom_gametheory, explanation usually starts with "Yes/No" or "Strategy is...".
            }
          });
        } else {
          setResult(null);
        }
      } catch (err: any) {
        alert("Error loading question: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--neon-orange)' }}>
      Loading...
    </div>
  );

  if (!question) return <div style={{ padding: 40, color: 'var(--neon-orange)' }}>Question not found</div>;

  // Delegates
  if (question.type === "normal_form_game_custom_student_input") {
    return (
      <GlassCard>
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <NeonButton onClick={onBack} variant="primary">
              <ArrowLeft size={16} /> Back
            </NeonButton>
          </div>
        </div>
        <CustomNash question={question} />
      </GlassCard>
    );
  }

  if (question.type === "search_problem_identification" || question.type === "search_problem_identification_custom") {
    return (
      <GlassCard>
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <NeonButton onClick={onBack} variant="primary">
              <ArrowLeft size={16} /> Back
            </NeonButton>
          </div>
        </div>
        <SearchQuestion question={question} onUpdate={() => setQuestion({ ...question })} />
      </GlassCard>
    );
  }

  // --- Standard View ---
  const payoff = question.data?.payoff_matrix || question.data?.matrix;
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
    const isGameTheory = question.type?.startsWith("game_theory");
    return (
      <div style={{ overflowX: 'auto', margin: '20px 0', background: '#f8fafc', padding: 20, borderRadius: 12 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "12px", margin: "0 auto" }}>
          <thead>
            {/* Column Player Name Label */}
            {question.data?.metadata?.player_col_name && (
              <tr>
                <th></th>
                <th colSpan={colLabels.length} style={{ textAlign: 'center', paddingBottom: 10, color: '#334155', fontWeight: 'bold' }}>
                  {question.data.metadata.player_col_name} (Cols)
                </th>
              </tr>
            )}
            <tr>
              {/* Row Player Name Label (Side) logic is tricky in simple table, maybe just prepend a header cell? 
                  Or just put it in the corner? 
                  Let's put Row Name in the top-left empty cell if exists, or separate column? 
              */}
              <th style={{ textAlign: 'right', paddingRight: 10, color: '#334155', fontWeight: 'bold' }}>
                {question.data?.metadata?.player_row_name ? `${question.data.metadata.player_row_name} (Rows)` : ""}
              </th>
              {colLabels.map((c, j) => (
                <th key={j} style={{ color: '#64748b', fontWeight: 600, paddingBottom: 8 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payoff.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#64748b', fontWeight: 600, paddingRight: 10, textAlign: 'right', minWidth: '80px' }}>
                  {rowLabels[i] ?? `R${i + 1}`}
                </td>
                {row.map((cell, j) => {
                  const key = `(${i + 1},${j + 1})`;
                  const selected = selectedProfiles.includes(key);
                  return (
                    <td
                      key={j}
                      onClick={() => !isGameTheory && toggleCell(i, j)}
                      style={{
                        background: selected ? '#fff7ed' : '#ffffff',
                        border: selected ? '2px solid #ea580c' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 24px',
                        cursor: isGameTheory ? 'default' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        minWidth: '90px',
                        boxShadow: selected ? '0 4px 12px rgba(234, 88, 12, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#334155', fontSize: '1.2rem', display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <span style={{ color: '#ea580c' }}>{cell[0]}</span>, <span style={{ color: '#475569' }}>{cell[1]}</span>
                      </div>
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
      let res;
      if (question!.type?.startsWith("game_theory")) {
        // Game Theory submission (text only, no PDF support yet)
        // Trim standard " " if it was prepended
        res = await submitGameTheoryAnswer(question!.id, submission.trim());
      } else {
        // Standard Nash/Generic submission
        res = await submitAnswer(question!.id, submission, pdfFile || undefined);
      }
      setResult(res);
    } catch (err: any) {
      alert("Error submitting: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setPdfFile(f);
  }

  return (
    <GlassCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <NeonButton onClick={onBack} variant="primary">
          <ArrowLeft size={16} /> Back
        </NeonButton>
        <NeonButton onClick={() => window.location.reload()} variant="ghost" style={{ color: '#333' }}>
          <RefreshCw size={16} /> Reload
        </NeonButton>
      </div>

      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ea580c', marginBottom: 20 }}>
        {question.prompt}
      </h3>

      {payoff ? renderTableFromPayoff() : matrixLines && <pre style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, color: "#334155", fontStyle: 'italic' }}>{matrixLines.join("\n")}</pre>}

      {/* Hide submission form if it's a pre-solved Custom Solver question */}
      {!question.data?.is_solver && (
        <form onSubmit={handleSubmit} style={{ marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: 'column', gap: 20 }}>

            {(!question.type?.startsWith("game_theory")) && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Pure Equilibrium?</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#333' }}>
                  <input type="radio" name="has" value="da" checked={hasEquilibrium === "da"} onChange={() => setHasEquilibrium("da")} style={{ accentColor: '#ea580c', width: 16, height: 16 }} />
                  <span>Yes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#333' }}>
                  <input type="radio" name="has" value="nu" checked={hasEquilibrium === "nu"} onChange={() => setHasEquilibrium("nu")} style={{ accentColor: '#ea580c', width: 16, height: 16 }} />
                  <span>No</span>
                </label>
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: 8, color: "#64748b", fontSize: "0.9rem" }}>
                {question.type?.startsWith("game_theory") ? "Your Answer:" : "Identified Profiles (Click cells or type):"}
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={profilesText}
                  onChange={(e) => setProfilesText(e.target.value)}
                  placeholder={question.type?.startsWith("game_theory") ? "e.g. Confess, R1..." : hasEquilibrium === "nu" ? "Disabled (You selected No)" : "(1,2) (2,1)..."}
                  disabled={hasEquilibrium === "nu"}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: hasEquilibrium === "nu" ? "#f1f5f9" : "#fff",
                    cursor: hasEquilibrium === "nu" ? "not-allowed" : "text",
                    color: "#000"
                  }}
                />
                <NeonButton type="submit" disabled={loading} glow variant="primary">Submit</NeonButton>
              </div>
              <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#ea580c" }}>
                {!question.type?.startsWith("game_theory") && `Selected: ${selectedProfiles.join(", ") || "—"}`}
              </div>
            </div>

            {(!question.type?.startsWith("game_theory")) && (
              <div>
                {/* PDF Upload Removed */}
              </div>
            )}

          </div>
        </form>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            border: result.result?.score_percent === 100 ? '1px solid #22c55e' : '1px solid #ef4444',
            background: result.result?.score_percent === 100 ? '#f0fdf4' : '#fef2f2'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: result.result?.score_percent === 100 ? '#15803d' : '#b91c1c' }}>
              Score: {result.result?.score_percent ?? result.score_percent ?? "—"}%
            </div>
            <div>
              <strong style={{ color: '#475569' }}>Feedback:</strong>
              <span style={{ color: '#333', marginLeft: 4 }}>
                {result.result?.feedback ?? result.feedback ?? result.result?.note ?? result.note ?? ""}
              </span>
            </div>
          </div>

          {(result.result?.explanation || result.explanation) && (
            <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 6, color: '#ea580c' }}>Explanation:</strong>
              <div style={{ whiteSpace: 'pre-wrap', color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {result.result?.explanation ?? result.explanation}
              </div>
            </div>
          )}

          {(!question.type?.startsWith("game_theory")) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Correct Equilibria (Reference) */}
              <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Correct Equilibria:</span>
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(result.result?.correct_equilibria || result.correct_equilibria || []).length > 0 ? (
                    (result.result?.correct_equilibria || result.correct_equilibria).map((eq: any, i: number) => (
                      <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {JSON.stringify(eq).replace('[', '(').replace(']', ')')}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                  )}
                </div>
              </div>

              {/* Analysis Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.85rem' }}>Matched (Correct):</span>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(result.result?.matched_equilibria || result.matched_equilibria || []).length > 0 ? (
                      (result.result?.matched_equilibria || result.matched_equilibria).map((eq: any, i: number) => (
                        <span key={i} style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {JSON.stringify(eq).replace('[', '(').replace(']', ')')}
                        </span>
                      ))
                    ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.85rem' }}>Extra (Wrong):</span>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(result.result?.extra_equilibria || result.extra_equilibria || []).length > 0 ? (
                      (result.result?.extra_equilibria || result.extra_equilibria).map((eq: any, i: number) => (
                        <span key={i} style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {JSON.stringify(eq).replace('[', '(').replace(']', ')')}
                        </span>
                      ))
                    ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </GlassCard>
  );
}