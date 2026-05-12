/**
 * TAROT ARCANA — UI Design Case Study
 * Design Philosophy: Dark mystical, deep navy/indigo background, gold typography (Cinzel + EB Garamond)
 * Layout: Full-screen immersive, two tabs: Draw Your Card + Browse the Deck
 * Signature: Arc card spread, flip animation on click, star particles
 */

import { useState } from "react";
import { useLocation } from "wouter";

// ─── Card Data ────────────────────────────────────────────────────────────────

const CARDS: { id: string; name: string; number: string; suit: string; element: string; planet: string; keywords: string[]; upright: string; reversed: string }[] = [
  { id: "major_00_fool", name: "The Fool", number: "0", suit: "Major Arcana", element: "Air", planet: "Uranus", keywords: ["Beginnings","Innocence","Risk","Adventure","Freedom"], upright: "The Fool heralds new beginnings and calculated risk. It is never too late to begin anew and follow your heart's desire. The journey ahead is not without danger, but it is time to take a leap of faith. This card augurs well for those embarking on new enterprises and educational courses, provided sensible planning is in place; this is a time for optimism.", reversed: "The Fool reversed brings out the irresponsible side — the mouth works ahead of the brain. Without thinking through the downsides, decisions are made that are not wise. Think carefully before agreeing to a new approach to work and hold back from emotional commitments until you are sure of your ground." },
  { id: "major_01_magician", name: "The Magician", number: "I", suit: "Major Arcana", element: "Air", planet: "Mercury", keywords: ["Action","Creativity","Willpower","Manifestation","Skill"], upright: "It's time for action — for communicating and expressing your ideas and desires. This is the card of the inventor, the traveler, the self-employed, and the entrepreneur, as it beckons you to broaden your horizons. You will have the drive to spur your plans forward. Blessed with a magic wand, you have all the tools you need.", reversed: "When reversed, the Magician turns trickster — this card can show you being misled by a charming manipulator. What you see is not what you get, and it's all show, not truth. In your projects, the Magician reversed can show a creative block as you feel torn between two paths." },
  { id: "major_02_high_priestess", name: "The High Priestess", number: "II", suit: "Major Arcana", element: "Water", planet: "The Moon", keywords: ["Secrets","Intuition","Wisdom","Mystery","Spirituality"], upright: "Hidden knowledge, intuition, psychic experience, and significant dreams are the gifts of the High Priestess. This is a time for incubation and privacy, to go inward, deepening your relationship with your higher self and trusting your internal knowing. Confidentiality is key.", reversed: "When reversed, the High Priestess can show an inappropriate mentor or choosing a temporarily wrong path. You might be listening to bad advice or someone might try to persuade you to go against your intuition. It can also indicate secrets that need to be out in the open." },
  { id: "major_03_empress", name: "The Empress", number: "III", suit: "Major Arcana", element: "Earth", planet: "Venus", keywords: ["Abundance","Fertility","Creativity","Nurturing","Nature"], upright: "The gifts of the Empress are abundance and material comfort, sensuality and security, and emotional support. This is an auspicious card for children and families, showing harmony at home. Your creative projects thrive and you prosper financially.", reversed: "When reversed, the Empress shows financial issues and domestic strife. She can also show a creative block in your projects and someone who is needy and takes too much from you." },
  { id: "major_04_emperor", name: "The Emperor", number: "IV", suit: "Major Arcana", element: "Fire", planet: "", keywords: ["Authority","Structure","Control","Stability","Leadership"], upright: "The Emperor can denote a powerful man and the traditional aspects of rulership and ambition. He brings balance, security, and conventional values. He reveals mastery of life and control over territory, and predicts that problems can be overcome with careful planning and single-mindedness.", reversed: "When reversed, the Emperor is power-hungry and excessive in his demands, representing the negative traits of traditional masculinity — domineering, controlling, and even cruel." },
  { id: "major_05_hierophant", name: "The Hierophant", number: "V", suit: "Major Arcana", element: "Earth", planet: "", keywords: ["Education","Tradition","Spirituality","Unity","Guidance"], upright: "The Hierophant shows support, self-realization, and expansion. This is a time to develop emotionally and spiritually — to commit to relationships; to think and philosophize; and to become more spiritually aware. He offers an opportunity to integrate mind and spirit.", reversed: "When reversed, the Hierophant shows poor leadership. You may be misled by an incompetent or egotistic individual at work or on your spiritual path." },
  { id: "major_06_lovers", name: "The Lovers", number: "VI", suit: "Major Arcana", element: "Air", planet: "", keywords: ["Love","Relationships","Choices","Harmony","Alignment"], upright: "The Lovers show relationships and a decision. The card can predict meeting a new partner or a career opportunity, and your choice now will have a significant effect on your future. The person coming into your orbit now has a positive influence and offers true love.", reversed: "When the Lovers card reverses, relationships go out of balance. A relationship is in crisis, and you may question your initial attraction as the values you once held as a couple feel corrupted." },
  { id: "major_07_chariot", name: "The Chariot", number: "VII", suit: "Major Arcana", element: "Water", planet: "", keywords: ["Victory","Determination","Control","Journey","Willpower"], upright: "The Chariot signifies success and a major departure. This is a time for determination and focus as you travel in a new direction. A decision is made, and now you can begin to experience real progress in your affairs. Ready to take control and navigate your path.", reversed: "When reversed, there is arrogance and self-indulgence. This can show a person or event spiraling out of control. Ego is at work, and selfish needs come before the greater good." },
  { id: "major_08_strength", name: "Strength", number: "VIII", suit: "Major Arcana", element: "Fire", planet: "", keywords: ["Courage","Patience","Endurance","Compassion","Inner Strength"], upright: "Strength shows that you turn to your higher self for self-guidance. Courage, determination, and patience are needed now, as it is time to get a situation under control. You will need to act with grace and sensitivity, rather than using brute force.", reversed: "When reversed, Strength turns to weakness of will and avoidance of risk, conflicts, and decision-making. Whatever you resist persists, so take charge and take on the challenge." },
  { id: "major_09_hermit", name: "The Hermit", number: "IX", suit: "Major Arcana", element: "Earth", planet: "", keywords: ["Solitude","Introspection","Wisdom","Guidance","Inner Search"], upright: "There's an opportunity to take time away from routine to consider your options or advance a personal project. The Hermit shows you need more time and space to process your thoughts and feelings. It can show breaking with tradition and finding a unique approach.", reversed: "When reversed, you may be feeling alone and unsupported. However, this is more an attitude than reality, so it's worth asking yourself if you are avoiding help." },
  { id: "major_10_wheel", name: "Wheel of Fortune", number: "X", suit: "Major Arcana", element: "Fire", planet: "Jupiter", keywords: ["Fate","Change","Luck","Cycles","Destiny"], upright: "When the Wheel is upright, anything is possible — and usually positive. Chance meetings, unexpected offers, and news arrive in force. If life has been difficult recently, the Wheel shows a turn for the better.", reversed: "When the Wheel is reversed, you may suffer some bad luck, but thankfully this marks the end of a run of challenges. The benefits of the upright Wheel will come — it will just take a little longer." },
  { id: "major_11_justice", name: "Justice", number: "XI", suit: "Major Arcana", element: "Air", planet: "", keywords: ["Balance","Fairness","Truth","Law","Cause and Effect"], upright: "There will be a positive outcome. This is a time when past errors or imbalances can be redressed. You benefit from a fair system, provided you are accountable, honest, and deserving. In legal matters, a decision goes in your favor.", reversed: "When reversed, Justice shows unfairness and imbalance. Legal matters may not go in your favor, or you may be dealing with a system that is corrupt or biased." },
  { id: "major_12_hanged_man", name: "The Hanged Man", number: "XII", suit: "Major Arcana", element: "Water", planet: "Neptune", keywords: ["Suspension","Sacrifice","Surrender","New Perspective","Waiting"], upright: "The Hanged Man shows a time of suspension and waiting. This is a period of voluntary sacrifice that leads to a new perspective. By surrendering control and accepting the present moment, you will gain wisdom and insight.", reversed: "When reversed, the Hanged Man shows resistance to necessary change or sacrifice. You may be clinging to old patterns or refusing to see a situation from a different angle." },
  { id: "major_13_death", name: "Death", number: "XIII", suit: "Major Arcana", element: "Water", planet: "", keywords: ["Transformation","Endings","Change","Transition","Renewal"], upright: "Death rarely signifies physical death. Instead, it heralds transformation, change, and new beginnings. Something in your life is ending, making way for something new. This transition may be difficult, but it is necessary and ultimately positive.", reversed: "When reversed, Death shows resistance to necessary change. You may be clinging to the past or refusing to let go of something that has run its course." },
  { id: "major_14_temperance", name: "Temperance", number: "XIV", suit: "Major Arcana", element: "Fire", planet: "", keywords: ["Balance","Moderation","Patience","Purpose","Harmony"], upright: "Temperance shows the art of negotiation and balance. This is a time to take the middle path, to blend opposites harmoniously, and to exercise patience. You are being guided to find balance in all areas of your life.", reversed: "When reversed, Temperance shows imbalance and excess. You may be overindulging in one area of life at the expense of others. There is a need to restore harmony and find the middle ground." },
  { id: "major_15_devil", name: "The Devil", number: "XV", suit: "Major Arcana", element: "Earth", planet: "", keywords: ["Bondage","Materialism","Shadow Self","Restriction","Addiction"], upright: "The Devil shows restriction and the shadow side of life. This card can represent unhealthy attachments, addictions, or situations where you feel trapped. However, the chains are loose — they could be removed if you chose.", reversed: "When reversed, the Devil shows liberation from bondage. You are breaking free from restrictions, addictions, or unhealthy patterns. This is a time of release and reclaiming your power." },
  { id: "major_16_tower", name: "The Tower", number: "XVI", suit: "Major Arcana", element: "Fire", planet: "Mars", keywords: ["Sudden Change","Upheaval","Revelation","Chaos","Awakening"], upright: "The Tower represents sudden, dramatic change and the breakdown of existing structures. While this can be shocking and disruptive, it ultimately leads to illumination and liberation. False beliefs built on unstable foundations are being destroyed to make way for truth.", reversed: "When reversed, the Tower shows that you are resisting necessary change or that the upheaval is less dramatic than feared. You may be avoiding a crisis that needs to be confronted." },
  { id: "major_17_star", name: "The Star", number: "XVII", suit: "Major Arcana", element: "Air", planet: "", keywords: ["Hope","Inspiration","Serenity","Renewal","Guidance"], upright: "The Star brings hope and guidance after difficulty. This is a time of healing, renewal, and spiritual connection. You are being guided by a higher power and can trust that things are moving in the right direction.", reversed: "When reversed, the Star shows a loss of faith or hope. You may be feeling disconnected from your spiritual path or unable to see the light at the end of the tunnel." },
  { id: "major_18_moon", name: "The Moon", number: "XVIII", suit: "Major Arcana", element: "Water", planet: "", keywords: ["Illusion","Fear","Subconscious","Intuition","Dreams"], upright: "The Moon represents a crisis of faith and deep emotions. Things may not be as they seem, and illusions or fears may be clouding your judgment. The Moon asks you to trust your intuition and navigate through uncertainty with care.", reversed: "When reversed, the Moon shows that illusions are being dispelled and clarity is returning. Fears that seemed overwhelming are diminishing, and you are beginning to see the truth." },
  { id: "major_19_sun", name: "The Sun", number: "XIX", suit: "Major Arcana", element: "Fire", planet: "The Sun", keywords: ["Joy","Success","Vitality","Clarity","Optimism"], upright: "The Sun brings growth, recovery, and radiant success. This is one of the most positive cards in the tarot, heralding a time of joy, clarity, and achievement. Children, creativity, and new projects flourish under the Sun's influence.", reversed: "When reversed, the Sun's energy is temporarily blocked or diminished. You may be experiencing self-doubt or a temporary setback. The joy and success are still available — you just need to clear away what is blocking the light." },
  { id: "major_20_judgement", name: "Judgement", number: "XX", suit: "Major Arcana", element: "Fire", planet: "Pluto", keywords: ["Reflection","Reckoning","Awakening","Absolution","Second Chances"], upright: "Judgement calls you to reflect on the past and make peace with it. This is a time of reckoning and awakening — a moment to hear the call of your higher self and respond. Second chances are available to you.", reversed: "When reversed, Judgement shows self-doubt and an inability to forgive yourself or others. You may be stuck in the past, unable to move forward. It is time to release old wounds." },
  { id: "major_21_world", name: "The World", number: "XXI", suit: "Major Arcana", element: "Earth", planet: "Saturn", keywords: ["Completion","Integration","Achievement","Wholeness","Travel"], upright: "The World represents success and the completion of a major life cycle. You have achieved something significant and can celebrate your accomplishments. This card also heralds the beginning of a new cycle — the end of one journey and the start of another.", reversed: "When reversed, the World shows that completion is delayed or that you are not fully embracing the success available to you. There may be loose ends to tie up before you can truly celebrate." },
];

