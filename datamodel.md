# Data Model — Lorenzo Fitness App

> **Progetto:** `fowczuzxgevrfxpalotj` (Supabase EU West, PostgreSQL 17)  
> **App:** Next.js 14 + TypeScript, deploy su Vercel  
> **Ultima revisione schema:** 23 marzo 2026

---

## Panoramica

Il database è organizzato in **4 domini funzionali**:

| Dominio | Tabelle |
|---|---|
| 👤 Profilo utente | `profilo` |
| 🍽️ Alimentazione | `pasti`, `pasto_alimenti`, `template_pasto`, `piano_pasti` |
| 🏋️ Allenamento | `sessioni_allenamento`, `sessione_esercizi`, `serie_esercizio`, `piano_allenamento` |
| 🗄️ Dispensa | `dispensa`, `categorie`, `movimenti_dispensa` |

---

## Dominio: Profilo Utente

### `profilo`

Singola riga che rappresenta l'utente e i suoi target macro giornalieri.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `nome` | text | NO | `'Lorenzo'` | Nome utente |
| `cognome` | text | SÌ | — | Cognome |
| `data_nascita` | date | SÌ | — | Data di nascita |
| `altezza_cm` | numeric | SÌ | — | Altezza in cm |
| `peso_kg` | numeric | SÌ | — | Peso attuale in kg |
| `target_kcal` | numeric | NO | `1650` | Target calorie giornaliere |
| `target_proteine` | numeric | NO | `146` | Target proteine in grammi |
| `target_carboidrati` | numeric | NO | `154` | Target carboidrati in grammi |
| `target_grassi` | numeric | NO | `44` | Target grassi in grammi |
| `note` | text | SÌ | — | Note libere |
| `aggiornato_il` | timestamptz | SÌ | `now()` | Ultimo aggiornamento |

**Valori attivi:**
- Kcal: **1.650**
- Proteine: **146g** · Carboidrati: **154g** · Grassi: **44g**

---

## Dominio: Alimentazione

### `pasti`

Storico dei pasti **effettivamente consumati** (log reale, non pianificazione).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `data` | date | NO | `CURRENT_DATE` | Data del pasto |
| `momento` | text | NO | — | `colazione`, `pranzo`, `cena`, `merenda`, `pre-workout`, `post-workout`, `spuntino` |
| `template_id` | integer | SÌ | — | FK → `template_pasto.id` |
| `nome_libero` | text | SÌ | — | Nome pasto se non usa template |
| `kcal_totali` | numeric | SÌ | — | Kcal totali del pasto |
| `proteine_totali_g` | numeric | SÌ | — | Proteine totali in grammi |
| `carboidrati_totali_g` | numeric | SÌ | — | Carboidrati totali in grammi |
| `grassi_totali_g` | numeric | SÌ | — | Grassi totali in grammi |
| `note` | text | SÌ | — | Note libere |
| `creato_il` | timestamptz | SÌ | `now()` | Timestamp creazione |

**FK:** `template_id` → `template_pasto.id`

---

### `pasto_alimenti`

Composizione dettagliata di ogni pasto (gli ingredienti singoli).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `pasto_id` | integer | SÌ | — | FK → `pasti.id` |
| `dispensa_id` | integer | SÌ | — | FK → `dispensa.id` (opzionale) |
| `nome_alimento` | text | NO | — | Nome dell'alimento |
| `quantita_g` | numeric | NO | — | Quantità in grammi |
| `kcal` | numeric | SÌ | — | Kcal della porzione |
| `proteine_g` | numeric | SÌ | — | Proteine della porzione |
| `carboidrati_g` | numeric | SÌ | — | Carboidrati della porzione |
| `grassi_g` | numeric | SÌ | — | Grassi della porzione |
| `note` | text | SÌ | — | Note libere |

**FK:** `pasto_id` → `pasti.id`, `dispensa_id` → `dispensa.id`

---

### `template_pasto`

Template di pasti ricorrenti (es. "Schiscetta pollo e pasta").

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `nome` | text | NO | — | Nome del template (UNIQUE) |
| `momento` | text | NO | — | Momento del giorno (stessi valori di `pasti.momento`) |
| `descrizione` | text | SÌ | — | Descrizione libera |
| `creato_il` | timestamptz | SÌ | `now()` | Timestamp creazione |

---

### `piano_pasti`

