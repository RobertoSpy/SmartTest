import React from "react";
import { generateQuestions } from "../api";

export default function Generate({ onGenerated, category }: { onGenerated?: () => void, category?: string }) {
  const [count, setCount] = React.useState<number>(10);
  const [loading, setLoading] = React.useState(false);
  const [localCategory, setLocalCategory] = React.useState<string>(category ?? "all");
  // ### NOU: Stare pentru a controla procentul de jocuri fără NE ###
  const [fractionNoNE, setFractionNoNE] = React.useState<number>(50); // Default 50%

  React.useEffect(() => {
    if (category) setLocalCategory(category);
  }, [category]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // ### MODIFICAT: Construim obiectul de opțiuni ###
      const options: { ensure?: string; targetFractionNoNe?: number } = {};

      if (localCategory === "nash_pur") {
        options.ensure = "at_least_one";
      } else {
        // Trimitem procentul doar dacă nu forțăm "doar cu NE"
        options.targetFractionNoNe = fractionNoNE / 100.0; // Convertim procent (0-100) în fracție (0.0-1.0)
      }
      
      await generateQuestions(count, options);
      alert(`${count} întrebări generate cu succes!`);
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error(err);
      alert(`Eroare la generare: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Generează întrebări</h2>
      <form onSubmit={onSubmit}>
        <label>
          <span>Număr:</span>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </label>

        <label>
          <span>Tip:</span>
          <select value={localCategory} onChange={(e) => setLocalCategory(e.target.value)} disabled={fractionNoNE > 0}>
            <option value="all">Mix (cu și fără NE)</option>
            <option value="nash_pur">Doar cu Nash pur</option>
          </select>
        </label>

        {/* ### NOU: Câmp pentru a seta procentul ### */}
        <label>
          <span>Procent Fără NE (%):</span>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={fractionNoNE}
            onChange={(e) => setFractionNoNE(Number(e.target.value))}
            style={{ width: 80 }}
            disabled={localCategory === 'nash_pur'}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Se generează..." : "Generează"}
        </button>
      </form>
      <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
        Setează "Procent Fără NE" la 50 pentru un mix echilibrat. Când setezi un procent, opțiunea "Tip" este ignorată.
      </p>
    </section>
  );
}