import { useEffect, useRef, useState } from 'react';

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => {
    return !sessionStorage.getItem('loadingScreenShown');
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Falling petals
    interface Petal {
      x: number; y: number; vx: number; vy: number;
      size: number; rotation: number; rotationSpeed: number;
      opacity: number; shape: number;
    }

    const petals: Petal[] = [];
    for (let i = 0; i < 12; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: -50 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.5 + 0.3,
        size: Math.random() * 30 + 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.4 + 0.3,
        shape: Math.random(),
      });
    }

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.globalAlpha = petal.opacity;

      const gradient = ctx.createLinearGradient(-petal.size * 0.5, -petal.size * 0.5, petal.size * 0.5, petal.size * 0.5);
      gradient.addColorStop(0, 'rgba(255, 182, 193, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.6)');
      gradient.addColorStop(1, 'rgba(219, 112, 147, 0.4)');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      if (petal.shape < 0.33) {
        ctx.ellipse(0, 0, petal.size * 0.3, petal.size * 0.8, 0, 0, Math.PI * 2);
      } else if (petal.shape < 0.66) {
        ctx.ellipse(0, 0, petal.size * 0.5, petal.size * 0.6, 0, 0, Math.PI * 2);
      } else {
        ctx.moveTo(-petal.size * 0.3, -petal.size * 0.5);
        ctx.quadraticCurveTo(petal.size * 0.2, 0, -petal.size * 0.2, petal.size * 0.5);
        ctx.quadraticCurveTo(0, petal.size * 0.3, petal.size * 0.3, -petal.size * 0.5);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    };

    let animId: number;
    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      petals.forEach((petal, idx) => {
        petal.vx += (Math.random() - 0.5) * 0.02;
        petal.vx = Math.max(-0.5, Math.min(0.5, petal.vx));
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.rotation += petal.rotationSpeed;
        drawPetal(petal);

        if (petal.y > canvas.height + 50) {
          petals[idx] = {
            x: Math.random() * canvas.width,
            y: -50,
            vx: (Math.random() - 0.5) * 0.3,
            vy: Math.random() * 0.5 + 0.3,
            size: Math.random() * 30 + 20,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            opacity: Math.random() * 0.4 + 0.3,
            shape: Math.random(),
          };
        }
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    // Dismiss handler - fade out then hide
    const dismiss = () => {
      setFading(true);
      sessionStorage.setItem('loadingScreenShown', 'true');
      setTimeout(() => {
        setVisible(false);
      }, 1200); // Wait for fade animation to complete
    };

    window.addEventListener('click', dismiss);

    // Auto-dismiss after 3 minutes
    const timer = setTimeout(dismiss, 180000);

    return () => {
      window.removeEventListener('click', dismiss);
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
      cancelAnimationFrame(animId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 1.2s ease-out',
      }}
    >
      {/* Canvas for falling petals */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Chinese characters */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        gap: '1rem',
        zIndex: 10,
      }}>
        {['瑶', '草', '琪', '花'].map((char, i) => (
          <div key={i} style={{
            fontSize: 'clamp(3rem, 10vw, 5rem)',
            color: i % 2 === 0 ? 'rgba(196, 69, 105, 0.4)' : 'rgba(255, 107, 157, 0.4)',
            fontWeight: 'bold',
            fontFamily: 'serif',
            letterSpacing: '0.05em',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
            fontStyle: 'italic',
          }}>
            {char}
          </div>
        ))}
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
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          marginBottom: '1rem',
        }}>
          KIKI ZHANG
        </div>
        <div style={{
          fontSize: 'clamp(0.65rem, 2.5vw, 0.9rem)',
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
        fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
        letterSpacing: '0.1em',
        zIndex: 20,
      }}>
        click to continue
      </div>
    </div>
  );
}
