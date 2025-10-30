const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function generateQuestions(count: number, options?: { distribution?: string, ensure?: string }) {
  let url = `${API_BASE}/api/questions/generate?count=${count}`;
  if (options?.distribution) url += `&distribution=${encodeURIComponent(options.distribution)}`;
  if (options?.ensure) url += `&ensure=${encodeURIComponent(options.ensure)}`;
  const res = await fetch(url, { method: "POST" });
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