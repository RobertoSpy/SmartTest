import React, { useState } from 'react';
import { submitSearchAnswer } from '../api';
import NeonButton from './ui/NeonButton';

interface SearchQuestionProps {
    question: any;
    onUpdate: () => void;
}

const SearchQuestion: React.FC<SearchQuestionProps> = ({ question, onUpdate }) => {
    const [answerText, setAnswerText] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!answerText.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const resp = await submitSearchAnswer(question.id, answerText);
            setResult(resp.result);
            if (onUpdate) onUpdate();
        } catch (err: any) {
            setError(err.message || "Submission Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {question.prompt}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={!!result}
                    placeholder="e.g. A* Admissible"
                    style={{
                        padding: '12px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: 'white'
                    }}
                />
            </div>

            {!result && (
                <NeonButton
                    onClick={handleSubmit}
                    disabled={!answerText.trim() || loading}
                    glow
                >
                    {loading ? "Sending..." : "Submit Answer"}
                </NeonButton>
            )}

            {error && <div style={{ color: 'var(--neon-red)', marginTop: '0.5rem' }}>{error}</div>}

            {result && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '16px',
                    backgroundColor: result.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    border: result.correct ? '1px solid var(--neon-green)' : '1px solid var(--neon-red)'
                }}>
                    <strong style={{ color: result.correct ? 'var(--neon-green)' : 'var(--neon-red)', fontSize: '1.1rem' }}>
                        {result.correct ? "Correct Answer!" : "Incorrect"}
                    </strong>
                    <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{result.explanation}</p>
                    <p style={{ marginTop: 4, fontWeight: 600 }}>Score: {result.score_percent}%</p>

                    {!result.correct && (
                        <div style={{ marginTop: '1rem' }}>
                            <details style={{ cursor: 'pointer' }}>
                                <summary style={{ color: 'var(--text-secondary)' }}>Debug JSON</summary>
                                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchQuestion;
