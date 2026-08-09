import { useState } from 'react';
import { analyzeRepository } from '../api.js';
import { PrimaryButton, GhostButton, Spinner, ErrorBanner } from '../components/ui.jsx';

function validate(val) {
  if (!val.startsWith('https://github.com/')) return 'Must be a valid GitHub repository URL';
  if (val.split('/').filter(Boolean).length < 4) return 'URL must include owner/repo (e.g. github.com/owner/repo)';
  return '';
}

export default function RepoConnect({ onAnalyzed }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function runAnalyze(targetUrl) {
    setError('');
    setLoading(true);
    try {
      const data = await analyzeRepository(targetUrl);
      onAnalyzed(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(url);
    if (err) { setError(err); return; }
    runAnalyze(url);
  }

  function handleDemo() {
    setUrl('demo');
    runAnalyze('demo');
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      
      {/* Hero Header */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(32px, 5vw, 52px)',
          color: '#FFFFFF',
          textAlign: 'center',
          margin: '0 0 16px',
          lineHeight: 1.15,
          letterSpacing: '-0.035em',
          maxWidth: 720
        }}>
          Pick up exactly<br />where you left off.
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 17,
          color: '#9CA3AF',
          textAlign: 'center',
          maxWidth: 580,
          margin: '0 0 44px',
          lineHeight: 1.65,
          letterSpacing: '-0.01em'
        }}>
          Compress your codebase into a precise, ranked context payload — so AI agents never waste tokens reloading what they already know.
        </p>

        {/* Card Container matching reference screenshot */}
        <div style={{
          width: '100%',
          maxWidth: 580,
          backgroundColor: 'rgba(18, 21, 30, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          
          {/* Card Label */}
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            color: '#9CA3AF',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M8 12h8" />
            </svg>
            <span>connect repository</span>
          </div>

          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Input Field */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 14, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M7 8l4 4-4 4M13 16h4" />
                </svg>
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                placeholder="github.com/owner/repository"
                style={{
                  width: '100%',
                  backgroundColor: '#090A0F',
                  border: `1px solid ${error ? 'var(--error)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 12,
                  color: '#FFFFFF',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 14,
                  padding: '13px 14px 13px 40px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'var(--error)' : 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {/* Vibrant Purple Button matching screenshot */}
            <PrimaryButton type="submit" disabled={loading} style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 15 }}>
              {loading ? (
                <><Spinner /> Analyzing repository…</>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Analyze repository
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M10 8l4 4-4 4" />
                  </svg>
                </span>
              )}
            </PrimaryButton>
          </form>

          {/* Quick Demo button */}
          <div style={{ marginTop: 16 }}>
            <GhostButton onClick={handleDemo} disabled={loading} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
              ⚡ Try instant demo repository
            </GhostButton>
          </div>
        </div>

        {/* Footer Badges matching reference screenshot */}
        <div style={{ marginTop: 44, display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            'Read-only access',
            'No code stored',
            'Context computed on-demand'
          ].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: '1px solid rgba(248, 113, 113, 0.4)',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                color: '#F87171',
                fontSize: 10,
                fontWeight: 700
              }}>
                ✓
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

