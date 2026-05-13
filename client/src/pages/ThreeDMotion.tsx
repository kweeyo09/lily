import { useLocation } from 'wouter';

export default function ThreeDMotion() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: '#fff', fontFamily: "'Barlow', sans-serif",
      overflow: 'auto', padding: '60px 40px',
    }}>
      {/* Back button */}
      <button
        className="liquid-glass"
        onClick={() => setLocation('/')}
        style={{
          position: 'fixed', top: 32, left: 32,
          borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          cursor: 'pointer', transition: 'all 0.3s ease', zIndex: 100, fontWeight: '400',
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

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '60px', marginTop: '40px' }}>
        <h1 style={{
          fontSize: '3rem', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontWeight: 'normal', marginBottom: '12px',
          letterSpacing: '0.05em', color: '#fff',
        }}>
          3D & Motion
        </h1>
        <p style={{
          fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.1em', lineHeight: 1.8, fontWeight: '300',
        }}>
          Immersive 3D models and dynamic motion graphics that bring ideas to life.
        </p>
      </div>

      {/* Portfolio Grid — projects added here as they are ready */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
      }} />
    </div>
  );
}
