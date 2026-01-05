import React, { useEffect, useState } from "react";
import { listQuestions, deleteQuestion } from "../api";
import { useNavigate } from "react-router-dom";
import NeonButton from "../components/ui/NeonButton";
import { Trash2, Filter } from "lucide-react";

export default function QuestionsList({
  onOpen,
  filterType: initialFilterType,
  refreshKey,
  showFilter = true,
  contextMode = 'global'
}: {
  onOpen?: (id: string) => void;
  filterType?: string;
  refreshKey?: number;
  showFilter?: boolean;
  contextMode?: 'global' | 'nash' | 'minmax' | 'search' | 'game theory';
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(initialFilterType || "all");
  const navigate = useNavigate();

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch persistent API questions
      const res = await listQuestions();
      let persistentQs = res.questions || [];

      // 2. Fetch local storage "mock" questions (MinMax/CSP)
      let mockQs: any[] = [];
      try {
        const local = localStorage.getItem('mock_history');
        if (local) {
          mockQs = JSON.parse(local);
        }
      } catch (e) {
        console.warn("Failed to parse mock history");
      }

      // 3. Merge
      let allQs = [...persistentQs, ...mockQs];

      // 4. Sort by date desc
      allQs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 5. Filter
      if (activeCategory !== "all" && activeCategory !== "all_context") {
        allQs = allQs.filter((q: any) => {
          const { cat, sub } = getHierarchy(q.type);

          if (contextMode === 'global') {
            return cat.toLowerCase() === activeCategory.toLowerCase();
          } else {
            // In context mode, 'activeCategory' (which acts as sub-filter here) might match 'sub' or be 'all'
            // But we ALSO must ensure the basic category matches the context mode!
            const contextsMsg = contextMode.toLowerCase();
            const itemCat = cat.toLowerCase();
            if (itemCat !== contextsMsg) return false;

            // Now filter by sub-type
            // activeCategory holds the SUB filter value or 'all'
            if (activeCategory === 'all_context') return true;
            // fuzzy match sub
            return sub.toLowerCase().includes(activeCategory.toLowerCase());
          }
        });
      } else if (contextMode !== 'global') {
        // Active category is "all" or "all_context", but we are in a context mode (e.g. Nash page).
        // We must still filter by the context!
        allQs = allQs.filter((q: any) => {
          const { cat } = getHierarchy(q.type);
          return cat.toLowerCase() === contextMode.toLowerCase();
        });
      }

      setQuestions(allQs);
    } catch (err) {
      setError("Could not load questions list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // When context changes, reset active filter to efficient default
    if (contextMode !== 'global') {
      setActiveCategory("all_context");
    } else {
      setActiveCategory(initialFilterType || "all");
    }
  }, [initialFilterType, contextMode]);

  useEffect(() => {
    fetchList();
  }, [activeCategory, refreshKey, contextMode]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this item?")) return;

    // Check if it's a mock question (starts with 'mock-')
    if (id.startsWith('mock-')) {
      const local = localStorage.getItem('mock_history');
      if (local) {
        const arr = JSON.parse(local).filter((q: any) => q.id !== id);
        localStorage.setItem('mock_history', JSON.stringify(arr));
        setQuestions(prev => prev.filter(q => q.id !== id));
      }
      return;
    }

    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  }

  const openQuestion = (q: any) => {
    // If it's a MinMax or CSP mock, we navigate to their page with state
    if (q.type === 'minmax_generated') {
      navigate('/minmax', { state: { tree: q.data?.tree, difficulty: q.data?.difficulty } });
      return;
    }
    if (q.type === 'minmax_custom' || q.type === 'minmax_random') {
      navigate('/minmax', { state: { restoreData: q.data } });
      return;
    }
    if (q.type === 'csp_generated') {
      navigate('/csp', { state: { problem: q.data?.problem } });
      return;
    }

    if (onOpen) {
      onOpen(q.id);
      return;
    }
    navigate(`/question/${encodeURIComponent(q.id)}`);
  };

  const getHierarchy = (t?: string) => {
    if (!t) return { cat: "General", sub: "Unknown" };
    if (t === "normal_form_game") return { cat: "Nash", sub: "Equilibrium" };
    if (t === "normal_form_game_custom_student_input") return { cat: "Nash", sub: "Student Task" };
    if (t === "search_problem_identification") return { cat: "Search", sub: "Problem ID" };
    if (t === "minmax_generated") return { cat: "MinMax", sub: "Alpha-Beta Tree" };
    if (t === "minmax_custom") return { cat: "MinMax", sub: "Custom" };
    if (t === "minmax_random") return { cat: "MinMax", sub: "Random" };
    if (t === "csp_generated") return { cat: "CSP", sub: "Validation" };

    if (t.startsWith("game_theory")) {
      // e.g. game_theory_pareto_optimality -> Pareto Optimality
      // e.g. game_theory_dominant_strategy -> Dominant Strategy
      // e.g. game_theory_named -> Named Game (legacy fallback)
      const subRaw = t.replace("game_theory_", "").replace(/_/g, " ");
      const sub = subRaw.charAt(0).toUpperCase() + subRaw.slice(1);
      return { cat: "Game Theory", sub: sub };
    }
    return { cat: "System", sub: t };
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div style={{ marginTop: '0px' }}>

      {/* Header / Filter Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>History / Archive</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{questions.length}</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {showFilter && (
            <div style={{ position: 'relative' }}>
              <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: '#000'
                }}
              >
                {contextMode === 'global' && (
                  <>
                    <option value="all">All Categories</option>
                    <option value="nash">Nash (All)</option>
                    <option value="game theory">Game Theory</option>
                    <option value="search">Search</option>
                    <option value="minmax">MinMax</option>
                    <option value="csp">CSP</option>
                  </>
                )}

                {contextMode === 'nash' && (
                  <>
                    <option value="all_context">All Nash</option>
                    <option value="equilibrium">Equilibrium</option>
                    <option value="student">Student Task</option>
                  </>
                )}

                {contextMode === 'minmax' && (
                  <>
                    <option value="all_context">All MinMax</option>
                    <option value="alpha-beta tree">Alpha-Beta Tree</option>
                    {/* If we had more types */}
                  </>
                )}

                {contextMode === 'search' && (
                  <>
                    <option value="all_context">All Search</option>
                    <option value="problem id">Problem ID</option>
                  </>
                )}

              </select>
            </div>
          )}
          <NeonButton onClick={fetchList} disabled={loading} variant="ghost" style={{ fontSize: '0.8rem', padding: '8px 12px', color: '#fff', border: '1px solid #444' }}>
            Refresh
          </NeonButton>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {questions.length === 0 && !loading && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', border: '1px dashed #444', borderRadius: '12px' }}>
          No questions found.
        </div>
      )}

      {loading && questions.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Loading archive...</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions.map((q) => {
          const { cat, sub } = getHierarchy(q.type);
          return (
            <div
              key={q.id}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: '8px' }}>
                  {/* Category Badge */}
                  <div style={{
                    background: '#ea580c',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {cat}
                  </div>
                  {/* Sub Label */}
                  <div style={{ fontSize: '0.7rem', color: '#aaa' }}>▶</div>
                  <div style={{
                    color: '#a5b4fc',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {sub}
                  </div>

                  <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: 'auto' }}>
                    {formatDateTime(q.created_at)}
                  </span>
                </div>

                <div style={{ color: "#fff", fontWeight: 500, fontSize: '0.95rem' }}>
                  {q.prompt ? (q.prompt.length > 80 ? q.prompt.slice(0, 80) + "…" : q.prompt) : "No Prompt / Question"}
                </div>
              </div>

              <div style={{ marginLeft: 20, display: "flex", gap: 8, alignItems: "center" }}>
                <NeonButton
                  onClick={() => openQuestion(q)}
                  style={{
                    // Butonul de View PORTOCALIU requested
                    background: '#ea580c',
                    border: 'none',
                    color: 'white',
                    padding: '8px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    borderRadius: '6px'
                  }}
                >
                  View
                </NeonButton>
                <button
                  onClick={() => handleDelete(q.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: 6 }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}