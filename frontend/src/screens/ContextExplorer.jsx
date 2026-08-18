import { useState } from 'react';
import { queryContext } from '../api.js';
import { PrimaryButton, ErrorBanner } from '../components/ui.jsx';

const SUGGESTED = [
  'How does authentication work in this project?',
  'What does the main entry point do?',
  'How are tasks stored and retrieved?',
];

function RelevanceBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <div style={{ width: 48, height: 4, backgroundColor: 'var(--border)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, right: `${100 - pct}%`, backgroundColor: 'var(--accent)' }} />
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent)', minWidth: 30 }}>{score}</span>
    </div>
  );
}

function ResultCard({ result, rank, maxScore }) {
  const [expanded, setExpanded] = useState(rank === 1);
  return (
    <div style={{
      backgroundColor: 'rgba(18, 21, 30, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 14,
      overflow: 'hidden'
    }}>
      <div onClick={() => setExpanded((v) => !v)} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#FFFFFF', backgroundColor: 'var(--accent)', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>#{rank}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#A5B4FC', fontWeight: 600, flex: 1, minWidth: 160 }}>{result.path}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>{result.tokenEstimate} tok</span>
        <RelevanceBar score={result.relevanceScore} maxScore={maxScore} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 20px 20px' }}>
          <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', backgroundColor: '#090A0F', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, padding: '14px 18px', margin: '18px 0 0', overflow: 'auto', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            <code>{result.snippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ContextExplorer({ repo, onAsked }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleAsk(q) {
    const text = (q ?? query).trim();
    if (!text) { setError('Enter a question first.'); return; }
    setQuery(text);
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await queryContext(repo.id, text);
      setResult({ ...data, query: text });
    } catch (err) {
      setError(err.message || 'Failed to retrieve context.');
    } finally {
      setLoading(false);
    }
  }

  const maxScore = result ? Math.max(1, ...result.relevantFiles.map((f) => f.relevanceScore)) : 1;

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 24, overflowWrap: 'break-word', wordBreak: 'break-all' }}>
        <span style={{ color: 'var(--accent-light)' }}>{repo?.fullName}</span> <span>/</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>context-explorer</span>
      </div>

      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 5vw, 26px)', color: '#FFFFFF', margin: '0 0 8px', letterSpacing: '-0.03em', overflowWrap: 'break-word' }}>Context Explorer</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'var(--muted)', margin: '0 0 28px', lineHeight: 1.6, overflowWrap: 'break-word' }}>
        Ask a question about the codebase. Relevant files are ranked and returned as compressed context.
      </p>

      <ErrorBanner message={error} />

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 220,
            backgroundColor: '#090A0F',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            padding: '4px 16px',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--accent-light)', marginRight: 12, flexShrink: 0 }}>&gt;_</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
              placeholder="Ask anything about the codebase…"
              style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 14, padding: '10px 0', outline: 'none' }}
            />
          </div>
          <PrimaryButton onClick={() => handleAsk()} disabled={loading} style={{ flexShrink: 0, height: 48, borderRadius: 14, padding: '0 24px', minWidth: 90 }}>
            {loading ? '…' : 'Ask →'}
          </PrimaryButton>
        </div>

        {!result && !loading && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => handleAsk(s)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--muted)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  borderRadius: 10,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  overflowWrap: 'break-word',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundColor: 'rgba(18, 21, 30, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 20, opacity: 1 - i * 0.15 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ height: 14, width: 220, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 14, width: 60, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, marginLeft: 'auto', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
              <div style={{ height: 60, backgroundColor: '#090A0F', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }} />
            </div>
          ))}
        </div>
      )}

      {result && !loading && (
        <>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--success)' }}>✓</span>
            <span>{result.relevantFiles.length} relevant file{result.relevantFiles.length === 1 ? '' : 's'} · {result.contextTokens} context tokens</span>
          </div>
          {result.relevantFiles.length === 0 ? (
            <div style={{ backgroundColor: 'rgba(18, 21, 30, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 20, fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--muted)' }}>
              No relevant files were found for this question. Try rephrasing, or ask about something visible in the repository.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {result.relevantFiles.map((r, i) => (
                <ResultCard key={r.path} result={r} rank={i + 1} maxScore={maxScore} />
              ))}
            </div>
          )}
          {result.relevantFiles.length > 0 && (
            <div className="responsive-btn-row" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton onClick={() => onAsked(result)} style={{ minHeight: 44 }}>Generate AI Response →</PrimaryButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}