**Pasti pianificati** per la settimana (quello che l'app mostra nel calendario alimentare). Questa è la tabella centrale dell'esperienza quotidiana.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `data` | date | NO | — | Data del pasto pianificato |
| `momento` | text | NO | — | `colazione`, `pranzo`, `merenda`, `cena`, `pre-workout`, `post-workout`, `spuntino` |
| `nome_pasto` | text | NO | — | Nome descrittivo del pasto |
| `kcal` | numeric | SÌ | — | Kcal stimate |
| `proteine_g` | numeric | SÌ | — | Proteine stimate in grammi |
| `carboidrati_g` | numeric | SÌ | — | Carboidrati stimati in grammi |
| `grassi_g` | numeric | SÌ | — | Grassi stimati in grammi |
| `note` | text | SÌ | — | Note libere |
| `completato` | boolean | NO | `false` | Flag: pasto consumato ✓ |
| `creato_il` | timestamptz | SÌ | `now()` | Timestamp creazione |

**Index:** `idx_piano_pasti_data` su `data`

> **Nota comportamentale:** ogni volta che stabiliamo un piano pasti, i dati vengono inseriti qui. Il flag `completato` viene aggiornato a `true` quando il pasto è stato effettivamente consumato. La Dashboard legge questa tabella per calcolare i macro del giorno.

---

## Dominio: Allenamento

### `sessioni_allenamento`

Log delle sessioni di allenamento completate o programmate.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `data` | date | NO | `CURRENT_DATE` | Data della sessione |
| `tipo` | text | NO | — | `pesi`, `corsa`, `corsa+pesi`, `mobilita`, `altro` |
| `titolo` | text | SÌ | — | Titolo libero (es. "Push Day A") |
| `durata_min` | numeric | SÌ | — | Durata in minuti |
| `note` | text | SÌ | — | Note libere / sensazioni |
| `kcal_bruciate` | numeric | SÌ | — | Kcal bruciate stimate |
| `frequenza_media_bpm` | numeric | SÌ | — | FC media in bpm |
| `distanza_km` | numeric | SÌ | — | Distanza (solo per corsa) |
| `ritmo_medio` | text | SÌ | — | Ritmo medio (es. `"5:30/km"`) |
| `completato` | boolean | NO | `true` | Flag completamento |
| `creato_il` | timestamptz | SÌ | `now()` | Timestamp creazione |

**Index:** `idx_sessioni_data` su `data`

---

### `sessione_esercizi`

Gli esercizi eseguiti all'interno di una sessione di pesi.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `sessione_id` | integer | NO | — | FK → `sessioni_allenamento.id` (CASCADE DELETE) |
| `ordine` | integer | NO | `1` | Ordine dell'esercizio nella sessione |
| `nome_esercizio` | text | NO | — | Nome dell'esercizio |
| `gruppo_muscolare` | text | SÌ | — | `petto`, `schiena`, `gambe`, `spalle`, `bicipiti`, `tricipiti`, `core`, `full body` |
| `note` | text | SÌ | — | Note tecniche |

**FK:** `sessione_id` → `sessioni_allenamento.id` ON DELETE CASCADE

---

### `serie_esercizio`

Le singole serie di ogni esercizio (set × reps × carico).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `sessione_esercizio_id` | integer | NO | — | FK → `sessione_esercizi.id` (CASCADE DELETE) |
| `numero_serie` | integer | NO | — | Numero della serie (1, 2, 3…) |
| `reps` | integer | SÌ | — | Ripetizioni eseguite |
| `peso_kg` | numeric | SÌ | — | Carico in kg |
| `rpe` | numeric | SÌ | — | RPE (1–10, Rating of Perceived Exertion) |
| `note` | text | SÌ | — | Note sulla serie |

**FK:** `sessione_esercizio_id` → `sessione_esercizi.id` ON DELETE CASCADE  
**Check:** `rpe BETWEEN 1 AND 10`

---

### `piano_allenamento`

Template settimanale degli allenamenti (lo schema fisso che si ripete ogni settimana).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `giorno_settimana` | integer | NO | — | **0 = Lunedì … 6 = Domenica** (convenzione italiana, ≠ JS) |
| `tipo` | text | NO | — | `pesi`, `corsa`, `corsa+pesi`, `mobilita`, `riposo` |
| `titolo` | text | SÌ | — | Titolo del workout (es. "Push – Petto / Spalle / Tricipiti") |
| `note` | text | SÌ | — | Note aggiuntive |
| `attivo` | boolean | NO | `true` | Se `false`, il giorno viene ignorato |

**Check:** `giorno_settimana BETWEEN 0 AND 6`

> ⚠️ **Nota critica:** La colonna `giorno_settimana` usa la convenzione **0 = Lunedì** (italiana). JavaScript `getDay()` usa invece **0 = Domenica**. Il frontend applica il mapper `idxToDbGiorno(idx) = idx === 0 ? 6 : idx - 1` per tradurre correttamente.

---

## Dominio: Dispensa

### `dispensa`

Inventario degli alimenti disponibili, con macro nutrizionali e soglie di riordino.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `nome_scontrino` | text | SÌ | — | Nome come appare sullo scontrino |
| `nome_standard` | text | NO | — | Nome normalizzato usato nell'app |
| `categoria_id` | integer | SÌ | — | FK → `categorie.id` |
| `quantita_disponibile` | numeric | NO | `0` | Quantità attuale in `unita_misura` |
| `unita_misura` | text | NO | — | `g`, `kg`, `ml`, `l`, `pz`, `dosi`, `brick`, `confezione`, `testa` |
| `peso_unitario_g` | numeric | SÌ | — | Peso unitario in grammi (per pezzi) |
| `soglia_minima` | numeric | SÌ | `0` | Soglia sotto cui scatta l'alert |
| `kcal_100g` | numeric | SÌ | — | Kcal per 100g |
| `proteine_100g` | numeric | SÌ | — | Proteine per 100g |
| `carboidrati_100g` | numeric | SÌ | — | Carboidrati per 100g |
| `grassi_100g` | numeric | SÌ | — | Grassi per 100g |
| `fibre_100g` | numeric | SÌ | — | Fibre per 100g |
| `data_scadenza` | date | SÌ | — | Data di scadenza |
| `dettagli` | text | SÌ | — | Dettagli aggiuntivi |
| `note_interne` | text | SÌ | — | Note di gestione interne |
| `url_prodotto` | text | SÌ | — | URL scheda prodotto |
| `aggiornato_il` | timestamptz | SÌ | `now()` | Ultimo aggiornamento |
| `creato_il` | timestamptz | SÌ | `now()` | Timestamp creazione |

**FK:** `categoria_id` → `categorie.id`

---

### `categorie`

Lookup table per le categorie degli alimenti in dispensa.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `nome` | text | NO | — | Nome categoria (UNIQUE) |

**Categorie attive nel DB:**
`Carboidrati e Cereali` · `Dolci e Extra` · `Frutta Secca e Semi` · `Integratori` · `Latticini e Derivati` · `Proteine` · `Snack e Barrette Proteiche` · `Verdure`

---

### `movimenti_dispensa`

Log di tutti i movimenti di inventario (acquisti, consumi, correzioni).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---|---|---|---|---|
| `id` | serial | NO | auto-increment | PK |
| `dispensa_id` | integer | SÌ | — | FK → `dispensa.id` |
| `tipo` | text | NO | — | `acquisto`, `consumo`, `correzione`, `scaduto` |
| `quantita` | numeric | NO | — | Quantità del movimento |
| `quantita_dopo` | numeric | SÌ | — | Giacenza risultante dopo il movimento |
| `riferimento_pasto_id` | integer | SÌ | — | FK → `pasti.id` (se il consumo è legato a un pasto) |
| `note` | text | SÌ | — | Note libere |
| `data` | timestamptz | SÌ | `now()` | Data/ora del movimento |

**FK:** `dispensa_id` → `dispensa.id`  
**Check:** `tipo IN ('acquisto', 'consumo', 'correzione', 'scaduto')`

---

## Diagramma relazioni (ERD testuale)

```
profilo (1)

categorie (1) ──< dispensa (1) ──< movimenti_dispensa
                      │
                      └──< pasto_alimenti >── pasti (1) ──> template_pasto
                                               │
                                          piano_pasti

sessioni_allenamento (1) ──< sessione_esercizi (1) ──< serie_esercizio

piano_allenamento (template settimanale — non collegato a sessioni_allenamento)
```

---

## Convenzioni importanti

| Tema | Regola |
|---|---|
| **Timezone** | Roma (CET/CEST). Le date `yyyy-MM-dd` vengono sempre interpretate in ora locale |
| **`giorno_settimana` nel DB** | `0 = Lunedì … 6 = Domenica` (italiano) — NON coincide con `Date.getDay()` di JS |
| **`piano_pasti` vs `pasti`** | `piano_pasti` = pianificato (cosa si prevede di mangiare). `pasti` = effettivo (storico reale) |
| **`piano_allenamento` vs `sessioni_allenamento`** | `piano_allenamento` = template fisso settimanale. `sessioni_allenamento` = log effettivo dei workout |
| **Macro dispensa** | Sempre espresse per **100g** (o 100ml). La porzione si calcola in app |
| **Soglia minima dispensa** | Se `quantita_disponibile ≤ soglia_minima` → alert nella Dashboard |
| **CASCADE DELETE** | Eliminare una `sessioni_allenamento` elimina automaticamente tutti i suoi `sessione_esercizi` e `serie_esercizio` |
| **Condimenti** | Esclusi per convenzione dal tracking dispensa (olio EVO, spray, salse zero) |
```