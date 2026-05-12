import { useState } from 'react';
import { useLocation } from 'wouter';

// ─── Budget App Clone ───────────────────────────────────────────────────────
// Design tokens extracted from the original:
//   Primary Blue: #3366FF  |  Header Blue: #1C53C6  |  Olive Green: #8B9A5E
//   Pink Badge: #F5C6D0    |  Yellow Badge: #E8D88E  |  BG: #F0EDE8
//   Progress Green: #2ECC71 |  Warning Red: #E84B4B
//   Fonts: Caveat (headings/nav) + Inter (body/amounts)
// ────────────────────────────────────────────────────────────────────────────

type Tab = 'home' | 'details' | 'add' | 'trends' | 'budget' | 'savings';
type CategoryFilter = 'All' | 'Food' | 'Transport' | 'Shopping';

interface Transaction {
  id: number;
  category: string;
  emoji: string;
  name: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

interface BudgetCategory {
  name: string;
  emoji: string;
  icon: string;
  spent: number;
  limit: number;
  dailyRate: number;
  color: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, category: 'Food', emoji: '🍔', name: 'Tesco Express', amount: -12.50, date: 'Today', type: 'expense' },
  { id: 2, category: 'Transport', emoji: '🚗', name: 'TfL Oyster', amount: -5.00, date: 'Today', type: 'expense' },
  { id: 3, category: 'Shopping', emoji: '🛍️', name: 'ASOS', amount: -45.00, date: 'Yesterday', type: 'expense' },
  { id: 4, category: 'Food', emoji: '🍔', name: 'Pret A Manger', amount: -8.90, date: 'Yesterday', type: 'expense' },
  { id: 5, category: 'Housing', emoji: '🏠', name: 'Rent Payment', amount: -700.00, date: 'Nov 1', type: 'expense' },
  { id: 6, category: 'Food', emoji: '🍔', name: 'Sainsbury\'s', amount: -34.20, date: 'Nov 3', type: 'expense' },
  { id: 7, category: 'Transport', emoji: '🚗', name: 'Uber', amount: -18.50, date: 'Nov 4', type: 'expense' },
  { id: 8, category: 'Shopping', emoji: '🛍️', name: 'Amazon', amount: -89.99, date: 'Nov 5', type: 'expense' },
  { id: 9, category: 'Food', emoji: '🍔', name: 'Deliveroo', amount: -22.40, date: 'Nov 6', type: 'expense' },
  { id: 10, category: 'Transport', emoji: '🚗', name: 'National Rail', amount: -32.00, date: 'Nov 7', type: 'expense' },
];

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: 'Housing', emoji: '🏠', icon: '🏠', spent: 700, limit: 900, dailyRate: 35.00, color: '#1A1F3A' },
  { name: 'Food', emoji: '🍔', icon: '🍔', spent: 180, limit: 400, dailyRate: 12.50, color: '#fff' },
  { name: 'Transport', emoji: '🚗', icon: '🚗', spent: 100, limit: 100, dailyRate: 5.00, color: '#fff' },
  { name: 'Shopping', emoji: '🛍️', icon: '🛍️', spent: 310, limit: 300, dailyRate: 15.50, color: '#fff' },
];

const SAVINGS_GOALS = [
  { name: 'Holiday Fund', emoji: '✈️', saved: 1200, goal: 2000, color: '#3366FF' },
  { name: 'Emergency Fund', emoji: '🛡️', saved: 3000, goal: 5000, color: '#2ECC71' },
  { name: 'New Laptop', emoji: '💻', saved: 450, goal: 1200, color: '#8B9A5E' },
];

const TREND_DATA = [
  { month: 'Aug', amount: 1950 },
  { month: 'Sep', amount: 2300 },
  { month: 'Oct', amount: 1800 },
  { month: 'Nov', amount: 2100 },
];

