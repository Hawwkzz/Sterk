import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentMonthRange, getCurrentYearRange } from '../lib/utils'
import { STATUTS, SECTEUR_DEFAUT } from '../lib/constants'
import toast from 'react-hot-toast'
import { isDemoMode } from '../lib/demoMode'
import {
  DEMO_CHANTIERS, computeDemoChantierStats, DEMO_CLASSEMENT,
} from '../lib/demoData'

function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: requête trop longue')), ms)
    )
  ])
}

export function useChantiers(filters = {}) {
  const { equipe, isAdmin } = useAuth()
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchChantiers = useCallback(async () => {
    // --- DÉMO : renvoie les mocks ---
    if (isDemoMode()) {
      let list = [...DEMO_CHANTIERS]
      if (filters.status) list = list.filter(c => c.status === filters.status)
      if (filters.dateFrom) list = list.filter(c => c.date_intervention >= filters.dateFrom)
      if (filters.dateTo) list = list.filter(c => c.date_intervention <= filters.dateTo)
      setChantiers(list); setError(null); setLoading(false)
      return
    }

    try {
      setLoading(true)
      let query = supabase.from('chantiers').select(`*, equipe:equipes(id, name)`).order('created_at', { ascending: false })
      if (!isAdmin && equipe) query = query.eq('equipe_id', equipe.id)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('date_intervention', filters.dateFrom)
      if (filters.dateTo) query = query.lte('date_intervention', filters.dateTo)
      const { data, error: fetchError } = await withTimeout(query)
      if (fetchError) throw fetchError
      setChantiers(data || [])
      setError(null)
    } catch (err) {
      console.error('[useChantiers] Error:', err)
      setError(err.message)
    } finally { setLoading(false) }
  }, [equipe, isAdmin, filters.status, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    if (isDemoMode()) { fetchChantiers(); return }
    if (equipe || isAdmin) fetchChantiers()
    else setLoading(false)
  }, [fetchChantiers, equipe, isAdmin])

  return { chantiers, loading, error, refetch: fetchChantiers }
}

export function useChantier(chantierId) {
  const [chantier, setChantier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchChantier = useCallback(async () => {
    if (!chantierId) { setLoading(false); return }

    if (isDemoMode()) {
      const found = DEMO_CHANTIERS.find(c => c.id === chantierId)
      setChantier(found || null); setError(found ? null : 'Introuvable'); setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await withTimeout(
        supabase.from('chantiers').select(`*, equipe:equipes(id, name, responsable), photos:chantier_photos(id, url, photo_type, created_at), documents:chantier_documents(id, url, filename, file_type, created_at), refus:chantier_refus(id, commentaire, created_at, photos:refus_photos(id, url))`).eq('id', chantierId).single()
      )
      if (fetchError) throw fetchError
      setChantier(data)
      setError(null)
    } catch (err) {
      console.error('[useChantier] Error:', err)
      setError(err.message)
    } finally { setLoading(false) }
  }, [chantierId])

  useEffect(() => { fetchChantier() }, [fetchChantier])
  return { chantier, loading, error, refetch: fetchChantier }
}

export function useChantierStats() {
  const { equipe, isAdmin, secteur } = useAuth()
  const [stats, setStats] = useState({
    ledValidees: 0, ledEnAttente: 0, ledRefusees: 0,
    primeAnnuelle: 0, primeMensuelle: 0, totalChantiers: 0,
    chantiersValides: 0, chantiersEnAttente: 0, chantiersRefuses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setStats(computeDemoChantierStats()); setLoading(false); return
    }

    if (!equipe && !isAdmin) { setLoading(false); return }
    async function fetchStats() {
      try {
        setLoading(true)
        const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
        const { start: yearStart, end: yearEnd } = getCurrentYearRange()
        let query = supabase.from('chantiers').select('id, unit_count, status, created_at')
        if (!isAdmin && equipe) query = query.eq('equipe_id', equipe.id)
        const { data: chantiers, error } = await withTimeout(query)
        if (error) throw error
        const allChantiers = chantiers || []
        const monthChantiers = allChantiers.filter(c => { const d = new Date(c.created_at); return d >= monthStart && d <= monthEnd })
        const yearChantiers = allChantiers.filter(c => { const d = new Date(c.created_at); return d >= yearStart && d <= yearEnd })
        const QUOTA = (secteur || SECTEUR_DEFAUT).quota_mensuel
        const PRIME = (secteur || SECTEUR_DEFAUT).prime_par_unite
        const ledValidees = monthChantiers.filter(c => c.status === STATUTS.VALIDE).reduce((s, c) => s + (c.unit_count || 0), 0)
        const ledEnAttente = monthChantiers.filter(c => c.status === STATUTS.PENDING_CLIENT).reduce((s, c) => s + (c.unit_count || 0), 0)
        const ledRefusees = monthChantiers.filter(c => c.status === STATUTS.REFUSE).reduce((s, c) => s + (c.unit_count || 0), 0)
        const ledValideesAnnee = yearChantiers.filter(c => c.status === STATUTS.VALIDE).reduce((s, c) => s + (c.unit_count || 0), 0)
        const primeMensuelle = Math.max(0, ledValidees - QUOTA) * PRIME
        const primeAnnuelle = Math.max(0, ledValideesAnnee - QUOTA) * PRIME
        setStats({ ledValidees, ledEnAttente, ledRefusees, primeAnnuelle, primeMensuelle, totalChantiers: monthChantiers.length, chantiersValides: monthChantiers.filter(c => c.status === STATUTS.VALIDE).length, chantiersEnAttente: monthChantiers.filter(c => c.status === STATUTS.PENDING_CLIENT).length, chantiersRefuses: monthChantiers.filter(c => c.status === STATUTS.REFUSE).length })
      } catch (err) { console.error('[useChantierStats] Error:', err) }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [equipe, isAdmin, secteur])

  return { stats, loading }
}

export function useClassement() {
  const { equipe, secteur } = useAuth()
  const [classement, setClassement] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setClassement(DEMO_CLASSEMENT)
      setMyRank(DEMO_CLASSEMENT.find(e => e.isMe)?.rank || null)
      setLoading(false); return
    }

    async function fetchClassement() {
      try {
        setLoading(true)
        const { start: yearStart } = getCurrentYearRange()
        const { data, error } = await withTimeout(
          supabase.from('equipes').select(`id, name, chantiers!inner(unit_count, status, created_at)`).eq('chantiers.status', STATUTS.VALIDE).gte('chantiers.created_at', yearStart.toISOString())
        )
        if (error) throw error
        const QUOTA = (secteur || SECTEUR_DEFAUT).quota_mensuel
        const PRIME = (secteur || SECTEUR_DEFAUT).prime_par_unite
        const equipesWithUnits = (data || []).map(eq => {
          const totalLed = eq.chantiers.reduce((s, c) => s + (c.unit_count || 0), 0)
          const prime = Math.max(0, totalLed - QUOTA) * PRIME
          return { id: eq.id, name: eq.name, totalLed, prime, isMe: equipe?.id === eq.id }
        })
        equipesWithUnits.sort((a, b) => b.totalLed - a.totalLed)
        const ranked = equipesWithUnits.map((eq, i) => ({ ...eq, rank: i + 1 }))
        setClassement(ranked)
        setMyRank(ranked.find(eq => eq.isMe)?.rank || null)
      } catch (err) { console.error('[useClassement] Error:', err) }
      finally { setLoading(false) }
    }
    fetchClassement()
  }, [equipe, secteur])

  return { classement, myRank, loading }
}
