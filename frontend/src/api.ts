const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Generează întrebări, cu opțiunea de a specifica un procent de jocuri fără NE.
 */
export async function generateQuestions(count: number, options?: { distribution?: string, ensure?: string, targetFractionNoNe?: number }) {
  let url = `${API_BASE}/api/questions/generate?count=${count}`;

  if (options?.distribution) {
    url += `&distribution=${encodeURIComponent(options.distribution)}`;
  }
  if (options?.ensure) {
    url += `&ensure=${encodeURIComponent(options.ensure)}`;
  }
  
  if (options?.targetFractionNoNe !== undefined && options.targetFractionNoNe >= 0) {
    url += `&target_fraction_no_ne=${options.targetFractionNoNe}`;
  }

  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "A apărut o eroare necunoscută." }));
    throw new Error(error.detail || "Eroare la generarea întrebărilor.");
  }

  return res.json();
}

/**
 * Returnează lista tuturor întrebărilor.
 */
export async function listQuestions() {
  const res = await fetch(`${API_BASE}/api/questions/`);
  return res.json();
}

/**
 * Returnează o singură întrebare după ID.
 */
export async function getQuestion(id: string) {
  const res = await fetch(`${API_BASE}/api/questions/${id}`);
  return res.json();
}

/**
 * Trimite un răspuns pentru o întrebare.
 */
export async function submitAnswer(qid: string, text?: string, pdfFile?: File) {
  const form = new FormData();
  if (text) form.append("submission_text", text);
  if (pdfFile) form.append("submission_pdf", pdfFile);
  const res = await fetch(`${API_BASE}/api/questions/${qid}/submit`, { method: "POST", body: form });
  return res.json();
}

/**
 * ### NOU: Funcție pentru a șterge o întrebare ###
 * Aceasta este funcția care lipsea.
 */
export async function deleteQuestion(id: string): Promise<void> {
  const url = `${API_BASE}/api/questions/${id}`;
  const res = await fetch(url, { method: "DELETE" });

  // Status 204 No Content înseamnă succes, dar nu există body de parsat
  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({ detail: "Eroare la ștergere." }));
    throw new Error(error.detail || "Nu s-a putut șterge întrebarea.");
  }
}