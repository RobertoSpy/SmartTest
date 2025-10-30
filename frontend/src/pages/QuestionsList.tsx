import React from "react";
import { listQuestions } from "../api";

export default function QuestionsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [questions, setQuestions] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    const res = await listQuestions();
    setQuestions(res.questions || []);
  }

  return (
    <section className="card">
      <h2>Întrebări generate</h2>
      <ul style={{ paddingLeft: 18 }}>
        {questions.map((q) => (
          <li key={q.id} style={{ marginBottom: 8 }}>
            <strong>{q.type}</strong> — id: <code style={{ color: "#333" }}>{q.id}</code>
            <div style={{ marginTop: 6 }}>
              <button className="btn" onClick={() => onOpen(q.id)}>Vezi</button>
            </div>
          </li>
        ))}
      </ul>
      <button className="btn" onClick={fetchList} style={{ marginTop: 8 }}>Reîncarcă listă</button>
    </section>
  );
}