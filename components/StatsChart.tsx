import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { SessioneAllenamento } from '../lib/types'

interface WorkoutVolumeChartProps {
  sessioni: SessioneAllenamento[]
}

const TIPO_COLOR: Record<string, string> = {
  pesi: '#e8ff47',
  corsa: '#2ed573',
  'corsa+pesi': '#3b82f6',
  mobilita: '#ff6b35',
  altro: '#6b6b74',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e1e22',
        border: '1px solid #2a2a2f',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
      }}>
        <p style={{ color: '#9898a8', margin: '0 0 4px' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, margin: 0 }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function WorkoutFrequencyChart({ sessioni }: WorkoutVolumeChartProps) {
  // Build last 8 weeks frequency
  const now = new Date()
  const weeks: { week: string; pesi: number; corsa: number }[] = []

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7) - now.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const label = format(weekStart, 'd/M', { locale: it })
    const inWeek = sessioni.filter(s => {
      const d = parseISO(s.data)
      return d >= weekStart && d <= weekEnd
    })

    weeks.push({
      week: label,
      pesi: inWeek.filter(s => s.tipo === 'pesi' || s.tipo === 'corsa+pesi').length,
      corsa: inWeek.filter(s => s.tipo === 'corsa' || s.tipo === 'corsa+pesi').length,
    })
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', marginBottom: 12, marginTop: 0 }}>
        Sessioni per settimana (8 settimane)
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={weeks} barGap={2} barCategoryGap="30%">
          <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} width={20} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pesi" name="Pesi" fill="#e8ff47" radius={[3, 3, 0, 0]} opacity={0.85} />
          <Bar dataKey="corsa" name="Corsa" fill="#2ed573" radius={[3, 3, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#e8ff47', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#e8ff47', display: 'inline-block' }} /> Pesi
        </span>
        <span style={{ fontSize: 11, color: '#2ed573', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2ed573', display: 'inline-block' }} /> Corsa
        </span>
      </div>
    </div>
  )
}

export function KcalBruciateChart({ sessioni }: WorkoutVolumeChartProps) {
  const last10 = [...sessioni]
    .filter(s => s.kcal_bruciate)
    .reverse()
    .slice(-10)
    .map(s => ({
      data: format(parseISO(s.data), 'd/M', { locale: it }),
      kcal: s.kcal_bruciate || 0,
      tipo: s.tipo,
    }))

  if (last10.length === 0) return null

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', marginBottom: 12, marginTop: 0 }}>
        Kcal bruciate (ultime sessioni)
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={last10}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
          <XAxis dataKey="data" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="kcal"
            name="Kcal"
            stroke="#ff6b35"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ff6b35', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#ff6b35' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MacroSettimanaChart({ pasti }: { pasti: { data: string; proteine_g?: number; carboidrati_g?: number; grassi_g?: number }[] }) {
  const byDay = new Map<string, { p: number; c: number; g: number }>()

  pasti.forEach(p => {
    const key = p.data
    if (!byDay.has(key)) byDay.set(key, { p: 0, c: 0, g: 0 })
    const curr = byDay.get(key)!
    curr.p += p.proteine_g || 0
    curr.c += p.carboidrati_g || 0
    curr.g += p.grassi_g || 0
  })

  const data = Array.from(byDay.entries()).map(([date, vals]) => ({
    giorno: format(parseISO(date), 'EEE', { locale: it }),
    P: Math.round(vals.p),
    C: Math.round(vals.c),
    G: Math.round(vals.g),
  }))

  if (data.length === 0) return null

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b74', marginBottom: 12, marginTop: 0 }}>
        Macro questa settimana
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} barGap={1} barCategoryGap="25%">
          <XAxis dataKey="giorno" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#4a4a55' }} axisLine={false} tickLine={false} width={24} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="P" name="Proteine" fill="#e8ff47" radius={[2, 2, 0, 0]} opacity={0.9} />
          <Bar dataKey="C" name="Carboidrati" fill="#3b82f6" radius={[2, 2, 0, 0]} opacity={0.9} />
          <Bar dataKey="G" name="Grassi" fill="#ff6b35" radius={[2, 2, 0, 0]} opacity={0.9} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6 }}>
        {[['#e8ff47','P'],['#3b82f6','C'],['#ff6b35','G']].map(([color, label]) => (
          <span key={label} style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: color, display: 'inline-block' }} /> {label}
          </span>
        ))}
      </div>
    </div>
  )
}
