import { supabase } from './supabase'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import type {
  Profilo, Dispensa, Pasto, PastoAlimento, PianoPasto,
  SessioneAllenamento, SessioneEsercizio, SerieEsercizio,
  GoogleFitGiornaliero, Sonno, PesoStorico,
} from './types'

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// ── PROFILO ───────────────────────────────────────────────────────────────────

export async function getProfilo() {
  const { data } = await supabase.from('profilo').select('*').limit(1).single()
  return data
}

export async function updateProfiloMacro(id: number, updates: Partial<Profilo>) {
  return supabase
    .from('profilo')
    .update({ ...updates, aggiornato_il: new Date().toISOString() })
    .eq('id', id)
}

export async function updateProfiloOAuth(id: number, updates: Partial<Profilo>) {
  return supabase
    .from('profilo')
    .update({ ...updates, aggiornato_il: new Date().toISOString() })
    .eq('id', id)
}

// ── DISPENSA ──────────────────────────────────────────────────────────────────

export async function getDispensa() {
  const { data } = await supabase
    .from('dispensa')
    .select('*, categoria:categorie(id, nome)')
    .order('nome_standard')
  return data || []
}

export async function updateDispensaQuantita(id: number, quantita: number) {
  return supabase
    .from('dispensa')
    .update({ quantita_disponibile: quantita, aggiornato_il: new Date().toISOString() })
    .eq('id', id)
}

export async function addDispensaItem(item: Partial<Dispensa>) {
  return supabase.from('dispensa').insert(item).select().single()
}

export async function deleteDispensaItem(id: number) {
  return supabase.from('dispensa').delete().eq('id', id)
}

export async function getCategorie() {
  const { data } = await supabase.from('categorie').select('*').order('nome')
  return data || []
}

export async function addMovimentoDispensa(movimento: {
  dispensa_id: number
  tipo: 'acquisto' | 'consumo' | 'correzione' | 'scaduto'
  quantita: number
  quantita_dopo?: number
  riferimento_pasto_id?: number
  note?: string
}) {
  return supabase.from('movimenti_dispensa').insert(movimento)
}

// ── ALIMENTAZIONE — PIANO ─────────────────────────────────────────────────────

export async function getPastoPianificato(dateFrom: string, dateTo: string) {
  const { data } = await supabase
    .from('piano_pasti')
    .select('*')
    .gte('data', dateFrom)
    .lte('data', dateTo)
    .order('data')
    .order('momento')
  return data || []
}

export async function togglePastoPianificato(id: number, completato: boolean) {
  return supabase.from('piano_pasti').update({ completato }).eq('id', id)
}

export async function addPianoPasto(pasto: Partial<PianoPasto>) {
  return supabase.from('piano_pasti').insert(pasto).select().single()
}

export async function deletePianoPasto(id: number) {
  return supabase.from('piano_pasti').delete().eq('id', id)
}

// ── ALIMENTAZIONE — DIARIO ────────────────────────────────────────────────────

export async function getPastiDelGiorno(data: string) {
  const { data: rows } = await supabase
    .from('pasti')
    .select('*, alimenti:pasto_alimenti(*)')
    .eq('data', data)
    .order('momento')
  return rows || []
}

export async function addPasto(pasto: Partial<Pasto>) {
  const { data, error } = await supabase
    .from('pasti')
    .insert(pasto)
    .select()
    .single()
  return { data, error }
}

export async function updatePastoMacro(id: number, updates: Partial<Pasto>) {
  return supabase.from('pasti').update(updates).eq('id', id)
}

export async function deletePasto(id: number) {
  // CASCADE elimina automaticamente i pasto_alimenti collegati
  return supabase.from('pasti').delete().eq('id', id)
}

export async function addPastoAlimento(alimento: Partial<PastoAlimento>) {
  const { data, error } = await supabase
    .from('pasto_alimenti')
    .insert(alimento)
    .select()
    .single()
  return { data, error }
}

export async function deletePastoAlimento(id: number) {
  return supabase.from('pasto_alimenti').delete().eq('id', id)
}

export async function getTemplatesPasto() {
  const { data } = await supabase
    .from('template_pasto')
    .select('*')
    .order('nome')
  return data || []
}

// ── ALLENAMENTO ───────────────────────────────────────────────────────────────

