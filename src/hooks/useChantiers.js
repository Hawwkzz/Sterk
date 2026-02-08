import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentMonthRange, getCurrentYearRange } from '../lib/utils'
import { STATUTS } from '../lib/constants'
import toast from 'react-hot-toast'

export function useChantiers(filters = {}) {
  const { equipe, isAdmin } = useAuth()
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchChantiers = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('chantiers')
        .select(`
          *,
          equipe:equipes(id, name)
        `)
        .order('created_at', { ascending: false })

      if (!isAdmin && equipe) {
        query = query.eq('equipe_id', equipe.id)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('date_intervention', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('date_intervention', filters.dateTo)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setChantiers(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching chantiers:', err)
      setError(err.message)
      toast.error('Erreur lors du chargement des chantiers')
    } finally {
      setLoading(false)
    }
  }, [equipe, isAdmin, filters.status, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    if (equipe || isAdmin) {
      fetchChantiers()
    }
  }, [fetchChantiers, equipe, isAdmin])

  return { chantiers, loading, error, refetch: fetchChantiers }
}

export function useChantier(chantierId) {
  const [chantier, setChantier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchChantier = useCallback(async () => {
    if (!chantierId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('chantiers')
        .select(`
          *,
          equipe:equipes(id, name, responsable),
          photos:chantier_photos(id, url, photo_type, created_at),
          documents:chantier_documents(id, url, filename, file_type, created_at),
          refus:chantier_refus(id, commentaire, created_at, photos:refus_photos(id, url))
        `)
        .eq('id', chantierId)
        .single()

      if (fetchError) throw fetchError
      setChantier(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching chantier:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [chantierId])

  useEffect(() => {
    fetchChantier()
  }, [fetchChantier])

  return { chantier, loading, error, refetch: fetchChantier }
}

export function useChantierStats() {
  const { equipe, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    ledValidees: 0,
    ledEnAttente: 0,
    ledRefusees: 0,
    primeAnnuelle: 0,
    primeMensuelle: 0,
    totalChantiers: 0,
    chantiersValides: 0,
    chantiersEnAttente: 0,
    chantiersRefuses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!equipe && !isAdmin) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        setLoading(true)
        const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
        const { start: yearStart, end: yearEnd } = getCurrentYearRange()

        let query = supabase
          .from('chantiers')
          .select('id, led_count, status, created_at')

        if (!isAdmin && equipe) {
          query = query.eq('equipe_id', equipe.id)
        }

        const { data: chantiers, error } = await query

        if (error) throw error

        const monthChantiers = chantiers.filter(c => {
          const date = new Date(c.created_at)
          return date >= monthStart && date <= monthEnd
        })

        const yearChantiers = chantiers.filter(c => {
          const date = new Date(c.created_at)
          return date >= yearStart && date <= yearEnd
        })

        const ledValidees = monthChantiers
          .filter(c => c.status === STATUTS.VALIDE)
          .reduce((sum, c) => sum + (c.led_count || 0), 0)

        const ledEnAttente = monthChantiers
          .filter(c => c.status === STATUTS.PENDING_CLIENT)
          .reduce((sum, c) => sum + (c.led_count || 0), 0)

        const ledRefusees = monthChantiers
          .filter(c => c.status === STATUTS.REFUSE)
          .reduce((sum, c) => sum + (c.led_count || 0), 0)

        const ledValideesAnnee = yearChantiers
          .filter(c => c.status === STATUTS.VALIDE)
          .reduce((sum, c) => sum + (c.led_count || 0), 0)

        const QUOTA = 1200
        const PRIME_PAR_LED = 5
        
        const primeMensuelle = Math.max(0, ledValidees - QUOTA) * PRIME_PAR_LED
        const primeAnnuelle = Math.max(0, ledValideesAnnee - QUOTA) * PRIME_PAR_LED

        setStats({
          ledValidees,
          ledEnAttente,
          ledRefusees,
          primeAnnuelle,
          primeMensuelle,
          totalChantiers: monthChantiers.length,
          chantiersValides: monthChantiers.filter(c => c.status === STATUTS.VALIDE).length,
          chantiersEnAttente: monthChantiers.filter(c => c.status === STATUTS.PENDING_CLIENT).length,
          chantiersRefuses: monthChantiers.filter(c => c.status === STATUTS.REFUSE).length,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [equipe, isAdmin])

  return { stats, loading }
}

export function useClassement() {
  const { equipe } = useAuth()
  const [classement, setClassement] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClassement() {
      try {
        setLoading(true)
        const { start: yearStart } = getCurrentYearRange()

        const { data, error } = await supabase
          .from('equipes')
          .select(`
            id,
            name,
            chantiers!inner(led_count, status, created_at)
          `)
          .eq('chantiers.status', STATUTS.VALIDE)
          .gte('chantiers.created_at', yearStart.toISOString())

        if (error) throw error

        const equipesWithLed = data.map(eq => {
          const totalLed = eq.chantiers.reduce((sum, c) => sum + (c.led_count || 0), 0)
          const QUOTA = 1200
          const PRIME_PAR_LED = 5
          const prime = Math.max(0, totalLed - QUOTA) * PRIME_PAR_LED
          
          return {
            id: eq.id,
            name: eq.name,
            totalLed,
            prime,
            isMe: equipe?.id === eq.id,
          }
        })

        equipesWithLed.sort((a, b) => b.totalLed - a.totalLed)

        const ranked = equipesWithLed.map((eq, index) => ({
          ...eq,
          rank: index + 1,
        }))

        setClassement(ranked)
        
        const myPosition = ranked.find(eq => eq.isMe)
        setMyRank(myPosition?.rank || null)
      } catch (err) {
        console.error('Error fetching classement:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClassement()
  }, [equipe])

  return { classement, myRank, loading }
}
