import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import CategoryDropdown from "./components/CategoryDropdown";
import NashGenerated from "./pages/NashGenerated";
import NashCustom from "./pages/NashCustom";
import GenerateAll from "./pages/GenerateAll";
import QuestionsList from "./pages/QuestionsList";
import QuestionView from "./pages/QuestionView";
import { generateStudentInputQuestions } from "./api";

/**
 * Wrapper Home care afișează generatorul corect și lista de întrebări
 * în funcție de ruta (se pune filterType pentru QuestionsList).
 */
function HomeFrame({ mode }: { mode: "all" | "nash_generated" | "nash_task" }) {
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [count, setCount] = React.useState<number>(1);
  const [percentNoNe, setPercentNoNe] = React.useState<number>(50); // procent jocuri FĂRĂ NE
  const [ensure, setEnsure] = React.useState<"any" | "at_least_one" | "none">("any");
  const navigate = useNavigate();

  // ADĂUGATE: state pentru dimensiuni fixe (rows x cols)
  const [fixedRows, setFixedRows] = React.useState<number | undefined>(2);
  const [fixedCols, setFixedCols] = React.useState<number | undefined>(4);

  let filterType: string | undefined;
  if (mode === "nash_generated") filterType = "normal_form_game";
  else if (mode === "nash_task") filterType = "normal_form_game_custom_student_input";

  // generează folosind endpointul custom care salvează task-uri student_input
  async function generateStudentInputTasks() {
    try {
      setGenerating(true);
      const options: any = {};
      if (ensure && ensure !== "any") {
        options.ensure = ensure === "at_least_one" ? "at_least_one" : "none";
      } else {
        // UI folosește percentNoNe = procentul de jocuri FĂRĂ NE (ex: 40% fără NE)
        // backend param e target_fraction_no_ne (0..1)
        options.targetFractionNoNe = Math.max(0, Math.min(100, percentNoNe)) / 100.0;
      }
      // optional, backend custom va genera student_input by default; we keep save_as for clarity
      options.save_as = "normal_form_game_custom_student_input";

      // ADĂUGATE: trimitem dimensiunile dacă sunt setate
      if (typeof fixedRows === "number") options.fixedRows = fixedRows;
      if (typeof fixedCols === "number") options.fixedCols = fixedCols;

      // <-- CALL THE NEW FUNCTION (points to /api/questions_custom/generate)
      await generateStudentInputQuestions(count, options);

      // reîmprospătăm lista
      setRefreshKey(k => k + 1);
      alert(`${count} task-uri generate — verifică lista.`);
    } catch (err: any) {
      console.error(err);
      alert("Eroare la generare: " + (err?.message || err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {mode === "all" && <GenerateAll onGenerated={() => { /* noop */ }} />}
      {mode === "nash_generated" && <NashGenerated onGenerated={() => { /* noop */ }} />}

      {mode === "nash_task" && (
        <div style={{ padding: 12, marginBottom: 12, background: "#fff", borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Taskuri — student introduce matricea</h3>
          <p style={{ margin: 0 }}>
            Generează task‑uri în care studentul va completa matricea și va indica dacă există Nash pur.
            Generatorul va salva fiecare task cu promptul potrivit (ex.: "Formează o matrice în care să fie Nash pur" sau "…să NU fie Nash pur").
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <label>
              <div style={{ fontSize: 13 }}>Număr întrebări</div>
              <input type="number" min={1} value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 1))} style={{ width: 80 }} />
            </label>

            <label>
              <div style={{ fontSize: 13 }}>Procent jocuri FĂRĂ NE (%)</div>
              <input type="number" min={0} max={100} value={percentNoNe} onChange={e => setPercentNoNe(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} style={{ width: 80 }} />
            </label>

            <label>
              <div style={{ fontSize: 13 }}>Forțează (override procent)</div>
              <select value={ensure} onChange={e => setEnsure(e.target.value as any)}>
                <option value="any">Orice (folosește procent)</option>
                <option value="at_least_one">Să aibă cel puțin un Nash pur</option>
                <option value="none">Să NU aibă Nash pur</option>
              </select>
            </label>

            {/* ADĂUGATE: controale pentru dimensiuni */}
            <label>
              <div style={{ fontSize: 13 }}>Rows</div>
              <input
                type="number"
                min={1}
                value={fixedRows ?? ""}
                onChange={(e) => setFixedRows(e.target.value ? Math.max(1, Number(e.target.value)) : undefined)}
                style={{ width: 80 }}
              />
            </label>

            <label>
              <div style={{ fontSize: 13 }}>Cols</div>
              <input
                type="number"
                min={1}
                value={fixedCols ?? ""}
                onChange={(e) => setFixedCols(e.target.value ? Math.max(1, Number(e.target.value)) : undefined)}
                style={{ width: 80 }}
              />
            </label>

            <div>
              <button className="btn btn-primary" onClick={generateStudentInputTasks} disabled={generating}>
                {generating ? "Se generează..." : "Generează task-uri (student input)"}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuestionsList filterType={filterType} refreshKey={refreshKey} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/all" replace />} />
          <Route path="/all" element={<HomeFrame mode="all" />} />
          <Route path="/nash/generated" element={<HomeFrame mode="nash_generated" />} />
          <Route path="/nash/task" element={<HomeFrame mode="nash_task" />} />
          <Route path="/question/:id" element={<QuestionViewRouter />} />
          <Route path="*" element={<Navigate to="/all" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

/* Header separată pentru a folosi navigate / location */
function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // derive current / active labels from location.pathname
  const path = location.pathname;
  const current =
    path.startsWith("/nash/task") ? "nash_task" :
    path.startsWith("/nash/generated") ? "nash_generated" :
    "all";

  function onCategorySelect(cat: string) {
    if (cat === "all") navigate("/all");
    else if (cat === "nash_pur") navigate("/nash/generated");
  }

  function onSubcategorySelect(sub: string) {
    if (sub === "generated") navigate("/nash/generated");
    else if (sub === "task") navigate("/nash/task");
  }

  return (
    <header>
      <div>
        <h1>SmarTest — L6 (Nash-pur)</h1>
        <p>Antrenament pentru găsirea echilibrelor Nash pure</p>
      </div>

      <nav>
        <button className="btn" onClick={() => navigate("/all")}>Home</button>

        <div style={{ width: 12 }} />

        <CategoryDropdown current={current === "all" ? "all" : "nash_pur"} onSelect={onCategorySelect} />

        {(current === "nash_generated" || current === "nash_task") && (
          <div className="category-group" style={{ marginLeft: 8 }}>
            <button className={`category-btn ${current === "nash_generated" ? "active" : ""}`} onClick={() => onSubcategorySelect("generated")}>Generat</button>
            <button className={`category-btn ${current === "nash_task" ? "active" : ""}`} onClick={() => onSubcategorySelect("task")}>Task</button>
          </div>
        )}
      </nav>
    </header>
  );
}

/* Router wrapper for QuestionView so we can use useParams */
function QuestionViewRouter() {
  return <QuestionViewWithRouter />;
}

import { useParams, useNavigate as useNav } from "react-router-dom";
function QuestionViewWithRouter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNav();
  if (!id) return <div>Invalid question id</div>;
  return <QuestionView id={id} onBack={() => navigate(-1)} />;
}