// ─── Card SVG Art (ornate back + front face) ─────────────────────────────────

const ELEMENT_COLORS: Record<string, string> = {
  Air: "#a8d8ea",
  Water: "#7eb8f7",
  Fire: "#f4a460",
  Earth: "#8fbc8f",
};

const ELEMENT_SYMBOLS: Record<string, string> = {
  Air: "☁",
  Water: "🜄",
  Fire: "🜂",
  Earth: "🜃",
};

function CardBack() {
  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1a1040" />
          <stop offset="100%" stopColor="#0a0820" />
        </radialGradient>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d060" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c8960c" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b6914" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="200" rx="8" fill="url(#bgGrad)" />
      <rect x="4" y="4" width="112" height="192" rx="6" fill="none" stroke="#c8960c" strokeWidth="0.8" strokeOpacity="0.6" />
      <rect x="8" y="8" width="104" height="184" rx="4" fill="none" stroke="#c8960c" strokeWidth="0.4" strokeOpacity="0.3" />
      {/* Sun rays */}
      {Array.from({length: 16}).map((_, i) => {
        const angle = (i * 22.5) * Math.PI / 180;
        const r1 = 18, r2 = 28;
        return (
          <line key={i}
            x1={60 + r1 * Math.cos(angle)} y1={100 + r1 * Math.sin(angle)}
            x2={60 + r2 * Math.cos(angle)} y2={100 + r2 * Math.sin(angle)}
            stroke="#c8960c" strokeWidth="0.8" strokeOpacity="0.5"
          />
        );
      })}
      <circle cx="60" cy="100" r="16" fill="url(#sunGrad)" />
      <circle cx="60" cy="100" r="10" fill="none" stroke="#f5d060" strokeWidth="0.8" strokeOpacity="0.7" />
      {/* Corner ornaments */}
      {[[12,16],[108,16],[12,184],[108,184]].map(([cx,cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4" fill="none" stroke="#c8960c" strokeWidth="0.6" strokeOpacity="0.5" />
          <circle cx={cx} cy={cy} r="1.5" fill="#c8960c" fillOpacity="0.5" />
        </g>
      ))}
      {/* Stars */}
      {[[20,40],[100,40],[20,160],[100,160],[40,70],[80,70],[40,130],[80,130]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="0.8" fill="#f5d060" fillOpacity="0.4" />
      ))}
      <text x="60" y="195" textAnchor="middle" fontSize="6" fill="#c8960c" fillOpacity="0.5" fontFamily="serif" letterSpacing="2">✦ ARCANA ✦</text>
    </svg>
  );
}

