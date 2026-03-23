import { useEffect, useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { getDashboardStats, getProfilo } from '../lib/api'
import { Profilo, SessioneAllenamento, PianoPasto, Dispensa } from '../lib/types'
import { MacroBar } from './MacroRing'
import dynamic from 'next/dynamic'

const WorkoutFrequencyChart = dynamic(
  () => import('./StatsChart').then(m => m.WorkoutFrequencyChart),
  { ssr: false }
)
const MacroSettimanaChart = dynamic(
  () => import('./StatsChart').then(m => m.MacroSettimanaChart),
  { ssr: false }
)

const TIPO_COLOR: Record<string, string> = {
  pesi: '#e8ff47',
  corsa: '#2ed573',
  'corsa+pesi': '#3b82f6',
  mobilita: '#ff6b35',
  altro: '#9898a8',
}

const MOMENTO_ORDER = ['colazione','pranzo','merenda','cena','pre-workout','post-workout','spuntino']

export default function Dashboard() {
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [sessioni, setSessioni] = useState<SessioneAllenamento[]>([])
  const [pastiOggi, setPastiOggi] = useState<PianoPasto[]>([])
  const [dispensaWarn, setDispensaWarn] = useState<Dispensa[]>([])
  const [loading, setLoading] = useState(true)

  const oggi = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    async function load() {
      const [p, stats] = await Promise.all([getProfilo(), getDashboardStats()])
      setProfilo(p)
      setSessioni(stats.sessioni.slice(0, 6))
      const todayPasti = stats.pastiSettimana.filter((p: PianoPasto) => p.data === oggi)
      todayPasti.sort((a: PianoPasto, b: PianoPasto) =>
        MOMENTO_ORDER.indexOf(a.momento) - MOMENTO_ORDER.indexOf(b.momento)
      )
      setPastiOggi(todayPasti)
      const warn = stats.dispensa.filter(
        (d: Dispensa) => d.soglia_minima != null && d.quantita_disponibile <= (d.soglia_minima || 0)
      )
      setDispensaWarn(warn)
      setLoading(false)
    }
    load()
  }, [])

  const totOggi = pastiOggi.reduce((acc, p) => ({
    kcal: acc.kcal + (p.kcal || 0),
    p: acc.p + (p.proteine_g || 0),
    c: acc.c + (p.carboidrati_g || 0),
    g: acc.g + (p.grassi_g || 0),
    completati: acc.completati + (p.completato ? 1 : 0),
  }), { kcal: 0, p: 0, c: 0, g: 0, completati: 0 })

  const weekSessioni = sessioni.filter(s => {
    const d = new Date(s.data)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: '#4a4a55', fontSize: 12, letterSpacing: '0.1em' }}>
        LOADING...
      </div>
    </div>
  )

  return (
    <div className="fade-up" style={{ paddingBottom: 4 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#f0f0f2', lineHeight: 1.1, margin: 0 }}>
          Ciao, {profilo?.nome || 'Lorenzo'} 👋
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b74', marginTop: 6 }}>
          Target: <span style={{ color: '#e8ff47', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {profilo?.target_kcal} kcal
          </span> · {profilo?.target_proteine}P / {profilo?.target_carboidrati}C / {profilo?.target_grassi}G
        </p>
      </div>

      {/* Alert dispensa */}
      {dispensaWarn.length > 0 && (
        <div className="fade-up-1" style={{
          background: 'rgba(255,71,87,0.08)',
          border: '1px solid rgba(255,71,87,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#ff4757', margin: '0 0 4px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Scorte basse
            </p>
            <p style={{ fontSize: 12, color: '#9898a8', margin: 0 }}>
              {dispensaWarn.map(d => d.nome_standard).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Macro oggi */}
      <div className="fade-up-1" style={{
        background: '#161618',
        border: '1px solid #2a2a2f',
        borderRadius: 16,
        padding: '18px 16px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: 0 }}>
            Macro oggi
          </h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#f0f0f2' }}>
              {Math.round(totOggi.kcal)}
            </span>
            <span style={{ fontSize: 11, color: '#4a4a55' }}>/ {profilo?.target_kcal} kcal</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MacroBar label="Proteine" value={totOggi.p} target={profilo?.target_proteine || 146} color="#e8ff47" />
          <MacroBar label="Carboidrati" value={totOggi.c} target={profilo?.target_carboidrati || 154} color="#3b82f6" />
          <MacroBar label="Grassi" value={totOggi.g} target={profilo?.target_grassi || 44} color="#ff6b35" />
        </div>
        {pastiOggi.length > 0 && (
          <p style={{ fontSize: 11, color: '#4a4a55', margin: '12px 0 0', fontFamily: 'var(--font-mono)' }}>
            {totOggi.completati}/{pastiOggi.length} pasti completati
          </p>
        )}
      </div>

      {/* Pasti oggi */}
      {pastiOggi.length > 0 && (
        <div className="fade-up-2" style={{
          background: '#161618',
          border: '1px solid #2a2a2f',
          borderRadius: 16,
          padding: '18px 0',
          marginBottom: 16,
        }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: '0 0 12px 16px' }}>
            Pasti di oggi
          </h2>
          {pastiOggi.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderTop: i > 0 ? '1px solid #1a1a1e' : 'none',
              opacity: p.completato ? 0.5 : 1,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: p.completato ? '#2ed573' : '#2a2a2f',
                marginRight: 12, flexShrink: 0,
                boxShadow: p.completato ? '0 0 6px rgba(46,213,115,0.6)' : 'none',
              }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: '#f0f0f2', fontWeight: 500 }}>{p.nome_pasto}</span>
                <span style={{ fontSize: 11, color: '#4a4a55', marginLeft: 8 }}>{p.momento}</span>
              </div>
              {p.kcal && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6b6b74' }}>
                  {p.kcal} kcal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ultimi allenamenti */}
      <div className="fade-up-3" style={{
        background: '#161618',
        border: '1px solid #2a2a2f',
        borderRadius: 16,
        padding: '18px 0',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: 0 }}>
            Ultimi allenamenti
          </h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e8ff47' }}>
            {weekSessioni.length} questa settimana
          </span>
        </div>
        {sessioni.length === 0 ? (
          <p style={{ fontSize: 13, color: '#4a4a55', padding: '8px 16px' }}>
            Nessun allenamento registrato. Inizia oggi! 💪
          </p>
        ) : (
          sessioni.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderTop: i > 0 ? '1px solid #1a1a1e' : 'none',
              gap: 12,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: TIPO_COLOR[s.tipo] || '#4a4a55',
                flexShrink: 0,
                boxShadow: `0 0 6px ${TIPO_COLOR[s.tipo] || '#4a4a55'}66`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: '#f0f0f2', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.titolo || s.tipo}
                </p>
                <p style={{ fontSize: 11, color: '#4a4a55', margin: 0, fontFamily: 'var(--font-mono)' }}>
                  {format(parseISO(s.data), 'dd/MM')}
                  {s.durata_min && ` · ${s.durata_min}'`}
                  {s.distanza_km && ` · ${s.distanza_km}km`}
                  {s.kcal_bruciate && ` · ${s.kcal_bruciate}kcal`}
                </p>
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: TIPO_COLOR[s.tipo] || '#4a4a55',
                background: `${TIPO_COLOR[s.tipo] || '#4a4a55'}15`,
                padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                {s.tipo}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Weekly heatmap */}
      <div className="fade-up-4" style={{
        background: '#161618',
        border: '1px solid #2a2a2f',
        borderRadius: 16,
        padding: '18px 16px',
        marginBottom: 16,
      }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', margin: '0 0 14px' }}>
          Attività ultime 3 settimane
        </h2>
        <WeeklyHeatmap sessioni={sessioni} />
      </div>

      {/* Grafici storici */}
      <div style={{
        background: '#161618',
        border: '1px solid #2a2a2f',
        borderRadius: 16,
        padding: '18px 16px',
        marginBottom: 16,
      }}>
        <WorkoutFrequencyChart sessioni={sessioni} />
        <MacroSettimanaChart pasti={pastiOggi} />
      </div>
    </div>
  )
}

function WeeklyHeatmap({ sessioni }: { sessioni: SessioneAllenamento[] }) {
  const today = new Date()
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (20 - i))
    return d
  })

  const sessioniByDate = new Map<string, SessioneAllenamento[]>()
  sessioni.forEach(s => {
    const k = s.data
    if (!sessioniByDate.has(k)) sessioniByDate.set(k, [])
    sessioniByDate.get(k)!.push(s)
  })

  const dayLabels = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
      {days.map((d, i) => {
        const key = format(d, 'yyyy-MM-dd')
        const ss = sessioniByDate.get(key) || []
        const hasSession = ss.length > 0
        const isT = isToday(d)
        const tipo = ss[0]?.tipo

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: 6,
              background: hasSession ? (TIPO_COLOR[tipo!] + '33') : '#1a1a1e',
              border: isT ? '1px solid #e8ff47' : hasSession ? `1px solid ${TIPO_COLOR[tipo!] || '#4a4a55'}44` : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: hasSession ? 12 : 9,
              color: hasSession ? TIPO_COLOR[tipo!] : '#2a2a2f',
              boxShadow: hasSession ? `0 0 8px ${TIPO_COLOR[tipo!] || '#e8ff47'}22` : 'none',
            }}>
              {hasSession ? (tipo === 'corsa' ? '🏃' : tipo === 'pesi' ? '🏋' : '●') : ''}
            </div>
            <span style={{ fontSize: 9, color: isT ? '#e8ff47' : '#2a2a2f', fontFamily: 'var(--font-mono)' }}>
              {dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
