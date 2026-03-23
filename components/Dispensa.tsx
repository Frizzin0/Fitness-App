import { useEffect, useState } from 'react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { getDispensa, updateDispensaQuantita, addDispensaItem, deleteDispensaItem, getCategorie } from '../lib/api'
import type { Dispensa, Categoria } from '../lib/types'

const CAT_EMOJI: Record<string, string> = {
  'Proteine': '🥩', 'Carboidrati': '🌾', 'Latticini': '🥛',
  'Verdure': '🥦', 'Frutta': '🍎', 'Grassi': '🫒',
  'Bevande': '🥤', 'Integratori': '💊', 'Condimenti': '🧂', 'Altro': '📦',
}

type FilterMode = 'tutti' | 'scorte-basse' | 'in-scadenza'

export default function Dispensa() {
  const [items, setItems] = useState<Dispensa[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterMode>('tutti')
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState('')
  const [addMode, setAddMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form
  const [newNome, setNewNome] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newUnita, setNewUnita] = useState('g')
  const [newCatId, setNewCatId] = useState('')
  const [newKcal, setNewKcal] = useState('')
  const [newP, setNewP] = useState('')
  const [newC, setNewC] = useState('')
  const [newG, setNewG] = useState('')
  const [newScadenza, setNewScadenza] = useState('')
  const [newSoglia, setNewSoglia] = useState('')

  const today = new Date()
  const in5days = addDays(today, 5)

  useEffect(() => {
    async function load() {
      const [d, c] = await Promise.all([getDispensa(), getCategorie()])
      setItems(d)
      setCategorie(c)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpdateQty(id: number) {
    if (editQty === '') return
    await updateDispensaQuantita(id, Number(editQty))
    const fresh = await getDispensa()
    setItems(fresh)
    setEditId(null)
    setEditQty('')
  }

  async function handleDelete(id: number) {
    if (!confirm('Rimuovere dalla dispensa?')) return
    await deleteDispensaItem(id)
    setItems(items.filter(i => i.id !== id))
  }

  async function handleAdd() {
    if (!newNome.trim() || !newQty || !newUnita) return
    setSaving(true)
    await addDispensaItem({
      nome_standard: newNome,
      quantita_disponibile: Number(newQty),
      unita_misura: newUnita,
      categoria_id: newCatId ? Number(newCatId) : undefined,
      kcal_100g: newKcal ? Number(newKcal) : undefined,
      proteine_100g: newP ? Number(newP) : undefined,
      carboidrati_100g: newC ? Number(newC) : undefined,
      grassi_100g: newG ? Number(newG) : undefined,
      data_scadenza: newScadenza || undefined,
      soglia_minima: newSoglia ? Number(newSoglia) : undefined,
    })
    const fresh = await getDispensa()
    setItems(fresh)
    resetAddForm()
    setAddMode(false)
    setSaving(false)
  }

  function resetAddForm() {
    setNewNome(''); setNewQty(''); setNewUnita('g'); setNewCatId('')
    setNewKcal(''); setNewP(''); setNewC(''); setNewG(''); setNewScadenza(''); setNewSoglia('')
  }

  function isScadenzaWarn(d?: string) {
    if (!d) return false
    return isBefore(parseISO(d), in5days)
  }

  function isScortaBassa(item: Dispensa) {
    return item.soglia_minima != null && item.quantita_disponibile <= item.soglia_minima
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.nome_standard.toLowerCase().includes(search.toLowerCase())
    if (filter === 'scorte-basse') return matchSearch && isScortaBassa(item)
    if (filter === 'in-scadenza') return matchSearch && isScadenzaWarn(item.data_scadenza)
    return matchSearch
  })

  // Group by category
  const grouped = new Map<string, Dispensa[]>()
  filtered.forEach(item => {
    const catName = (item.categoria as any)?.nome || 'Altro'
    if (!grouped.has(catName)) grouped.set(catName, [])
    grouped.get(catName)!.push(item)
  })

  const warnCount = items.filter(i => isScortaBassa(i)).length
  const scadCount = items.filter(i => isScadenzaWarn(i.data_scadenza)).length

  if (addMode) {
    return (
      <div className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setAddMode(false); resetAddForm() }} style={backBtnStyle}>← Indietro</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#f0f0f2', margin: 0 }}>
            Aggiungi alimento
          </h2>
        </div>

        <FieldGroup label="Nome alimento">
          <input placeholder="es. Petto di pollo" value={newNome} onChange={e => setNewNome(e.target.value)} style={inputStyle} />
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldGroup label="Quantità">
            <input type="number" placeholder="500" value={newQty} onChange={e => setNewQty(e.target.value)} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Unità">
            <select value={newUnita} onChange={e => setNewUnita(e.target.value)} style={inputStyle}>
              {['g','kg','ml','l','pz','bustine','confezioni'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </FieldGroup>
        </div>

        <FieldGroup label="Categoria">
          <select value={newCatId} onChange={e => setNewCatId(e.target.value)} style={inputStyle}>
            <option value="">— Seleziona —</option>
            {categorie.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </FieldGroup>

        <div style={{ background: '#161618', border: '1px solid #2a2a2f', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b74', margin: '0 0 10px' }}>
            Valori nutrizionali (per 100g)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Kcal', val: newKcal, set: setNewKcal },
              { label: 'Prot', val: newP, set: setNewP },
              { label: 'Carb', val: newC, set: setNewC },
              { label: 'Grassi', val: newG, set: setNewG },
            ].map(f => (
              <FieldGroup key={f.label} label={f.label}>
                <input type="number" placeholder="0" value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
              </FieldGroup>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldGroup label="Scadenza">
            <input type="date" value={newScadenza} onChange={e => setNewScadenza(e.target.value)} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Soglia minima">
            <input type="number" placeholder="es. 100" value={newSoglia} onChange={e => setNewSoglia(e.target.value)} style={inputStyle} />
          </FieldGroup>
        </div>

        <button onClick={handleAdd} disabled={saving} style={primaryBtnStyle}>
          {saving ? 'Salvataggio...' : '✓ Aggiungi alla dispensa'}
        </button>
      </div>
    )
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#f0f0f2', margin: 0 }}>
          Dispensa
        </h1>
        <button onClick={() => setAddMode(true)} style={primaryBtnStyle}>+ Aggiungi</button>
      </div>

      {/* Alert */}
      {(warnCount > 0 || scadCount > 0) && (
        <div style={{
          background: 'rgba(255,71,87,0.06)',
          border: '1px solid rgba(255,71,87,0.2)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', gap: 12,
        }}>
          {warnCount > 0 && (
            <span style={{ fontSize: 12, color: '#ff4757' }}>
              ⚠️ <strong>{warnCount}</strong> sotto soglia
            </span>
          )}
          {scadCount > 0 && (
            <span style={{ fontSize: 12, color: '#f59e0b' }}>
              ⏰ <strong>{scadCount}</strong> in scadenza
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <input
          placeholder="Cerca alimento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a55', fontSize: 14 }}>🔍</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { id: 'tutti' as FilterMode, label: 'Tutti', count: items.length },
          { id: 'scorte-basse' as FilterMode, label: 'Scorte basse', count: warnCount },
          { id: 'in-scadenza' as FilterMode, label: 'In scadenza', count: scadCount },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            background: filter === f.id ? '#e8ff4715' : '#1a1a1e',
            border: `1px solid ${filter === f.id ? '#e8ff4740' : '#2a2a2f'}`,
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            color: filter === f.id ? '#e8ff47' : '#6b6b74',
            fontSize: 12, fontFamily: 'var(--font-body)',
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            {f.label}
            {f.count > 0 && (
              <span style={{
                background: filter === f.id ? '#e8ff47' : '#2a2a2f',
                color: filter === f.id ? '#0d0d0f' : '#6b6b74',
                borderRadius: 10, padding: '1px 6px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#4a4a55', fontFamily: 'var(--font-mono)', fontSize: 12 }}>LOADING...</div>
      ) : (
        Array.from(grouped.entries()).map(([catName, catItems]) => (
          <div key={catName} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 2px' }}>
              <span>{CAT_EMOJI[catName] || '📦'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', fontWeight: 700 }}>
                {catName}
              </span>
              <span style={{ fontSize: 10, color: '#2a2a2f', fontFamily: 'var(--font-mono)' }}>{catItems.length}</span>
            </div>

            <div style={{ background: '#161618', border: '1px solid #1e1e22', borderRadius: 12, overflow: 'hidden' }}>
              {catItems.map((item, idx) => {
                const warn = isScortaBassa(item)
                const scad = isScadenzaWarn(item.data_scadenza)
                const isEditing = editId === item.id

                return (
                  <div key={item.id} style={{
                    padding: '11px 14px',
                    borderTop: idx > 0 ? '1px solid #111114' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {/* Status dot */}
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: warn ? '#ff4757' : scad ? '#f59e0b' : '#2ed573',
                      boxShadow: warn ? '0 0 6px #ff475744' : scad ? '0 0 6px #f59e0b44' : '0 0 4px #2ed57344',
                    }} />

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#f0f0f2', margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nome_standard}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        {item.proteine_100g && (
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#e8ff4766' }}>
                            {item.proteine_100g}P/100g
                          </span>
                        )}
                        {item.data_scadenza && (
                          <span style={{ fontSize: 10, color: scad ? '#f59e0b' : '#4a4a55', fontFamily: 'var(--font-mono)' }}>
                            scad. {format(parseISO(item.data_scadenza), 'dd/MM')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qty editor */}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                          autoFocus
                          style={{
                            width: 64, background: '#0d0d0f', border: '1px solid #e8ff4760',
                            borderRadius: 6, padding: '4px 8px', color: '#e8ff47',
                            fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', textAlign: 'right',
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateQty(item.id); if (e.key === 'Escape') setEditId(null) }}
                        />
                        <span style={{ fontSize: 10, color: '#6b6b74' }}>{item.unita_misura}</span>
                        <button onClick={() => handleUpdateQty(item.id)} style={{ background: '#e8ff47', border: 'none', borderRadius: 5, color: '#0d0d0f', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '4px 8px' }}>✓</button>
                        <button onClick={() => setEditId(null)} style={{ background: 'none', border: 'none', color: '#4a4a55', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(item.id); setEditQty(String(item.quantita_disponibile)) }} style={{
                        background: warn ? 'rgba(255,71,87,0.1)' : '#1a1a1e',
                        border: `1px solid ${warn ? 'rgba(255,71,87,0.3)' : '#2a2a2f'}`,
                        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: warn ? '#ff4757' : '#9898a8',
                        fontWeight: warn ? 700 : 400,
                      }}>
                        {item.quantita_disponibile} <span style={{ fontSize: 10, color: '#4a4a55' }}>{item.unita_misura}</span>
                      </button>
                    )}

                    <button onClick={() => handleDelete(item.id)} style={{
                      background: 'none', border: 'none', color: '#2a2a2f',
                      cursor: 'pointer', fontSize: 14, padding: '4px', flexShrink: 0,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff4757')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#2a2a2f')}>
                      🗑
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {filtered.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: '#4a4a55', textAlign: 'center', padding: 32 }}>
          {search ? 'Nessun risultato' : 'Dispensa vuota'}
        </p>
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
