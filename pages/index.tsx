import Head from 'next/head'
import { useState } from 'react'
import { TabId } from '../lib/types'
import BottomNav from '../components/BottomNav'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false })
const Allenamento = dynamic(() => import('../components/Allenamento'), { ssr: false })
const Alimentazione = dynamic(() => import('../components/Alimentazione'), { ssr: false })
const Dispensa = dynamic(() => import('../components/Dispensa'), { ssr: false })

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  return (
    <>
      <Head>
        <title>Lorenzo · Fitness</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0d0d0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fitness" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="grain" style={{
        minHeight: '100dvh',
        background: '#0d0d0f',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        {/* Top safe area filler */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 1,
          background: 'linear-gradient(to bottom, #0d0d0f, transparent)',
        }} />

        {/* Main content */}
        <main style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '20px 16px 100px',
          minHeight: '100dvh',
        }}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'allenamento' && <Allenamento />}
          {activeTab === 'alimentazione' && <Alimentazione />}
          {activeTab === 'dispensa' && <Dispensa />}
        </main>

        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </>
  )
}
