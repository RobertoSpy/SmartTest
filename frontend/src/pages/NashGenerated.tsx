import React from "react";
import { generateQuestions } from "../api";

export default function NashGenerated({ onGenerated }: { onGenerated?: () => void }) {
  const [count, setCount] = React.useState<number>(10);
  const [mode, setMode] = React.useState<"force" | "percent">("force");
  const [fractionNoNE, setFractionNoNE] = React.useState<number>(50); // procent FĂRĂ NE
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "force") {
        // forțăm jocuri care au cel puțin un Nash pur
        await generateQuestions(count, { ensure: "at_least_one" });
        alert(`${count} întrebări (Nash pur) generate cu succes!`);
      } else {
        // folosim procentul de jocuri FĂRĂ NE (target_fraction_no_ne)
        await generateQuestions(count, { targetFractionNoNe: fractionNoNE / 100.0 });
        alert(`${count} întrebări generate cu mix (aprox ${fractionNoNE}% fără NE)`);
      }
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error(err);
      alert(`Eroare la generare: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Generează - Nash pur (generat)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            <span>Număr:</span>
            <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} style={{ width: 100 }} />
          </label>

          <label>
            <span>Mod:</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ width: 220 }}>
              <option value="force">Forțează Nash pur (toate)</option>
              <option value="percent">Folosește procent Fără NE</option>
            </select>
          </label>

          {mode === "percent" && (
            <label>
              <span>Procent Fără NE (%):</span>
              <input
                type="number"
                min={0}
                max={100}
                value={fractionNoNE}
                onChange={(e) => setFractionNoNE(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                style={{ width: 80 }}
              />
            </label>
          )}

          <div style={{ marginLeft: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Se generează..." : mode === "force" ? "Generează Nash pur" : "Generează (folosește procent)"}
            </button>
          </div>
        </div>
      </form>

      <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
        {mode === "force"
          ? "Acest generator produce jocuri care au cel puțin un echilibru Nash pur."
          : "Acest generator va folosi procentul specificat pentru a controla câte jocuri să nu aibă Nash pur (ex: 50% fără NE)."}
      </p>
    </section>
  );
}