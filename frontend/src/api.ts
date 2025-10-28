const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function generateQuestions(count: number) {
  const res = await fetch(`${API_BASE}/api/questions/generate?count=${count}`, { method: "POST" });
  return res.json();
}

export async function listQuestions() {
  const res = await fetch(`${API_BASE}/api/questions/`);
  return res.json();
}

export async function getQuestion(id: string) {
  const res = await fetch(`${API_BASE}/api/questions/${id}`);
  return res.json();
}

export async function submitAnswer(qid: string, text?: string, pdfFile?: File) {
  const form = new FormData();
  if (text) form.append("submission_text", text);
  if (pdfFile) form.append("submission_pdf", pdfFile);
  const res = await fetch(`${API_BASE}/api/questions/${qid}/submit`, { method: "POST", body: form });
  return res.json();
}

export async function downloadPdfHex(qid: string) {
  const res = await fetch(`${API_BASE}/api/questions/${qid}/download`);
  return res.json();
}