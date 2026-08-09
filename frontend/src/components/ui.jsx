export function PrimaryButton({ children, onClick, disabled, type = 'button', style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? 'rgba(99, 102, 241, 0.25)' : 'var(--accent)',
        color: disabled ? 'var(--muted)' : '#FFFFFF',
        border: 'none',
        borderRadius: 12,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: 15,
        padding: '12px 24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        gap: 10,
        boxShadow: disabled ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.35)',
        transition: 'all 0.18s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.35)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        color: 'var(--muted)',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: 13,
        padding: '10px 20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        e.currentTarget.style.color = '#F3F4F6';
        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
      }}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--error)',
      border: '1px solid rgba(248, 113, 113, 0.3)', backgroundColor: 'rgba(248, 113, 113, 0.08)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>✕</span> {message}
    </div>
  );
}

export function InfoBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--accent-light)',
      border: '1px solid rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>ℹ</span> {message}
    </div>
  );
}

