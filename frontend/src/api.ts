const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

/**
 * Helper: parsează răspunsul, încearcă JSON, fallback text.
 * Aruncă Error cu mesaj util când res.ok === false.
 */
async function handleResponse(res: Response) {
  if (res.status === 204) return null; // No Content
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? JSON.parse(text || "{}")
    : text;

  if (!res.ok) {
    // payload poate fi obiect cu detail sau string
    const msg =
      (payload && typeof payload === "object" && (payload.detail || payload.message)) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return payload;
}

function buildQuery(params: Record<string, any> | undefined) {
  if (!params) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/* === API functions === */

export async function generateQuestions(
  count: number,
  options?: { distribution?: string; ensure?: string; targetFractionNoNe?: number; save_as?: string; difficulty?: string }
) {
  const params: Record<string, any> = { count };
  if (options?.distribution) params.distribution = options.distribution;
  if (options?.ensure) params.ensure = options.ensure;
  if (typeof options?.targetFractionNoNe === "number")
    params.target_fraction_no_ne = options.targetFractionNoNe;
  if (options?.save_as) params.save_as = options.save_as;
  if (options?.difficulty) params.difficulty = options.difficulty;

  // Reverted to /api/questions
  const url = `${API_BASE}/api/questions/generate${buildQuery(params)}`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function generateGameTheoryQuestions(count: number) {
  const url = `${API_BASE}/api/gametheory/generate?count=${count}`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function submitGameTheoryAnswer(qid: string, text: string) {
  const url = `${API_BASE}/api/gametheory/${encodeURIComponent(qid)}/submit?submission_text=${encodeURIComponent(text)}`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function solveGameTheoryScenario(data: {
  matrix: number[][][];
  q_type: string;
  row_labels?: string[];
  col_labels?: string[];
  player_row?: string;
  player_col?: string;
}) {
  const url = `${API_BASE}/api/gametheory-custom/solve`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function listQuestions(params?: { type?: string }) {
  const qs = buildQuery(params as any);
  const res = await fetch(`${API_BASE}/api/questions${qs}`);
  return handleResponse(res);
}

export async function getQuestion(id: string) {
  const res = await fetch(`${API_BASE}/api/questions/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

// Original submitAnswer for Nash/General (legacy?)
export async function submitAnswer(qid: string, text?: string, pdfFile?: File) {
  const form = new FormData();
  if (text) form.append("submission_text", text);
  if (pdfFile) form.append("submission_pdf", pdfFile);
  const res = await fetch(`${API_BASE}/api/questions/${encodeURIComponent(qid)}/submit`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}

export async function submitSearchAnswer(qid: string, text: string) {
  // Search answers accept a simple JSON body or form, but let's using JSON as per my reproduction script which worked.
  // Actually the backend endpoint accepts `submission_text: str = Form(...)` BUT also checks for JSON body.
  // My reproduction works with JSON. Using JSON is cleaner.
  const res = await fetch(`${API_BASE}/api/questions/search/${encodeURIComponent(qid)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submission_text: text }),
  });
  return handleResponse(res);
}

export async function submitCustomMatrix(
  qid: string,
  submissionMatrix: any,
  claimedEquilibria?: Array<[number, number]>,
  submissionText?: string
) {
  const body: any = { submission_matrix: submissionMatrix };
  if (claimedEquilibria) body.claimed_equilibria = claimedEquilibria;
  if (submissionText) body.submission_text = submissionText;

  // debug: logăm payloadul exact pe care îl trimitem
  try {
    console.log("DEBUG submitCustomMatrix body:", JSON.stringify(body));
  } catch (e) {
    console.log("DEBUG submitCustomMatrix body (could not stringify):", body);
  }

  const url = `${API_BASE}/api/questions/${encodeURIComponent(qid)}/submit`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // logăm răspunsul brut (text) pentru debugging
  const text = await res.text();
  console.log("DEBUG submitCustomMatrix response status:", res.status);
  console.log("DEBUG submitCustomMatrix raw response:", text);

  // încercăm să parsăm JSON dacă e cazul
  let parsed: any = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(text || "{}");
    } catch (err) {
      parsed = text;
    }
  } else {
    parsed = text;
  }

  if (!res.ok) {
    // aruncăm eroare cu detaliul din răspuns (utile pentru debugging)
    const msg =
      (parsed && typeof parsed === "object" && (parsed.detail || parsed.message)) ||
      (typeof parsed === "string" && parsed) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return parsed;
}
export async function deleteQuestion(id: string): Promise<null> {
  const url = `${API_BASE}/api/questions/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE" });
  return handleResponse(res);
}

/* === Custom matrix endpoints === */
export async function validateCustomMatrix(payload: any) {
  const res = await fetch(`${API_BASE}/api/questions/custom/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function createCustomQuestion(payload: any) {
  const res = await fetch(`${API_BASE}/api/questions/custom/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/* New: create student-input question with custom prompt */
export async function createStudentInputQuestion(payload: any) {
  const res = await fetch(`${API_BASE}/api/questions/custom/create_student_input`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function generateStudentInputQuestions(
  count: number,
  options?: {
    distribution?: string;
    ensure?: string;
    targetFractionNoNe?: number;
    save_as?: string;
    fixedRows?: number;
    fixedCols?: number;
    difficulty?: string;
  }
) {
  const params: Record<string, any> = { count };
  if (options?.distribution) params.distribution = options.distribution;
  if (options?.ensure) params.ensure = options.ensure;
  if (typeof options?.targetFractionNoNe === "number")
    params.target_fraction_no_ne = options.targetFractionNoNe;
  if (options?.save_as) params.save_as = options.save_as;
  if (typeof options?.fixedRows === "number") params.fixed_rows = options.fixedRows;
  if (typeof options?.fixedCols === "number") params.fixed_cols = options.fixedCols;
  if (options?.difficulty) params.difficulty = options.difficulty;

  const url = `${API_BASE}/api/questions_custom/generate${buildQuery(params)}`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function generateSearchQuestions(count: number) {
  const url = `${API_BASE}/api/questions/search/generate?count=${count}`;
  const res = await fetch(url, { method: "POST" });
  return handleResponse(res);
}

export async function createCustomSearchQuestion(payload: { prompt: string, options?: string[] }) {
  const res = await fetch(`${API_BASE}/api/questions/search/create_custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export const solveCSP = async (data: any) => {
  try {
    const response = await fetch(`${API_BASE}/csp/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error while solving CSP:', error);
    throw error;
  }
};

export async function generateMinMaxQuestion(difficulty: string = "easy") {
  const res = await fetch(`${API_BASE}/api/questions/minmax/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ difficulty }),
  });
  return handleResponse(res);
}

export async function submitMinMaxAnswer(tree: any, rootValue: number, visitedLeaves: number) {
  const res = await fetch(`${API_BASE}/api/questions/minmax/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tree,
      root_value: rootValue,
      visited_leaves: visitedLeaves
    }),
  });
  return handleResponse(res);
}

export async function saveCustomMinMaxQuestion(payload: any) {
  const res = await fetch(`${API_BASE}/api/questions/minmax/create_custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}



export default {
  API_BASE,
  generateQuestions,
  generateStudentInputQuestions,
  listQuestions,
  getQuestion,
  submitAnswer,
  submitCustomMatrix,
  deleteQuestion,
  validateCustomMatrix,
  createCustomQuestion,
  createStudentInputQuestion,
  generateSearchQuestions,
  createCustomSearchQuestion,
  submitSearchAnswer,
  solveCSP,
  generateMinMaxQuestion,
  submitMinMaxAnswer,
};

export async function generateCSPProblem() {
  const res = await fetch(`${API_BASE}/csp/generate_problem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  return handleResponse(res);
}