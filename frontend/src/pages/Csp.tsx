import React, { useState } from "react";
import { solveCSP } from "../api";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import { Plus, Trash2, Play, Settings } from "lucide-react";

export default function Csp() {
  const [mode, setMode] = useState<"solve" | "generate">("solve");

  const [result, setResult] = useState<any>(null);
  const [generatedProblem, setGeneratedProblem] = useState<any>(null);
  const [userSolution, setUserSolution] = useState<Record<string, number>>({});

  const [numVariables, setNumVariables] = useState<number>(3);
  const [variables, setVariables] = useState<string[]>(["X1", "X2", "X3"]);
  const [domains, setDomains] = useState<any>({
    X1: [1, 2, 3],
    X2: [1, 2, 3],
    X3: [1, 2, 3],
  });
  const [partialAssignment, setPartialAssignment] = useState<any>({
    X1: null,
    X2: null,
    X3: null,
  });
  const [constraints, setConstraints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNumVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, Number(e.target.value));
    setNumVariables(count);

    const newVars = Array.from({ length: count }, (_, i) => `X${i + 1}`);
    setVariables(newVars);

    const newDomains: any = {};
    const newPartial: any = {};

    newVars.forEach((v) => {
      newDomains[v] = [1, 2, 3];
      newPartial[v] = null;
    });

    setDomains(newDomains);
    setPartialAssignment(newPartial);
  };

  const addConstraint = (var1: string, var2: string, condition: string) => {
    if (!var1 || !var2) return;
    setConstraints([...constraints, { var1, var2, condition }]);
  };

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const solve = async () => {
    setLoading(true);
    setResult(null);

    const filteredPartial = Object.fromEntries(
      Object.entries(partialAssignment).filter(
        ([_, v]) => v !== null && v !== ""
      )
    );

    const payload = {
      variables,
      domains,
      partial_assignment: filteredPartial,
      constraints,
    };

    try {
      const res = await solveCSP(payload);
      setResult(res);
    } catch {
      alert("Error solving CSP");
    } finally {
      setLoading(false);
    }
  };

  const generateProblem = async () => {
    setResult(null);
    setGeneratedProblem(null);
    setUserSolution({});

    try {
      const res = await fetch("http://127.0.0.1:8000/csp/generate_problem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})  
      });

      if (!res.ok) {
        throw new Error("Server error: " + res.statusText);
      }

      const data = await res.json();
      setGeneratedProblem(data.problem);
    } catch (error) {
      console.error("Error generating problem:", error);
      alert("There was an issue generating the problem. Please try again later.");
    }
  };

  const checkSolution = async () => {
    if (!generatedProblem) return;

    const payload = {
      variables: generatedProblem.variables,
      domains: generatedProblem.domains,
      constraints: generatedProblem.constraints,
      user_solution: userSolution,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/csp/check_solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Server error: " + res.statusText);
      }

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error checking solution:", error);
      alert("There was an issue checking the solution. Please try again later.");
    }
  };

  const handleModeChange = (newMode: "solve" | "generate") => {
    setMode(newMode);
    setResult(null);
    setGeneratedProblem(null);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <h2 className="text-gradient">CSP – Backtracking Solver</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <NeonButton onClick={() => handleModeChange("solve")}>Solve</NeonButton>
        <NeonButton onClick={() => handleModeChange("generate")}>Generate</NeonButton>
      </div>

      {mode === "solve" && (
        <>
          <GlassCard header={<Settings size={18} />}>
            <label>
              Number of Variables:
              <input
                type="number"
                min={1}
                value={numVariables}
                onChange={handleNumVariablesChange}
                style={{ marginLeft: 8 }}
              />
            </label>

            {variables.map((v) => (
              <div key={v} style={{ marginTop: 12 }}>
                <b>{v}</b>
                <input
                  type="text"
                  value={domains[v].join(",")}
                  onChange={(e) =>
                    setDomains({
                      ...domains,
                      [v]: e.target.value
                        .split(",")
                        .map((x) => Number(x.trim()))
                        .filter((x) => !isNaN(x)),
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Partial"
                  value={partialAssignment[v] ?? ""}
                  onChange={(e) =>
                    setPartialAssignment({
                      ...partialAssignment,
                      [v]: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            ))}
          </GlassCard>

          <GlassCard header="Constraints">
            <input id="v1" placeholder="X1" />
            <select id="cond">
              <option value="!=">≠</option>
              <option value="=">=</option>
              <option value=">">{">"}</option>
              <option value="<">{`<`}</option>
            </select>
            <input id="v2" placeholder="X2" />
            <NeonButton
              onClick={() =>
                addConstraint(
                  (document.getElementById("v1") as HTMLInputElement).value,
                  (document.getElementById("v2") as HTMLInputElement).value,
                  (document.getElementById("cond") as HTMLSelectElement).value
                )
              }
            >
              <Plus size={16} />
            </NeonButton>

            {constraints.map((c, i) => (
              <div key={i}>
                {c.var1} {c.condition} {c.var2}
                <Trash2 size={14} onClick={() => removeConstraint(i)} />
              </div>
            ))}
          </GlassCard>

          <NeonButton onClick={solve} disabled={loading}>
            <Play size={18} /> Solve CSP
          </NeonButton>
        </>
      )}

      {mode === "generate" && (
        <>
          <NeonButton onClick={generateProblem}>
            Generate CSP Problem
          </NeonButton>

          {generatedProblem && (
            <GlassCard>
              <h3>Generated Problem</h3>

              <p><b>Variables:</b> {generatedProblem.variables.join(", ")}</p>

              <p><b>Domains:</b></p>
              <ul>
                {Object.entries(generatedProblem.domains).map(([v, d]: any) => (
                  <li key={v}>
                    {v} ∈ {"{"}{d.join(", ")}{"}"}
                  </li>
                ))}
              </ul>

              <p><b>Constraints:</b></p>
              <ul>
                {generatedProblem.constraints.map((c: any, i: number) => (
                  <li key={i}>
                    {c.var1} {c.condition} {c.var2}
                  </li>
                ))}
              </ul>

              <h4>Your Solution</h4>
              {generatedProblem.variables.map((v: string) => (
                <input
                  key={v}
                  type="number"
                  placeholder={`Value for ${v}`}
                  onChange={(e) =>
                    setUserSolution({
                      ...userSolution,
                      [v]: Number(e.target.value),
                    })
                  }
                />
              ))}

              <NeonButton onClick={checkSolution}>
                Check Solution
              </NeonButton>
            </GlassCard>
          )}
        </>
      )}

      {result && (
        <GlassCard>
          {result.score !== undefined ? (
            <>
              <h3>Score: {result.score}%</h3>
              <p>{result.feedback}</p>
            </>
          ) : null}
        </GlassCard>
      )}
    </div>
  );
}
