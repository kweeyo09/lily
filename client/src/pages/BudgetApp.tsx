import { useLocation } from 'wouter';

// ─── Budget App: Component Library embed via iframe ───────────────────────────
// The budgeting-app-component-library.html is hosted on CDN and embedded
// full-screen inside a portfolio wrapper with a back button overlay.
// ─────────────────────────────────────────────────────────────────────────────

const COMPONENT_LIBRARY_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/budgeting-app-component-library_adf522f7.html';

export default function BudgetApp() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Floating back button */}
      <button
        className="liquid-glass"
        onClick={() => setLocation('/ui-design')}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 200,
          borderRadius: 8,
          color: '#fff',
          fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          padding: '8px 16px',
          transition: 'all 0.3s ease',
          fontWeight: '400',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow =
            'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow =
            'inset 0 1px 1px rgba(255,255,255,0.1)';
        }}
      >
        ← BACK
      </button>

      {/* Portfolio label */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 200,
        color: 'rgba(255,255,255,0.35)',
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        fontFamily: "'Barlow', sans-serif",
        fontWeight: '300',
      }}>
        UI DESIGN · CASE STUDY
      </div>

      {/* Full-screen iframe */}
      <iframe
        src={COMPONENT_LIBRARY_URL}
        title="Budgeting App Component Library"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          flex: 1,
        }}
        allow="fullscreen"
      />
    </div>
  );
}
