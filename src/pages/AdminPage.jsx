import { useState, useEffect } from 'react'
import { Users, FileText, Zap, Download, Search, Filter, Ban, CheckCircle, Clock, AlertCircle, ChevronRight, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STATUT_CONFIG, STATUTS } from '../lib/constants'
import { formatNumber, formatCurrency, formatDate, formatDateTime } from '../lib/utils'
import { Card, Button, Input, Spinner, Badge, Modal } from '../components/ui'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [equipes, setEquipes] = useState([])
  const [chantiers, setChantiers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChantier, setSelectedChantier] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      // Stats globales
      const { data: allChantiers } = await supabase
        .from('chantiers')
        .select('id, led_count, status, created_at')

      const { data: allEquipes } = await supabase
        .from('equipes')
        .select('*')

      // Calculer stats
      const totalLed = allChantiers
        ?.filter(c => c.status === STATUTS.VALIDE)
        .reduce((sum, c) => sum + (c.led_count || 0), 0) || 0

      const pendingCount = allChantiers?.filter(c => c.status === STATUTS.PENDING_CLIENT).length || 0
      const refusedCount = allChantiers?.filter(c => c.status === STATUTS.REFUSE).length || 0

      setStats({
        totalEquipes: allEquipes?.length || 0,
        totalChantiers: allChantiers?.length || 0,
        totalLed,
        pendingCount,
        refusedCount,
      })

      setEquipes(allEquipes || [])

      // Derniers chantiers
      const { data: recentChantiers } = await supabase
        .from('chantiers')
        .select(`
          *,
          equipe:equipes(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      setChantiers(recentChantiers || [])
    } catch (err) {
      console.error('Admin fetch error:', err)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleBlockEquipe(equipeId, blocked) {
    try {
      const { error } = await supabase
        .from('equipes')
        .update({ blocked })
        .eq('id', equipeId)

      if (error) throw error
      toast.success(blocked ? 'Équipe bloquée' : 'Équipe débloquée')
      fetchData()
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function handleExportCSV() {
    try {
      const { data } = await supabase
        .from('chantiers')
        .select(`
          *,
          equipe:equipes(name)
        `)
        .eq('status', STATUTS.VALIDE)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) {
        toast.error('Aucune donnée à exporter')
        return
      }

      // Créer CSV
      const headers = ['ID', 'Équipe', 'Adresse', 'Client', 'LED', 'Date', 'Statut']
      const rows = data.map(c => [
        c.id,
        c.equipe?.name || '',
        `"${c.adresse}"`,
        `"${c.client_name}"`,
        c.led_count,
        formatDate(c.created_at),
        c.status
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `export-chantiers-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()

      toast.success('Export téléchargé')
    } catch (err) {
      toast.error('Erreur lors de l\'export')
    }
  }

  const filteredChantiers = chantiers.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.adresse?.toLowerCase().includes(query) ||
      c.client_name?.toLowerCase().includes(query) ||
      c.equipe?.name?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
        {[
          { id: 'overview', label: 'Vue globale', icon: BarChart3 },
          { id: 'equipes', label: 'Équipes', icon: Users },
          { id: 'chantiers', label: 'Chantiers', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-zinc-500 text-sm">Équipes</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalEquipes}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-zinc-500 text-sm">Chantiers</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalChantiers}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="text-zinc-500 text-sm">LED validées</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalLed)}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-zinc-500 text-sm">En attente</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.pendingCount}</p>
            </Card>
          </div>

          {/* Export */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Export des données</p>
                <p className="text-zinc-500 text-sm">Télécharger tous les chantiers validés</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Équipes Tab */}
      {activeTab === 'equipes' && (
        <div className="space-y-3">
          {equipes.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Aucune équipe</p>
            </Card>
          ) : (
            equipes.map(eq => (
              <Card key={eq.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{eq.name}</p>
                      {eq.blocked && (
                        <Badge variant="danger">Bloquée</Badge>
                      )}
                    </div>
                    <p className="text-zinc-500 text-sm">{eq.responsable}</p>
                  </div>
                  <Button
                    variant={eq.blocked ? 'secondary' : 'danger'}
                    size="sm"
                    onClick={() => handleBlockEquipe(eq.id, !eq.blocked)}
                  >
                    <Ban className="w-4 h-4" />
                    {eq.blocked ? 'Débloquer' : 'Bloquer'}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Chantiers Tab */}
      {activeTab === 'chantiers' && (
        <div className="space-y-4">
          <Input
            placeholder="Rechercher un chantier..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="space-y-2">
            {filteredChantiers.map(chantier => {
              const config = STATUT_CONFIG[chantier.status] || STATUT_CONFIG[STATUTS.DRAFT]
              return (
                <Card 
                  key={chantier.id} 
                  className="p-4 cursor-pointer hover:bg-zinc-800/70"
                  onClick={() => setSelectedChantier(chantier)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Zap className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            chantier.status === STATUTS.VALIDE ? 'success' :
                            chantier.status === STATUTS.REFUSE ? 'danger' :
                            chantier.status === STATUTS.PENDING_CLIENT ? 'warning' :
                            'default'
                          }
                        >
                          {config.label}
                        </Badge>
                        <span className="text-zinc-500 text-xs">
                          {chantier.equipe?.name}
                        </span>
                      </div>
                      <p className="text-white text-sm truncate">{chantier.adresse}</p>
                      <p className="text-zinc-500 text-xs">
                        {chantier.led_count} LED · {formatDate(chantier.created_at, 'dd MMM HH:mm')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Chantier Detail Modal */}
      {selectedChantier && (
        <Modal
          open={!!selectedChantier}
          onClose={() => setSelectedChantier(null)}
          title={`Chantier #${selectedChantier.id}`}
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 text-xs">Équipe</p>
                <p className="text-white">{selectedChantier.equipe?.name}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Statut</p>
                <Badge
                  variant={
                    selectedChantier.status === STATUTS.VALIDE ? 'success' :
                    selectedChantier.status === STATUTS.REFUSE ? 'danger' :
                    'warning'
                  }
                >
                  {STATUT_CONFIG[selectedChantier.status]?.label}
                </Badge>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">LED</p>
                <p className="text-white font-bold">{selectedChantier.led_count}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Date</p>
                <p className="text-white">{formatDateTime(selectedChantier.created_at)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-zinc-500 text-xs">Adresse</p>
              <p className="text-white">{selectedChantier.adresse}</p>
            </div>
            
            <div>
              <p className="text-zinc-500 text-xs">Client</p>
              <p className="text-white">{selectedChantier.client_name}</p>
              {selectedChantier.client_email && (
                <p className="text-zinc-400 text-sm">{selectedChantier.client_email}</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
