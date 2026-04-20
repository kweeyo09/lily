import { useEffect, useState } from 'react';

export default function Loading() {
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    // Handle click to dismiss
    const handleClick = () => {
      setShowContent(false);
    };

    window.addEventListener('click', handleClick);

    // Auto-hide after 3 minutes (180000ms)
    const timer = setTimeout(() => {
      setShowContent(false);
    }, 180000);

    return () => {
      window.removeEventListener('click', handleClick);
      clearTimeout(timer);
    };
  }, []);

  if (!showContent) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0f0f19',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      cursor: 'pointer',
    }}>


      {/* Chinese characters - styled like brushstroke aesthetic */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        gap: '1rem',
        zIndex: 10,
      }}>
        <div style={{
          fontSize: '5rem',
          color: 'rgba(196, 69, 105, 0.4)',
          fontWeight: 'bold',
          fontFamily: 'serif',
          letterSpacing: '0.05em',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
          fontStyle: 'italic',
        }}>
          瑶
        </div>
        <div style={{
          fontSize: '5rem',
          color: 'rgba(255, 107, 157, 0.4)',
          fontWeight: 'bold',
          fontFamily: 'serif',
          letterSpacing: '0.05em',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
          fontStyle: 'italic',
        }}>
          草
        </div>
        <div style={{
          fontSize: '5rem',
          color: 'rgba(196, 69, 105, 0.4)',
          fontWeight: 'bold',
          fontFamily: 'serif',
          letterSpacing: '0.05em',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
          fontStyle: 'italic',
        }}>
          琪
        </div>
        <div style={{
          fontSize: '5rem',
          color: 'rgba(255, 107, 157, 0.4)',
          fontWeight: 'bold',
          fontFamily: 'serif',
          letterSpacing: '0.05em',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
          fontStyle: 'italic',
        }}>
          花
        </div>
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'monospace',
        zIndex: 20,
      }}>
        <div style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          marginBottom: '1rem',
        }}>
          KIKI ZHANG
        </div>
        <div style={{
          fontSize: '0.9rem',
          letterSpacing: '0.2em',
          opacity: 0.7,
        }}>
          瑶草琪花 · KIXIZ STUDIO
        </div>
      </div>

      {/* Click hint */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        zIndex: 20,
      }}>
        click to continue
      </div>
    </div>
  );
}
