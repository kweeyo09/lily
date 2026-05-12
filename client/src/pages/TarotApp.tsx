/**
 * TarotApp — embeds the original tarot-arcana app via iframe blob URL
 * The standalone HTML (JS+CSS inlined) is fetched from /tarot-app.txt
 * and turned into a blob URL so the iframe renders it correctly.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function TarotApp() {
  const [, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    fetch("/tarot-app.txt")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        const blob = new Blob([html], { type: "text/html" });
        objectUrl = URL.createObjectURL(blob);
        if (iframeRef.current) {
          iframeRef.current.src = objectUrl;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tarot app:", err);
        setError(true);
        setLoading(false);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a12",
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
          zIndex: 10,
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
          }}
        >
          LOADING · · ·
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,100,100,0.7)",
            fontFamily: "serif",
            fontSize: "0.8rem",
            letterSpacing: "0.2em",
            zIndex: 5,
          }}
        >
          Failed to load — please refresh
        </div>
      )}

      {/* Full-screen iframe */}
      <iframe
        ref={iframeRef}
        title="Tarot Arcana"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          flex: 1,
          opacity: loading ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
        allow="autoplay"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
