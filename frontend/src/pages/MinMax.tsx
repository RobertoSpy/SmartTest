import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateMinMaxQuestion, submitMinMaxAnswer, saveCustomMinMaxQuestion } from "../api";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import QuestionsList from "./QuestionsList";

interface TreeNode {
  id: string;
  value?: number;
  children: TreeNode[];
  is_max: boolean;
  x?: number;
  y?: number;
}

// Helper to calculate positions for SVG
const CANVAS_WIDTH = 1200; // Increased from 800
const CANVAS_HEIGHT = 500; // Increased from 400
const LEVEL_HEIGHT = 100; // Increased from 80 for vertical spacing

function calculateLayout(node: TreeNode, x: number, y: number, spread: number): TreeNode {
  const newNode = { ...node, x, y };
  if (newNode.children.length > 0) {
    const childSpread = spread / newNode.children.length;
    newNode.children = newNode.children.map((child, i) => {
      // Calculate offset to center children
      const offset = (i - (newNode.children.length - 1) / 2) * spread;
      return calculateLayout(child, x + offset, y + LEVEL_HEIGHT, childSpread);
    });
  }
  return newNode;
}

export default function MinMax() {
  const [mode, setMode] = useState<"random" | "custom">("random");
  const [difficulty, setDifficulty] = useState("easy");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);

  // Custom Input State
  const [customInput, setCustomInput] = useState("((3,5),(6,9))");
  const [parseError, setParseError] = useState<string | null>(null);

  const [rootVal, setRootVal] = useState("");
  const [visitedCount, setVisitedCount] = useState("");

  const [checkResult, setCheckResult] = useState<any>(null);

  // Layout State
  const [layoutTree, setLayoutTree] = useState<TreeNode | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.tree) {
      // Generated persistence (legacy/mock logic if handled by backend, but here we treat as restoring state)
      // If restoring from history (random or custom), we load it here
      setTree(location.state.tree);
      setDifficulty(location.state.difficulty || "medium");
    }

    if (location.state?.restoreData) {
      // Restore full session
      const d = location.state.restoreData;
      setMode(d.mode || "custom"); // Default to custom if missing, but we'll save mode now
      setCustomInput(d.customInput || "");
      setTree(d.tree);
      setRootVal(d.userAnswer?.rootVal || "");
      setVisitedCount(d.userAnswer?.visitedCount || "");
      setCheckResult(d.checkResult);
      if (d.difficulty) setDifficulty(d.difficulty);
    }
  }, [location.state]);

  useEffect(() => {
    if (tree) {
      // Recalculate layout when tree changes
      // Wider spread for clarity
      const spread = difficulty === 'hard' ? 280 : 350; // Increased spread
      setLayoutTree(calculateLayout(tree, CANVAS_WIDTH / 2, 50, spread));
    } else {
      setLayoutTree(null);
    }
  }, [tree, difficulty]);


  // Basic recursive parser for bracket notation: ((3,5),(6,9))
  function parseBracketTree(input: string): TreeNode {
    let cursor = 0;
    const cleanInput = input.replace(/\s+/g, ""); // remove whitespace

    let nodeIdCounter = 1;

    function parseNode(depth: number): TreeNode {
      const id = String(nodeIdCounter++);
      const is_max = depth % 2 === 0; // Root is MAX (depth 0), depth 1 is MIN, etc.

      if (cursor >= cleanInput.length) {
        throw new Error("Unexpected end of input");
      }

      // Check if leaf (number)
      if (cleanInput[cursor] !== "(") {
        let numStr = "";
        while (cursor < cleanInput.length && /[0-9.-]/.test(cleanInput[cursor])) {
          numStr += cleanInput[cursor];
          cursor++;
        }
        const val = parseInt(numStr);
        if (isNaN(val)) throw new Error(`Invalid number at position ${cursor}`);
        return { id, is_max, children: [], value: val };
      }

      // It's a list of children: (child1, child2, ...)
      cursor++; // skip '('
      const children: TreeNode[] = [];

      while (cursor < cleanInput.length && cleanInput[cursor] !== ")") {
        children.push(parseNode(depth + 1));
        if (cleanInput[cursor] === ",") {
          cursor++; // skip comma
        }
      }

      if (cleanInput[cursor] !== ")") throw new Error("Missing closing parenthesis");
      cursor++; // skip ')'

      return { id, is_max, children, value: undefined };
    }

    const root = parseNode(0);
    if (cursor < cleanInput.length) throw new Error("Extra characters after tree definition");
    return root;
  }

  function handleCustomGenerate() {
    try {
      setParseError(null);
      setCheckResult(null);
      setRootVal("");
      setVisitedCount("");

      const parsed = parseBracketTree(customInput);
      setTree(parsed);
    } catch (e: any) {
      setParseError("Format invalid: " + e.message);
      setTree(null);
    }
  }

  // Helper to save mock questions
  const saveMock = (q: any) => {
    const local = localStorage.getItem('mock_history');
    const arr = local ? JSON.parse(local) : [];
    arr.push(q);
    localStorage.setItem('mock_history', JSON.stringify(arr));
  };

  async function handleGenerate() {
    try {
      setLoading(true);
      setCheckResult(null);
      setRootVal("");
      setVisitedCount("");
      const res = await generateMinMaxQuestion(difficulty);
      setTree(res.tree);

      setTree(res.tree);

      // Backend saves history automatically
      setRefreshKey(k => k + 1); // Trigger refresh

    } catch (err: any) {
      alert("Eroare la generare: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!tree) return;
    try {
      setLoading(true);
      const rVal = parseInt(rootVal);
      const vCount = parseInt(visitedCount);

      if (isNaN(rVal) || isNaN(vCount)) {
        alert("Te rog introdu valori numerice valide.");
        return;
      }

      const res = await submitMinMaxAnswer(tree, rVal, vCount);
      setCheckResult(res);

      // Save to History (Custom Mode only - Random is handled by Backend persistence)
      if (mode === "custom") {
        await saveCustomMinMaxQuestion({
          tree,
          prompt: `Custom Tree Solve - ${new Date().toLocaleTimeString()} (DB)`,
          custom_input: customInput,
          user_answer: { rootVal: String(rVal), visitedCount: String(vCount) },
          check_result: res
        });
        setRefreshKey(k => k + 1); // Trigger refresh
      }

    } catch (err: any) {
      alert("Eroare la verificare: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to save to local mock history
  const saveToMockHistory = (item: any) => {
    try {
      const local = localStorage.getItem('mock_history');
      const arr = local ? JSON.parse(local) : [];
      arr.push(item);
      localStorage.setItem('mock_history', JSON.stringify(arr));
    } catch (e) {
      console.error("Failed to save to mock history", e);
    }
  };

  // Recursive SVG Renderer
  const renderTreeSVG = (node: TreeNode) => {
    if (!node.x || !node.y) return null;

    return (
      <React.Fragment key={node.id}>
        {/* Lines to children */}
        {node.children.map(child => (
          <line
            key={`line-${node.id}-${child.id}`}
            x1={node.x} y1={node.y}
            x2={child.x} y2={child.y}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
        ))}
        {/* Render Children */}
        {node.children.map(child => renderTreeSVG(child))}

        {/* Node Circle */}
        <g transform={`translate(${node.x}, ${node.y})`}>
          <circle
            r="18"
            fill={node.is_max ? "var(--neon-red)" : "var(--neon-blue)"}
            stroke="#fff"
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 8px ${node.is_max ? "var(--neon-red)" : "var(--neon-blue)"})` }}
          />
          <text
            dy="5"
            textAnchor="middle"
            fill="#fff"
            fontWeight="bold"
            fontSize="12px"
            style={{ pointerEvents: 'none' }}
          >
            {node.children.length === 0 ? node.value : (node.is_max ? "MAX" : "MIN")}
          </text>
        </g>
      </React.Fragment>
    );
  };

  return (
    <div style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h2 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>MinMax Alpha-Beta</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Visualize and solve MinMax trees with Alpha-Beta pruning cuts.
        </p>
      </header>

      {/* Controls */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setMode("random")}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: mode === "random" ? 'var(--bg-card)' : 'transparent',
                color: mode === "random" ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Random
            </button>
            <button
              onClick={() => setMode("custom")}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: mode === "custom" ? 'var(--bg-card)' : 'transparent',
                color: mode === "custom" ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Custom Input
            </button>
          </div>

          {mode === "random" && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155'
                }}
              >
                <option value="easy">Easy (Depth 2)</option>
                <option value="medium">Medium (Depth 3)</option>
                <option value="hard">Hard (Depth 4)</option>
              </select>
              <NeonButton
                onClick={handleGenerate}
                disabled={loading}
                glow
                style={{ background: '#ea580c', color: 'white', border: 'none' }}
              >
                {loading ? "Generating..." : "Generate Tree"}
              </NeonButton>
            </div>
          )}
        </div>

        {mode === "custom" && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  fontFamily: 'monospace'
                }}
                placeholder="((3,5),(6,9))"
              />
              <NeonButton
                onClick={handleCustomGenerate}
                variant="primary"
                style={{ background: '#ea580c', color: 'white', border: 'none' }}
              >
                Visualize
              </NeonButton>
            </div>
            {parseError && <div style={{ color: 'var(--neon-red)', marginTop: 8, fontSize: '0.9rem' }}>{parseError}</div>}
          </div>
        )}
      </GlassCard>

      {/* Visualization Area */}
      {layoutTree && (
        <GlassCard style={{ padding: 0, overflowX: 'auto', display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ minWidth: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={`${0} ${0} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}>
              {renderTreeSVG(layoutTree)}
            </svg>
          </div>
        </GlassCard>
      )}

      {/* Answer Section */}
      {tree && (
        <GlassCard header={<h3 style={{ margin: 0 }}>Submit Solution</h3>}>
          <div style={{ display: "flex", gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Root Value</label>
              <input
                type="number"
                value={rootVal}
                onChange={e => setRootVal(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  width: '120px'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Visited Leaves</label>
              <input
                type="number"
                value={visitedCount}
                onChange={e => setVisitedCount(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  width: '120px'
                }}
              />
            </div>

            <NeonButton
              onClick={handleSubmit}
              disabled={loading}
              variant="primary"
              style={{ marginTop: 'auto', alignSelf: 'flex-end', height: '40px', background: '#ea580c', color: 'white', border: 'none' }}
            >
              Check Answer
            </NeonButton>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {
        checkResult && (
          <GlassCard
            style={{
              border: checkResult.correct ? '1px solid var(--neon-green)' : '1px solid var(--neon-red)',
              background: checkResult.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: checkResult.correct ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                {checkResult.message}
              </h3>
            </div>

            {!checkResult.correct && (
              <div style={{ marginBottom: 12, color: 'var(--text-primary)' }}>
                <p>Correct Root Value: <b style={{ color: 'var(--neon-green)' }}>{checkResult.correct_root_value}</b></p>
                <p>Correct Visited Leaves: <b style={{ color: 'var(--neon-green)' }}>{checkResult.correct_visited_leaves}</b></p>
              </div>
            )}

            {checkResult.explanation && (
              <div style={{
                marginTop: 16,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                background: "rgba(0,0,0,0.3)",
                padding: 12,
                borderRadius: 8,
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Trace:</strong><br />
                {checkResult.explanation}
              </div>
            )}
          </GlassCard>
        )
      }

      {/* History Section */}
      <GlassCard header={<h3 style={{ margin: 0 }}>MinMax History</h3>}>
        <QuestionsList filterType="all_context" contextMode="minmax" refreshKey={refreshKey} />
      </GlassCard>

    </div >
  );
}
