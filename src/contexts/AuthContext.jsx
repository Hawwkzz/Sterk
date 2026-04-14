import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SECTEUR_DEFAUT } from '../lib/constants'
import { isDemoMode, getDemoRole, exitDemoMode } from '../lib/demoMode'
import {
  DEMO_USER_ENTREPRISE, DEMO_USER_EQUIPE,
  DEMO_PROFILE_ENTREPRISE, DEMO_PROFILE_EQUIPE,
  DEMO_EQUIPE, DEMO_ENTREPRISE, DEMO_SECTEUR,
} from '../lib/demoData'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [equipe, setEquipe] = useState(null)
  const [entreprise, setEntreprise] = useState(null)
  const [secteur, setSecteur] = useState(SECTEUR_DEFAUT)
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)
  const maxRetries = 2

  useEffect(() => {
    // --- MODE DÉMO : on court-circuite Supabase et on injecte des valeurs fictives ---
    if (isDemoMode()) {
      const role = getDemoRole()
      if (role === 'entreprise') {
        setUser(DEMO_USER_ENTREPRISE)
        setProfile(DEMO_PROFILE_ENTREPRISE)
        setEntreprise(DEMO_ENTREPRISE)
        setEquipe(null)
        setSecteur(DEMO_SECTEUR)
      } else {
        setUser(DEMO_USER_EQUIPE)
        setProfile(DEMO_PROFILE_EQUIPE)
        setEquipe(DEMO_EQUIPE)
        setEntreprise(DEMO_ENTREPRISE)
        setSecteur(DEMO_SECTEUR)
      }
      setLoading(false)
      return
    }

    initAuth()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isDemoMode()) return // safety
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setEquipe(null)
          setEntreprise(null)
          setSecteur(SECTEUR_DEFAUT)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function initAuth() {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        4000
      )

      if (error) {
        console.error('[Auth] getSession error:', error)
        if (retryCount.current < maxRetries) {
          retryCount.current++
          console.log(`[Auth] Retry ${retryCount.current}/${maxRetries}...`)
          return initAuth()
        }
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('[Auth] getSession crashed:', err)
      if (retryCount.current < maxRetries) {
        retryCount.current++
        console.log(`[Auth] Retry ${retryCount.current}/${maxRetries} après timeout...`)
        return initAuth()
      }
      setUser(null)
      setLoading(false)
    }
  }

  async function fetchProfile(userId) {
    try {
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        10000
      )

      if (profileError) throw profileError
      setProfile(profileData)

      // Si rôle équipe → charger équipe + secteur
      if (profileData.equipe_id) {
        const { data: equipeData, error: equipeError } = await withTimeout(
          supabase
            .from('equipes')
            .select('*')
            .eq('id', profileData.equipe_id)
            .single(),
          10000
        )

        if (!equipeError && equipeData) {
          setEquipe(equipeData)

          // Charger la config secteur de l'équipe
          if (equipeData.secteur_id) {
            const { data: secteurData, error: secteurError } = await withTimeout(
              supabase
                .from('secteurs')
                .select('*')
                .eq('id', equipeData.secteur_id)
                .single(),
              10000
            )

            if (!secteurError && secteurData) {
              setSecteur(secteurData)
            }
          }
        }
      }

      // Si rôle entreprise → charger entreprise
      if (profileData.entreprise_id) {
        const { data: entrepriseData, error: entrepriseError } = await withTimeout(
          supabase
            .from('entreprises')
            .select('*')
            .eq('id', profileData.entreprise_id)
            .single(),
          10000
        )

        if (!entrepriseError && entrepriseData) {
          setEntreprise(entrepriseData)
        }
      }
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signOut() {
    // En mode démo, "déconnexion" = quitter la démo sans toucher Supabase
    if (isDemoMode()) {
      exitDemoMode()
      setUser(null); setProfile(null); setEquipe(null); setEntreprise(null)
      setSecteur(SECTEUR_DEFAUT)
      window.location.href = '/login'
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setEquipe(null)
      setEntreprise(null)
      setSecteur(SECTEUR_DEFAUT)
    }
    return { error }
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  const isAdmin = profile?.role === 'admin'
  const isEquipe = profile?.role === 'equipe'
  const isEntreprise = profile?.role === 'entreprise'

  const value = {
    user,
    profile,
    equipe,
    entreprise,
    secteur,
    loading,
    isAdmin,
    isEquipe,
    isEntreprise,
    isDemo: isDemoMode(),
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile: () => user && !isDemoMode() && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---- Helpers ----

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout après ${ms / 1000}s`)), ms)
    )
  ])
}
