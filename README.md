# Lorenzo Fitness App

Dashboard personale per allenamento e alimentazione, connessa a Supabase.

## Stack
- **Next.js 14** (Pages Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (database)
- **Recharts** (grafici)
- **date-fns** (date)

## Deploy su Vercel

### Opzione A — Deploy da GitHub (consigliato)

1. Carica questa cartella su un repository GitHub (privato va bene)
2. Vai su [vercel.com](https://vercel.com) → New Project → Import Git Repository
3. Seleziona il repo e clicca Deploy
4. Vai su **Settings → Environment Variables** e aggiungi:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://fowczuzxgevrfxpalotj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Redeploy → l'app è online!

### Opzione B — Deploy via Vercel CLI

```bash
npm install -g vercel
cd lorenzo-app
vercel
# Segui il wizard, poi:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

## Sviluppo locale

```bash
npm install
npm run dev
# Apri http://localhost:3000
```

## Struttura DB Supabase

| Tabella | Descrizione |
|---|---|
| `dispensa` | Inventario alimenti con macro e quantità |
| `categorie` | Categorie alimenti |
| `movimenti_dispensa` | Log movimenti inventario |
| `pasti` | Pasti consumati (storico) |
| `piano_pasti` | Pasti pianificati per settimana |
| `pasto_alimenti` | Composizione di ogni pasto |
| `template_pasto` | Template pasti ricorrenti |
| `profilo` | Profilo utente e target macro |
| `sessioni_allenamento` | Log sessioni workout |
| `sessione_esercizi` | Esercizi per sessione |
| `serie_esercizio` | Set × reps × kg × RPE |
| `piano_allenamento` | Piano settimanale default |

## Funzionalità

- **Dashboard** — macro del giorno, attività recente, heatmap 3 settimane, alert scorte basse
- **Allenamento** — calendario settimanale, log sessioni, form nuovo workout con esercizi e serie
- **Alimentazione** — piano pasti settimanale, toggle completamento, aggiunta/rimozione pasti
- **Dispensa** — gestione inventario, modifica quantità inline, alert scorte basse/scadenze
