import { useLocation } from 'wouter';

const JELLYFLOWER_THUMB = '/assets/jellyflower_bf91d6d2.mp4';

export default function ThreeDMotion() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: "'Barlow', sans-serif",
      overflow: 'auto',
      padding: '60px 40px',
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

      {/* Portfolio Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '28px',
      }}>
        {/* Jelly Flower card */}
        <div
          onClick={() => setLocation('/3d-motion/jellyflower')}
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, border-color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          {/* Video thumbnail — autoplay muted loop as preview */}
          <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', lineHeight: 0 }}>
            <video
              src={JELLYFLOWER_THUMB}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          {/* Card info */}
          <div style={{ padding: '20px 22px 24px' }}>
            <p style={{
              fontSize: '0.6rem', letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontWeight: '300',
            }}>
              3D ANIMATION
            </p>
            <h3 style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
              fontSize: '1.3rem', fontWeight: 'normal', marginBottom: '8px', color: '#fff',
            }}>
              Jelly Flower
            </h3>
            <p style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7, fontWeight: '300',
            }}>
              Soft-body dynamics & translucent material study
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
