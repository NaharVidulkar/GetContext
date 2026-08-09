import { useState, useEffect } from 'react';
import RepoConnect from './screens/RepoConnect.jsx';
import RepoDashboard from './screens/RepoDashboard.jsx';
import ContextExplorer from './screens/ContextExplorer.jsx';
import AIResponse from './screens/AIResponse.jsx';
import ContextAPI from './screens/ContextAPI.jsx';

const NAV_ITEMS = [
  { id: 'connect', label: 'Connect' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'response', label: 'Response' },
  { id: 'api', label: 'API' },
];

export default function App() {
  const [screen, setScreen] = useState('connect');
  const [repo, setRepo] = useState(null); // real analyze() response
  const [queryResult, setQueryResult] = useState(null); // real query() response
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  // Global cursor ambient glow tracking
  useEffect(() => {
    function handleMouseMove(e) {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  function handleAnalyzed(data) {
    setRepo(data);
    setScreen('dashboard');
  }

  function handleAsked(result) {
    setQueryResult(result);
    setLastRequest({ repositoryId: repo.id, query: result.query });
    setLastResponse(result);
    setScreen('response');
  }

  const canGo = {
    connect: true,
    dashboard: Boolean(repo),
    explorer: Boolean(repo),
    response: Boolean(queryResult),
    api: Boolean(repo),
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Grid & Mouse-Following Glow */}
      <div className="grid-bg" />
      <div className="cursor-glow" />

      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(9, 10, 15, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid rgba(99, 102, 241, 0.5)',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h6M9 12h6M9 15h4" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 17, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              GetContext
            </span>
          </div>

          {/* Navigation Pills */}
          <nav data-app-nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 12,
            padding: '4px 5px',
          }}>
            {NAV_ITEMS.map((item) => {
              const active = screen === item.id;
              const disabled = !canGo[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => canGo[item.id] && setScreen(item.id)}
                  disabled={disabled}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: disabled ? 'rgba(255, 255, 255, 0.25)' : (active ? '#A5B4FC' : 'var(--muted)'),
                    backgroundColor: active ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                    border: active ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                    padding: '6px 16px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    borderRadius: 8,
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.02em' }}>online</span>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {screen === 'connect' && <RepoConnect onAnalyzed={handleAnalyzed} />}
        {screen === 'dashboard' && <RepoDashboard repo={repo} onGoExplorer={() => setScreen('explorer')} />}
        {screen === 'explorer' && <ContextExplorer repo={repo} onAsked={handleAsked} />}
        {screen === 'response' && (
          <AIResponse
            repo={repo}
            queryResult={queryResult}
            onBackToDashboard={() => setScreen('dashboard')}
            onViewApi={() => setScreen('api')}
          />
        )}
        {screen === 'api' && <ContextAPI repo={repo} lastRequest={lastRequest} lastResponse={lastResponse} />}
      </main>
    </div>
  );
}

