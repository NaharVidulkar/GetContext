import { PrimaryButton, GhostButton } from '../components/ui.jsx';

function MarkdownLite({ text }) {
  const lines = (text || '').split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} style={{ margin: '16px 0 6px', fontWeight: 600, color: 'var(--text)' }}>{line.slice(2, -2)}</p>;
        }
        if (/^\d+\. /.test(line)) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, margin: '6px 0' }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, flexShrink: 0 }}>{line.slice(0, 2)}</span>
              <span style={{ color: 'var(--text)' }}>{renderInlineCode(line.slice(3))}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        return <p key={i} style={{ margin: '4px 0', lineHeight: 1.8 }}>{renderInlineCode(line)}</p>;
      })}
    </>
  );
}

function renderInlineCode(line) {
  const parts = line.split(/(`[^`]+`)/);
  return parts.map((part, j) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={j} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)', backgroundColor: 'rgba(34,211,238,0.08)', padding: '1px 5px' }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AIResponse({ repo, queryResult, onBackToDashboard, onViewApi }) {
  if (!queryResult) return null;

  const before = queryResult.repositoryTokens || 0;
  const after = queryResult.contextTokens || 0;
  const reduction = queryResult.reductionPercentage ?? 0;

  function handleResumeThisAnswer() {
    const filesText = queryResult.relevantFiles.map((f) => `### ${f.path}\n\n\`\`\`\n${f.snippet}\n\`\`\``).join('\n\n');
    const md = `## Repository Context: ${repo?.fullName || ''}\n\n**Question:** ${queryResult.query}\n\n**Relevant files** (${after} tokens vs ${before} full repo — ${reduction}% reduction):\n\n${filesText}\n\n---\nPaste this into ChatGPT, Claude, or any other AI assistant along with your question — it already has the exact context needed.\n`;
    downloadMarkdown('getcontext-answer-context.md', md);
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 24, overflowWrap: 'break-word', wordBreak: 'break-all' }}>
        <span style={{ color: 'var(--accent-light)' }}>{repo?.fullName}</span> <span>/</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>ai-response</span>
      </div>

      <div data-grid-response style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          {/* Main Answer Card */}
          <div style={{
            backgroundColor: 'rgba(18, 21, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: '24px 20px',
            marginBottom: 20,
            minWidth: 0
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#A5B4FC', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> RESPONSE · {queryResult.answerSource === 'gemini' ? 'gemini 1.5' : 'offline fallback'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#F3F4F6', lineHeight: 1.8, overflowWrap: 'break-word' }}>
              <MarkdownLite text={queryResult.answer} />
            </div>
          </div>

          {/* Files Used Card */}
          <div style={{
            backgroundColor: 'rgba(18, 21, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            overflow: 'hidden',
            minWidth: 0
          }}>
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 20px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#A5B4FC', fontWeight: 600 }}>FILES USED IN CONTEXT</span>
            </div>
            {queryResult.relevantFiles.map((f, i) => (
              <div key={f.path} style={{ padding: '12px 20px', borderBottom: i < queryResult.relevantFiles.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-light)', fontWeight: 500, flex: 1, minWidth: 120, overflowWrap: 'break-word', wordBreak: 'break-all' }}>{f.path}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{f.tokenEstimate.toLocaleString()} tok</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compression Metrics Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{
            backgroundColor: 'rgba(18, 21, 30, 0.9)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 20,
            padding: '24px 20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(99, 102, 241, 0.12)',
            boxSizing: 'border-box'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderLeft: '36px solid transparent', borderTop: '36px solid var(--accent)', opacity: 0.4 }} />

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#A5B4FC', letterSpacing: '0.12em', marginBottom: 20, fontWeight: 700 }}>TOKEN COMPRESSION</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>BEFORE</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 30px)', color: 'var(--muted)', letterSpacing: '-0.04em' }}>{before.toLocaleString()}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>tokens</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, color: 'var(--accent-light)' }}>→</div>
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--success)', marginBottom: 4 }}>AFTER</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 30px)', color: '#FFFFFF', letterSpacing: '-0.04em' }}>{after.toLocaleString()}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>tokens</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ height: 8, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, position: 'relative', marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${before ? (after / before) * 100 : 0}%`, backgroundColor: 'var(--accent)', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>0</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>{before.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)' }}>compression</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', color: '#A5B4FC', letterSpacing: '-0.04em' }}>{reduction}% smaller</span>
            </div>
          </div>

          <PrimaryButton onClick={handleResumeThisAnswer} style={{ width: '100%', minHeight: 46 }}>Resume in New Agent →</PrimaryButton>
          <GhostButton onClick={onViewApi} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>View raw API response →</GhostButton>
          <GhostButton onClick={onBackToDashboard} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>← Back to dashboard</GhostButton>
        </div>
      </div>
    </div>
  );
}

