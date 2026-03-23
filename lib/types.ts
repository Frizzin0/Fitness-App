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
  note?: string
  aggiornato_il: string
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
  aggiornato_il: string
  creato_il: string
  categoria?: Categoria
}

export interface Categoria {
  id: number
  nome: string
}

export interface Pasto {
  id: number
  data: string
  momento: string
  template_id?: number
  nome_libero?: string
  kcal_totali?: number
  proteine_totali_g?: number
  carboidrati_totali_g?: number
  grassi_totali_g?: number
  note?: string
  creato_il: string
}

export interface PianoPasto {
  id: number
  data: string
  momento: string
  nome_pasto: string
  kcal?: number
  proteine_g?: number
  carboidrati_g?: number
  grassi_g?: number
  note?: string
  completato: boolean
  creato_il: string
}

export interface SessioneAllenamento {
  id: number
  data: string
  tipo: 'pesi' | 'corsa' | 'corsa+pesi' | 'mobilita' | 'altro'
  titolo?: string
  durata_min?: number
  note?: string
  kcal_bruciate?: number
  frequenza_media_bpm?: number
  distanza_km?: number
  ritmo_medio?: string
  completato: boolean
  creato_il: string
  esercizi?: SessioneEsercizio[]
}

export interface SessioneEsercizio {
  id: number
  sessione_id: number
  ordine: number
  nome_esercizio: string
  gruppo_muscolare?: string
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
  giorno_settimana: number
  tipo: string
  titolo?: string
  note?: string
  attivo: boolean
}

export type TabId = 'dashboard' | 'allenamento' | 'alimentazione' | 'dispensa'
