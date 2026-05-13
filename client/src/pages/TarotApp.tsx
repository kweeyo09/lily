/**
 * TarotApp — embeds the original tarot-arcana app via iframe.
 *
 * Cursor fix:
 * ─────────────────────────────────────────────────────────────────────
 * Browsers stop firing mousemove on the parent document when the mouse
 * enters an iframe.  The custom plumeria cursor (CustomCursor.tsx)
 * listens on document, so it freezes at the iframe boundary.
 *
 * Fix: a transparent overlay div (pointer-events: auto) sits above the
 * iframe and captures all mouse events in the parent document.
 *
 *  1. mousemove  → re-dispatched on document  → CustomCursor tracks ✓
 *  2. click/mousedown/mouseup/mousemove → forwarded into the iframe via
 *     postMessage so the tarot app's card interactions still work ✓
 *
 * The tarot app's index.html has a listener injected that receives these
 * messages and re-dispatches synthetic events on its own document.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

export default function TarotApp() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const iframe = iframeRef.current;
    if (!overlay || !iframe) return;

    const forwardToIframe = (e: MouseEvent, type: string) => {
      iframe.contentWindow?.postMessage(
        {
          type: "cursor-relay",
          eventType: type,
          clientX: e.clientX,
          clientY: e.clientY,
          button: (e as MouseEvent).button ?? 0,
        },
        "*"
      );
    };

    const onMove = (e: MouseEvent) => {
      // Keep parent cursor tracking
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
      // Forward into iframe
      forwardToIframe(e, "mousemove");
    };

    const onDown = (e: MouseEvent) => forwardToIframe(e, "mousedown");
    const onUp   = (e: MouseEvent) => forwardToIframe(e, "mouseup");
    const onClick = (e: MouseEvent) => forwardToIframe(e, "click");

    overlay.addEventListener("mousemove", onMove);
    overlay.addEventListener("mousedown", onDown);
    overlay.addEventListener("mouseup", onUp);
    overlay.addEventListener("click", onClick);

    return () => {
      overlay.removeEventListener("mousemove", onMove);
      overlay.removeEventListener("mousedown", onDown);
      overlay.removeEventListener("mouseup", onUp);
      overlay.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0e0818",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Minimal top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => setLocation("/ui-design")}
          style={{
            pointerEvents: "all",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(200,150,12,0.35)",
            color: "#c8960c",
            fontFamily: "serif",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            padding: "6px 14px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          ← BACK
        </button>
        <span
          style={{
            color: "rgba(200,150,12,0.45)",
            fontFamily: "serif",
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
          }}
        >
          UI DESIGN · CASE STUDY
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(200,150,12,0.6)",
            fontFamily: "serif",
            fontSize: "0.8rem",
            letterSpacing: "0.3em",
            zIndex: 5,
            background: "#0e0818",
          }}
        >
          LOADING · · ·
        </div>
      )}

      {/* iframe + overlay wrapper */}
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <iframe
          ref={iframeRef}
          src="/tarot-app/"
          title="Tarot Arcana"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            flex: 1,
            opacity: loading ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
          allow="autoplay"
          onLoad={() => setLoading(false)}
        />

        {/*
          Cursor relay overlay — sits above the iframe, captures mouse events,
          forwards them to the tarot app via postMessage.
          z-index: 1 keeps it below the top-bar (z:20).
        */}
        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "transparent",
          }}
        />
      </div>
    </div>
  );
}
