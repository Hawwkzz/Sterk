import { Trophy, Medal, Award, TrendingUp, Zap } from 'lucide-react'
import { useClassement } from '../hooks/useChantiers'
import { formatNumber, formatCurrency } from '../lib/utils'
import { Card, Spinner } from '../components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export default function ClassementPage() {
  const { classement, myRank, loading } = useClassement()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // Top 3 pour le podium
  const podium = classement.slice(0, 3)
  // Reste du classement
  const rest = classement.slice(3)

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Classement</h1>
        <div className="text-right">
          <p className="text-zinc-500 text-xs">Votre position</p>
          <p className="text-2xl font-bold text-orange-400">#{myRank || '-'}</p>
        </div>
      </div>

      {classement.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500">Aucune donnée de classement disponible</p>
          <p className="text-zinc-600 text-sm mt-2">
            Le classement apparaîtra dès que des chantiers seront validés
          </p>
        </Card>
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {/* 2ème place */}
            {podium[1] && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-2xl">{MEDALS[1]}</span>
                </div>
                <p className={`font-medium text-sm ${podium[1].isMe ? 'text-orange-400' : 'text-white'}`}>
                  {podium[1].name}
                </p>
                <p className="text-zinc-500 text-xs">{formatNumber(podium[1].totalLed)} LED</p>
                <div className="w-20 h-20 bg-zinc-700 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-zinc-400 text-lg font-bold">2</span>
                </div>
              </div>
            )}

            {/* 1ère place */}
            {podium[0] && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-xl shadow-orange-500/30">
                  <span className="text-3xl">{MEDALS[0]}</span>
                </div>
                <p className={`font-bold ${podium[0].isMe ? 'text-orange-400' : 'text-white'}`}>
                  {podium[0].name}
                </p>
                <p className="text-orange-400 text-sm font-medium">{formatNumber(podium[0].totalLed)} LED</p>
                <div className="w-20 h-28 bg-gradient-to-t from-orange-600 to-amber-500 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">1</span>
                </div>
              </div>
            )}

            {/* 3ème place */}
            {podium[2] && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-2xl">{MEDALS[2]}</span>
                </div>
                <p className={`font-medium text-sm ${podium[2].isMe ? 'text-orange-400' : 'text-white'}`}>
                  {podium[2].name}
                </p>
                <p className="text-zinc-500 text-xs">{formatNumber(podium[2].totalLed)} LED</p>
                <div className="w-20 h-14 bg-amber-800 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-amber-200 text-lg font-bold">3</span>
                </div>
              </div>
            )}
          </div>

          {/* Liste complète */}
          <div className="space-y-2 mt-6">
            {classement.map((eq) => (
              <Card
                key={eq.id}
                className={`p-4 flex items-center gap-4 ${
                  eq.isMe ? 'border-orange-500/30 bg-orange-500/10' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    eq.rank <= 3
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {eq.rank <= 3 ? MEDALS[eq.rank - 1] : eq.rank}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${eq.isMe ? 'text-orange-400' : 'text-white'}`}>
                    {eq.name}
                    {eq.isMe && <span className="text-xs ml-2 text-orange-400/70">(vous)</span>}
                  </p>
                  <div className="flex items-center gap-1 text-zinc-500 text-sm">
                    <Zap className="w-3 h-3" />
                    {formatNumber(eq.totalLed)} LED validées
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-bold">{formatCurrency(eq.prime)}</p>
                  <p className="text-zinc-500 text-xs">prime</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Info */}
          <p className="text-center text-zinc-600 text-xs pt-4">
            Classement basé sur les LED validées depuis le début de l'année
          </p>
        </>
      )}
    </div>
  )
}
