import { useEffect, useState } from 'react'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { getSessioniAllenamento, getPianoAllenamento, addSessione, addEsercizio, addSerie } from '../lib/api'
import { SessioneAllenamento, PianoAllenamento, SessioneEsercizio } from '../lib/types'

const TIPO_COLOR: Record<string, string> = {
  pesi: '#e8ff47', corsa: '#2ed573', 'corsa+pesi': '#3b82f6', mobilita: '#ff6b35', riposo: '#2a2a2f',
}
const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
const GRUPPI = ['petto','schiena','spalle','bicipiti','tricipiti','gambe','core','full body']

type Step = 'list' | 'new-session' | 'add-exercise' | 'detail'

interface NewEsercizio {
  nome: string
  gruppo: string
  serie: { reps: string; peso: string; rpe: string }[]
}

export default function Allenamento() {
  const [sessioni, setSessioni] = useState<SessioneAllenamento[]>([])
  const [piano, setPiano] = useState<PianoAllenamento[]>([])
  const [step, setStep] = useState<Step>('list')
  const [selected, setSelected] = useState<SessioneAllenamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New session form
  const [tipo, setTipo] = useState<string>('pesi')
  const [titolo, setTitolo] = useState('')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [durata, setDurata] = useState('')
  const [kcal, setKcal] = useState('')
  const [distanza, setDistanza] = useState('')
  const [ritmo, setRitmo] = useState('')
  const [noteSession, setNoteSession] = useState('')
  const [esercizi, setEsercizi] = useState<NewEsercizio[]>([])
  const [newEsNome, setNewEsNome] = useState('')
  const [newEsGruppo, setNewEsGruppo] = useState('petto')
  const [currentEsIndex, setCurrentEsIndex] = useState<number | null>(null)

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  useEffect(() => {
    async function load() {
      const [s, p] = await Promise.all([getSessioniAllenamento(30), getPianoAllenamento()])
      setSessioni(s)
      setPiano(p)
      setLoading(false)
    }
    load()
  }, [])

  const sessioniByDate = new Map<string, SessioneAllenamento[]>()
  sessioni.forEach(s => {
    if (!sessioniByDate.has(s.data)) sessioniByDate.set(s.data, [])
    sessioniByDate.get(s.data)!.push(s)
  })

  const pianoByGiorno = new Map<number, PianoAllenamento>()
  piano.forEach(p => pianoByGiorno.set(p.giorno_settimana, p))

  async function handleSaveSession() {
    setSaving(true)
    const { data: newS, error } = await addSessione({
      data,
      tipo: tipo as SessioneAllenamento['tipo'],
      titolo: titolo || undefined,
      durata_min: durata ? Number(durata) : undefined,
      kcal_bruciate: kcal ? Number(kcal) : undefined,
      distanza_km: distanza ? Number(distanza) : undefined,
      ritmo_medio: ritmo || undefined,
      note: noteSession || undefined,
      completato: true,
    })
    if (newS && !error) {
      for (let i = 0; i < esercizi.length; i++) {
        const es = esercizi[i]
        const { data: newEs } = await addEsercizio({
          sessione_id: newS.id,
          ordine: i + 1,
          nome_esercizio: es.nome,
          gruppo_muscolare: es.gruppo,
        })
        if (newEs) {
          for (let j = 0; j < es.serie.length; j++) {
            const sr = es.serie[j]
            await addSerie({
              sessione_esercizio_id: newEs.id,
              numero_serie: j + 1,
              reps: sr.reps ? Number(sr.reps) : undefined,
              peso_kg: sr.peso ? Number(sr.peso) : undefined,
              rpe: sr.rpe ? Number(sr.rpe) : undefined,
            })
          }
        }
      }
      const fresh = await getSessioniAllenamento(30)
      setSessioni(fresh)
      resetForm()
      setStep('list')
    }
    setSaving(false)
  }

  function resetForm() {
    setTipo('pesi'); setTitolo(''); setData(format(new Date(), 'yyyy-MM-dd'))
    setDurata(''); setKcal(''); setDistanza(''); setRitmo(''); setNoteSession('')
    setEsercizi([]); setNewEsNome(''); setNewEsGruppo('petto')
  }

  function addEsercizioToList() {
    if (!newEsNome.trim()) return
    setEsercizi([...esercizi, { nome: newEsNome, gruppo: newEsGruppo, serie: [{ reps: '', peso: '', rpe: '' }] }])
    setNewEsNome(''); setNewEsGruppo('petto')
  }

  function addSerieToEsercizio(idx: number) {
    const updated = [...esercizi]
    updated[idx].serie.push({ reps: '', peso: '', rpe: '' })
    setEsercizi(updated)
  }

  function updateSerie(esIdx: number, srIdx: number, field: 'reps' | 'peso' | 'rpe', val: string) {
    const updated = [...esercizi]
    updated[esIdx].serie[srIdx][field] = val
    setEsercizi(updated)
  }

  if (loading) return <Loader />

  if (step === 'new-session') {
    return (
      <div className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setStep('list'); resetForm() }} style={backBtnStyle}>← Indietro</button>
          <h2 style={sectionTitle}>Nuova sessione</h2>
        </div>

        {/* Tipo */}
        <FieldGroup label="Tipo">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['pesi','corsa','corsa+pesi','mobilita','altro'] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)} style={{
                ...chipStyle,
                background: tipo === t ? TIPO_COLOR[t] + '20' : '#1a1a1e',
                border: `1px solid ${tipo === t ? TIPO_COLOR[t] : '#2a2a2f'}`,
                color: tipo === t ? TIPO_COLOR[t] : '#9898a8',
              }}>{t}</button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Data">
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        </FieldGroup>

        <FieldGroup label="Titolo (opz.)">
          <input placeholder="es. Push day A" value={titolo} onChange={e => setTitolo(e.target.value)} style={inputStyle} />
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldGroup label="Durata (min)">
            <input type="number" placeholder="60" value={durata} onChange={e => setDurata(e.target.value)} style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Kcal bruciate">
            <input type="number" placeholder="350" value={kcal} onChange={e => setKcal(e.target.value)} style={inputStyle} />
          </FieldGroup>
        </div>

        {(tipo === 'corsa' || tipo === 'corsa+pesi') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldGroup label="Distanza (km)">
              <input type="number" step="0.01" placeholder="5.0" value={distanza} onChange={e => setDistanza(e.target.value)} style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Ritmo medio">
              <input placeholder="5:30/km" value={ritmo} onChange={e => setRitmo(e.target.value)} style={inputStyle} />
            </FieldGroup>
          </div>
        )}

        {(tipo === 'pesi' || tipo === 'corsa+pesi') && (
          <div style={{ background: '#161618', border: '1px solid #2a2a2f', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: '0 0 12px' }}>
              Esercizi ({esercizi.length})
            </h3>

            {esercizi.map((es, esIdx) => (
              <div key={esIdx} style={{ marginBottom: 16, background: '#1a1a1e', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f2', margin: '0 0 2px' }}>{es.nome}</p>
                    <p style={{ fontSize: 11, color: '#6b6b74', margin: 0, fontFamily: 'var(--font-mono)' }}>{es.gruppo}</p>
                  </div>
                  <button onClick={() => setEsercizi(esercizi.filter((_, i) => i !== esIdx))} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>

                {es.serie.map((sr, srIdx) => (
                  <div key={srIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <input placeholder="Reps" type="number" value={sr.reps} onChange={e => updateSerie(esIdx, srIdx, 'reps', e.target.value)} style={{ ...miniInputStyle }} />
                    <input placeholder="Kg" type="number" step="0.5" value={sr.peso} onChange={e => updateSerie(esIdx, srIdx, 'peso', e.target.value)} style={{ ...miniInputStyle }} />
                    <input placeholder="RPE" type="number" step="0.5" value={sr.rpe} onChange={e => updateSerie(esIdx, srIdx, 'rpe', e.target.value)} style={{ ...miniInputStyle }} />
                    <button onClick={() => { const u = [...esercizi]; u[esIdx].serie = u[esIdx].serie.filter((_, i) => i !== srIdx); setEsercizi(u) }} style={{ background: 'none', border: 'none', color: '#4a4a55', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                ))}
                <button onClick={() => addSerieToEsercizio(esIdx)} style={{ ...chipStyle, marginTop: 4, fontSize: 11, color: '#e8ff47', borderColor: '#e8ff4730' }}>
                  + Serie
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input placeholder="Nome esercizio" value={newEsNome} onChange={e => setNewEsNome(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
              <select value={newEsGruppo} onChange={e => setNewEsGruppo(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 0 }}>
                {GRUPPI.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button onClick={addEsercizioToList} style={{ ...chipStyle, background: '#e8ff4720', color: '#e8ff47', border: '1px solid #e8ff4740', whiteSpace: 'nowrap' }}>+ Aggiungi</button>
            </div>
          </div>
        )}

        <FieldGroup label="Note">
          <textarea placeholder="Sensazioni, progressi..." value={noteSession} onChange={e => setNoteSession(e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
        </FieldGroup>

        <button onClick={handleSaveSession} disabled={saving} style={primaryBtnStyle}>
          {saving ? 'Salvataggio...' : '✓ Salva sessione'}
        </button>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#f0f0f2', margin: 0 }}>
          Allenamento
        </h1>
        <button onClick={() => setStep('new-session')} style={primaryBtnStyle}>
          + Nuova
        </button>
      </div>

      {/* Piano settimanale */}
      <div style={{ background: '#161618', border: '1px solid #2a2a2f', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: '0 0 14px' }}>
          Piano settimana
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {GIORNI.map((g, idx) => {
            const d = addDays(weekStart, idx)
            const dayKey = format(d, 'yyyy-MM-dd')
            const ss = sessioniByDate.get(dayKey) || []
            const pianoDel = pianoByGiorno.get(idx)
            const isT = format(today, 'yyyy-MM-dd') === dayKey

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: isT ? '#e8ff47' : '#4a4a55', fontWeight: isT ? 700 : 400 }}>
                  {g}
                </span>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: ss.length > 0
                    ? TIPO_COLOR[ss[0].tipo] + '22'
                    : pianoDel && pianoDel.tipo !== 'riposo'
                    ? '#1e1e22'
                    : 'transparent',
                  border: isT
                    ? '1.5px solid #e8ff47'
                    : ss.length > 0
                    ? `1px solid ${TIPO_COLOR[ss[0].tipo] || '#4a4a55'}44`
                    : '1px solid #1e1e22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {ss.length > 0
                    ? (ss[0].tipo === 'corsa' ? '🏃' : ss[0].tipo === 'pesi' ? '🏋' : '●')
                    : pianoDel && pianoDel.tipo !== 'riposo'
                    ? <span style={{ fontSize: 8, color: '#4a4a55', fontFamily: 'var(--font-mono)' }}>
                        {pianoDel.tipo === 'corsa' ? '○' : '◇'}
                      </span>
                    : ''}
                </div>
                <span style={{ fontSize: 8, color: '#4a4a55', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.2 }}>
                  {format(d, 'd')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Piano default */}
        {piano.length > 0 && (
          <div style={{ marginTop: 14, borderTop: '1px solid #1a1a1e', paddingTop: 12 }}>
            {piano.filter(p => p.tipo !== 'riposo').map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: TIPO_COLOR[p.tipo] || '#6b6b74', minWidth: 24 }}>
                  {GIORNI[p.giorno_settimana]}
                </span>
                <span style={{ fontSize: 12, color: '#9898a8' }}>{p.titolo}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log sessioni */}
      <div style={{ background: '#161618', border: '1px solid #2a2a2f', borderRadius: 16, padding: '18px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: '0 0 4px 16px' }}>
          Storico allenamenti
        </h2>
        {sessioni.length === 0 ? (
          <p style={{ fontSize: 13, color: '#4a4a55', padding: '12px 16px' }}>
            Nessuna sessione ancora. Registra il tuo primo workout! 🏋️
          </p>
        ) : (
          sessioni.map((s, i) => (
            <div key={s.id} style={{
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid #1a1a1e' : 'none',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: TIPO_COLOR[s.tipo] + '18',
                  border: `1px solid ${TIPO_COLOR[s.tipo]}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {s.tipo === 'corsa' ? '🏃' : s.tipo === 'pesi' ? '🏋' : '◉'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f2', margin: '0 0 2px', lineHeight: 1.3 }}>
                      {s.titolo || s.tipo}
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a4a55', flexShrink: 0 }}>
                      {format(parseISO(s.data), 'dd/MM')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.durata_min && <Pill label={`${s.durata_min}'`} />}
                    {s.distanza_km && <Pill label={`${s.distanza_km} km`} />}
                    {s.ritmo_medio && <Pill label={s.ritmo_medio} />}
                    {s.kcal_bruciate && <Pill label={`${s.kcal_bruciate} kcal`} color="#ff6b35" />}
                  </div>
                  {s.note && <p style={{ fontSize: 11, color: '#6b6b74', margin: '4px 0 0' }}>{s.note}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--font-mono)',
      color: color || '#6b6b74',
      background: '#1a1a1e',
      padding: '2px 6px', borderRadius: 4,
    }}>
      {label}
    </span>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: '#4a4a55', fontSize: 12, letterSpacing: '0.1em' }}>LOADING...</div>
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
  marginBottom: 0,
}

const miniInputStyle: React.CSSProperties = {
  background: '#161618', border: '1px solid #2a2a2f',
  borderRadius: 6, padding: '7px 8px', color: '#f0f0f2',
  fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', width: '100%',
}

const chipStyle: React.CSSProperties = {
  background: '#1a1a1e', border: '1px solid #2a2a2f', borderRadius: 6,
  padding: '6px 12px', color: '#9898a8', fontSize: 12,
  cursor: 'pointer', fontFamily: 'var(--font-body)',
}

const primaryBtnStyle: React.CSSProperties = {
  background: '#e8ff47', color: '#0d0d0f', border: 'none',
  borderRadius: 10, padding: '12px 20px', fontSize: 13,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  letterSpacing: '0.02em',
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#6b6b74',
  cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)',
  padding: 0,
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
  color: '#f0f0f2', margin: 0,
}
