import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [equipe, setEquipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)
  const maxRetries = 2

  useEffect(() => {
    initAuth()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setEquipe(null)
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
        // Retry si c'est le premier essai (cold start Supabase)
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
      // Retry sur timeout (cold start)
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

      if (profileData.equipe_id) {
        const { data: equipeData, error: equipeError } = await withTimeout(
          supabase
            .from('equipes')
            .select('*')
            .eq('id', profileData.equipe_id)
            .single(),
          10000
        )

        if (!equipeError) {
          setEquipe(equipeData)
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
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setEquipe(null)
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

  const value = {
    user,
    profile,
    equipe,
    loading,
    isAdmin,
    isEquipe,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---- Helpers ----

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout après ${ms / 1000}s`)), ms)
    )
  ])
}
