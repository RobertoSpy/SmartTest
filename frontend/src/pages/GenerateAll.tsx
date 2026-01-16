import React from "react";
import { generateQuestions, generateStudentInputQuestions, generateSearchQuestions, generateMinMaxQuestion, generateCSPProblem } from "../api";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import { Shuffle } from "lucide-react";

export default function GenerateAll({ onGenerated }: { onGenerated?: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);



  async function handleGenerateTest(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setLog([]);
    try {
      // 1. Nash Category -> Random Subcategory
      const nashSub = Math.random() < 0.5 ? "Nash Equilibrium (Simple)" : "Student Task (Custom)";
      const nashPromise = nashSub.includes("Task")
        ? generateStudentInputQuestions(1, { save_as: "normal_form_game_custom_student_input" })
        : generateQuestions(1);

      // 2. Search Category
      const searchPromise = generateSearchQuestions(1);

      // 3. MinMax Category (Real Backend Generation)
      const minmaxPromise = generateMinMaxQuestion("medium");

      // 4. CSP Category (Real Backend Generation)
      const cspPromise = generateCSPProblem();

      await Promise.all([nashPromise, searchPromise, minmaxPromise, cspPromise]);

      setLog(prev => [
        ...prev,
        `Generated: Nash (${nashSub})`,
        `Generated: Search Problem`,
        `Generated: MinMax Tree (Backend)`,
        `Generated: CSP Problem (Backend)`
      ]);

      alert(`Test Generated Successfully!\n\nAll 4 Categories are now available in your History.`);
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error("Test Generation error:", err);
      alert("Error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard
      header={<h2 style={{ margin: 0, fontSize: '1.8rem', fontFamily: "monospace", color: '#ea580c' }}>TEST GENERATOR</h2>}
      style={{ maxWidth: 650, margin: '0 auto', textAlign: 'center' }}
    >
      <div style={{ marginBottom: 30, color: "#fff", lineHeight: '1.6', fontSize: '0.95rem' }}>
        <strong>Baterie de Test (4 Întrebări)</strong>
        <br />
        Generează câte o problemă din fiecare categorie.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, textAlign: 'left' }}>
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid #444' }}>
          <div style={{ fontWeight: 'bold', color: '#ea580c' }}>1. Nash Category</div>
          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Random: Equilibrium or Task</div>
        </div>
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid #444' }}>
          <div style={{ fontWeight: 'bold', color: '#ea580c' }}>2. Search Category</div>
          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Identification Problem</div>
        </div>
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid #444' }}>
          <div style={{ fontWeight: 'bold', color: '#ea580c' }}>3. MinMax Category</div>
          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Alpha-Beta Tree</div>
        </div>
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid #444' }}>
          <div style={{ fontWeight: 'bold', color: '#ea580c' }}>4. CSP Category</div>
          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Constraint Logic</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <NeonButton
          onClick={handleGenerateTest}
          disabled={loading}
          variant="primary"
          style={{
            padding: '16px 48px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            background: '#ea580c',
            color: 'white',
            fontWeight: 'bold',
            letterSpacing: '1px',
            border: 'none'
          }}
        >
          {loading ? "GENERATING..." : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}> <Shuffle size={20} /> GENERATE RANDOM TEST</div>}
        </NeonButton>
      </div>

      {log.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid #444' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ea580c', marginBottom: 4 }}>Status:</div>
          {log.map((l, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#fff' }}>✓ {l}</div>)}
        </div>
      )}

    </GlassCard>
  );
}