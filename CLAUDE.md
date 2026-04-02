# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start local dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test or lint scripts are configured.

## Architecture

Personal fitness dashboard — mobile-first (max-width 480px), PWA-capable Next.js app with **5 tab sections**: Dashboard, Allenamento, Alimentazione (+ sub-tab Dispensa), Calendario, Salute.

**Stack:** Next.js 14 (Pages Router), TypeScript 5, Supabase (PostgreSQL 17), Tailwind CSS 3.4, Recharts, date-fns with Italian locale.

**Key structural decisions:**
- All major components are loaded with `dynamic(..., { ssr: false })` in `pages/index.tsx` — no server-side rendering for the main UI
- No global state library — state is managed locally with `useState` hooks in each component
- All Supabase queries live in `lib/api.ts`; TypeScript types for all data models are in `lib/types.ts`
- Path alias `@/*` resolves to the project root (e.g. `@/lib/api`)
- UI text and dates are in Italian (`date-fns/locale/it`)

**Tailwind theme:** Dark background (`#0d0d0f`), surface (`#161618`), card (`#1e1e22`), lime accent (`#e8ff47`). Custom font CSS variables: `--font-display` (Syne), `--font-body` (DM Sans), `--font-mono` (Space Mono).

**Supabase:** Project `zecbxiphqwcyfbxwzqug` (EU West, PostgreSQL 17). Client initialized in `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No API routes — all DB access is client-side.

## External Integrations

**Strava:** OAuth2 flow stores tokens in `profilo` (`strava_access_token`, `strava_refresh_token`, `strava_token_expires_at`). Activities are synced into `sessioni_allenamento` via `upsertStravaActivity()` using `strava_activity_id` as conflict key. GPS tracks stored as GeoJSON in `percorso_geojson`, heart rate zones in `zone_cardio`, lap splits in `lap_splits` (all jsonb).

**Google Fit:** OAuth2 tokens stored in `profilo` (`google_fit_access_token`, `google_fit_refresh_token`, `google_fit_token_expires_at`). Daily data (steps, sleep, HR) synced into `google_fit_giornaliero` and `sonno` via `upsertGoogleFitGiornaliero()` / `upsertSonno()`.

## Data Model (Supabase tables)

### Convenzioni
- `giorno_settimana` in `piano_allenamento` usa **0 = Lunedì … 6 = Domenica** (italiano). JS `Date.getDay()` usa 0 = Domenica — applicare il mapper `idx === 0 ? 6 : idx - 1`.
- Macro dispensa sempre per **100g** (o 100ml); le porzioni si calcolano in app.
- `piano_pasti` = pianificato. `pasti` = log reale consumato.
- `piano_allenamento` = template settimanale fisso. `sessioni_allenamento` = log effettivo.
- Timezone: Roma (CET/CEST). Le date `yyyy-MM-dd` sono sempre in ora locale.

### Dominio: Profilo
| Tabella | Note |
|---|---|
| `profilo` | Singola riga. Target macro: kcal 1650, P 146g, C 154g, G 44g. Contiene token OAuth Strava e Google Fit. |

### Dominio: Alimentazione
| Tabella | Note |
|---|---|
| `template_pasto` | Template pasti ricorrenti (es. "Schiscetta pollo e riso") |
| `pasti` | Log reale pasti consumati. `momento` ∈ colazione/pranzo/cena/merenda/pre-workout/post-workout/spuntino |
| `pasto_alimenti` | Composizione alimento×porzione per ogni pasto. FK `pasto_id` CASCADE DELETE. Opzionale FK `dispensa_id`. |
| `piano_pasti` | Pasti pianificati con flag `completato`. Index su `data`. |

### Dominio: Dispensa
| Tabella | Note |
|---|---|
| `categorie` | Lookup: Carboidrati e Cereali, Dolci e Extra, Frutta Secca e Semi, Integratori, Latticini e Derivati, Proteine, Snack e Barrette Proteiche, Verdure |
| `dispensa` | Inventario alimenti con macro per 100g, soglia minima, scadenza |
| `movimenti_dispensa` | Log acquisti/consumi/correzioni/scaduti. FK opzionale `riferimento_pasto_id` |

### Dominio: Allenamento
| Tabella | Note |
|---|---|
| `sessioni_allenamento` | Log sessioni. `tipo` ∈ pesi/corsa/corsa+pesi/mobilita/altro. `fonte` ∈ manuale/strava. Campi Strava: `strava_activity_id` (UNIQUE), `zone_cardio` (jsonb), `percorso_geojson` (jsonb), `lap_splits` (jsonb), `elevazione_m`, `cadenza_media`, `potenza_media_w`. Index su `data`. |
| `sessione_esercizi` | Esercizi per sessione. CASCADE DELETE da `sessioni_allenamento`. |
| `serie_esercizio` | Serie×reps×kg×RPE. CASCADE DELETE da `sessione_esercizi`. RPE CHECK 1–10. |
| `piano_allenamento` | Template settimanale fisso. `tipo` ∈ pesi/corsa/corsa+pesi/mobilita/riposo. |

### Dominio: Salute (nuove tabelle)
| Tabella | Note |
|---|---|
| `google_fit_giornaliero` | Dati giornalieri Google Fit: passi, distanza, kcal attive, minuti attività, FC media/riposo. UNIQUE su `data`. Upsert via `upsertGoogleFitGiornaliero()`. |
| `sonno` | Fasi del sonno: profondo/leggero/REM/veglia in minuti. Score 0–100. `fonte` ∈ google_fit/manuale. Index su `data`. |
| `peso_storico` | Storico peso corporeo. UNIQUE su `data`. Upsert via `addPesoStorico()`. |

## API — funzioni principali (`lib/api.ts`)

```
Profilo:      getProfilo · updateProfiloMacro · updateProfiloOAuth
Dispensa:     getDispensa · addDispensaItem · updateDispensaQuantita · deleteDispensaItem · addMovimentoDispensa
Categorie:    getCategorie
Piano pasti:  getPastoPianificato · addPianoPasto · togglePastoPianificato · deletePianoPasto
Diario pasti: getPastiDelGiorno · addPasto · updatePastoMacro · deletePasto
              addPastoAlimento · deletePastoAlimento · getTemplatesPasto
Allenamento:  getSessioniAllenamento · getSessioneDetail · addSessione
              addEsercizio · addSerie · getPianoAllenamento · upsertStravaActivity
Google Fit:   getGoogleFitRange · getGoogleFitOggi · upsertGoogleFitGiornaliero
Sonno:        getSonnoRange · getUltimoSonno · upsertSonno
Peso:         getPesoStorico · addPesoStorico
Dashboard:    getDashboardStats  ← include gfitOggi, ultimoSonno, ultimoPeso
```

## TypeScript — tipi principali (`lib/types.ts`)

```
Letterali:   MomentoType · TipoSessione · TipoPiano · FonteSessione · FonteSonno · GruppoMuscolare
TabId:       'dashboard' | 'allenamento' | 'alimentazione' | 'calendario' | 'salute'
Profilo:     Profilo
Dispensa:    Categoria · Dispensa · MovimentoDispensa
Alimentaz.:  TemplatePasto · Pasto · PastoAlimento · PianoPasto
Allenamento: SessioneAllenamento · SessioneEsercizio · SerieEsercizio · PianoAllenamento
             ZoneCardio · LapSplit
Salute:      GoogleFitGiornaliero · Sonno · PesoStorico
```
