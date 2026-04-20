import { useEffect, useRef, useState } from 'react';

export default function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Petal particles
    interface Petal {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    }

    const petals: Petal[] = [];
    const petalCount = 40;
    const colors = ['#ff6b9d', '#c44569', '#ffd89b', '#a8d8ff', '#e8d5f2'];

    // Create petals
    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 20 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 15, 25, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw petals
      petals.forEach((petal) => {
        // Mouse distortion
        const dx = mousePos.x - petal.x;
        const dy = mousePos.y - petal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.5;
          petal.vx -= (dx / distance) * force;
          petal.vy -= (dy / distance) * force;
        }

        // Movement
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.rotation += petal.rotationSpeed;

        // Damping
        petal.vx *= 0.98;
        petal.vy *= 0.98;

        // Wrap around edges
        if (petal.x < -50) petal.x = canvas.width + 50;
        if (petal.x > canvas.width + 50) petal.x = -50;
        if (petal.y < -50) petal.y = canvas.height + 50;
        if (petal.y > canvas.height + 50) petal.y = -50;

        // Draw petal
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rotation);
        ctx.fillStyle = petal.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size * 0.6, petal.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Auto-hide after 3 minutes (180000ms)
    const timer = setTimeout(() => {
      setShowContent(false);
    }, 180000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [mousePos]);

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
    }}>
      {/* Canvas for interactive petals */}
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

      {/* Chinese characters - decorative */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        fontSize: '4rem',
        color: 'rgba(255, 107, 157, 0.3)',
        fontWeight: 'bold',
        fontFamily: 'serif',
        letterSpacing: '0.2em',
        zIndex: 10,
      }}>
        瑶
      </div>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        fontSize: '4rem',
        color: 'rgba(196, 69, 105, 0.3)',
        fontWeight: 'bold',
        fontFamily: 'serif',
        letterSpacing: '0.2em',
        zIndex: 10,
      }}>
        草
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '12%',
        fontSize: '4rem',
        color: 'rgba(255, 216, 155, 0.3)',
        fontWeight: 'bold',
        fontFamily: 'serif',
        letterSpacing: '0.2em',
        zIndex: 10,
      }}>
        琪
      </div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        fontSize: '4rem',
        color: 'rgba(168, 216, 255, 0.3)',
        fontWeight: 'bold',
        fontFamily: 'serif',
        letterSpacing: '0.2em',
        zIndex: 10,
      }}>
        花
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'monospace',
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
          marginBottom: '2rem',
        }}>
          瑶草琪花 · KIXIZ STUDIO
        </div>
        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          opacity: 0.5,
        }}>
          Loading your portfolio...
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => setShowContent(false)}
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 20,
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
        SKIP
      </button>
    </div>
  );
}
