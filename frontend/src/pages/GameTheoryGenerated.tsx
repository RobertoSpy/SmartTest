import React, { useState } from "react";
import QuestionsList from "./QuestionsList";
import { generateGameTheoryQuestions, solveGameTheoryScenario } from "../api";
import NeonButton from "../components/ui/NeonButton";
import GlassCard from "../components/ui/GlassCard";

// Types for Custom Solver
type QuestionType = 'dominant_strategy' | 'best_strategy' | 'pareto_optimality';

export default function GameTheoryGenerated({ onGenerated }: { onGenerated?: () => void }) {
    // Mode State
    const [mode, setMode] = useState<'generate' | 'solve'>('generate');

    // Generator State
    const [count, setCount] = useState<number>(5);
    const [genLoading, setGenLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Solver State
    const [matrixSize, setMatrixSize] = useState<{ m: number; n: number }>({ m: 2, n: 2 });
    // Use strings for matrix state to allow "", "-", etc.
    const [matrix, setMatrix] = useState<string[][][]>([
        [["0", "0"], ["0", "0"]],
        [["0", "0"], ["0", "0"]]
    ]);
    const [playerRow, setPlayerRow] = useState("Player A");
    const [playerCol, setPlayerCol] = useState("Player B");
    const [rowLabels, setRowLabels] = useState<string[]>(["R1", "R2"]);
    const [colLabels, setColLabels] = useState<string[]>(["C1", "C2"]);
    const [selectedQType, setSelectedQType] = useState<QuestionType>('dominant_strategy');
    const [solveLoading, setSolveLoading] = useState(false);
    const [solveResult, setSolveResult] = useState<{ solution: string; explanation: string } | null>(null);

    // Generator Handlers
    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setGenLoading(true);
        try {
            await generateGameTheoryQuestions(count);
            setRefreshTrigger(prev => prev + 1);
            onGenerated && onGenerated();
        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err?.message || err}`);
        } finally {
            setGenLoading(false);
        }
    }

    // Solver Handlers
    const handleResize = (m: number, n: number) => {
        const newMat: string[][][] = [];
        const newRLabels: string[] = [];
        const newCLabels: string[] = [];

        for (let i = 0; i < m; i++) {
            const row: string[][] = [];
            newRLabels.push(rowLabels[i] || `R${i + 1}`);
            for (let j = 0; j < n; j++) {
                if (i < matrix.length && j < matrix[0].length) {
                    row.push(matrix[i][j]);
                } else {
                    row.push(["0", "0"]);
                }
            }
            newMat.push(row);
        }
        for (let j = 0; j < n; j++) {
            newCLabels.push(colLabels[j] || `C${j + 1}`);
        }
        setMatrixSize({ m, n });
        setMatrix(newMat);
        setRowLabels(newRLabels);
        setColLabels(newCLabels);
    };

    const updateCell = (r: number, c: number, pIdx: 0 | 1, value: string) => {
        const copy = [...matrix];
        copy[r] = [...copy[r]];
        copy[r][c] = [...copy[r][c]];
        copy[r][c][pIdx] = value;
        setMatrix(copy);
    };

    const handleSolve = async (e: React.FormEvent) => {
        e.preventDefault();
        setSolveLoading(true);
        setSolveResult(null);

        // Parse matrix to numbers
        const numericMatrix = matrix.map(row =>
            row.map(cell => [
                Number(cell[0]) || 0,
                Number(cell[1]) || 0
            ])
        );

        try {
            const res = await solveGameTheoryScenario({
                matrix: numericMatrix,
                q_type: selectedQType,
                row_labels: rowLabels,
                col_labels: colLabels,
                player_row: playerRow,
                player_col: playerCol
            });
            setSolveResult(res);
            setRefreshTrigger(prev => prev + 1); // Refresh history
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setSolveLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <h2 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>Game Theory</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Generate practice questions or solve custom scenarios.
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <NeonButton
                        onClick={() => setMode("generate")}
                        variant={mode === "generate" ? "primary" : "ghost"}
                        style={{ fontSize: "0.85rem", padding: "6px 16px" }}
                    >
                        Generate (AI)
                    </NeonButton>
                    <NeonButton
                        onClick={() => setMode("solve")}
                        variant={mode === "solve" ? "primary" : "ghost"}
                        style={{ fontSize: "0.85rem", padding: "6px 16px" }}
                    >
                        Custom Input (Solve)
                    </NeonButton>
                </div>
            </header>

            {mode === 'generate' ? (
                <GlassCard>
                    <form onSubmit={handleGenerate}>
                        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Count</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value) || 1)}
                                    style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
                                />
                            </label>

                            <NeonButton
                                type="submit"
                                disabled={genLoading}
                                glow
                                style={{
                                    background: '#ea580c',
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                {genLoading ? "Generating..." : "Generate Batch"}
                            </NeonButton>
                        </div>
                    </form>
                </GlassCard>
            ) : (
                <GlassCard>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'center' }}>
                        <label style={{ color: 'white' }}>
                            Rows:
                            <select
                                value={matrixSize.m}
                                onChange={e => handleResize(parseInt(e.target.value), matrixSize.n)}
                                style={{ marginLeft: 8, padding: 4, background: '#333', color: 'white', border: '1px solid #555' }}
                            >
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                            </select>
                        </label>
                        <label style={{ color: 'white' }}>
                            Cols:
                            <select
                                value={matrixSize.n}
                                onChange={e => handleResize(matrixSize.m, parseInt(e.target.value))}
                                style={{ marginLeft: 8, padding: 4, background: '#333', color: 'white', border: '1px solid #555' }}
                            >
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <input
                                placeholder="Player A Name"
                                value={playerRow}
                                onChange={e => setPlayerRow(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: 8, color: 'white' }}
                            />
                            <input
                                placeholder="Player B Name"
                                value={playerCol}
                                onChange={e => setPlayerCol(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: 8, color: 'white' }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
                        <table style={{ borderCollapse: 'collapse', color: 'white' }}>
                            <thead>
                                <tr>
                                    <th />
                                    {colLabels.map((lbl, j) => (
                                        <th key={j} style={{ padding: 10 }}>
                                            <input
                                                value={lbl}
                                                onChange={(e) => {
                                                    const copy = [...colLabels];
                                                    copy[j] = e.target.value;
                                                    setColLabels(copy);
                                                }}
                                                style={{ width: 60, textAlign: 'center', background: 'transparent', border: '1px solid #555', color: 'white' }}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matrix.map((row, i) => (
                                    <tr key={i}>
                                        <th style={{ padding: 10 }}>
                                            <input
                                                value={rowLabels[i]}
                                                onChange={(e) => {
                                                    const copy = [...rowLabels];
                                                    copy[i] = e.target.value;
                                                    setRowLabels(copy);
                                                }}
                                                style={{ width: 60, textAlign: 'center', background: 'transparent', border: '1px solid #555', color: 'white' }}
                                            />
                                        </th>
                                        {row.map((cell, j) => (
                                            <td key={j} style={{ padding: 10, border: '1px solid #444' }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <input
                                                        type="number"
                                                        value={cell[0]}
                                                        onChange={e => updateCell(i, j, 0, e.target.value)}
                                                        style={{ width: 60, padding: '4px', background: '#222', color: '#a5b4fc', border: '1px solid #444', borderRadius: 4, textAlign: 'center' }}
                                                    />
                                                    <span style={{ color: '#666' }}>,</span>
                                                    <input
                                                        type="number"
                                                        value={cell[1]}
                                                        onChange={e => updateCell(i, j, 1, e.target.value)}
                                                        style={{ width: 60, padding: '4px', background: '#222', color: '#fdba74', border: '1px solid #444', borderRadius: 4, textAlign: 'center' }}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', color: 'white', gap: 6 }}>
                            Question Type
                            <select
                                value={selectedQType}
                                onChange={(e) => setSelectedQType(e.target.value as QuestionType)}
                                style={{ padding: 10, borderRadius: 6, background: '#222', color: 'white', border: '1px solid #555' }}
                            >
                                <option value="dominant_strategy">Is there a Dominant Strategy?</option>
                                <option value="best_strategy">What is the Best Strategy?</option>
                                <option value="pareto_optimality">Is it Pareto Optimal?</option>
                            </select>
                        </label>

                        <NeonButton onClick={handleSolve} disabled={solveLoading} glow variant="primary">
                            {solveLoading ? "Solving..." : "Solve Scenario"}
                        </NeonButton>
                    </div>

                    {solveResult && (
                        <div style={{ marginTop: 30, padding: 20, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--neon-green)', borderRadius: 12 }}>
                            <h3 style={{ color: 'var(--neon-green)', marginTop: 0 }}>Solution: {solveResult.solution}</h3>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#ddd', lineHeight: 1.5 }}>
                                {solveResult.explanation}
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            <div style={{ marginTop: '0px' }}>
                <QuestionsList
                    contextMode="game theory"
                    refreshKey={refreshTrigger}
                />
            </div>
        </div>
    );
}