export default function BudgetApp() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [addForm, setAddForm] = useState({ name: '', amount: '', category: 'Food', type: 'expense' });
  const [addSuccess, setAddSuccess] = useState(false);

  const filteredTransactions = categoryFilter === 'All'
    ? TRANSACTIONS
    : TRANSACTIONS.filter(t => t.category === categoryFilter);

  const handleAdd = () => {
    if (addForm.name && addForm.amount) {
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setAddForm({ name: '', amount: '', category: 'Food', type: 'expense' });
        setActiveTab('home');
      }, 1500);
    }
  };

  const maxTrend = Math.max(...TREND_DATA.map(d => d.amount));

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      position: 'relative',
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

      {/* Portfolio label */}
      <div style={{
        position: 'fixed', top: 24, right: 24, zIndex: 200,
        color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem',
        letterSpacing: '0.2em', fontFamily: "'Barlow', sans-serif",
        fontWeight: '300',
      }}>
        UI DESIGN · CASE STUDY
      </div>

      {/* Phone frame */}
      <div style={{
        width: 390, height: 844,
        background: '#F0EDE8',
        borderRadius: 48,
        boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
      }}>

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 28px 8px',
          background: activeTab === 'home' ? '#3366FF' : '#F0EDE8',
          color: activeTab === 'home' ? '#fff' : '#1A1F3A',
          transition: 'background 0.3s ease',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontWeight: 500 }}>
            <span>●●●●</span>
            <span>WiFi</span>
            <span>▮▮▮</span>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* ── HOME SCREEN ── */}
          {activeTab === 'home' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8' }}>
              {/* Blue header */}
              <div style={{
                background: 'linear-gradient(160deg, #3366FF 0%, #1C53C6 100%)',
                padding: '16px 20px 32px',
                borderRadius: '0 0 28px 28px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{
                    fontFamily: "'Caveat', cursive", fontSize: 32, fontWeight: 700, color: '#fff',
                  }}>Budget</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 16,
                  }}>🔍</div>
                </div>

                {/* Balance card */}
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 20, padding: '20px 22px',
                  backdropFilter: 'blur(10px)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', right: -20, top: -20,
                    width: 120, height: 120, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                  }} />
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)', marginBottom: 6, textTransform: 'uppercase' }}>Total Balance</p>
                  <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16 }}>£4,250</p>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {[{ label: 'SPENT', val: '£2,100' }, { label: 'LEFT', val: '£2,150' }, { label: 'DAYS', val: '12' }].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.val}</p>
                        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 16px 0' }}>
                {/* Spent badges */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[
                    { bg: '#F5C6D0', label: 'SPENT', val: '£2,100' },
                    { bg: '#E8D88E', label: 'SPENT', val: '£2,100' },
                    { bg: '#E8E8E8', label: 'SPENT', val: '£2,100' },
                  ].map((b, i) => (
                    <div key={i} style={{
                      flex: 1, background: b.bg, borderRadius: 12, padding: '10px 12px',
                    }}>
                      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>{b.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1F3A' }}>{b.val}</p>
                    </div>
                  ))}
                </div>

                {/* On track banner */}
                <div style={{
                  background: '#8B9A5E', borderRadius: 14, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>On track! 🎯</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Keep spending at this rate</p>
                  </div>
                  <span style={{ fontSize: 24 }}>💰</span>
                </div>

                {/* Category filter pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {(['All', 'Food', 'Transport', 'Shopping'] as CategoryFilter[]).map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none',
                      background: categoryFilter === cat ? '#1A1F3A' : '#fff',
                      color: categoryFilter === cat ? '#fff' : '#1A1F3A',
                      fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s',
                    }}>
                      {cat === 'Food' ? '🍔 ' : cat === 'Transport' ? '🚗 ' : cat === 'Shopping' ? '🛍️ ' : ''}{cat}
                    </button>
                  ))}
                </div>

                {/* Category cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 20 }}>
                  {BUDGET_CATEGORIES.filter(c =>
                    categoryFilter === 'All' || c.name === categoryFilter
                  ).map(cat => {
                    const pct = Math.min(cat.spent / cat.limit, 1);
                    const over = cat.spent > cat.limit;
                    return (
                      <div key={cat.name} style={{
                        background: cat.color === '#1A1F3A' ? '#1A1F3A' : '#fff',
                        borderRadius: 16, padding: '14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{cat.emoji}</div>
                        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: cat.color === '#1A1F3A' ? 'rgba(255,255,255,0.6)' : '#888', textTransform: 'uppercase', marginBottom: 4 }}>{cat.name}</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: cat.color === '#1A1F3A' ? '#fff' : '#1A1F3A', marginBottom: 2 }}>£{cat.dailyRate.toFixed(2)}/day</p>
                        {over ? (
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#E84B4B', marginBottom: 8 }}>Over budget</p>
                        ) : (
                          <p style={{ fontSize: 11, color: cat.color === '#1A1F3A' ? 'rgba(255,255,255,0.5)' : '#999', marginBottom: 8 }}>£{cat.spent} of £{cat.limit}</p>
                        )}
                        <div style={{ height: 4, background: cat.color === '#1A1F3A' ? 'rgba(255,255,255,0.2)' : '#eee', borderRadius: 2 }}>
                          <div style={{
                            height: '100%', width: `${pct * 100}%`,
                            background: over ? '#E84B4B' : '#2ECC71',
                            borderRadius: 2, transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── DETAILS SCREEN ── */}
          {activeTab === 'details' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8' }}>
              <div style={{ padding: '20px 20px 0' }}>
                <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#1A1F3A', marginBottom: 4 }}>Transactions</h2>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>November 2024</p>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
                  {(['All', 'Food', 'Transport', 'Shopping'] as CategoryFilter[]).map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none',
                      background: categoryFilter === cat ? '#1A1F3A' : '#fff',
                      color: categoryFilter === cat ? '#fff' : '#1A1F3A',
                      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Transaction list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
                  {filteredTransactions.map(t => (
                    <div key={t.id} style={{
                      background: '#fff', borderRadius: 14, padding: '14px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>{t.emoji}</div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1F3A', marginBottom: 2 }}>{t.name}</p>
                          <p style={{ fontSize: 11, color: '#999' }}>{t.date} · {t.category}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#E84B4B' }}>£{Math.abs(t.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ADD SCREEN ── */}
          {activeTab === 'add' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8', padding: '20px' }}>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#1A1F3A', marginBottom: 4 }}>Add Transaction</h2>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Record a new expense or income</p>

              {addSuccess && (
                <div style={{
                  background: '#2ECC71', borderRadius: 14, padding: '14px 18px',
                  color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 20,
                  textAlign: 'center',
                }}>
                  ✓ Transaction added!
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Type toggle */}
                <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  {['expense', 'income'].map(type => (
                    <button key={type} onClick={() => setAddForm(f => ({ ...f, type }))} style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: addForm.type === type ? (type === 'expense' ? '#E84B4B' : '#2ECC71') : 'transparent',
                      color: addForm.type === type ? '#fff' : '#888',
                      fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}>{type}</button>
                  ))}
                </div>

                {/* Name input */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label>
                  <input
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Coffee, Groceries..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
                      background: '#fff', fontSize: 14, color: '#1A1F3A',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.06)', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Amount input */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Amount (£)</label>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
                      background: '#fff', fontSize: 20, fontWeight: 700, color: '#1A1F3A',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.06)', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Category select */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[{ name: 'Food', emoji: '🍔' }, { name: 'Transport', emoji: '🚗' }, { name: 'Shopping', emoji: '🛍️' }, { name: 'Housing', emoji: '🏠' }].map(cat => (
                      <button key={cat.name} onClick={() => setAddForm(f => ({ ...f, category: cat.name }))} style={{
                        padding: '12px', borderRadius: 12, border: 'none',
                        background: addForm.category === cat.name ? '#1A1F3A' : '#fff',
                        color: addForm.category === cat.name ? '#fff' : '#1A1F3A',
                        fontSize: 13, fontWeight: 500,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        transition: 'all 0.2s',
                      }}>{cat.emoji} {cat.name}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handleAdd} style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #3366FF, #1C53C6)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  marginTop: 8, boxShadow: '0 4px 16px rgba(51,102,255,0.35)',
                  transition: 'transform 0.15s ease',
                }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Add Transaction
                </button>
              </div>
            </div>
          )}

          {/* ── TRENDS SCREEN ── */}
          {activeTab === 'trends' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8', padding: '20px' }}>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#1A1F3A', marginBottom: 4 }}>Spending Trends</h2>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Last 4 months</p>

              {/* Bar chart */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Monthly Spend</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, justifyContent: 'space-around' }}>
                  {TREND_DATA.map((d, i) => {
                    const h = (d.amount / maxTrend) * 100;
                    const isLatest = i === TREND_DATA.length - 1;
                    return (
                      <div key={d.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: isLatest ? '#3366FF' : '#888' }}>£{d.amount.toLocaleString()}</p>
                        <div style={{
                          width: 40, height: `${h}%`, minHeight: 8,
                          background: isLatest ? 'linear-gradient(180deg, #3366FF, #1C53C6)' : '#E8E8E8',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.5s ease',
                        }} />
                        <p style={{ fontSize: 12, fontFamily: "'Caveat', cursive", fontWeight: 600, color: '#888' }}>{d.month}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Category Breakdown</p>
                {BUDGET_CATEGORIES.map(cat => {
                  const pct = (cat.spent / 2100) * 100;
                  return (
                    <div key={cat.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1F3A' }}>{cat.emoji} {cat.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1F3A' }}>£{cat.spent}</span>
                      </div>
                      <div style={{ height: 6, background: '#F0EDE8', borderRadius: 3 }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: cat.spent > cat.limit ? '#E84B4B' : '#3366FF',
                          borderRadius: 3,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── BUDGET SCREEN ── */}
          {activeTab === 'budget' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8', padding: '20px' }}>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#1A1F3A', marginBottom: 4 }}>Budget Limits</h2>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>November 2024</p>

              {/* Summary card */}
              <div style={{
                background: 'linear-gradient(135deg, #3366FF, #1C53C6)',
                borderRadius: 20, padding: '20px', marginBottom: 20,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 8 }}>Total Budget</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 4 }}>£1,700</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>£1,290 spent · £410 remaining</p>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 14 }}>
                  <div style={{ height: '100%', width: '76%', background: '#fff', borderRadius: 3 }} />
                </div>
              </div>

              {/* Category budget cards */}
              {BUDGET_CATEGORIES.map(cat => {
                const pct = Math.min(cat.spent / cat.limit, 1);
                const over = cat.spent > cat.limit;
                return (
                  <div key={cat.name} style={{
                    background: '#fff', borderRadius: 16, padding: '16px 18px',
                    marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1F3A' }}>{cat.name}</p>
                          <p style={{ fontSize: 11, color: '#999' }}>£{cat.dailyRate.toFixed(2)}/day</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: over ? '#E84B4B' : '#1A1F3A' }}>£{cat.spent}</p>
                        <p style={{ fontSize: 11, color: '#999' }}>of £{cat.limit}</p>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#F0EDE8', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', width: `${pct * 100}%`,
                        background: over ? '#E84B4B' : pct > 0.8 ? '#F5A623' : '#2ECC71',
                        borderRadius: 3,
                      }} />
                    </div>
                    {over && (
                      <p style={{ fontSize: 11, color: '#E84B4B', fontWeight: 600, marginTop: 6 }}>
                        Over by £{cat.spent - cat.limit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SAVINGS SCREEN ── */}
          {activeTab === 'savings' && (
            <div style={{ flex: 1, overflowY: 'auto', background: '#F0EDE8', padding: '20px' }}>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#1A1F3A', marginBottom: 4 }}>Savings Goals</h2>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Track your progress</p>

              {/* Total savings card */}
              <div style={{
                background: '#1A1F3A', borderRadius: 20, padding: '20px', marginBottom: 20,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>Total Saved</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4 }}>£4,650</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>across 3 goals</p>
              </div>

              {/* Savings goal cards */}
              {SAVINGS_GOALS.map(goal => {
                const pct = (goal.saved / goal.goal) * 100;
                return (
                  <div key={goal.name} style={{
                    background: '#fff', borderRadius: 18, padding: '18px 20px',
                    marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 14,
                          background: `${goal.color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>{goal.emoji}</div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1F3A', marginBottom: 2 }}>{goal.name}</p>
                          <p style={{ fontSize: 12, color: '#999' }}>{pct.toFixed(0)}% complete</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: goal.color }}>£{goal.saved.toLocaleString()}</p>
                        <p style={{ fontSize: 11, color: '#bbb' }}>of £{goal.goal.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#F0EDE8', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: goal.color, borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
                      £{(goal.goal - goal.saved).toLocaleString()} to go
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div style={{
          display: 'flex', background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          paddingBottom: 8, flexShrink: 0,
        }}>
          {([
            { id: 'home', emoji: '🏠', label: 'Home' },
            { id: 'details', emoji: '📋', label: 'Details' },
            { id: 'add', emoji: '➕', label: 'Add' },
            { id: 'trends', emoji: '📊', label: 'Trends' },
            { id: 'budget', emoji: '💰', label: 'Budget' },
            { id: 'savings', emoji: '🐷', label: 'Savings' },
          ] as { id: Tab; emoji: string; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '10px 4px 6px', border: 'none', background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: tab.id === 'add' ? 20 : 16 }}>{tab.emoji}</span>
              <span style={{
                fontFamily: "'Caveat', cursive", fontSize: 11, fontWeight: 600,
                color: activeTab === tab.id ? '#3366FF' : '#999',
                transition: 'color 0.2s',
              }}>{tab.label}</span>
              {activeTab === tab.id && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3366FF' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
