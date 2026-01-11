import React, { useState } from "react";
import { generateQuestions, generateStudentInputQuestions } from "../api";
import NeonButton from "../components/ui/NeonButton";
import GlassCard from "../components/ui/GlassCard";

export default function NashGenerated({ onGenerated }: { onGenerated?: () => void }) {
  const [uiMode, setUiMode] = useState<"random" | "custom">("random");

  // Shared State
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("medium");

  const [loading, setLoading] = useState(false);

  async function handleRandomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // We now just send count and difficulty
      await generateQuestions(count, { difficulty });
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await generateStudentInputQuestions(count, {
        save_as: "normal_form_game_custom_student_input",
        difficulty
      });
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h2 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>Nash Generator</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Generate random Payoff Matrices or create Student Tasks.
        </p>
      </header>

      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setUiMode("random")}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: uiMode === "random" ? 'var(--bg-card)' : 'transparent',
                color: uiMode === "random" ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: uiMode === "random" ? 600 : 400
              }}
            >
              Random (Equilibria)
            </button>
            <button
              onClick={() => setUiMode("custom")}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: uiMode === "custom" ? 'var(--bg-card)' : 'transparent',
                color: uiMode === "custom" ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: uiMode === "custom" ? 600 : 400
              }}
            >
              Student Task (Custom)
            </button>
          </div>
        </div>

        {/* RANDOM MODE UI */}
        {uiMode === "random" && (
          <form onSubmit={handleRandomSubmit}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Count</span>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                  style={{ width: '80px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: '140px' }}
                >
                  <option value="easy">Easy (Small)</option>
                  <option value="medium">Medium (Avg)</option>
                  <option value="hard">Hard (Large)</option>
                </select>
              </label>

              <NeonButton
                type="submit"
                disabled={loading}
                glow
                style={{
                  background: '#ea580c',
                  border: 'none',
                  color: 'white'
                }}
              >
                {loading ? "Generating..." : "Generate Batch"}
              </NeonButton>
            </div>
            <p style={{ marginTop: '16px', color: "var(--text-secondary)", fontSize: '0.85rem', opacity: 0.8 }}>
              {difficulty === "easy" && "Small matrices, guaranteed Nash Equilibrium."}
              {difficulty === "medium" && "Medium matrices, guaranteed Nash Equilibrium."}
              {difficulty === "hard" && "Large matrices (up to 5x5), mixed difficulty (may have zero NE)."}
            </p>
          </form>
        )}

        {/* CUSTOM MODE UI */}
        {uiMode === "custom" && (
          <form onSubmit={handleCustomSubmit}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Task Count</span>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                  style={{ width: '100px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: '140px' }}
                >
                  <option value="easy">Easy (Small)</option>
                  <option value="medium">Medium (Avg)</option>
                  <option value="hard">Hard (Large)</option>
                </select>
              </label>

              <NeonButton
                type="submit"
                disabled={loading}
                glow
                style={{
                  background: '#ea580c',
                  border: 'none',
                  color: 'white'
                }}
              >
                {loading ? "Creating..." : "Create Tasks"}
              </NeonButton>
            </div>
            <div style={{ marginTop: '16px', color: "var(--text-secondary)", fontSize: '0.85rem', opacity: 0.8 }}>
              Creates tasks where the student must fill in coordinates for the given difficulty.
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}