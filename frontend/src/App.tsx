import React from "react";
import Generate from "./pages/Generate";
import QuestionsList from "./pages/QuestionsList";
import QuestionView from "./pages/QuestionView";

type View = { name: "home" } | { name: "question", id: string };

export default function App() {
  const [view, setView] = React.useState<View>({ name: "home" });

  return (
    <div className="container">
      <header>
        <h1>SmarTest — L6 (N-Queens)</h1>
        <nav>
          <button onClick={() => setView({ name: "home" })}>Home</button>
        </nav>
      </header>
      <main>
        {view.name === "home" && (
          <>
            <Generate onGenerated={() => setView({ name: "home" })} />
            <QuestionsList onOpen={(id) => setView({ name: "question", id })} />
          </>
        )}
        {view.name === "question" && <QuestionView id={view.id} onBack={() => setView({ name: "home" })} />}
      </main>
    </div>
  );
}