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

    // Petal particles - semi-realistic flower petals
    interface Petal {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const petals: Petal[] = [];
    const petalCount = 8; // Very few petals
    const colors = ['#ff6b9d', '#c44569', '#ffd89b', '#a8d8ff', '#e8d5f2'];

    // Create petals
    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1, // Very slow movement
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 25 + 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005, // Extremely slow rotation
        opacity: Math.random() * 0.3 + 0.2,
      });
    }

    const animate = () => {
      // Clear canvas completely for clean look
      ctx.fillStyle = 'rgba(15, 15, 25, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw petals
      petals.forEach((petal) => {
        // Mouse distortion - very subtle
        const dx = mousePos.x - petal.x;
        const dy = mousePos.y - petal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 250;

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 0.05; // Very subtle force
          petal.vx -= (dx / distance) * force * 0.5;
          petal.vy -= (dy / distance) * force * 0.5;
        }

        // Movement
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.rotation += petal.rotationSpeed;

        // Very strong damping for smooth, slow motion
        petal.vx *= 0.98;
        petal.vy *= 0.98;

        // Wrap around edges
        if (petal.x < -150) petal.x = canvas.width + 150;
        if (petal.x > canvas.width + 150) petal.x = -150;
        if (petal.y < -150) petal.y = canvas.height + 150;
        if (petal.y > canvas.height + 150) petal.y = -150;

        // Draw clean, simple petal
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rotation);
        ctx.fillStyle = petal.color;
        ctx.globalAlpha = petal.opacity;

        // Draw simple petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size * 0.35, petal.size * 0.7, 0, 0, Math.PI * 2);
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

    // Handle click to dismiss
    const handleClick = () => {
      setShowContent(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Auto-hide after 3 minutes (180000ms)
    const timer = setTimeout(() => {
      setShowContent(false);
    }, 180000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
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
      cursor: 'pointer',
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
