import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode } from '../lib/demoMode'
import {
  DEMO_DOSSIERS_CEE, DEMO_EQUIPES, DEMO_CHANTIERS,
  computeDemoEntrepriseStats,
} from '../lib/demoData'
import { STATUTS } from '../lib/constants'

// Hook: liste des dossiers CEE de l'entreprise
export function useDossiersCEE(filters = {}) {
  const { entreprise } = useAuth()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (isDemoMode()) {
      let list = [...DEMO_DOSSIERS_CEE]
      if (filters.statut) list = list.filter(d => d.statut === filters.statut)
      setDossiers(list); setError(null); setLoading(false)
      return
    }

    if (!entreprise?.id) return
    setLoading(true)

    try {
      let query = supabase
        .from('dossiers_cee')
        .select(`
          *,
          chantier:chantiers(
            id, adresse, unit_count, client_name, client_email, status, date_intervention,
            equipe:equipes(id, name)
          ),
          documents:documents_cee(id, type_document, nom, url, valide)
        `)
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false })

      if (filters.statut) {
        query = query.eq('statut', filters.statut)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setDossiers(data || [])
    } catch (err) {
      console.error('[useEntreprise] Error fetching dossiers:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [entreprise?.id, filters.statut])

  useEffect(() => { fetch() }, [fetch])

  return { dossiers, loading, error, refetch: fetch }
}

// Hook: un seul dossier CEE avec détails
export function useDossierCEE(dossierId) {
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!dossierId) return

    if (isDemoMode()) {
      const found = DEMO_DOSSIERS_CEE.find(d => d.id === dossierId)
      setDossier(found || null); setError(found ? null : new Error('Introuvable'))
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('dossiers_cee')
        .select(`
          *,
          chantier:chantiers(
            id, adresse, unit_count, client_name, client_email, client_phone,
            status, date_intervention, commentaire,
            equipe:equipes(id, name, responsable),
            photos:chantier_photos(id, url, photo_type),
            documents:chantier_documents(id, url, filename, file_type)
          ),
          documents:documents_cee(id, type_document, nom, url, valide, commentaire, created_at, source, source_id)
        `)
        .eq('id', dossierId)
        .single()

      if (fetchError) throw fetchError
      setDossier(data)
    } catch (err) {
      console.error('[useEntreprise] Error fetching dossier:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [dossierId])

  useEffect(() => { fetch() }, [fetch])

  return { dossier, loading, error, refetch: fetch }
}

// Hook: stats de l'entreprise
export function useEntrepriseStats() {
  const { entreprise } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setStats(computeDemoEntrepriseStats()); setLoading(false); return
    }

    if (!entreprise?.id) return

    async function fetchStats() {
      try {
        const { data: dossiers } = await supabase
          .from('dossiers_cee')
          .select('statut, montant_prime_estime, montant_prime_recu')
          .eq('entreprise_id', entreprise.id)

        const { data: equipes } = await supabase
          .from('equipes')
          .select('id')
          .eq('entreprise_id', entreprise.id)

        const equipeIds = (equipes || []).map(e => e.id)

        let chantiersValides = 0
        let chantiersSansDossier = 0

        if (equipeIds.length > 0) {
          const { data: chantiers } = await supabase
            .from('chantiers')
            .select('id')
            .eq('status', 'VALIDE')
            .in('equipe_id', equipeIds)

          chantiersValides = chantiers?.length || 0

          const { data: dossiersExistants } = await supabase
            .from('dossiers_cee')
            .select('chantier_id')
            .eq('entreprise_id', entreprise.id)

          const chantierIdsAvecDossier = new Set((dossiersExistants || []).map(d => d.chantier_id))
          chantiersSansDossier = (chantiers || []).filter(c => !chantierIdsAvecDossier.has(c.id)).length
        }

        const allDossiers = dossiers || []
        const primeEstimee = allDossiers.reduce((sum, d) => sum + (parseFloat(d.montant_prime_estime) || 0), 0)
        const primeRecue = allDossiers.reduce((sum, d) => sum + (parseFloat(d.montant_prime_recu) || 0), 0)

        const parStatut = {}
        allDossiers.forEach(d => {
          parStatut[d.statut] = (parStatut[d.statut] || 0) + 1
        })

        setStats({
          totalDossiers: allDossiers.length,
          chantiersValides,
          chantiersSansDossier,
          primeEstimee,
          primeRecue,
          parStatut,
          nbEquipes: equipeIds.length,
        })
      } catch (err) {
        console.error('[useEntreprise] Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [entreprise?.id])

  return { stats, loading }
}

// Hook: équipes de l'entreprise avec leur performance
export function useEntrepriseEquipes() {
  const { entreprise } = useAuth()
  const [equipes, setEquipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setEquipes(DEMO_EQUIPES); setLoading(false); return
    }

    if (!entreprise?.id) return

    async function fetchEquipes() {
      try {
        const { data: equipesData } = await supabase
          .from('equipes')
          .select(`
            id, name, responsable, blocked,
            secteur:secteurs(slug, label, unit_label, prime_par_unite)
          `)
          .eq('entreprise_id', entreprise.id)

        const enriched = await Promise.all((equipesData || []).map(async (eq) => {
          const { count } = await supabase
            .from('chantiers')
            .select('*', { count: 'exact', head: true })
            .eq('equipe_id', eq.id)
            .eq('status', 'VALIDE')

          return { ...eq, chantiersValides: count || 0 }
        }))

        setEquipes(enriched)
      } catch (err) {
        console.error('[useEntreprise] Error fetching equipes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEquipes()
  }, [entreprise?.id])

  return { equipes, loading }
}

// Hook: chantiers validés sans dossier CEE
export function useChantiersSansDossier() {
  const { entreprise } = useAuth()
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (isDemoMode()) {
      const idsAvecDossier = new Set(DEMO_DOSSIERS_CEE.map(d => d.chantier_id))
      const sansDossier = DEMO_CHANTIERS
        .filter(c => c.status === STATUTS.VALIDE && !idsAvecDossier.has(c.id))
      setChantiers(sansDossier); setLoading(false); return
    }

    if (!entreprise?.id) return
    setLoading(true)

    try {
      const { data: equipes } = await supabase
        .from('equipes')
        .select('id')
        .eq('entreprise_id', entreprise.id)

      const equipeIds = (equipes || []).map(e => e.id)
      if (equipeIds.length === 0) { setChantiers([]); setLoading(false); return }

      const { data: chantiersValides } = await supabase
        .from('chantiers')
        .select('id, adresse, unit_count, client_name, date_intervention, equipe:equipes(id, name)')
        .eq('status', 'VALIDE')
        .in('equipe_id', equipeIds)
        .order('date_intervention', { ascending: false })

      const { data: dossiers } = await supabase
        .from('dossiers_cee')
        .select('chantier_id')
        .eq('entreprise_id', entreprise.id)

      const idsAvecDossier = new Set((dossiers || []).map(d => d.chantier_id))
      const sansDossier = (chantiersValides || []).filter(c => !idsAvecDossier.has(c.id))

      setChantiers(sansDossier)
    } catch (err) {
      console.error('[useEntreprise] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [entreprise?.id])

  useEffect(() => { fetch() }, [fetch])

  return { chantiers, loading, refetch: fetch }
}

// Hook: configuration des primes par secteur pour l'entreprise
export function useEntrepriseParamsPrimes() {
  const { entreprise } = useAuth()
  const [secteurs, setSecteurs] = useState([])
  const [params, setParams] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (isDemoMode()) {
      setSecteurs([
        { id: 'demo-led', slug: 'led', label: 'LED Relamping', unit_label: 'LED', quota_mensuel: 1200, prime_par_unite: 5 },
        { id: 'demo-pac', slug: 'pac', label: 'Pompe à Chaleur', unit_label: 'PAC', quota_mensuel: 8, prime_par_unite: 200 },
        { id: 'demo-pv', slug: 'pv', label: 'Photovoltaïque', unit_label: 'panneau', quota_mensuel: 5, prime_par_unite: 300 },
        { id: 'demo-irve', slug: 'irve', label: 'Bornes IRVE', unit_label: 'borne', quota_mensuel: 10, prime_par_unite: 80 },
      ])
      setParams({})
      setLoading(false)
      return
    }

    if (!entreprise?.id) return

    async function fetchData() {
      try {
        const { data: secteursData } = await supabase
          .from('secteurs')
          .select('id, slug, label, unit_label, quota_mensuel, prime_par_unite')
          .order('slug')

        const { data: paramsData } = await supabase
          .from('entreprise_secteur_params')
          .select('secteur_id, prime_par_unite, quota_mensuel')
          .eq('entreprise_id', entreprise.id)

        const paramsMap = {}
        ;(paramsData || []).forEach(p => {
          paramsMap[p.secteur_id] = { prime_par_unite: p.prime_par_unite, quota_mensuel: p.quota_mensuel }
        })

        setSecteurs(secteursData || [])
        setParams(paramsMap)
      } catch (err) {
        console.error('[useEntrepriseParamsPrimes]', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [entreprise?.id])

  const saveParam = async (secteurId, prime_par_unite, quota_mensuel) => {
    if (isDemoMode()) return { success: true }
    if (!entreprise?.id) return { success: false }

    setSaving(secteurId)
    try {
      const { error } = await supabase
        .from('entreprise_secteur_params')
        .upsert(
          { entreprise_id: entreprise.id, secteur_id: secteurId, prime_par_unite: parseFloat(prime_par_unite), quota_mensuel: parseInt(quota_mensuel) },
          { onConflict: 'entreprise_id,secteur_id' }
        )

      if (error) throw error
      setParams(prev => ({ ...prev, [secteurId]: { prime_par_unite, quota_mensuel } }))
      return { success: true }
    } catch (err) {
      console.error('[saveParam]', err)
      return { success: false, error: err }
    } finally {
      setSaving(null)
    }
  }

  const getEffectiveValues = (secteur) => ({
    prime_par_unite: params[secteur.id]?.prime_par_unite ?? secteur.prime_par_unite,
    quota_mensuel: params[secteur.id]?.quota_mensuel ?? secteur.quota_mensuel,
    hasOverride: !!params[secteur.id],
  })

  return { secteurs, params, loading, saving, saveParam, getEffectiveValues }
}