export async function getSessioniAllenamento(limit = 20) {
  const { data } = await supabase
    .from('sessioni_allenamento')
    .select('*')
    .order('data', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getSessioneDetail(id: number) {
  const { data } = await supabase
    .from('sessioni_allenamento')
    .select(`
      *,
      esercizi:sessione_esercizi(
        *,
        serie:serie_esercizio(*)
      )
    `)
    .eq('id', id)
    .single()
  return data
}

export async function addSessione(sessione: Partial<SessioneAllenamento>) {
  const { data, error } = await supabase
    .from('sessioni_allenamento')
    .insert(sessione)
    .select()
    .single()
  return { data, error }
}

export async function addEsercizio(esercizio: Partial<SessioneEsercizio>) {
  const { data, error } = await supabase
    .from('sessione_esercizi')
    .insert(esercizio)
    .select()
    .single()
  return { data, error }
}

export async function addSerie(serie: Partial<SerieEsercizio>) {
  return supabase.from('serie_esercizio').insert(serie)
}

export async function getPianoAllenamento() {
  const { data } = await supabase
    .from('piano_allenamento')
    .select('*')
    .eq('attivo', true)
    .order('giorno_settimana')
  return data || []
}

// Upsert attività Strava: inserisce o aggiorna in base a strava_activity_id
export async function upsertStravaActivity(activity: Partial<SessioneAllenamento>) {
  const { data, error } = await supabase
    .from('sessioni_allenamento')
    .upsert(activity, { onConflict: 'strava_activity_id' })
    .select()
    .single()
  return { data, error }
}

// ── SALUTE — GOOGLE FIT ───────────────────────────────────────────────────────

export async function getGoogleFitRange(dateFrom: string, dateTo: string) {
  const { data } = await supabase
    .from('google_fit_giornaliero')
    .select('*')
    .gte('data', dateFrom)
    .lte('data', dateTo)
    .order('data', { ascending: false })
  return data || []
}

export async function getGoogleFitOggi() {
  const { data } = await supabase
    .from('google_fit_giornaliero')
    .select('*')
    .eq('data', today())
    .maybeSingle()
  return data
}

export async function upsertGoogleFitGiornaliero(record: Partial<GoogleFitGiornaliero>) {
  return supabase
    .from('google_fit_giornaliero')
    .upsert({ ...record, aggiornato_il: new Date().toISOString() }, { onConflict: 'data' })
}

// ── SALUTE — SONNO ────────────────────────────────────────────────────────────

export async function getSonnoRange(dateFrom: string, dateTo: string) {
  const { data } = await supabase
    .from('sonno')
    .select('*')
    .gte('data', dateFrom)
    .lte('data', dateTo)
    .order('data', { ascending: false })
  return data || []
}

export async function getUltimoSonno() {
  const { data } = await supabase
    .from('sonno')
    .select('*')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function upsertSonno(record: Partial<Sonno>) {
  return supabase
    .from('sonno')
    .upsert({ ...record, aggiornato_il: new Date().toISOString() }, { onConflict: 'data' })
}

// ── SALUTE — PESO ─────────────────────────────────────────────────────────────

export async function getPesoStorico(limit = 30) {
  const { data } = await supabase
    .from('peso_storico')
    .select('*')
    .order('data', { ascending: false })
    .limit(limit)
  return data || []
}

export async function addPesoStorico(record: Pick<PesoStorico, 'data' | 'peso_kg' | 'note'>) {
  return supabase
    .from('peso_storico')
    .upsert(record, { onConflict: 'data' })
    .select()
    .single()
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const todayStr = today()
  const treSettimane = format(subWeeks(new Date(), 3), 'yyyy-MM-dd')
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [sessioni, pastiSettimana, dispensa, gfitOggi, ultimoSonno, ultimoPeso] =
    await Promise.all([
      supabase
        .from('sessioni_allenamento')
        .select('*')
        .gte('data', treSettimane)
        .order('data', { ascending: false }),
      supabase
        .from('piano_pasti')
        .select('*')
        .gte('data', weekStart)
        .lte('data', weekEnd),
      supabase
        .from('dispensa')
        .select('*')
        .not('soglia_minima', 'is', null),
      supabase
        .from('google_fit_giornaliero')
        .select('*')
        .eq('data', todayStr)
        .maybeSingle(),
      supabase
        .from('sonno')
        .select('*')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('peso_storico')
        .select('*')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  return {
    sessioni:      sessioni.data      || [],
    pastiSettimana: pastiSettimana.data || [],
    dispensa:      dispensa.data      || [],
    gfitOggi:      gfitOggi.data      ?? null,
    ultimoSonno:   ultimoSonno.data   ?? null,
    ultimoPeso:    ultimoPeso.data    ?? null,
    todayStr,
    weekStart,
    weekEnd,
  }
}
