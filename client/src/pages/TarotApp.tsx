import { useState, useRef } from "react";
import { useLocation } from "wouter";

export default function TarotApp() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0e0818",
        display: "flex",
        flexDirection: "column",
        cursor: "auto",
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

      {/* iframe wrapper */}
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <iframe
          ref={(el) => {
            if (el && !loading) {
              try {
                const doc = el.contentDocument || el.contentWindow?.document;
                if (doc) {
                  const style = doc.createElement("style");
                  style.textContent = "* { cursor: auto !important; }";
                  doc.head.appendChild(style);
                }
              } catch (e) {
                // Cross-origin or other access issues
              }
            }
          }}
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
      </div>
    </div>
  );
}
