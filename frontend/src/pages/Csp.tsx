import React, { useState } from "react";
import { solveCSP } from "../api";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import { Plus, Trash2, Play, Settings } from "lucide-react";

export default function CSPPoint3() {
  const [result, setResult] = useState<any>(null);

  const [numVariables, setNumVariables] = useState<number>(3);
  const [variables, setVariables] = useState<string[]>(["X1", "X2", "X3"]);
  const [domains, setDomains] = useState<any>({ "X1": [1, 2, 3], "X2": [1, 2, 3], "X3": [1, 2, 3] });
  const [partialAssignment, setPartialAssignment] = useState<any>({ "X1": null, "X2": null, "X3": null });
  const [constraints, setConstraints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNumVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value));
    setNumVariables(count);

    const newVariables = Array.from({ length: count }, (_, i) => `X${i + 1}`);
    setVariables(newVariables);

    const newDomains = newVariables.reduce((acc: any, varName: string) => {
      acc[varName] = [1, 2, 3];
      return acc;
    }, {});
    setDomains(newDomains);

    const newPartialAssignment = newVariables.reduce((acc: any, varName: string) => {
      acc[varName] = null;
      return acc;
    }, {});
    setPartialAssignment(newPartialAssignment);
  };

  const addConstraint = (var1: string, var2: string, condition: string) => {
    if (!var1 || !var2) return;
    setConstraints((prevConstraints) => [
      ...prevConstraints,
      { var1, var2, condition }
    ]);
  };

  const removeFromDomain = (variable: string, value: number) => {
    const newDomains = { ...domains };
    newDomains[variable] = newDomains[variable].filter((val: number) => val !== value);
    setDomains(newDomains);
  };

  const removeConstraint = (index: number) => {
    const newConstraints = constraints.filter((_, i) => i !== index);
    setConstraints(newConstraints);
  };

  const solve = async () => {
    setLoading(true);
    setResult(null);
    const filteredPartialAssignment = Object.fromEntries(
      Object.entries(partialAssignment).filter(([_, value]) => value !== null && value !== "")
    );

    const payload = {
      variables,
      domains,
      partial_assignment: filteredPartialAssignment,
      constraints
    };

    try {
      const res = await solveCSP(payload);
      setResult(res);
    } catch (error) {
      console.error("Error while solving CSP:", error);
      alert("Error solving CSP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h2 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>CSP Solver</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Constraint Satisfaction Problem Solver with Backtracking
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard header={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={18} /> Configuration</div>}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Number of Variables:</span>
              <input
                type="number"
                min="1"
                value={numVariables}
                onChange={handleNumVariablesChange}
                style={{
                  width: 80,
                  padding: '8px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155'
                }}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {variables.map((variable) => (
                <div key={variable} style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--neon-cyan)' }}>{variable}</div>

                  {/* Domain */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Domain (comma separated)</label>
                    <input
                      type="text"
                      value={domains[variable]?.join(", ")}
                      onChange={(e) => {
                        const newDomains = { ...domains };
                        newDomains[variable] = e.target.value
                          .split(",")
                          .map((v) => {
                            const num = Number(v.trim());
                            return isNaN(num) ? null : num;
                          })
                          .filter((v) => v !== null);
                        setDomains(newDomains);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        color: '#fff',
                        border: '1px solid #334155'
                      }}
                    />
                  </div>

                  {/* Partial */}
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Partial Assignment (Optional)</label>
                    <input
                      type="number"
                      placeholder="None"
                      value={partialAssignment[variable] === null ? "" : partialAssignment[variable]}
                      onChange={(e) => {
                        const newAssignment = { ...partialAssignment };
                        newAssignment[variable] = e.target.value ? Number(e.target.value) : null;
                        setPartialAssignment(newAssignment);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        color: '#fff',
                        border: '1px solid #334155'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Constraints Logic Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard header={<h3>Constraints</h3>}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
              <input type="text" placeholder="X1" id="var1" style={{ width: 60, padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
              <select id="condition" style={{ padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: 'white' }}>
                <option value="!=">≠</option>
                <option value="=">=</option>
                <option value=">">{">"}</option>
                <option value="<">{`<`}</option>
              </select>
              <input type="text" placeholder="X2" id="var2" style={{ width: 60, padding: 8, borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: 'white' }} />

              <NeonButton
                onClick={() => {
                  const var1 = (document.getElementById("var1") as HTMLInputElement).value;
                  const var2 = (document.getElementById("var2") as HTMLInputElement).value;
                  const condition = (document.getElementById("condition") as HTMLSelectElement).value;
                  addConstraint(var1, var2, condition);
                }}
                variant="primary"
                style={{ padding: '8px' }}
              >
                <Plus size={18} />
              </NeonButton>
            </div>

            {constraints.length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No constraints added.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {constraints.map((constraint, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px 12px',
                    borderRadius: 8
                  }}>
                    <span style={{ fontFamily: 'monospace' }}>{constraint.var1} {constraint.condition} {constraint.var2}</span>
                    <button onClick={() => removeConstraint(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <NeonButton
            onClick={solve}
            disabled={loading}
            glow
            style={{
              justifyContent: 'center',
              fontSize: '1.1rem',
              padding: '16px',
              background: '#ea580c',
              border: 'none',
              color: 'white'
            }}
          >
            {loading ? "Solving..." : <><Play size={20} /> Solve CSP</>}
          </NeonButton>

          {result && (
            <GlassCard
              style={{
                borderColor: 'var(--neon-green)',
                background: 'rgba(34, 197, 94, 0.05)'
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--neon-green)', marginBottom: 12 }}>Solution Found</h3>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: 12,
                borderRadius: 8,
                color: '#fff',
                fontFamily: 'monospace',
                marginBottom: 20
              }}>
                {JSON.stringify(result.solution, null, 2)}
              </pre>

              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>Algorithm Steps</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 8 }}>
                <ul style={{ paddingLeft: 20, margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {result.steps.map((s: string, i: number) => (
                    <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
