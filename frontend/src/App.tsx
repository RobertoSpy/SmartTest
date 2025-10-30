import React from "react";
import "./App.css";
import Generate from "./pages/Generate";
import QuestionsList from "./pages/QuestionsList";
import QuestionView from "./pages/QuestionView";

type View = { name: "home" } | { name: "question", id: string };

export default function App() {
  const [view, setView] = React.useState<View>({ name: "home" });
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  return (
    <div className="container">
      <header>
        <div>
          <h1>SmarTest — L6 (Nash-pur)</h1>
          <p>Antrenament pentru găsirea echilibrelor Nash pure</p>
        </div>

        <nav>
          <button className="btn" onClick={() => { setView({ name: "home" }); }}>Home</button>

          <div className="category-group" style={{ marginLeft: 8 }}>
            <span style={{ marginRight: 6, color: "#333" }}>Categorii:</span>
            <button
              className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              Toate
            </button>
            <button
              className={`category-btn ${selectedCategory === "nash_pur" ? "active" : ""}`}
              onClick={() => setSelectedCategory("nash_pur")}
            >
              Nash pur
            </button>
          </div>
        </nav>
      </header>

      <main>
        {view.name === "home" && (
          <>
            <Generate category={selectedCategory} onGenerated={() => setView({ name: "home" })} />
            <QuestionsList onOpen={(id) => setView({ name: "question", id })} />
          </>
        )}
        {view.name === "question" && <QuestionView id={view.id} onBack={() => setView({ name: "home" })} />}
      </main>
    </div>
  );
}