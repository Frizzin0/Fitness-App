// ── Tipi letterali condivisi ──────────────────────────────────────────────────

export type MomentoType =
  | 'colazione' | 'pranzo' | 'cena'
  | 'merenda' | 'pre-workout' | 'post-workout' | 'spuntino'

export type TipoSessione    = 'pesi' | 'corsa' | 'corsa+pesi' | 'mobilita' | 'altro'
export type TipoPiano       = 'pesi' | 'corsa' | 'corsa+pesi' | 'mobilita' | 'riposo'
export type FonteSessione   = 'manuale' | 'strava'
export type FonteSonno      = 'google_fit' | 'manuale'
export type TipoMovimento   = 'acquisto' | 'consumo' | 'correzione' | 'scaduto'
export type GruppoMuscolare =
  | 'petto' | 'schiena' | 'gambe' | 'spalle'
  | 'bicipiti' | 'tricipiti' | 'core' | 'full body'

export type TabId = 'dashboard' | 'allenamento' | 'alimentazione' | 'calendario' | 'salute'

// ── Profilo ───────────────────────────────────────────────────────────────────

export interface Profilo {
  id: number
  nome: string
  cognome?: string
  data_nascita?: string
  altezza_cm?: number
  peso_kg?: number
  target_kcal: number
  target_proteine: number
  target_carboidrati: number
  target_grassi: number
  // OAuth Strava
  strava_athlete_id?: number
  strava_access_token?: string
  strava_refresh_token?: string
  strava_token_expires_at?: string
  // OAuth Google Fit
  google_fit_access_token?: string
  google_fit_refresh_token?: string
  google_fit_token_expires_at?: string
  note?: string
  aggiornato_il: string
}

// ── Dispensa ──────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number
  nome: string
}

export interface Dispensa {
  id: number
  nome_scontrino?: string
  nome_standard: string
  categoria_id?: number
  quantita_disponibile: number
  unita_misura: string
  peso_unitario_g?: number
  soglia_minima?: number
  kcal_100g?: number
  proteine_100g?: number
  carboidrati_100g?: number
  grassi_100g?: number
  fibre_100g?: number
  data_scadenza?: string
  dettagli?: string
  note_interne?: string
  url_prodotto?: string
  aggiornato_il: string
  creato_il: string
  categoria?: Categoria
}

export interface MovimentoDispensa {
  id: number
  dispensa_id?: number
  tipo: TipoMovimento
  quantita: number
  quantita_dopo?: number
  riferimento_pasto_id?: number
  note?: string
  data: string
}

// ── Alimentazione ─────────────────────────────────────────────────────────────

export interface TemplatePasto {
  id: number
  nome: string
  momento: MomentoType
  descrizione?: string
  creato_il: string
}

export interface PastoAlimento {
  id: number
  pasto_id?: number
  dispensa_id?: number
  nome_alimento: string
  quantita_g: number
  kcal?: number
  proteine_g?: number
  carboidrati_g?: number
  grassi_g?: number
  note?: string
}

export interface Pasto {
  id: number
  data: string
  momento: MomentoType
  template_id?: number
  nome_libero?: string
  kcal_totali?: number
  proteine_totali_g?: number
  carboidrati_totali_g?: number
  grassi_totali_g?: number
  note?: string
  creato_il: string
  alimenti?: PastoAlimento[]
}

export interface PianoPasto {
  id: number
  data: string
  momento: MomentoType
  nome_pasto: string
  kcal?: number
  proteine_g?: number
  carboidrati_g?: number
  grassi_g?: number
  note?: string
  completato: boolean
  creato_il: string
}

// ── Allenamento ───────────────────────────────────────────────────────────────

export interface ZoneCardio {
  z1_min: number
  z2_min: number
  z3_min: number
  z4_min: number
  z5_min: number
  z1_pct?: number
  z2_pct?: number
  z3_pct?: number
  z4_pct?: number
  z5_pct?: number
}

export interface LapSplit {
  km: number
  tempo_sec: number
  ritmo: string
  hr?: number
}

export interface SessioneAllenamento {
  id: number
  data: string
  tipo: TipoSessione
  titolo?: string
  durata_min?: number
  note?: string
  kcal_bruciate?: number
  frequenza_media_bpm?: number
  frequenza_max_bpm?: number
  distanza_km?: number
  ritmo_medio?: string
  completato: boolean
  // Strava
  strava_activity_id?: number
  elevazione_m?: number
  cadenza_media?: number
  potenza_media_w?: number
  zone_cardio?: ZoneCardio
  percorso_geojson?: object
  lap_splits?: LapSplit[]
  fonte: FonteSessione
  creato_il: string
  esercizi?: SessioneEsercizio[]
}

export interface SessioneEsercizio {
  id: number
  sessione_id: number
  ordine: number
  nome_esercizio: string
  gruppo_muscolare?: GruppoMuscolare
  note?: string
  serie?: SerieEsercizio[]
}

export interface SerieEsercizio {
  id: number
  sessione_esercizio_id: number
  numero_serie: number
  reps?: number
  peso_kg?: number
  rpe?: number
  note?: string
}

export interface PianoAllenamento {
  id: number
  giorno_settimana: number // 0 = Lunedì … 6 = Domenica (convenzione italiana, ≠ JS Date.getDay())
  tipo: TipoPiano
  titolo?: string
  note?: string
  attivo: boolean
}

// ── Salute ────────────────────────────────────────────────────────────────────

export interface GoogleFitGiornaliero {
  id: number
  data: string
  passi?: number
  distanza_m?: number
  kcal_attive?: number
  kcal_totali?: number
  minuti_attivita_leggera?: number
  minuti_attivita_moderata?: number
  minuti_attivita_intensa?: number
  frequenza_cardiaca_media?: number
  frequenza_cardiaca_riposo?: number
  aggiornato_il: string
}

export interface Sonno {
  id: number
  data: string
  ora_inizio?: string
  ora_fine?: string
  durata_minuti?: number
  score?: number
  fase_profondo_min?: number
  fase_leggero_min?: number
  fase_rem_min?: number
  veglia_min?: number
  fonte: FonteSonno
  aggiornato_il: string
}

export interface PesoStorico {
  id: number
  data: string
  peso_kg: number
  note?: string
  creato_il: string
}
