import { useEffect } from 'react';

const PDF_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/KZCV26_f175d443.pdf';
const VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(PDF_URL)}&embedded=true`;

interface ResumeModalProps {
  onClose: () => void;
}

export default function ResumeModal({ onClose }: ResumeModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 6,
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem', letterSpacing: '0.12em',
          zIndex: 10000,
        }}
      >
        CLOSE ✕
      </button>

      {/* PDF iframe — stop click propagation so clicking PDF doesn't close modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(90vw, 860px)',
          height: 'min(92vh, 1100px)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <iframe
          src={VIEWER_URL}
          title="Kiki Zhang Resume"
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
        />
      </div>
    </div>
  );
}
