/**
 * TarotApp — embeds the original tarot-arcana app via iframe srcdoc
 * The entire app (HTML + inlined JS + CSS) is imported as a raw string
 * and passed to srcdoc, so it renders correctly regardless of CDN headers.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
// @ts-ignore — Vite raw import
import tarotHtml from "../tarot-standalone.html?raw";

export default function TarotApp() {
  const [, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Write the HTML directly into the iframe document
    const blob = new Blob([tarotHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    return () => URL.revokeObjectURL(url);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
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

      {/* Full-screen iframe — blob URL bypasses CDN content-type issues */}
      <iframe
        ref={iframeRef}
        title="Tarot Arcana"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          flex: 1,
        }}
        allow="autoplay"
      />
    </div>
  );
}
