import React from "react";
import { generateQuestions } from "../api";

export default function Generate({ onGenerated }: { onGenerated?: () => void }) {
  const [count, setCount] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await generateQuestions(count);
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
    <section>
      <h2>Generează întrebări</h2>
      <form onSubmit={onSubmit}>
        <label>Număr întrebări:
          <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
        <button type="submit" disabled={loading}>Generează</button>
      </form>
    </section>
  );
}