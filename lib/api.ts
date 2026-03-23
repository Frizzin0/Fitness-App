import { supabase } from './supabase'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'


// Restituisce la data locale di Roma come stringa yyyy-MM-dd
function today(): string {
  // Usiamo semplicemente new Date() e formattiamo: il browser è già nella timezone dell'utente
  return format(new Date(), 'yyyy-MM-dd')
}

export async function getProfilo() {
  const { data } = await supabase.from('profilo').select('*').limit(1).single()
  return data
}

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

export async function addDispensaItem(item: Partial<import('./types').Dispensa>) {
  return supabase.from('dispensa').insert(item).select().single()
}

export async function deleteDispensaItem(id: number) {
  return supabase.from('dispensa').delete().eq('id', id)
}

export async function getCategorie() {
  const { data } = await supabase.from('categorie').select('*').order('nome')
  return data || []
}

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

export async function addPianoPasto(pasto: Partial<import('./types').PianoPasto>) {
  return supabase.from('piano_pasti').insert(pasto).select().single()
}

export async function deletePianoPasto(id: number) {
  return supabase.from('piano_pasti').delete().eq('id', id)
}

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

export async function addSessione(sessione: Partial<import('./types').SessioneAllenamento>) {
  const { data, error } = await supabase
    .from('sessioni_allenamento')
    .insert(sessione)
    .select()
    .single()
  return { data, error }
}

export async function addEsercizio(esercizio: Partial<import('./types').SessioneEsercizio>) {
  const { data, error } = await supabase
    .from('sessione_esercizi')
    .insert(esercizio)
    .select()
    .single()
  return { data, error }
}

export async function addSerie(serie: Partial<import('./types').SerieEsercizio>) {
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

export async function getDashboardStats() {
  const todayStr = today()
  const treSettimane = format(subWeeks(new Date(), 3), 'yyyy-MM-dd')

  // Settimana: lun-dom centrata sulla data locale
  const now = new Date()
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [sessioni, pastiSettimana, dispensa] = await Promise.all([
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
  ])

  return {
    sessioni: sessioni.data || [],
    pastiSettimana: pastiSettimana.data || [],
    dispensa: dispensa.data || [],
    todayStr,
    weekStart,
    weekEnd,
  }
}

export async function updateProfiloMacro(id: number, updates: Partial<import('./types').Profilo>) {
  return supabase.from('profilo').update({ ...updates, aggiornato_il: new Date().toISOString() }).eq('id', id)
}
