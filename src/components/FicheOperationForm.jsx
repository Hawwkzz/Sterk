import { useState, useMemo, useEffect } from 'react'
import { Zap, Info, Check } from 'lucide-react'
import { Card, Button, Input } from './ui'
import { FICHES, listFiches, computeCumac } from '../lib/cee'

/**
 * Formulaire dynamique basé sur la fiche FOS sélectionnée.
 * Props :
 *  - value: { fiche_code, donnees_techniques, kwh_cumac, zone_climatique }
 *  - onChange: ({ fiche_code, donnees_techniques, kwh_cumac, zone_climatique }) => void
 *  - onSave: () => Promise<void>
 *  - saving: bool
 */
export default function FicheOperationForm({ value = {}, onChange, onSave, saving }) {
  const [code, setCode] = useState(value.fiche_code || '')
  const [data, setData] = useState(value.donnees_techniques || {})

  useEffect(() => {
    setCode(value.fiche_code || '')
    setData(value.donnees_techniques || {})
  }, [value.fiche_code, value.donnees_techniques])

  const fiche = code ? FICHES[code] : null

  const computed = useMemo(() => {
    if (!code) return null
    return computeCumac(code, data)
  }, [code, data])

  function updateField(key, val) {
    const newData = { ...data, [key]: val }
    setData(newData)
    const next = computeCumac(code, newData)
    onChange?.({
      fiche_code: code,
      donnees_techniques: newData,
      kwh_cumac: next?.kwh_cumac ?? null,
      zone_climatique: newData.zone_climatique || null,
    })
  }

  function selectFiche(newCode) {
    setCode(newCode)
    setData({})
    onChange?.({
      fiche_code: newCode,
      donnees_techniques: {},
      kwh_cumac: null,
      zone_climatique: null,
    })
  }

  // Validation : tous les champs required doivent être remplis
  const missingRequired = fiche
    ? fiche.fields.filter(f => f.required && (data[f.key] === undefined || data[f.key] === '' || data[f.key] === null))
    : []
  const canSave = fiche && missingRequired.length === 0

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-orange-400" />
        <h3 className="text-white font-semibold text-sm">Fiche d'opération standardisée</h3>
      </div>

      {/* Sélection fiche */}
      <div>
        <label className="text-zinc-400 text-xs block mb-2">Fiche FOS</label>
        <select
          value={code}
          onChange={e => selectFiche(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-orange-500"
        >
          <option value="">— Choisir une fiche —</option>
          {listFiches().map(f => (
            <option key={f.code} value={f.code}>{f.code} — {f.label}</option>
          ))}
        </select>
      </div>

      {fiche && (
        <>
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">{fiche.description}</p>
          </div>

          {/* Champs dynamiques */}
          <div className="space-y-3">
            {fiche.fields.map(f => (
              <FieldRenderer
                key={f.key}
                field={f}
                value={data[f.key]}
                onChange={v => updateField(f.key, v)}
              />
            ))}
          </div>

          {/* Résultat kWh cumac */}
          {computed && computed.kwh_cumac != null && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-xs">kWh cumac calculés</span>
                <span className="text-orange-400 font-black text-xl">
                  {computed.kwh_cumac.toLocaleString('fr-FR')}
                </span>
              </div>
              {computed.puissance_totale_w != null && (
                <p className="text-zinc-500 text-[10px] mt-1">
                  Puissance totale installée : {computed.puissance_totale_w} W · durée de vie {computed.duree_vie_ans} ans
                </p>
              )}
              {computed.palier_etas && (
                <p className="text-zinc-500 text-[10px] mt-1">
                  Palier ETAS : ≥ {computed.palier_etas}% · tranche surface : {computed.tranche_surface}
                </p>
              )}
            </div>
          )}

          {/* Bouton sauvegarde */}
          {onSave && (
            <Button
              className="w-full"
              onClick={onSave}
              disabled={!canSave || saving}
              loading={saving}
            >
              <Check className="w-4 h-4" />
              {missingRequired.length > 0
                ? `${missingRequired.length} champ(s) requis manquant(s)`
                : 'Enregistrer les données techniques'}
            </Button>
          )}
        </>
      )}
    </Card>
  )
}

function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'select') {
    return (
      <div>
        <label className="text-zinc-400 text-xs block mb-1">
          {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-orange-500"
        >
          <option value="">—</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-zinc-300 text-sm">{field.label}</span>
      </label>
    )
  }

  return (
    <Input
      label={field.label + (field.required ? ' *' : '')}
      type={field.type || 'text'}
      value={value ?? ''}
      onChange={e => onChange(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      placeholder={field.placeholder}
      min={field.min}
      max={field.max}
      step={field.step}
    />
  )
}
