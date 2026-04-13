import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SECTEUR_DEFAUT } from '../lib/constants'

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
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        return initAuth()
      }
      setUser(null)
      setLoading(false)
    }
  }

  async function fetchProfile(userId) {
    try {
      // Étape 1 : charger le profil
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

      // Étape 2 : charger équipe + entreprise EN PARALLÈLE (au lieu d'en série)
      const promises = []

      if (profileData.equipe_id) {
        promises.push(
          withTimeout(
            supabase
              .from('equipes')
              .select('*')
              .eq('id', profileData.equipe_id)
              .single(),
            10000
          ).then(async ({ data: equipeData, error: equipeError }) => {
            if (!equipeError && equipeData) {
              setEquipe(equipeData)
              // Charger secteur si besoin
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
          })
        )
      }

      if (profileData.entreprise_id) {
        promises.push(
          withTimeout(
            supabase
              .from('entreprises')
              .select('*')
              .eq('id', profileData.entreprise_id)
              .single(),
            10000
          ).then(({ data: entrepriseData, error: entrepriseError }) => {
            if (!entrepriseError && entrepriseData) {
              setEntreprise(entrepriseData)
            }
          })
        )
      }

      // Attendre toutes les requêtes en parallèle
      if (promises.length > 0) {
        await Promise.all(promises)
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
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile: () => user && fetchProfile(user.id),
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
