import React, { useState } from 'react';
import { submitSearchAnswer } from '../api';

interface SearchQuestionProps {
    question: any;
    onUpdate: () => void;
}

const SearchQuestion: React.FC<SearchQuestionProps> = ({ question, onUpdate }) => {
    const [answerText, setAnswerText] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { problem_name, instance_text } = question.data;

    const handleSubmit = async () => {
        if (!answerText.trim()) return;
        setLoading(true);
        setError(null);
        try {
            // Use submitSearchAnswer targeting /api/questions/search/...
            const resp = await submitSearchAnswer(question.id, answerText);
            setResult(resp.result);
            if (onUpdate) onUpdate();
        } catch (err: any) {
            setError(err.message || "Eroare la trimitere");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem', borderRadius: '8px' }}>
            <div style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap', fontSize: '1.1rem', lineHeight: '1.6' }}>
                {question.prompt}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={!!result}
                    placeholder="Ex: A* Admisibilă"
                    style={{ padding: '0.5rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>

            {!result && (
                <button
                    onClick={handleSubmit}
                    disabled={!answerText.trim() || loading}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
                >
                    {loading ? "Se trimite..." : "Trimite Răspuns"}
                </button>
            )}

            {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}

            {result && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: result.correct ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
                    <strong>{result.correct ? "Răspuns Corect!" : "Răspuns Greșit"}</strong>
                    <p>{result.explanation}</p>
                    <p>Scor: {result.score_percent}%</p>

                    {!result.correct && (
                        <div style={{ marginTop: '1rem' }}>
                            <details>
                                <summary style={{ cursor: 'pointer', color: '#666' }}>Vezi JSON (Debug)</summary>
                                <pre style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', overflowX: 'auto', fontSize: '0.85rem' }}>
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
