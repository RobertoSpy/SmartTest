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
import { generateSearchQuestions } from "./api";
import CSPPoint3 from "./pages/Csp";
import MinMax from "./pages/MinMax";
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <GlassCard header={<h3 style={{ margin: 0, color: 'var(--text-accent)' }}>Search Problems Generator</h3>}>
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