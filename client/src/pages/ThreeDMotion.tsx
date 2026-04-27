import { useLocation } from 'wouter';

export default function ThreeDMotion() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: '#fff', fontFamily: 'monospace',
      overflow: 'auto', padding: '60px 40px',
    }}>
      {/* Back button */}
      <button
        onClick={() => setLocation('/')}
        style={{
          position: 'fixed', top: 32, left: 32,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 4, color: '#fff', fontFamily: 'monospace',
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          cursor: 'pointer', transition: 'all 0.2s ease', zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.color = '#fff';
        }}
      >
        ← BACK
      </button>

      <style>{`
        @media (max-width: 768px) {
          #next-btn-3d {
            display: block !important;
          }
        }
      `}</style>

      {/* Mobile-only NEXT button */}
      <button
        id="next-btn-3d"
        onClick={() => setLocation('/product-design')}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 4,
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          padding: '8px 16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 100,
          display: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.color = '#fff';
        }}
      >
        NEXT →
      </button>

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '60px', marginTop: '40px' }}>
        <h1 style={{
          fontSize: '3rem', fontWeight: 'bold', marginBottom: '12px',
          letterSpacing: '0.15em', color: '#fff',
        }}>
          3D & MOTION
        </h1>
        <p style={{
          fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.1em', lineHeight: 1.8,
        }}>
          Immersive 3D models and dynamic motion graphics that bring ideas to life.
        </p>
      </div>

      {/* Portfolio Grid */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px',
      }}>
        {/* Placeholder cards for your work */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '24px', cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '300px', display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: '100%', height: '200px', background: 'rgba(255,255,255,0.02)',
              borderRadius: 4, marginBottom: '16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem',
            }}>
              [Project Image]
            </div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
              Project {i}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              Add your project description here
            </p>
          </div>
        ))}
      </div>

      {/* Upload prompt */}
      <div style={{
        maxWidth: '1200px', margin: '80px auto 0',
        padding: '40px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
          Ready to showcase your 3D and motion work? Upload your projects and descriptions in the code.
        </p>
      </div>
    </div>
  );
}
