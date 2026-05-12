import { useState } from 'react';
import { useLocation } from 'wouter';

// ─── Budgeting App Component Library ─────────────────────────────────────────
// Design tokens: Primary Blue #3366FF | Header Blue #1C53C6 | Olive #8B9A5E
// Pink Badge #F5C6D0 | Yellow Badge #E8D88E | BG #F0EDE8
// Progress Green #2ECC71 | Warning Red #E84B4B
// Fonts: Caveat (headings/nav) + Inter (body)
// ─────────────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'details' | 'add' | 'trends' | 'budget' | 'savings';

const COLORS = {
  blue: '#3366FF',
  blueDeep: '#1C53C6',
  olive: '#8B9A5E',
  pink: '#F5C6D0',
  yellow: '#E8D88E',
  green: '#2ECC71',
  red: '#E84B4B',
  dark: '#1A1F3A',
  bg: '#F0EDE8',
};

// ── Shared phone shell ────────────────────────────────────────────────────────
function PhoneShell({ activeScreen, onTabChange, children }: {
  activeScreen: Screen;
  onTabChange: (s: Screen) => void;
  children: React.ReactNode;
}) {
  const headerBlue = activeScreen === 'home';
  const tabs: { id: Screen; emoji: string; label: string }[] = [
    { id: 'home', emoji: '🏠', label: 'Home' },
    { id: 'details', emoji: '📋', label: 'Details' },
    { id: 'add', emoji: '➕', label: 'Add' },
    { id: 'trends', emoji: '📊', label: 'Trends' },
    { id: 'budget', emoji: '💰', label: 'Budget' },
    { id: 'savings', emoji: '🐷', label: 'Savings' },
  ];
  return (
    <div style={{
      width: 390, flexShrink: 0,
      background: COLORS.bg,
      borderRadius: 48,
      boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      height: 844,
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 28px 8px',
        background: headerBlue ? COLORS.blue : COLORS.bg,
        color: headerBlue ? '#fff' : COLORS.dark,
        transition: 'background 0.3s',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 500 }}>
          <span>●●●●</span><span>WiFi</span><span>▮▮▮</span>
        </div>
      </div>
      {/* Screen */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {/* Bottom nav */}
      <div style={{
        display: 'flex', background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 8, flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTabChange(t.id)} style={{
            flex: 1, padding: '10px 4px 6px', border: 'none', background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: t.id === 'add' ? 20 : 16 }}>{t.emoji}</span>
            <span style={{
              fontFamily: "'Caveat', cursive", fontSize: 11, fontWeight: 600,
              color: activeScreen === t.id ? COLORS.blue : '#999',
            }}>{t.label}</span>
            {activeScreen === t.id && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: COLORS.blue }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Home screen ───────────────────────────────────────────────────────────────
function HomeScreen() {
  const [filter, setFilter] = useState<'All' | 'Food' | 'Transport' | 'Shopping'>('All');
  const cats = [
    { name: 'Housing', emoji: '🏠', rate: '£35.00/day', spent: 700, limit: 900, dark: true },
    { name: 'Food', emoji: '🍔', rate: '£12.50/day', spent: 180, limit: 400, dark: false },
    { name: 'Transport', emoji: '🚗', rate: '£5.00/day', spent: 100, limit: 100, dark: false },
    { name: 'Shopping', emoji: '🛍️', rate: '£15.50/day', spent: 310, limit: 300, dark: false },
  ];
  const visible = filter === 'All' ? cats : cats.filter(c => c.name === filter);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg }}>
      {/* Blue header */}
      <div style={{
        background: `linear-gradient(160deg, ${COLORS.blue} 0%, ${COLORS.blueDeep} 100%)`,
        padding: '16px 20px 32px', borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 32, fontWeight: 700, color: '#fff' }}>Budget</span>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔍</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '20px 22px', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)', marginBottom: 6, textTransform: 'uppercase' }}>Total Balance</p>
          <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16 }}>£4,250</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ l: 'SPENT', v: '£2,100' }, { l: 'LEFT', v: '£2,150' }, { l: 'DAYS', v: '12' }].map(i => (
              <div key={i.l}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{i.v}</p>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{i.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[{ bg: COLORS.pink }, { bg: COLORS.yellow }, { bg: '#E8E8E8' }].map((b, i) => (
            <div key={i} style={{ flex: 1, background: b.bg, borderRadius: 12, padding: '10px 12px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>SPENT</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.dark }}>£2,100</p>
            </div>
          ))}
        </div>
        {/* On track */}
        <div style={{ background: COLORS.olive, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>On track! 🎯</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Keep spending at this rate</p>
          </div>
          <span style={{ fontSize: 24 }}>💰</span>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
          {(['All', 'Food', 'Transport', 'Shopping'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none',
              background: filter === f ? COLORS.dark : '#fff',
              color: filter === f ? '#fff' : COLORS.dark,
              fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>{f === 'Food' ? '🍔 ' : f === 'Transport' ? '🚗 ' : f === 'Shopping' ? '🛍️ ' : ''}{f}</button>
          ))}
        </div>
        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 20 }}>
          {visible.map(c => {
            const pct = Math.min(c.spent / c.limit, 1);
            const over = c.spent > c.limit;
            return (
              <div key={c.name} style={{ background: c.dark ? COLORS.dark : '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{c.emoji}</div>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: c.dark ? 'rgba(255,255,255,0.6)' : '#888', textTransform: 'uppercase', marginBottom: 4 }}>{c.name}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: c.dark ? '#fff' : COLORS.dark, marginBottom: 2 }}>{c.rate}</p>
                {over
                  ? <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.red, marginBottom: 8 }}>Over budget</p>
                  : <p style={{ fontSize: 11, color: c.dark ? 'rgba(255,255,255,0.5)' : '#999', marginBottom: 8 }}>£{c.spent} of £{c.limit}</p>
                }
                <div style={{ height: 4, background: c.dark ? 'rgba(255,255,255,0.2)' : '#eee', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: over ? COLORS.red : COLORS.green, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Details screen ────────────────────────────────────────────────────────────
function DetailsScreen() {
  const txns = [
    { emoji: '🍔', name: 'Tesco Express', cat: 'Food', date: 'Today', amt: 12.50 },
    { emoji: '🚗', name: 'TfL Oyster', cat: 'Transport', date: 'Today', amt: 5.00 },
    { emoji: '🛍️', name: 'ASOS', cat: 'Shopping', date: 'Yesterday', amt: 45.00 },
    { emoji: '🍔', name: 'Pret A Manger', cat: 'Food', date: 'Yesterday', amt: 8.90 },
    { emoji: '🏠', name: 'Rent Payment', cat: 'Housing', date: 'Nov 1', amt: 700.00 },
    { emoji: '🍔', name: "Sainsbury's", cat: 'Food', date: 'Nov 3', amt: 34.20 },
    { emoji: '🚗', name: 'Uber', cat: 'Transport', date: 'Nov 4', amt: 18.50 },
    { emoji: '🛍️', name: 'Amazon', cat: 'Shopping', date: 'Nov 5', amt: 89.99 },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, padding: '20px 20px 0' }}>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Transactions</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>November 2024</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
        {txns.map((t, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.emoji}</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.dark, marginBottom: 2 }}>{t.name}</p>
                <p style={{ fontSize: 11, color: '#999' }}>{t.date} · {t.cat}</p>
              </div>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.red }}>£{t.amt.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Add screen ────────────────────────────────────────────────────────────────
function AddScreen() {
  const [form, setForm] = useState({ name: '', amount: '', cat: 'Food', type: 'expense' });
  const [success, setSuccess] = useState(false);
  const handle = () => {
    if (form.name && form.amount) {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setForm({ name: '', amount: '', cat: 'Food', type: 'expense' }); }, 1500);
    }
  };
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, padding: 20 }}>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Add Expense</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Record a new transaction</p>
      {success && <div style={{ background: COLORS.green, borderRadius: 14, padding: '14px 18px', color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 20, textAlign: 'center' }}>✓ Added!</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: form.type === t ? (t === 'expense' ? COLORS.red : COLORS.green) : 'transparent', color: form.type === t ? '#fff' : '#888', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Coffee, Groceries..." style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: '#fff', fontSize: 14, color: COLORS.dark, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Amount (£)</label>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: '#fff', fontSize: 20, fontWeight: 700, color: COLORS.dark, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ n: 'Food', e: '🍔' }, { n: 'Transport', e: '🚗' }, { n: 'Shopping', e: '🛍️' }, { n: 'Housing', e: '🏠' }].map(c => (
              <button key={c.n} onClick={() => setForm(f => ({ ...f, cat: c.n }))} style={{ padding: 12, borderRadius: 12, border: 'none', background: form.cat === c.n ? COLORS.dark : '#fff', color: form.cat === c.n ? '#fff' : COLORS.dark, fontSize: 13, fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{c.e} {c.n}</button>
            ))}
          </div>
        </div>
        <button onClick={handle} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDeep})`, color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 8, boxShadow: `0 4px 16px ${COLORS.blue}55` }}>Add Transaction</button>
      </div>
    </div>
  );
}

// ── Trends screen ─────────────────────────────────────────────────────────────
function TrendsScreen() {
  const data = [{ m: 'Aug', v: 1950 }, { m: 'Sep', v: 2300 }, { m: 'Oct', v: 1800 }, { m: 'Nov', v: 2100 }];
  const max = Math.max(...data.map(d => d.v));
  const cats = [
    { n: 'Housing', e: '🏠', spent: 700, limit: 900 },
    { n: 'Food', e: '🍔', spent: 180, limit: 400 },
    { n: 'Transport', e: '🚗', spent: 100, limit: 100 },
    { n: 'Shopping', e: '🛍️', spent: 310, limit: 300 },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, padding: 20 }}>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Spending Trends</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Last 4 months</p>
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Monthly Spend</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, justifyContent: 'space-around' }}>
          {data.map((d, i) => {
            const h = (d.v / max) * 100;
            const latest = i === data.length - 1;
            return (
              <div key={d.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: latest ? COLORS.blue : '#888' }}>£{d.v.toLocaleString()}</p>
                <div style={{ width: 40, height: `${h}%`, minHeight: 8, background: latest ? `linear-gradient(180deg, ${COLORS.blue}, ${COLORS.blueDeep})` : '#E8E8E8', borderRadius: '6px 6px 0 0' }} />
                <p style={{ fontSize: 12, fontFamily: "'Caveat', cursive", fontWeight: 600, color: '#888' }}>{d.m}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Category Breakdown</p>
        {cats.map(c => {
          const pct = (c.spent / 2100) * 100;
          const over = c.spent > c.limit;
          return (
            <div key={c.n} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.dark }}>{c.e} {c.n}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>£{c.spent}</span>
              </div>
              <div style={{ height: 6, background: COLORS.bg, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: over ? COLORS.red : COLORS.blue, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Budget screen ─────────────────────────────────────────────────────────────
function BudgetScreen() {
  const cats = [
    { n: 'Housing', e: '🏠', spent: 700, limit: 900, rate: 35.00 },
    { n: 'Food', e: '🍔', spent: 180, limit: 400, rate: 12.50 },
    { n: 'Transport', e: '🚗', spent: 100, limit: 100, rate: 5.00 },
    { n: 'Shopping', e: '🛍️', spent: 310, limit: 300, rate: 15.50 },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, padding: 20 }}>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Budget Limits</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>November 2024</p>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDeep})`, borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 8 }}>Total Budget</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 4 }}>£1,700</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>£1,290 spent · £410 remaining</p>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 14 }}>
          <div style={{ height: '100%', width: '76%', background: '#fff', borderRadius: 3 }} />
        </div>
      </div>
      {cats.map(c => {
        const pct = Math.min(c.spent / c.limit, 1);
        const over = c.spent > c.limit;
        return (
          <div key={c.n} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{c.e}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.dark }}>{c.n}</p>
                  <p style={{ fontSize: 11, color: '#999' }}>£{c.rate.toFixed(2)}/day</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: over ? COLORS.red : COLORS.dark }}>£{c.spent}</p>
                <p style={{ fontSize: 11, color: '#999' }}>of £{c.limit}</p>
              </div>
            </div>
            <div style={{ height: 6, background: COLORS.bg, borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pct * 100}%`, background: over ? COLORS.red : pct > 0.8 ? '#F5A623' : COLORS.green, borderRadius: 3 }} />
            </div>
            {over && <p style={{ fontSize: 11, color: COLORS.red, fontWeight: 600, marginTop: 6 }}>Over by £{c.spent - c.limit}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Savings screen ────────────────────────────────────────────────────────────
function SavingsScreen() {
  const goals = [
    { n: 'Holiday Fund', e: '✈️', saved: 1200, goal: 2000, color: COLORS.blue },
    { n: 'Emergency Fund', e: '🛡️', saved: 3000, goal: 5000, color: COLORS.green },
    { n: 'New Laptop', e: '💻', saved: 450, goal: 1200, color: COLORS.olive },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, padding: 20 }}>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>Savings Goals</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Track your progress</p>
      <div style={{ background: COLORS.dark, borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>Total Saved</p>
        <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4 }}>£4,650</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>across 3 goals</p>
      </div>
      {goals.map(g => {
        const pct = (g.saved / g.goal) * 100;
        return (
          <div key={g.n} style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{g.e}</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.dark, marginBottom: 2 }}>{g.n}</p>
                  <p style={{ fontSize: 12, color: '#999' }}>{pct.toFixed(0)}% complete</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: g.color }}>£{g.saved.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: '#bbb' }}>of £{g.goal.toLocaleString()}</p>
              </div>
            </div>
            <div style={{ height: 8, background: COLORS.bg, borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: g.color, borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>£{(g.goal - g.saved).toLocaleString()} to go</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Color Palette section ─────────────────────────────────────────────────────
function ColorPalette() {
  const swatches = [
    { name: 'Primary Blue', hex: '#3366FF' },
    { name: 'Header Blue', hex: '#1C53C6' },
    { name: 'Olive Green', hex: '#8B9A5E' },
    { name: 'Pink Badge', hex: '#F5C6D0' },
    { name: 'Yellow Badge', hex: '#E8D88E' },
    { name: 'Progress Green', hex: '#2ECC71' },
    { name: 'Warning Red', hex: '#E84B4B' },
    { name: 'Dark Navy', hex: '#1A1F3A' },
  ];
  return (
    <div>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Color Palette</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: 300 }}>Design tokens extracted from the Budget app</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
        {swatches.map(s => (
          <div key={s.name} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            <div style={{ height: 80, background: s.hex }} />
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{s.name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{s.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Typography section ────────────────────────────────────────────────────────
function Typography() {
  const specs = [
    { label: 'Page Title', sample: 'Budget', font: 'Caveat Bold', size: '32px', style: { fontFamily: "'Caveat', cursive", fontSize: 32, fontWeight: 700, color: '#fff' } },
    { label: 'Card Heading', sample: '£4,250', font: 'Inter Bold', size: '28px', style: { fontFamily: 'Inter', fontSize: 28, fontWeight: 700, color: '#fff' } },
    { label: 'Section Label', sample: 'TOTAL BALANCE', font: 'Inter Semibold', size: '10px', style: { fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.6)' } },
    { label: 'Body Amount', sample: '£35.00/day', font: 'Inter Bold', size: '16px', style: { fontFamily: 'Inter', fontSize: 16, fontWeight: 700, color: '#fff' } },
    { label: 'Body Text', sample: '£700 of £900', font: 'Inter Regular', size: '13px', style: { fontFamily: 'Inter', fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)' } },
    { label: 'Nav Label', sample: 'Home', font: 'Caveat Medium', size: '12px', style: { fontFamily: "'Caveat', cursive", fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)' } },
  ];
  return (
    <div>
      <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Typography</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: 300 }}>Font system: Caveat + Inter</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {specs.map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
              <span style={s.style}>{s.sample}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{s.font}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{s.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BudgetApp() {
  const [, setLocation] = useLocation();
  const [activeScreen, setActiveScreen] = useState<Screen>('home');

  const screenContent: Record<Screen, React.ReactNode> = {
    home: <HomeScreen />,
    details: <DetailsScreen />,
    add: <AddScreen />,
    trends: <TrendsScreen />,
    budget: <BudgetScreen />,
    savings: <SavingsScreen />,
  };

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Back button */}
      <button
        className="liquid-glass"
        onClick={() => setLocation('/ui-design')}
        style={{
          position: 'fixed', top: 24, left: 24, zIndex: 200,
          borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif",
          fontSize: '0.75rem', letterSpacing: '0.15em', padding: '8px 16px',
          transition: 'all 0.3s ease', fontWeight: '400',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.1)'; }}
      >
        ← BACK
      </button>

      {/* Page header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 60px' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow', sans-serif", fontWeight: 300, marginBottom: 12 }}>UI DESIGN · CASE STUDY</p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 'normal', color: '#fff', marginBottom: 16 }}>Budgeting App</h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: 560, lineHeight: 1.8, fontWeight: 300 }}>
          A mobile budgeting app with real-time spending tracking, category breakdowns, and savings goals. Built with a warm off-white palette, Caveat + Inter typography, and a blue-dominant design system.
        </p>
      </div>

      {/* Interactive phone + info */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px', display: 'flex', gap: 60, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Phone */}
        <div style={{ flexShrink: 0 }}>
          <PhoneShell activeScreen={activeScreen} onTabChange={setActiveScreen}>
            {screenContent[activeScreen]}
          </PhoneShell>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>TAP THE TABS TO EXPLORE</p>
        </div>

        {/* Right column: color + typography */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 60 }}>
          <ColorPalette />
          <Typography />
        </div>
      </div>
    </div>
  );
}
