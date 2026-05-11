/**
 * CustomCursor
 * Design: dark elegant aesthetic — small white dot (precise) + larger ring (lagging follower)
 * On hover over interactive elements: ring expands, dot fades → "magnetic" feel
 * Uses requestAnimationFrame for smooth 60fps tracking with lerp easing on the ring.
 */

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch-only devices
    if (window.matchMedia("(hover: none)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;
    let isHovering = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseEnterInteractive = () => {
      isHovering = true;
      dot.style.opacity = "0";
      dot.style.transform = "translate(-50%, -50%) scale(0)";
      ring.style.width = "44px";
      ring.style.height = "44px";
      ring.style.borderColor = "rgba(255,255,255,0.9)";
      ring.style.backgroundColor = "rgba(255,255,255,0.06)";
    };

    const onMouseLeaveInteractive = () => {
      isHovering = false;
      dot.style.opacity = "1";
      dot.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.width = "28px";
      ring.style.height = "28px";
      ring.style.borderColor = "rgba(255,255,255,0.55)";
      ring.style.backgroundColor = "transparent";
    };

    // Attach hover listeners to all interactive elements
    const interactiveSelectors =
      "a, button, [role='button'], input, select, textarea, label, [tabindex]";

    const attachListeners = () => {
      document.querySelectorAll(interactiveSelectors).forEach((el) => {
        el.addEventListener("mouseenter", onMouseEnterInteractive);
        el.addEventListener("mouseleave", onMouseLeaveInteractive);
      });
    };

    // Re-attach when DOM changes (e.g. modals open)
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    attachListeners();

    // Animation loop — dot snaps, ring lerps
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const LERP_FACTOR = 0.12;

    const animate = () => {
      // Dot follows instantly
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";

      // Ring lerps toward mouse
      ringX = lerp(ringX, mouseX, LERP_FACTOR);
      ringY = lerp(ringY, mouseY, LERP_FACTOR);
      ring.style.left = ringX + "px";
      ring.style.top = ringY + "px";

      rafId = requestAnimationFrame(animate);
    };

    animate();
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
      document.querySelectorAll(interactiveSelectors).forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterInteractive);
        el.removeEventListener("mouseleave", onMouseLeaveInteractive);
      });
    };
  }, []);

  return (
    <>
      {/* Precise dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.95)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99999,
          transition: "opacity 0.2s ease, transform 0.2s ease",
          mixBlendMode: "difference",
        }}
      />
      {/* Lagging ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.55)",
          backgroundColor: "transparent",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 99998,
          transition:
            "width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background-color 0.25s ease",
        }}
      />
    </>
  );
}
