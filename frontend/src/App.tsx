import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";

// Pages
import NashPage from "./pages/NashPage";
import NashCustom from "./pages/NashCustom";
import GenerateAll from "./pages/GenerateAll";
import QuestionsList from "./pages/QuestionsList";
import QuestionView from "./pages/QuestionView";
import { generateSearchQuestions, createCustomSearchQuestion } from "./api";
import CSPPoint3 from "./pages/Csp";
import MinMax from "./pages/MinMax";
import NashGenerated from "./pages/NashGenerated";
import GameTheoryGenerated from "./pages/GameTheoryGenerated";
import GlassCard from "./components/ui/GlassCard";
import NeonButton from "./components/ui/NeonButton";

// Inline Search Page Wrapper
const SearchPage = () => {
  const [count, setCount] = React.useState(1);
  const [generating, setGenerating] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  async function handleGenerateSearch() {
    try {
      setGenerating(true);
      await generateSearchQuestions(count);
      setRefreshKey(k => k + 1);
      alert(`${count} questions generated.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const [mode, setMode] = React.useState<"random" | "custom">("random");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [solutionResult, setSolutionResult] = React.useState<any>(null);

  async function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault();
    setSolutionResult(null);
    try {
      setGenerating(true);
      const resp = await createCustomSearchQuestion({
        prompt: customPrompt
      });
      setRefreshKey(k => k + 1);

      if (resp.solution) {
        setSolutionResult(resp.solution);
      } else {
        alert("Custom search question created! Check History.");
        setCustomPrompt("");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <GlassCard header={<h3 style={{ margin: 0, color: 'var(--text-accent)' }}>Search Problems Generator</h3>}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <NeonButton
            onClick={() => { setMode("random"); setSolutionResult(null); }}
            variant={mode === "random" ? "primary" : "ghost"}
            style={{ fontSize: "0.85rem", padding: "6px 16px" }}
          >
            Random (AI)
          </NeonButton>
          <NeonButton
            onClick={() => { setMode("custom"); setSolutionResult(null); }}
            variant={mode === "custom" ? "primary" : "ghost"}
            style={{ fontSize: "0.85rem", padding: "6px 16px" }}
          >
            Solver (Custom)
          </NeonButton>
        </div>

        {mode === "random" ? (
          <>
            <p style={{ color: 'var(--text-secondary)' }}>Identify the correct strategy for search problems (N-Queens, Graph Coloring, etc).</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
              <label>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Count</div>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={e => setCount(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: 80,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: 'white'
                  }}
                />
              </label>
              <NeonButton onClick={handleGenerateSearch} disabled={generating} glow variant="primary">
                {generating ? "Generating..." : "Generate Search Questions"}
              </NeonButton>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <form onSubmit={handleCreateCustom} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Problem Description (Prompt)</span>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Paste the text of a search problem here (e.g. 'Solve N-Queens...'). The system will auto-detect the strategy."
                  rows={4}
                  required
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '12px',
                    fontFamily: 'inherit'
                  }}
                />
              </label>

              <NeonButton type="submit" disabled={generating} glow variant="primary" style={{ alignSelf: "flex-start" }}>
                {generating ? "Solving..." : "Solve Problem"}
              </NeonButton>
            </form>

            {solutionResult && (
              <div style={{
                marginTop: 10,
                padding: 16,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid var(--neon-green)',
                borderRadius: 12
              }}>
                <div style={{ color: 'var(--neon-green)', fontWeight: 'bold', marginBottom: 8 }}>
                  Solution Identified
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strategy: </span>
                  <span style={{ fontWeight: 600, color: 'white' }}>{solutionResult.correct_strategy}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Heuristic: </span>
                  <span style={{ fontWeight: 600, color: 'white' }}>{solutionResult.correct_heuristic}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {solutionResult.explanation}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard header={<h3>Search History</h3>}>
        <QuestionsList filterType="all_context" contextMode="search" refreshKey={refreshKey} />
      </GlassCard>
    </div>
  );
};

/* Router wrapper for QuestionView */
function QuestionViewWithRouter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <div>Invalid question id</div>;
  return <QuestionView id={id} onBack={() => navigate(-1)} />;
}

/* Custom Nash Wrapper */
function CustomGameWrapper() {
  const nav = useNavigate();
  // Mock a question object for the CustomNash component or use it differently?
  // NashCustom expects a { question } prop.
  // Actually, NashCustom is a "Question View" component for a SPECIFIC question type.
  // We need a "Creator" page if we want to START a custom game.
  // Looking at the code, `NashPage` handles generators. `NashCustom` handles the VIEW of a custom task.
  // If the user wants to CREATE a custom matrix task, they use the Generator which creates a "Task" question.
  // So "Custom Games" route might be redundant if GenerateAll handles it.
  // However, I'll put a placeholder or the generator there.
  return (
    <GlassCard header={<h2 className="text-gradient">Custom Games</h2>}>
      <div style={{ color: 'var(--text-secondary)' }}>
        To play a custom game, use the <strong>Batch Gen</strong> or <strong>Nash Equilibrium</strong> generator to create a "Student Input" task.
        <br /><br />
        Then find it in the <strong>History</strong>.
      </div>
    </GlassCard>
  );
}

// Global History Page
function GlobalHistory() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  return (
    <GlassCard header={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 className="text-gradient" style={{ margin: 0 }}>Global History</h2>
      <NeonButton onClick={() => setRefreshKey(k => k + 1)} variant="ghost" style={{ fontSize: '0.8rem' }}>Refresh</NeonButton>
    </div>}>
      <QuestionsList refreshKey={refreshKey} contextMode="global" />
    </GlassCard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/nash" replace />} />

          {/* Modules */}
          <Route path="/nash" element={<NashPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/minmax" element={<MinMax />} />
          <Route path="/nash-generated" element={<NashGenerated />} />
          <Route path="/game-theory-generated" element={<GameTheoryGenerated />} />
          <Route path="/csp" element={<CSPPoint3 />} />

          {/* Tools / Archives */}
          <Route path="/custom-nash" element={<CustomGameWrapper />} />
          <Route path="/generate-all" element={<GenerateAll onGenerated={() => { }} />} />
          <Route path="/history" element={<GlobalHistory />} />

          {/* Details View */}
          <Route path="/question/:id" element={<QuestionViewWithRouter />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/nash" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}