function CardFace({ card }: { card: typeof CARDS[0] }) {
  const color = ELEMENT_COLORS[card.element] || "#c8960c";
  const symbol = ELEMENT_SYMBOLS[card.element] || "✦";
  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id={`fg-${card.id}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1e1650" />
          <stop offset="100%" stopColor="#0a0820" />
        </radialGradient>
      </defs>
      <rect width="120" height="200" rx="8" fill={`url(#fg-${card.id})`} />
      <rect x="4" y="4" width="112" height="192" rx="6" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.7" />
      {/* Number */}
      <text x="60" y="22" textAnchor="middle" fontSize="9" fill={color} fillOpacity="0.8" fontFamily="serif" letterSpacing="1">{card.number}</text>
      {/* Decorative line */}
      <line x1="20" y1="27" x2="100" y2="27" stroke={color} strokeWidth="0.4" strokeOpacity="0.4" />
      {/* Central symbol area */}
      <circle cx="60" cy="90" r="32" fill="none" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
      <circle cx="60" cy="90" r="24" fill="none" stroke={color} strokeWidth="0.4" strokeOpacity="0.2" />
      {/* Element symbol */}
      <text x="60" y="96" textAnchor="middle" fontSize="28" fill={color} fillOpacity="0.6">{symbol}</text>
      {/* Card name */}
      <line x1="20" y1="135" x2="100" y2="135" stroke={color} strokeWidth="0.4" strokeOpacity="0.4" />
      <text x="60" y="150" textAnchor="middle" fontSize="8" fill="#f5d060" fontFamily="serif" letterSpacing="1.5">
        {card.name.toUpperCase()}
      </text>
      {/* Keywords */}
      <text x="60" y="165" textAnchor="middle" fontSize="5.5" fill={color} fillOpacity="0.7" fontFamily="serif">
        {card.keywords.slice(0,3).join(" · ")}
      </text>
      {/* Element */}
      <text x="60" y="180" textAnchor="middle" fontSize="5" fill={color} fillOpacity="0.5" fontFamily="serif" letterSpacing="1">
        {card.element.toUpperCase()}
      </text>
      {/* Corner ornaments */}
      {[[12,16],[108,16],[12,184],[108,184]].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill={color} fillOpacity="0.3" />
      ))}
    </svg>
  );
}

