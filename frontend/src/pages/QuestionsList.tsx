import React, { useEffect, useMemo, useState } from "react";
import { listQuestions, deleteQuestion } from "../api";

// Tip pentru a mapa denumirile tehnice la cele afișate utilizatorului
const CATEGORY_NAMES: { [key: string]: string } = {
  normal_form_game: "Jocuri în formă normală (Nash Pur)",
  default: "Diverse",
};

export default function QuestionsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await listQuestions();
      // Backend-ul deja le trimite sortate
      setQuestions(res.questions || []);
    } catch (err) {
      setError("Nu s-a putut încărca lista de întrebări.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această întrebare?")) {
      return;
    }
    try {
      await deleteQuestion(id);
      // Elimină întrebarea din listă local, fără a reîncărca totul
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      alert(`Eroare la ștergere: ${err.message}`);
    }
  };

  // Grupăm întrebările pe categorii
  const groupedQuestions = useMemo(() => {
    return questions.reduce((acc, q) => {
      const category = q.type || 'default';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(q);
      return acc;
    }, {} as { [key: string]: any[] });
  }, [questions]);

  // Funcție pentru a formata data
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ro-RO", {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Istoric Întrebări</h2>
        <button className="btn" onClick={fetchList} disabled={loading}>
          {loading ? "Se încarcă..." : "Reîncarcă Lista"}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {Object.keys(groupedQuestions).length === 0 && !loading && (
        <p>Nu există întrebări generate.</p>
      )}

      {Object.entries(groupedQuestions).map(([category, qs]) => (
        <div key={category} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            {CATEGORY_NAMES[category] || category}
          </h3>
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {qs.map((q) => (
              <li key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <span style={{ color: "#555" }}>
                    Generată pe: {formatDateTime(q.created_at)}
                  </span>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button className="btn" onClick={() => onOpen(q.id)}>Vezi Întrebarea</button>
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleDelete(q.id)}
                  title="Șterge întrebarea"
                  style={{ color: '#d9534f', fontSize: '1.2rem' }}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}