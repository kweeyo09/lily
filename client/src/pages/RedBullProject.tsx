/**
 * Red Bull — Product Design Case Study
 * Layout: full-bleed video hero → two render stills below
 */

import { useLocation } from 'wouter';

const REDBULL_VIDEO = '/manus-storage/redbull_e597ca33.mp4';
const REDBULL_IMG_1 = '/manus-storage/0072_df56ea18.png'; // three cans studio shot
const REDBULL_IMG_2 = '/manus-storage/0052_400eda6f.png'; // ice splash close-up

export default function RedBullProject() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Barlow', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* ── NAV BAR ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 100,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          backdropFilter: 'blur(0px)',
        }}
      >
        <button
          className="liquid-glass"
          onClick={() => setLocation('/product-design')}
          style={{
            borderRadius: 8,
            color: '#fff',
            fontFamily: "'Barlow', sans-serif",
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            padding: '7px 16px',
            transition: 'all 0.3s ease',
            fontWeight: '400',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1)';
          }}
        >
          ← BACK
        </button>

        <span
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Barlow', sans-serif",
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            fontWeight: '300',
          }}
        >
          PRODUCT DESIGN · CASE STUDY
        </span>
      </div>

      {/* ── HERO VIDEO ── */}
      <div
        style={{
          width: '100%',
          position: 'relative',
          background: '#000',
          lineHeight: 0,
        }}
      >
        <video
          src={REDBULL_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            display: 'block',
            maxHeight: '100vh',
            objectFit: 'cover',
          }}
        />
        {/* Subtle bottom fade into content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(to bottom, transparent, #000)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── PROJECT INFO ── */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px 40px 40px',
        }}
      >
        <p
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '14px',
            fontWeight: '300',
          }}
        >
          3D PRODUCT VISUALISATION
        </p>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontWeight: 'normal',
            marginBottom: '20px',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
          }}
        >
          Red Bull
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.9,
            fontWeight: '300',
            maxWidth: '640px',
          }}
        >
          A 3D product visualisation study for Red Bull Energy Drink. Rendered in
          Blender with a focus on material realism — metallic label reflections,
          condensation, and high-energy liquid dynamics.
        </p>
      </div>

      {/* ── RENDER IMAGES ── */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 40px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Image 1 — three cans studio */}
        <div
          style={{
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={REDBULL_IMG_1}
            alt="Red Bull — three cans studio render"
            style={{
              width: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Image 2 — ice splash */}
        <div
          style={{
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={REDBULL_IMG_2}
            alt="Red Bull — ice splash render"
            style={{
              width: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    </div>
  );
}