// ─── Flip Card Component ──────────────────────────────────────────────────────

function FlipCard({ card, isFlipped, onClick, style }: {
  card: typeof CARDS[0];
  isFlipped: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="cursor-pointer select-none"
      style={{ perspective: "800px", ...style }}
      onClick={onClick}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <CardBack />
        </div>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <CardFace card={card} />
        </div>
      </div>
    </div>
  );
}

// ─── Draw Tab ─────────────────────────────────────────────────────────────────

function DrawTab() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<typeof CARDS[0] | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReversed, setIsReversed] = useState(false);

  const spreadCards = CARDS.slice(0, 22);
  const total = spreadCards.length;

  const handleCardClick = (card: typeof CARDS[0]) => {
    setSelectedCard(card);
    setIsReversed(Math.random() > 0.7);
    setIsFlipped(false);
    setTimeout(() => setIsFlipped(true), 100);
  };

  const handleClose = () => {
    setIsFlipped(false);
    setTimeout(() => setSelectedCard(null), 700);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Instruction */}
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "#c8960c", fontFamily: "serif" }}>✦ The Oracle Speaks ✦</p>
        <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Cinzel', serif", color: "#f0e6c8", letterSpacing: "0.1em" }}>
          DRAW YOUR CARD
        </h2>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ fontFamily: "'EB Garamond', serif", color: "#a89070", fontStyle: "italic" }}>
          Sweep your cursor across the spread to roll the deck. The card that calls to you — hover, then click to reveal its wisdom.
        </p>
      </div>

      {/* Arc spread */}
      <div className="relative w-full" style={{ height: "280px", maxWidth: "900px" }}>
        {spreadCards.map((card, i) => {
          const angle = -50 + (i / (total - 1)) * 100;
          const rad = angle * Math.PI / 180;
          const radius = 380;
          const cx = 50 + (i / (total - 1) - 0.5) * 80;
          const cy = 85 - Math.abs(Math.sin(rad)) * 30;
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={card.id}
              className="absolute transition-all duration-200"
              style={{
                width: "52px",
                height: "88px",
                left: `${cx}%`,
                bottom: isHovered ? "20px" : "0px",
                transform: `translateX(-50%) rotate(${angle * 0.4}deg) scale(${isHovered ? 1.15 : 1})`,
                transformOrigin: "bottom center",
                filter: isHovered ? "drop-shadow(0 0 12px rgba(200,150,12,0.8))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                zIndex: isHovered ? 30 : i,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleCardClick(card)}
            >
              <CardBack />
            </div>
          );
        })}
      </div>

      {/* Selected card modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(5,3,20,0.92)", backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        >
          <div
            className="flex gap-8 items-start max-w-3xl w-full mx-4 p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Card */}
            <div className="flex-shrink-0" style={{ width: "160px", height: "267px" }}>
              <FlipCard
                card={selectedCard}
                isFlipped={isFlipped}
                onClick={() => {}}
                style={{ width: "160px", height: "267px", transform: isReversed && isFlipped ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs tracking-[0.3em] mb-1" style={{ color: "#c8960c", fontFamily: "serif" }}>
                {selectedCard.number} · {selectedCard.suit}
              </p>
              <h3 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cinzel', serif", color: "#f0e6c8" }}>
                {selectedCard.name}
              </h3>
              {isReversed && (
                <p className="text-xs tracking-widest mb-3" style={{ color: "#e07070", fontFamily: "serif" }}>↓ REVERSED</p>
              )}
              <div className="flex gap-2 flex-wrap mb-4">
                {selectedCard.keywords.map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "rgba(200,150,12,0.4)", color: "#c8960c", fontFamily: "serif" }}>{k}</span>
                ))}
              </div>
              <div className="flex gap-3 text-xs mb-4" style={{ color: "#a89070", fontFamily: "serif" }}>
                <span>Element: {selectedCard.element}</span>
                {selectedCard.planet && <span>· Planet: {selectedCard.planet}</span>}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "'EB Garamond', serif", color: "#d4c4a0", fontStyle: "italic" }}>
                {isReversed ? selectedCard.reversed : selectedCard.upright}
              </p>
              <button
                onClick={handleClose}
                className="text-xs tracking-widest px-4 py-2 border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(200,150,12,0.4)", color: "#c8960c", fontFamily: "serif" }}
              >
                ✦ CLOSE ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Browse Tab ───────────────────────────────────────────────────────────────

