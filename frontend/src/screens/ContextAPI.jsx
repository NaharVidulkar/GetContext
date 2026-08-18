function JsonBlock({ data }) {
  return (
    <pre style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.7,
      color: '#F3F4F6', backgroundColor: '#090A0F', border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12, padding: 14, overflowX: 'auto', maxWidth: '100%', margin: 0,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word'
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function ContextAPI({ repo, lastRequest, lastResponse }) {
  const hasData = lastRequest && lastResponse;

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 24, overflowWrap: 'break-word', wordBreak: 'break-all' }}>
        <span style={{ color: 'var(--accent-light)' }}>{repo?.fullName}</span> <span>/</span> <span style={{ color: '#FFFFFF', fontWeight: 600 }}>context-api</span>
      </div>

      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 'clamp(22px, 5vw, 26px)', color: '#FFFFFF', margin: '0 0 8px', letterSpacing: '-0.03em', overflowWrap: 'break-word' }}>Context API</h2>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'var(--muted)', margin: '0 0 28px', lineHeight: 1.6, overflowWrap: 'break-word' }}>
        Raw request/response for the last <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-light)' }}>/api/context/query</code> call — this is real API traffic, not a mock.
      </p>

      {!hasData ? (
        <div style={{ backgroundColor: 'rgba(18, 21, 30, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 20, fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--muted)', overflowWrap: 'break-word' }}>
          Ask a question in Context Explorer first — the last real request/response will appear here.
        </div>
      ) : (
        <div data-grid-two style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', overflowWrap: 'break-word' }}>
              <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>POST</span> /api/context/query — REQUEST
            </div>
            <JsonBlock data={lastRequest} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', overflowWrap: 'break-word' }}>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>200</span> RESPONSE
            </div>
            <JsonBlock data={lastResponse} />
          </div>
        </div>
      )}
    </div>
  );
}

