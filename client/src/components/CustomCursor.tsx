/**
 * CustomCursor — Plumeria flower cursor
 * Design: dark elegant aesthetic
 * - Flower image follows the mouse with a smooth lerp lag
 * - Slow continuous spin on hover over interactive elements
 * - Slightly smaller at rest, scales up on hover
 * - Touch devices skip this entirely
 */

import { useEffect, useRef } from "react";

const FLOWER_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/plumeria-cursor-FHeEbDTnJ2btCLPGf5qFqe.png";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch-only devices
    if (window.matchMedia("(hover: none)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    let mouseX = -200;
    let mouseY = -200;
    let curX = -200;
    let curY = -200;
    let rafId: number;
    let rotation = 0;
    let isHovering = false;
    let spinSpeed = 0; // degrees per frame
    const TARGET_SPIN = 1.2; // deg/frame when hovering
    const LERP_POS = 0.13;
    const LERP_SPIN = 0.08;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onEnter = () => {
      isHovering = true;
      el.style.width = "52px";
      el.style.height = "52px";
      el.style.opacity = "0.95";
    };

    const onLeave = () => {
      isHovering = false;
      el.style.width = "38px";
      el.style.height = "38px";
      el.style.opacity = "0.82";
    };

    const interactiveSelectors =
      "a, button, [role='button'], input, select, textarea, label, [tabindex]";

    const attachListeners = () => {
      document.querySelectorAll(interactiveSelectors).forEach((node) => {
        node.addEventListener("mouseenter", onEnter);
        node.addEventListener("mouseleave", onLeave);
      });
    };

    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    attachListeners();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      curX = lerp(curX, mouseX, LERP_POS);
      curY = lerp(curY, mouseY, LERP_POS);

      // Spin: ease toward target speed
      const targetSpeed = isHovering ? TARGET_SPIN : 0;
      spinSpeed = lerp(spinSpeed, targetSpeed, LERP_SPIN);
      rotation += spinSpeed;

      el.style.left = curX + "px";
      el.style.top = curY + "px";
      el.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

      rafId = requestAnimationFrame(animate);
    };

    animate();
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
      document.querySelectorAll(interactiveSelectors).forEach((node) => {
        node.removeEventListener("mouseenter", onEnter);
        node.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "38px",
        height: "38px",
        backgroundImage: `url(${FLOWER_URL})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 99999,
        opacity: 0.82,
        filter: "drop-shadow(0 0 6px rgba(255, 220, 120, 0.45))",
        transition: "width 0.25s ease, height 0.25s ease, opacity 0.25s ease",
        willChange: "transform, left, top",
      }}
    />
  );
}
