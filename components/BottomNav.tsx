import { TabId } from '../lib/types'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard',    label: 'Home',      icon: '⬡' },
  { id: 'allenamento',  label: 'Workout',   icon: '◈' },
  { id: 'alimentazione',label: 'Pasti',     icon: '◉' },
  { id: 'dispensa',     label: 'Dispensa',  icon: '◫' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(13,13,15,0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #1e1e22',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {tabs.map(t => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 0 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                transition: 'all 0.2s ease',
                color: isActive ? '#e8ff47' : '#4a4a55',
              }}
            >
              <span style={{
                fontSize: 20,
                lineHeight: 1,
                filter: isActive ? 'drop-shadow(0 0 6px rgba(232,255,71,0.5))' : 'none',
                transition: 'filter 0.2s ease',
              }}>
                {t.icon}
              </span>
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {t.label}
              </span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: 'calc(100% - 2px)',
                  width: 24,
                  height: 2,
                  background: '#e8ff47',
                  borderRadius: 1,
                  boxShadow: '0 0 8px rgba(232,255,71,0.8)',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
