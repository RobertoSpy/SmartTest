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
    <section>
      <h2>Întrebări generate</h2>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.id} — {q.type} — n={q.n} —
            <button onClick={() => onOpen(q.id)}>vezi</button>
          </li>
        ))}
      </ul>
      <button onClick={fetchList}>Reîncarcă listă</button>
    </section>
  );
}