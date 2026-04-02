import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { getPastoPianificato, togglePastoPianificato, addPianoPasto, deletePianoPasto } from '../lib/api'
import { MomentoType, PianoPasto } from '../lib/types'

const MOMENTO_ORDER = ['colazione','pranzo','merenda','cena','pre-workout','post-workout','spuntino']
const MOMENTO_COLOR: Record<string, string> = {
  colazione: '#ff6b35', pranzo: '#3b82f6', merenda: '#8b5cf6',
  cena: '#2ed573', 'pre-workout': '#e8ff47', 'post-workout': '#06b6d4', spuntino: '#f59e0b',
}

export default function Alimentazione() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [pastiMap, setPastiMap] = useState<Map<string, PianoPasto[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [addMode, setAddMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  // Form
  const [newNome, setNewNome] = useState('')
  const [newMomento, setNewMomento] = useState<MomentoType>('pranzo')
  const [newData, setNewData] = useState('')
  const [newKcal, setNewKcal] = useState('')
  const [newP, setNewP] = useState('')
  const [newC, setNewC] = useState('')
  const [newG, setNewG] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  const from = format(weekStart, 'yyyy-MM-dd')
  const to = format(weekEnd, 'yyyy-MM-dd')

  useEffect(() => {
    load()
  }, [weekOffset])

  async function load() {
    setLoading(true)
    const pasti = await getPastoPianificato(from, to)
    const map = new Map<string, PianoPasto[]>()
    pasti.forEach((p: PianoPasto) => {
      if (!map.has(p.data)) map.set(p.data, [])
      map.get(p.data)!.push(p)
    })
    map.forEach(list => list.sort((a, b) => MOMENTO_ORDER.indexOf(a.momento) - MOMENTO_ORDER.indexOf(b.momento)))
    setPastiMap(map)
    setLoading(false)
  }

  async function handleToggle(id: number, completato: boolean) {
    await togglePastoPianificato(id, !completato)
    await load()
  }

  async function handleDelete(id: number) {
    await deletePianoPasto(id)
    await load()
  }

  async function handleAdd() {
    if (!newNome.trim() || !newData) return
    setSaving(true)
    await addPianoPasto({
      data: newData,
      momento: newMomento,
      nome_pasto: newNome,
      kcal: newKcal ? Number(newKcal) : undefined,
      proteine_g: newP ? Number(newP) : undefined,
      carboidrati_g: newC ? Number(newC) : undefined,
      grassi_g: newG ? Number(newG) : undefined,
      completato: false,
    })
    setAddMode(false)
    resetForm()
    await load()
    setSaving(false)
  }

  function resetForm() {
    setNewNome(''); setNewMomento('pranzo'); setNewData(''); setNewKcal(''); setNewP(''); setNewC(''); setNewG('')
  }

  const totByDay = (date: string) => {
    const pasti = pastiMap.get(date) || []
    return pasti.reduce((acc, p) => ({
      kcal: acc.kcal + (p.kcal || 0),
      p: acc.p + (p.proteine_g || 0),
      c: acc.c + (p.carboidrati_g || 0),
      g: acc.g + (p.grassi_g || 0),
    }), { kcal: 0, p: 0, c: 0, g: 0 })
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayKey = format(today, 'yyyy-MM-dd')

  if (addMode) {
    return (
      <div className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setAddMode(false); resetForm() }} style={backBtnStyle}>← Indietro</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#f0f0f2', margin: 0 }}>
            Aggiungi pasto
          </h2>
        </div>

        <FieldGroup label="Nome pasto">
          <input placeholder="es. Pasta al pollo" value={newNome} onChange={e => setNewNome(e.target.value)} style={inputStyle} />
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldGroup label="Data">
            <input type="date" value={newData || selectedDate} onChange={e => setNewData(e.target.value)} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Momento">
            <select value={newMomento} onChange={e => setNewMomento(e.target.value as MomentoType)} style={inputStyle}>
              {MOMENTO_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FieldGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Kcal', val: newKcal, set: setNewKcal },
            { label: 'Prot g', val: newP, set: setNewP },
            { label: 'Carb g', val: newC, set: setNewC },
            { label: 'Grassi g', val: newG, set: setNewG },
          ].map(f => (
            <FieldGroup key={f.label} label={f.label}>
              <input type="number" placeholder="0" value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
            </FieldGroup>
          ))}
        </div>

        <button onClick={handleAdd} disabled={saving} style={primaryBtnStyle}>
          {saving ? 'Salvataggio...' : '✓ Aggiungi pasto'}
        </button>
      </div>
    )
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#f0f0f2', margin: 0, lineHeight: 1 }}>
            Alimentazione
          </h1>
          <p style={{ fontSize: 12, color: '#4a4a55', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
            {format(weekStart, 'd', { locale: it })} – {format(weekEnd, 'd MMM yyyy', { locale: it })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtnStyle}>‹</button>
          <button onClick={() => setWeekOffset(0)} style={{ ...navBtnStyle, fontSize: 10, padding: '6px 10px' }}>oggi</button>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtnStyle}>›</button>
          <button onClick={() => { setAddMode(true); setNewData(todayKey) }} style={primaryBtnStyle}>+ Pasto</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#4a4a55', fontFamily: 'var(--font-mono)', fontSize: 12 }}>LOADING...</div>
      ) : (
        days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const pasti = pastiMap.get(key) || []
          const tot = totByDay(key)
          const isT = key === todayKey
          const isPast = day < today && !isT

          return (
            <div key={key} style={{
              marginBottom: 12,
              background: '#161618',
              border: `1px solid ${isT ? '#e8ff4740' : '#1e1e22'}`,
              borderRadius: 14,
              overflow: 'hidden',
              opacity: isPast ? 0.75 : 1,
            }}>
              {/* Day header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: isT ? 'rgba(232,255,71,0.05)' : 'transparent',
                borderBottom: pasti.length > 0 ? '1px solid #1a1a1e' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: isT ? '#e8ff47' : '#f0f0f2' }}>
                    {format(day, 'EEEE', { locale: it })}
                  </span>
                  <span style={{ fontSize: 12, color: '#4a4a55', fontFamily: 'var(--font-mono)' }}>
                    {format(day, 'd MMM')}
                  </span>
                  {isT && <span style={{ fontSize: 10, background: '#e8ff4720', color: '#e8ff47', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>OGGI</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {tot.kcal > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b6b74' }}>
                      {Math.round(tot.kcal)} kcal
                    </span>
                  )}
                  <button onClick={() => { setAddMode(true); setNewData(key) }} style={{
                    background: 'none', border: '1px solid #2a2a2f', borderRadius: 6,
                    color: '#6b6b74', fontSize: 14, cursor: 'pointer', width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>+</button>
                </div>
              </div>

              {/* Pasti */}
              {pasti.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  borderTop: i > 0 ? '1px solid #111114' : 'none',
                  opacity: p.completato ? 0.5 : 1,
                }}>
                  <button onClick={() => handleToggle(p.id, p.completato)} style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: p.completato ? `1.5px solid ${MOMENTO_COLOR[p.momento] || '#4a4a55'}` : '1.5px solid #2a2a2f',
                    background: p.completato ? (MOMENTO_COLOR[p.momento] || '#4a4a55') + '33' : 'transparent',
                    cursor: 'pointer', flexShrink: 0, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p.completato && <span style={{ fontSize: 10, color: MOMENTO_COLOR[p.momento] || '#4a4a55' }}>✓</span>}
                  </button>

                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: MOMENTO_COLOR[p.momento] || '#6b6b74',
                    minWidth: 48, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {p.momento.slice(0, 3)}
                  </span>

                  <span style={{ flex: 1, fontSize: 13, color: '#f0f0f2', textDecoration: p.completato ? 'line-through' : 'none' }}>
                    {p.nome_pasto}
                  </span>

                  {p.proteine_g != null && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#e8ff47' }}>{p.proteine_g}P</span>
                  )}

                  <button onClick={() => handleDelete(p.id)} style={{
                    background: 'none', border: 'none', color: '#2a2a2f', cursor: 'pointer',
                    fontSize: 14, padding: 0, lineHeight: 1,
                  }} onMouseEnter={e => (e.currentTarget.style.color = '#ff4757')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#2a2a2f')}>
                    ×
                  </button>
                </div>
              ))}

              {pasti.length === 0 && (
                <div style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 12, color: '#2a2a2f' }}>Nessun pasto pianificato</span>
                </div>
              )}

              {/* Macro totali giorno */}
              {tot.kcal > 0 && (
                <div style={{
                  display: 'flex', gap: 12, padding: '8px 14px',
                  borderTop: '1px solid #111114',
                  background: '#0f0f12',
                }}>
                  {[
                    { label: 'P', val: tot.p, color: '#e8ff47' },
                    { label: 'C', val: tot.c, color: '#3b82f6' },
                    { label: 'G', val: tot.g, color: '#ff6b35' },
                  ].map(m => (
                    <span key={m.label} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span style={{ color: m.color, fontWeight: 700 }}>{Math.round(m.val)}</span>
                      <span style={{ color: '#2a2a2f' }}>{m.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b74', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#161618', border: '1px solid #2a2a2f',
  borderRadius: 8, padding: '10px 12px', color: '#f0f0f2',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
}

const primaryBtnStyle: React.CSSProperties = {
  background: '#e8ff47', color: '#0d0d0f', border: 'none',
  borderRadius: 10, padding: '10px 16px', fontSize: 13,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#6b6b74',
  cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0,
}

const navBtnStyle: React.CSSProperties = {
  background: '#1a1a1e', border: '1px solid #2a2a2f', borderRadius: 8,
  color: '#9898a8', cursor: 'pointer', fontSize: 16, padding: '6px 12px',
}
