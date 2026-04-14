import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Eye, EyeOff, Building2, HardHat, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input } from '../components/ui'
import toast from 'react-hot-toast'
import { enterDemoMode } from '../lib/demoMode'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)

  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email) {
      toast.error('Veuillez saisir votre email')
      return
    }

    if (forgotPassword) {
      setLoading(true)
      const { error } = await resetPassword(email)
      setLoading(false)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Email de réinitialisation envoyé')
        setForgotPassword(false)
      }
      return
    }

    if (!password) {
      toast.error('Veuillez saisir votre mot de passe')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Email ou mot de passe incorrect')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Connexion réussie')
      navigate('/')
    }
  }

  function launchDemo(role) {
    enterDemoMode(role)
    toast.success(`Mode démo ${role === 'entreprise' ? 'Entreprise' : 'Équipe'} activé`)
    // Reload complet pour que AuthContext reparte proprement sur le mode démo
    window.location.href = role === 'entreprise' ? '/entreprise' : '/'
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            EOIA<span className="text-orange-500">.</span>Energie
          </h1>
          <p className="text-zinc-500 mt-2">Gestion de chantiers énergétiques</p>
        </div>

        {/* ---- Mode démo : accès sans compte ---- */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center gap-2 mb-3 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Découvrir l'app en 1 clic
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => launchDemo('entreprise')}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-orange-500/50 transition-all"
            >
              <Building2 className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-white">Démo Entreprise</span>
              <span className="text-[10px] text-zinc-500 leading-tight text-center">Dossiers CEE, équipes, primes</span>
            </button>
            <button
              type="button"
              onClick={() => launchDemo('equipe')}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-orange-500/50 transition-all"
            >
              <HardHat className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-white">Démo Équipe</span>
              <span className="text-[10px] text-zinc-500 leading-tight text-center">Chantiers, photos, classement</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 text-center">
            Données fictives · aucune inscription nécessaire
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Form connexion */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="votre@email.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {!forgotPassword && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Mot de passe"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {forgotPassword ? 'Envoyer le lien' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setForgotPassword(!forgotPassword)}
              className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
            >
              {forgotPassword ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative py-6 text-center">
        <p className="text-zinc-600 text-sm">
         EOIA Energie © 2026
        </p>
      </div>
    </div>
  )
}
