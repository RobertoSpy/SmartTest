import React from "react";
import { generateQuestions } from "../api";

export default function Generate({ onGenerated, category }: { onGenerated?: () => void, category?: string }) {
  const [count, setCount] = React.useState<number>(10);
  const [loading, setLoading] = React.useState(false);
  const [localCategory, setLocalCategory] = React.useState<string>(category ?? "all");

  React.useEffect(() => {
    if (category) setLocalCategory(category);
  }, [category]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const options: { ensure?: string } = {};
      if (localCategory === "nash_pur") {
        options.ensure = "at_least_one";
      } else {
        options.ensure = "any";
      }
      await generateQuestions(count, options);
      alert("Întrebări generate");
      onGenerated && onGenerated();
    } catch (err) {
      console.error(err);
      alert("Eroare la generare");
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
          <select value={localCategory} onChange={(e) => setLocalCategory(e.target.value)}>
            <option value="all">Toate</option>
            <option value="nash_pur">Nash pur</option>
          </select>
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Se generează..." : "Generează"}
        </button>
      </form>
      <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
        Dacă selectezi "Nash pur", generatorul va încerca să producă jocuri care au cel puțin un echilibru pur.
      </p>
    </section>
  );
}