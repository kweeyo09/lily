import { useLocation } from 'wouter';

// Embeds the Limelight (theatreboxd) Next.js app, hosted on Vercel, inside the
// portfolio via an iframe so it feels like a native page.
const LIMELIGHT_URL = 'https://theatreboxd.vercel.app/';

export default function Limelight() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      {/* Back button */}
      <button
        className="liquid-glass"
        onClick={() => setLocation('/ui-design')}
        style={{
          position: 'fixed', top: 32, left: 32,
          borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          transition: 'all 0.3s ease', zIndex: 100, fontWeight: '400',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1)';
        }}
      >
        ← BACK
      </button>

      <iframe
        src={LIMELIGHT_URL}
        title="Limelight"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="fullscreen"
      />
    </div>
  );
}
