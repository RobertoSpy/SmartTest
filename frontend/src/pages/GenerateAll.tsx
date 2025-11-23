import React from "react";
import { generateQuestions, generateStudentInputQuestions } from "../api";

export default function GenerateAll({ onGenerated }: { onGenerated?: () => void }) {
  const [loading, setLoading] = React.useState(false);

  /**
   * Generate one item per "category/subcategory".
   * Currently we create:
   *  - 1 x normal generated Nash question (generateQuestions)
   *  - 1 x student-input Nash task (generateStudentInputQuestions)
   *
   * This removes the UI for count / percent / NE — pressing the button will
   * always create one question for each category.
   */
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      // 1) generate a normal_form_game (1 item)
      await generateQuestions(1);

      // 2) generate a student-input task (1 item)
      await generateStudentInputQuestions(1, {
        save_as: "normal_form_game_custom_student_input",
      });

      alert("S-au generat câte 1 întrebare pentru fiecare categorie.");
      onGenerated && onGenerated();
    } catch (err: any) {
      console.error("GenerateAll error:", err);
      alert("Eroare la generare: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Generează câte 1 din fiecare categorie</h2>
      <p style={{ marginBottom: 12, color: "var(--muted)" }}>
        Apasă butonul pentru a genera automat câte o întrebare din fiecare categorie (Nash generat și Task — student introduce matricea).
      </p>

      <div>
        <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
          {loading ? "Se generează..." : "Generează câte 1 din fiecare"}
        </button>
      </div>
    </section>
  );
}