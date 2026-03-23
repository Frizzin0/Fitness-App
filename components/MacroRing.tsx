interface MacroRingProps {
  label: string
  value: number
  target: number
  color: string
  unit?: string
}

export function MacroRing({ label, value, target, color, unit = 'g' }: MacroRingProps) {
  const pct = Math.min((value / target) * 100, 100)
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 68, height: 68 }}>
        <svg width={68} height={68} viewBox="0 0 68 68">
          <circle cx={34} cy={34} r={r} fill="none" stroke="#1e1e22" strokeWidth={5} />
          <circle
            cx={34} cy={34} r={r}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / 4}
            style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#f0f0f2', lineHeight: 1 }}>
            {Math.round(value)}
          </span>
          <span style={{ fontSize: 9, color: '#6b6b74', fontFamily: 'var(--font-mono)' }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: '#9898a8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: '#4a4a55' }}>/ {target}{unit}</span>
    </div>
  )
}

interface MacroBarProps {
  label: string
  value: number
  target: number
  color: string
}

export function MacroBar({ label, value, target, color }: MacroBarProps) {
  const pct = Math.min((value / target) * 100, 100)
  const over = value > target

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: '#9898a8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: over ? '#ff4757' : '#f0f0f2' }}>
          {Math.round(value)} <span style={{ color: '#4a4a55' }}>/ {target}g</span>
        </span>
      </div>
      <div style={{ height: 4, background: '#1e1e22', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: over ? '#ff4757' : color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${over ? '#ff475766' : color + '66'}`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}
