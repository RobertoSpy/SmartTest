import React from "react";
import { getQuestion, submitAnswer, downloadPdfHex } from "../api";

export default function QuestionView({ id, onBack }: { id: string, onBack?: () => void }) {
  const [q, setQ] = React.useState<any>(null);
  const [answerText, setAnswerText] = React.useState("");
  const [pdfFile, setPdfFile] = React.useState<File | undefined>(undefined);
  const [result, setResult] = React.useState<any>(null);

  React.useEffect(() => {
    fetchQuestion();
  }, [id]);

  async function fetchQuestion() {
    const res = await getQuestion(id);
    setQ(res);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await submitAnswer(id, answerText, pdfFile);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Eroare la submit");
    }
  }

  async function onDownload() {
    const res = await downloadPdfHex(id);
    if (res.pdf_bytes_base64) {
      // hex string back to bytes
      const hex = res.pdf_bytes_base64 as string;
      const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      alert("Nu există PDF");
    }
  }

  return (
    <section>
      <button onClick={onBack}>Înapoi</button>
      <h2>Întrebare</h2>
      {q ? (
        <>
          <p><strong>Prompt:</strong> {q.prompt}</p>
          <p><strong>Dimensiune:</strong> {q.n}x{q.n}</p>
          <button onClick={onDownload}>Descarcă PDF</button>
          <form onSubmit={onSubmit}>
            <label>Răspuns text (ex: (1,3),(2,5),... sau board cu Q):
              <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={6} cols={60} />
            </label>
            <label>SAU upload PDF:
              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : undefined)} />
            </label>
            <button type="submit">Trimite</button>
          </form>
          {result && (
            <div>
              <h3>Evaluare</h3>
              <p>Scor: {result.result.score_percent}%</p>
              <p>Număr poziții corecte: {result.result.num_correct}</p>
              <p>Conflicte: {result.result.conflicts}</p>
              <pre>Poziții corecte: {JSON.stringify(result.result.correct_positions)}</pre>
            </div>
          )}
        </>
      ) : <p>Loading...</p>}
    </section>
  );
}