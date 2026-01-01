import React, { useState } from "react";
import { generateQuestions, generateStudentInputQuestions } from "../api";
import NeonButton from "../components/ui/NeonButton";
import GlassCard from "../components/ui/GlassCard";

export default function NashGenerated({ onGenerated }: { onGenerated?: () => void }) {
  const [uiMode, setUiMode] = useState<"random" | "custom">("random");

  // Random Mode State
  const [count, setCount] = useState<number>(10);
  const [forceMode, setForceMode] = useState<"force" | "percent">("force");
  const [fractionNoNE, setFractionNoNE] = useState<number>(50);

  // Custom Mode State
  const [taskCount, setTaskCount] = useState<number>(1);

  const [loading, setLoading] = useState(false);

  async function handleRandomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (forceMode === "force") {
        await generateQuestions(count, { ensure: "at_least_one" });
      } else {
        await generateQuestions(count, { targetFractionNoNe: fractionNoNE / 100.0 });
      }
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
      await generateStudentInputQuestions(taskCount, { save_as: "normal_form_game_custom_student_input" });
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
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Logica</span>
                <select
                  value={forceMode}
                  onChange={(e) => setForceMode(e.target.value as any)}
                  style={{ width: '200px' }}
                >
                  <option value="force">Force Pure Nash (All)</option>
                  <option value="percent">Mixed (No-Nash %)</option>
                </select>
              </label>

              {forceMode === "percent" && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No NE %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={fractionNoNE}
                    onChange={(e) => setFractionNoNE(Number(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </label>
              )}

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
              {forceMode === "force"
                ? "Guarantees at least one Pure Nash Equilibrium per game."
                : "Allows games with NO equilibrium based on percentage."}
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
                  value={taskCount}
                  onChange={(e) => setTaskCount(Number(e.target.value) || 1)}
                  style={{ width: '100px' }}
                />
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
                {loading ? "Creating..." : "Create Student Tasks"}
              </NeonButton>
            </div>
            <div style={{ marginTop: '16px', color: "var(--text-secondary)", fontSize: '0.85rem', opacity: 0.8 }}>
              Creates tasks where the student must fill in the payoff values ("Student Input" mode).
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}