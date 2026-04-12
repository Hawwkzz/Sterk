import { Users, Trophy, FileCheck, Zap } from 'lucide-react'
import { useEntrepriseEquipes } from '../hooks/useEntreprise'
import { Card, Badge, Spinner, EmptyState } from '../components/ui'

export default function EntrepriseEquipesPage() {
  const { equipes, loading } = useEntrepriseEquipes()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (equipes.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon={Users}
          title="Aucune Ã©quipe"
          description="Aucune Ã©quipe n'est rattachÃ©e Ã  votre entreprise."
        />
      </div>
    )
  }

  // Trier par chantiers validÃ©s dÃ©croissant
  const sorted = [...equipes].sort((a, b) => b.chantiersValides - a.chantiersValides)

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Mes Ã©quipes</h1>
        <p className="text-zinc-500 text-sm">{equipes.length} Ã©quipe{equipes.length > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {sorted.map((eq, index) => (
          <Card key={eq.id} className="p-4">
            <div className="flex items-start gap-3">
              {/* Rang */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                index === 0 ? 'bg-amber-500/20' : index === 1 ? 'bg-zinc-400/20' : index === 2 ? 'bg-orange-800/20' : 'bg-zinc-800'
              }`}>
                {index < 3 ? (
                  <Trophy className={`w-5 h-5 ${
                    index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : 'text-orange-700'
                  }`} />
                ) : (
                  <span className="text-zinc-500 font-bold text-sm">#{index + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{eq.name}</p>
                  {eq.blocked && <Badge variant="danger">BloquÃ©e</Badge>}
                </div>
                {eq.responsable && (
                  <p className="text-zinc-500 text-xs mt-0.5">{eq.responsable}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {eq.secteur && (
                    <Badge variant="orange">
                      <Zap className="w-3 h-3 mr-1" />
                      {eq.secteur.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold text-lg">{eq.chantiersValides}</p>
                <p className="text-zinc-500 text-xs">chantiers</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

