import React from "react";
import { generateQuestions } from "../api";

export default function Generate({ onGenerated, category }: { onGenerated?: () => void; category?: string }) {
  const [count, setCount] = React.useState<number>(10);
  const [loading, setLoading] = React.useState(false);
  const [localCategory, setLocalCategory] = React.useState<string>(category ?? "all");
  const [fractionNoNE, setFractionNoNE] = React.useState<number>(50);

  // sub-type for Nash pur: generated | student_input
  const [nashSub, setNashSub] = React.useState<"generated" | "student_input">("generated");

  React.useEffect(() => {
    if (category) setLocalCategory(category);
  }, [category]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // CASE: admin wants to create task(s) where student inputs the matrix
      if (localCategory === "nash_pur" && nashSub === "student_input") {
        const options: any = { ensure: "at_least_one", save_as: "normal_form_game_custom_student_input" };
        await generateQuestions(count, options);
        alert(`${count} task-uri student-input generate cu succes!`);
        onGenerated && onGenerated();
        setLoading(false);
        return;
      }

      // default: generate standard (matrice generată și salvată)
      const options: any = {};
      if (localCategory === "nash_pur") options.ensure = "at_least_one";
      else options.targetFractionNoNe = fractionNoNE / 100.0;

      await generateQuestions(count, options);
      alert(`${count} întrebări generate cu succes!`);
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error(err);
      alert(`Eroare: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Generează întrebări</h2>
      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={{ marginRight: 8 }}>Număr:</span>
          <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ width: 80 }} />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={{ marginRight: 8 }}>Tip:</span>
          <select value={localCategory} onChange={(e) => setLocalCategory(e.target.value)} disabled={fractionNoNE > 0}>
            <option value="all">Mix (cu și fără NE)</option>
            <option value="nash_pur">Doar cu Nash pur</option>
          </select>
        </label>

        {localCategory === "nash_pur" && (
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>Sub-tip Nash:</span>
            <select value={nashSub} onChange={(e) => setNashSub(e.target.value as any)}>
              <option value="generated">Generat aleator</option>
              <option value="student_input">Task (student introduce matricea)</option>
            </select>
          </label>
        )}

        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={{ marginRight: 8 }}>Procent Fără NE (%):</span>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={fractionNoNE}
            onChange={(e) => setFractionNoNE(Number(e.target.value))}
            style={{ width: 80 }}
            disabled={localCategory === "nash_pur"}
          />
        </label>

        <div style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Se procesează..." : "Generează/Verifică"}
          </button>
        </div>
      </form>
    </section>
  );
}