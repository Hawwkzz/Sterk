import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Hook: liste des dossiers CEE de l'entreprise
export function useDossiersCEE(filters = {}) {
  const { entreprise } = useAuth()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
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

// Hook: un seul dossier CEE avec dÃ©tails
export function useDossierCEE(dossierId) {
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!dossierId) return
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
          documents:documents_cee(id, type_document, nom, url, valide, commentaire, created_at)
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
    if (!entreprise?.id) return

    async function fetchStats() {
      try {
        // RÃ©cupÃ©rer tous les dossiers CEE
        const { data: dossiers } = await supabase
          .from('dossiers_cee')
          .select('statut, montant_prime_estime, montant_prime_recu')
          .eq('entreprise_id', entreprise.id)

        // RÃ©cupÃ©rer les chantiers validÃ©s des Ã©quipes de l'entreprise
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

          // Compter ceux sans dossier CEE
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

// Hook: Ã©quipes de l'entreprise avec leur performance
export function useEntrepriseEquipes() {
  const { entreprise } = useAuth()
  const [equipes, setEquipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

        // Pour chaque Ã©quipe, compter les chantiers validÃ©s
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

// Hook: chantiers validÃ©s sans dossier CEE (pour crÃ©er de nouveaux dossiers)
export function useChantiersSansDossier() {
  const { entreprise } = useAuth()
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!entreprise?.id) return
    setLoading(true)

    try {
      // Ãquipes de l'entreprise
      const { data: equipes } = await supabase
        .from('equipes')
        .select('id')
        .eq('entreprise_id', entreprise.id)

      const equipeIds = (equipes || []).map(e => e.id)
      if (equipeIds.length === 0) { setChantiers([]); setLoading(false); return }

      // Chantiers validÃ©s
      const { data: chantiersValides } = await supabase
        .from('chantiers')
        .select('id, adresse, unit_count, client_name, date_intervention, equipe:equipes(id, name)')
        .eq('status', 'VALIDE')
        .in('equipe_id', equipeIds)
        .order('date_intervention', { ascending: false })

      // Dossiers existants
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

