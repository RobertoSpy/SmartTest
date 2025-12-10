import React, { useEffect, useMemo, useState } from "react";
import { listQuestions, deleteQuestion } from "../api";
import { useNavigate } from "react-router-dom";

export default function QuestionsList({
  onOpen,
  filterType,
}: {
  onOpen?: (id: string) => void;
  filterType?: string;
  refreshKey?: number;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await listQuestions(filterType ? { type: filterType } : undefined);
      setQuestions(res.questions || []);
    } catch (err) {
      setError("Nu s-a putut încărca lista de întrebări.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  async function handleDelete(id: string) {
    if (!window.confirm("Ești sigur că vrei să ștergi această întrebare?")) return;
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      alert(`Eroare la ștergere: ${err.message}`);
    }
  }

  const openQuestion = (id: string) => {
    if (onOpen) {
      onOpen(id);
      return;
    }
    // fallback: navigăm la ruta /question/:id
    navigate(`/question/${encodeURIComponent(id)}`);
  };

  // Simplificat: tu ai doar două tipuri relevante -> afișăm etichete doar pentru ele.
  const typeLabel = (t?: string) => {
    if (!t) return "—";
    if (t === "normal_form_game") return "Nash generat";
    if (t === "normal_form_game_custom_student_input") return "Task: student introduce matricea";
    return t;
  };

  const headerTitle = useMemo(() => {
    if (filterType === "normal_form_game") return "Istoric — Nash pur (Generat)";
    if (filterType === "normal_form_game_custom_student_input") return "Istoric — Nash pur (Task student)";
    return "Istoric Întrebări";
  }, [filterType]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>{headerTitle}</h2>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            {filterType ? `Filtru: ${filterType}` : "Afișează toate întrebările"}
          </div>
        </div>
        <button className="btn" onClick={fetchList} disabled={loading}>
          {loading ? "Se încarcă..." : "Reîncarcă Lista"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {questions.length === 0 && !loading && <p>Nu există întrebări generate.</p>}

      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {questions.map((q) => (
          <li
            key={q.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ color: "#555", fontSize: 13 }}>Generată pe: {formatDateTime(q.created_at)}</div>
                <div style={{ padding: "3px 8px", borderRadius: 6, background: "#f3f4f6", fontSize: 12, color: "#374151" }}>
                  {typeLabel(q.type)}
                </div>
              </div>

              <div style={{ marginTop: 8, color: "#111827", fontWeight: 600 }}>
                {q.prompt ? (q.prompt.length > 120 ? q.prompt.slice(0, 120) + "…" : q.prompt) : "Fără prompt"}
              </div>

              {q.data && (q.data.row_labels || q.data.rows) && (q.data.col_labels || q.data.cols) && (
                <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                  Dimensiune: {q.data.row_labels ? q.data.row_labels.length : q.data.rows} x {q.data.col_labels ? q.data.col_labels.length : q.data.cols}
                </div>
              )}
            </div>

            <div style={{ marginLeft: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn" onClick={() => openQuestion(q.id)}>Vezi Întrebarea</button>
              <button
                className="btn btn-ghost"
                onClick={() => handleDelete(q.id)}
                title="Șterge întrebare"
                style={{ color: "#d9534f", fontSize: "1.2rem" }}
              >
                &times;
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}