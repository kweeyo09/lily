import { useLocation } from 'wouter';

// ─── Design: dark elegant, Instrument Serif italic headings, Barlow body ───
// Cards use liquid-glass utility class from index.css
// First card: Budget App (real project), rest are placeholders

const BUDGET_APP_SCREENSHOT =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663487115720/ejiFnRLP6xDAMjzum8YmMk/budget-app-full_9f9cebd2.png';


interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  link?: string;
  internal?: boolean;
  isPlaceholder?: boolean;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Budget App',
    description:
      'A mobile budgeting app with real-time spending tracking, category breakdowns, and progress indicators. Features a clean component library with a blue-dominant palette and Caveat + Inter typography system.',
    tags: ['Mobile UI', 'Design System', 'Finance'],
    image: BUDGET_APP_SCREENSHOT,
    link: '/budget-app',
  internal: true,
  },
  {
    id: 2,
    title: 'Tarot Arcana',
    description:
      'An immersive tarot card experience featuring the complete 22 Major Arcana. Hover the arc spread to draw a card, flip to reveal its meaning, or browse the full deck with upright and reversed interpretations.',
    tags: ['Interactive UI', 'Dark Design', 'Mystical'],
    link: '/tarot-arcana',
    internal: true,
  },
  {
    id: 3,
    title: 'Project 3',
    description: 'Add your project description here',
    tags: [],
    isPlaceholder: true,
  },
  {
    id: 4,
    title: 'Project 4',
    description: 'Add your project description here',
    tags: [],
    isPlaceholder: true,
  },
  {
    id: 5,
    title: 'Project 5',
    description: 'Add your project description here',
    tags: [],
    isPlaceholder: true,
  },
  {
    id: 6,
    title: 'Project 6',
    description: 'Add your project description here',
    tags: [],
    isPlaceholder: true,
  },
];

export default function UIDesign() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: "'Barlow', sans-serif",
      overflow: 'auto',
      padding: '60px 40px',
    }}>
      {/* Back button */}
      <button
        className="liquid-glass"
        onClick={() => setLocation('/')}
        style={{
          position: 'fixed', top: 32, left: 32,
          borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          transition: 'all 0.3s ease', zIndex: 100, fontWeight: '400',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1)';
        }}
      >
        ← BACK
      </button>

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '60px', marginTop: '40px' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontWeight: 'normal',
          marginBottom: '12px',
          letterSpacing: '0.05em',
          color: '#fff',
        }}>
          UI Design
        </h1>
        <p style={{
          fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.1em', lineHeight: 1.8, fontWeight: '300',
        }}>
          Digital experiences crafted with attention to detail and user-centered design principles.
        </p>
      </div>

      {/* Portfolio Grid */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
      }}>
        {projects.map((project) => (
          <div
            key={project.id}
            className="liquid-glass"
            onClick={() => {
              if (project.link) {
                if (project.internal) setLocation(project.link);
                else window.open(project.link, '_blank');
              }
            }}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              transition: 'all 0.35s ease',
              display: 'flex',
              flexDirection: 'column',
              cursor: project.link ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 24px rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1)';
            }}
          >
            {/* Image area */}
            <div style={{
              width: '100%',
              height: '260px',
              background: project.isPlaceholder ? 'rgba(255,255,255,0.02)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    display: 'block',
                  }}
                />
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                  [Project Image]
                </span>
              )}


            </div>

            {/* Text content */}
            <div style={{ padding: '20px 22px 24px' }}>
              <h3 style={{
                fontSize: '1rem',
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontWeight: 'normal',
                marginBottom: '8px',
                color: '#fff',
              }}>
                {project.title}
              </h3>
              <p style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.55)',
                fontWeight: '300',
                lineHeight: 1.7,
                marginBottom: project.tags.length ? '14px' : 0,
              }}>
                {project.description}
              </p>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {project.tags.map((tag) => (
                    <span key={tag} style={{
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      color: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontWeight: '400',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: '80px' }} />
    </div>
  );
}