function BrowseTab() {
  const [selected, setSelected] = useState<typeof CARDS[0] | null>(null);
  const [isReversed, setIsReversed] = useState(false);

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "#c8960c", fontFamily: "serif" }}>✦ The Complete Deck ✦</p>
        <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Cinzel', serif", color: "#f0e6c8", letterSpacing: "0.1em" }}>
          BROWSE THE DECK
        </h2>
        <p className="text-sm" style={{ fontFamily: "'EB Garamond', serif", color: "#a89070", fontStyle: "italic" }}>
          22 Major Arcana — click any card to explore its meaning
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-3 max-w-5xl mx-auto">
        {CARDS.map(card => (
          <div
            key={card.id}
            className="cursor-pointer group"
            onClick={() => { setSelected(card); setIsReversed(false); }}
          >
            <div
              className="transition-all duration-200 group-hover:scale-105"
              style={{
                filter: selected?.id === card.id
                  ? "drop-shadow(0 0 12px rgba(200,150,12,0.9))"
                  : "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
              }}
            >
              <CardFace card={card} />
            </div>
            <p className="text-center mt-1 text-xs" style={{ color: "#a89070", fontFamily: "serif", fontSize: "9px" }}>
              {card.name}
            </p>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(5,3,20,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="flex gap-8 items-start max-w-3xl w-full mx-4 p-8 rounded-lg"
            style={{ background: "rgba(15,10,40,0.95)", border: "1px solid rgba(200,150,12,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0" style={{ width: "140px", height: "233px" }}>
              <div style={{ transform: isReversed ? "rotate(180deg)" : "none", transition: "transform 0.3s", width: "140px", height: "233px" }}>
                <CardFace card={selected} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs tracking-[0.3em] mb-1" style={{ color: "#c8960c", fontFamily: "serif" }}>
                {selected.number} · {selected.suit}
              </p>
              <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Cinzel', serif", color: "#f0e6c8" }}>
                {selected.name}
              </h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {selected.keywords.map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "rgba(200,150,12,0.4)", color: "#c8960c", fontFamily: "serif" }}>{k}</span>
                ))}
              </div>
              <div className="flex gap-4 text-xs mb-4" style={{ color: "#a89070", fontFamily: "serif" }}>
                <span>Element: {selected.element}</span>
                {selected.planet && <span>Planet: {selected.planet}</span>}
              </div>

              {/* Toggle upright/reversed */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsReversed(false)}
                  className="text-xs px-3 py-1 border transition-all"
                  style={{
                    borderColor: !isReversed ? "#c8960c" : "rgba(200,150,12,0.3)",
                    color: !isReversed ? "#c8960c" : "#a89070",
                    background: !isReversed ? "rgba(200,150,12,0.1)" : "transparent",
                    fontFamily: "serif",
                  }}
                >↑ UPRIGHT</button>
                <button
                  onClick={() => setIsReversed(true)}
                  className="text-xs px-3 py-1 border transition-all"
                  style={{
                    borderColor: isReversed ? "#e07070" : "rgba(200,150,12,0.3)",
                    color: isReversed ? "#e07070" : "#a89070",
                    background: isReversed ? "rgba(224,112,112,0.1)" : "transparent",
                    fontFamily: "serif",
                  }}
                >↓ REVERSED</button>
              </div>

              <p className="text-sm leading-relaxed" style={{ fontFamily: "'EB Garamond', serif", color: "#d4c4a0", fontStyle: "italic" }}>
                {isReversed ? selected.reversed : selected.upright}
              </p>

              <button
                onClick={() => setSelected(null)}
                className="mt-4 text-xs tracking-widest px-4 py-2 border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(200,150,12,0.4)", color: "#c8960c", fontFamily: "serif" }}
              >
                ✦ CLOSE ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stars Background ─────────────────────────────────────────────────────────

