import { useEffect, useRef, useState } from 'react';

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Falling petals
    interface Petal {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      shape: number; // 0-1 for different petal shapes
    }

    const petals: Petal[] = [];
    const petalCount = 12;

    // Create petals
    for (let i = 0; i < petalCount; i++) {
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

      // Watercolor pink gradient
      const gradient = ctx.createLinearGradient(-petal.size * 0.5, -petal.size * 0.5, petal.size * 0.5, petal.size * 0.5);
      gradient.addColorStop(0, 'rgba(255, 182, 193, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.6)');
      gradient.addColorStop(1, 'rgba(219, 112, 147, 0.4)');
      ctx.fillStyle = gradient;

      // Draw petal shape based on shape value
      ctx.beginPath();
      if (petal.shape < 0.33) {
        // Pointed petal
        ctx.ellipse(0, 0, petal.size * 0.3, petal.size * 0.8, 0, 0, Math.PI * 2);
      } else if (petal.shape < 0.66) {
        // Round petal
        ctx.ellipse(0, 0, petal.size * 0.5, petal.size * 0.6, 0, 0, Math.PI * 2);
      } else {
        // Curved petal
        ctx.moveTo(-petal.size * 0.3, -petal.size * 0.5);
        ctx.quadraticCurveTo(petal.size * 0.2, 0, -petal.size * 0.2, petal.size * 0.5);
        ctx.quadraticCurveTo(0, petal.size * 0.3, petal.size * 0.3, -petal.size * 0.5);
        ctx.closePath();
      }
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#0f0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw petals
      petals.forEach((petal, idx) => {
        // Gentle horizontal drift
        petal.vx += (Math.random() - 0.5) * 0.02;
        petal.vx = Math.max(-0.5, Math.min(0.5, petal.vx)); // Clamp drift

        // Movement
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.rotation += petal.rotationSpeed;

        // Draw petal
        drawPetal(petal);

        // Reset petal when it goes off screen
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

      requestAnimationFrame(animate);
    };

    animate();

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