function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.5 + 0.1,
    delay: Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r * 2}px`,
            height: `${s.r * 2}px`,
            background: "#f5d060",
            opacity: s.opacity,
            animation: `twinkle 3s ${s.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TarotApp() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"draw" | "browse">("draw");

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: "linear-gradient(180deg, #050314 0%, #0a0820 40%, #080618 100%)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.6; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      <Stars />

      {/* Back button */}
      <button
        onClick={() => setLocation("/ui-design")}
        className="fixed top-5 left-5 z-40 flex items-center gap-2 text-xs tracking-widest px-3 py-2 border transition-all hover:bg-white/5"
        style={{ borderColor: "rgba(200,150,12,0.4)", color: "#c8960c", fontFamily: "serif", background: "rgba(5,3,20,0.8)" }}
      >
        ← BACK
      </button>

      {/* Label */}
      <div className="fixed top-5 right-5 z-40 text-xs tracking-widest" style={{ color: "rgba(200,150,12,0.5)", fontFamily: "serif" }}>
        UI DESIGN · CASE STUDY
      </div>

      <div className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(to right, transparent, rgba(200,150,12,0.6))" }} />
            <span className="text-xs tracking-[0.4em]" style={{ color: "#c8960c", fontFamily: "serif" }}>THE COMPLETE RIDER-WAITE DECK</span>
            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(to left, transparent, rgba(200,150,12,0.6))" }} />
          </div>
          <h1
            className="text-6xl md:text-8xl font-black mb-4"
            style={{ fontFamily: "'Cinzel Decorative', serif", color: "#f0e6c8", letterSpacing: "0.05em", textShadow: "0 0 40px rgba(200,150,12,0.3)" }}
          >
            Tarot Arcana
          </h1>
          <p className="text-lg mb-8" style={{ fontFamily: "'EB Garamond', serif", color: "#a89070", fontStyle: "italic" }}>
            Explore the ancient wisdom of the 78 cards
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 mb-8">
            {[["22", "Major Arcana"], ["56", "Minor Arcana"], ["78", "Total Cards"]].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-3xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#f0e6c8" }}>{n}</div>
                <div className="text-xs tracking-widest mt-1" style={{ color: "#a89070", fontFamily: "serif" }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-24" style={{ background: "rgba(200,150,12,0.3)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#c8960c" }} />
            <div className="h-px w-24" style={{ background: "rgba(200,150,12,0.3)" }} />
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-0 border-b" style={{ borderColor: "rgba(200,150,12,0.2)" }}>
            {(["draw", "browse"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-8 py-3 text-xs tracking-[0.3em] uppercase transition-all relative"
                style={{
                  fontFamily: "serif",
                  color: tab === t ? "#f0e6c8" : "#a89070",
                  borderBottom: tab === t ? "2px solid #c8960c" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t === "draw" ? "✦ Draw Your Card" : "☽ Browse the Deck"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {tab === "draw" ? <DrawTab /> : <BrowseTab />}
        </div>
      </div>
    </div>
  );
}
