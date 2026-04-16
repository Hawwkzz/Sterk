// Définitions des Fiches d'Opérations Standardisées (FOS) CEE
// Sources: arrêtés officiels du Ministère de la Transition Écologique

// Durée de validité réglementaire d'un dossier CEE : 12 mois après la date de facture
export const CEE_VALIDITY_MONTHS = 12

// Zones climatiques France métropolitaine
export const ZONES_CLIMATIQUES = [
  { value: 'H1', label: 'H1 - Nord & Est (climat le plus froid)' },
  { value: 'H2', label: 'H2 - Ouest & Centre' },
  { value: 'H3', label: 'H3 - Méditerranée' },
]

// Catégories de ménage (précarité énergétique)
// Coef "Coup de pouce" pour valorisation précarité énergétique
export const CATEGORIES_MENAGE = [
  { value: 'classique', label: 'Classique (hors précarité)', coef: 1 },
  { value: 'modeste', label: 'Ménage modeste', coef: 1.5 },
  { value: 'grande_precarite', label: 'Ménage grande précarité', coef: 2 },
]

export function getCoefPrecarite(categorie) {
  const c = CATEGORIES_MENAGE.find(m => m.value === categorie)
  return c ? c.coef : 1
}


// ==========================================================
// BAT-EQ-127 — Luminaires LED tertiaire
// ==========================================================
// Formule : kWh cumac = coefficient(secteur) × puissance_totale_W
const COEF_LED_TERTIAIRE = {
  hotellerie_restauration: { coef: 31, duree_vie: 13, label: 'Hôtellerie / Restauration' },
  commerces: { coef: 36, duree_vie: 11, label: 'Commerces' },
  bureaux: { coef: 35, duree_vie: 25, label: 'Bureaux' },
  sante: { coef: 38, duree_vie: 13, label: 'Santé' },
  enseignement: { coef: 24, duree_vie: 25, label: 'Enseignement' },
  autres: { coef: 24, duree_vie: 25, label: 'Autres secteurs tertiaires' },
}

// ==========================================================
// BAR-TH-171 — PAC air/eau résidentiel
// ==========================================================
// Tables officielles kWh cumac (ETAS ≥ 126% et ≥ 111%)
// Sources : Arrêté du 22 décembre 2014 modifié
const BAR_TH_171_TABLE = {
  // Maison individuelle, ETAS ≥ 126%
  maison: {
    111: { H1: { '<70': 36700, '70-90': 57400, '>90': 80000 },
           H2: { '<70': 28600, '70-90': 44700, '>90': 62400 },
           H3: { '<70': 18600, '70-90': 29000, '>90': 40400 } },
    126: { H1: { '<70': 45900, '70-90': 71800, '>90': 100000 },
           H2: { '<70': 35800, '70-90': 55900, '>90': 78000 },
           H3: { '<70': 23300, '70-90': 36300, '>90': 50500 } },
  },
  appartement: {
    111: { H1: { '<35': 16800, '35-60': 26300, '>60': 36600 },
           H2: { '<35': 13100, '35-60': 20500, '>60': 28600 },
           H3: { '<35': 8500, '35-60': 13300, '>60': 18500 } },
    126: { H1: { '<35': 21000, '35-60': 32900, '>60': 45800 },
           H2: { '<35': 16400, '35-60': 25700, '>60': 35700 },
           H3: { '<35': 10600, '35-60': 16700, '>60': 23200 } },
  },
}

// ==========================================================
// BAR-TH-129 — PAC air/air résidentiel
// ==========================================================
// Formule simplifiée : kWh cumac = coef(zone) × surface_chauffee
const COEF_PAC_AIR_AIR = {
  H1: 16800,
  H2: 13100,
  H3: 8500,
}

// ==========================================================
// BAR-TH-174 — PAC air/eau individuelle (maison / appartement)
// ==========================================================
// Arrêté du 7 janvier 2026 (vA80-3 effective 17/01/2026)
// Structure identique à BAR-TH-171 mais valeurs de table mises à jour 2026
// ⚠️ VALEURS INDICATIVES — à vérifier contre l'arrêté officiel avant production
const BAR_TH_174_TABLE = {
  maison: {
    111: { H1: { '<70': 38500, '70-90': 60200, '>90': 84000 },
           H2: { '<70': 30000, '70-90': 46900, '>90': 65500 },
           H3: { '<70': 19500, '70-90': 30400, '>90': 42400 } },
    126: { H1: { '<70': 48100, '70-90': 75300, '>90': 105000 },
           H2: { '<70': 37500, '70-90': 58700, '>90': 81900 },
           H3: { '<70': 24400, '70-90': 38100, '>90': 53000 } },
  },
  appartement: {
    111: { H1: { '<35': 17600, '35-60': 27600, '>60': 38400 },
           H2: { '<35': 13700, '35-60': 21500, '>60': 30000 },
           H3: { '<35': 8900, '35-60': 13900, '>60': 19400 } },
    126: { H1: { '<35': 22000, '35-60': 34500, '>60': 48000 },
           H2: { '<35': 17200, '35-60': 27000, '>60': 37500 },
           H3: { '<35': 11100, '35-60': 17500, '>60': 24300 } },
  },
}

// ==========================================================
// BAR-TH-179 — PAC collective (logement collectif / copropriété)
// ==========================================================
// Installation d'une PAC collective sur boucle d'eau chaude en copropriété
// ⚠️ VALEURS INDICATIVES — à vérifier contre l'arrêté officiel
const BAR_TH_179_COEFS = {
  H1: 1950,
  H2: 1520,
  H3: 990,
}

// ==========================================================
// Schémas de formulaire par fiche
// ==========================================================
export const FICHES = {
  'BAT-EQ-127': {
    code: 'BAT-EQ-127',
    label: 'LED — Luminaires tertiaire',
    secteur: 'tertiaire',
    description: 'Remplacement de luminaires par des luminaires LED dans un bâtiment tertiaire existant.',
    fields: [
      { key: 'secteur_activite', label: "Secteur d'activité", type: 'select',
        options: Object.entries(COEF_LED_TERTIAIRE).map(([k, v]) => ({ value: k, label: v.label })),
        required: true },
      { key: 'nb_luminaires', label: 'Nombre de luminaires installés', type: 'number', required: true, min: 1 },
      { key: 'puissance_unitaire_w', label: 'Puissance unitaire (W)', type: 'number', required: true, step: 0.1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence commerciale', type: 'text', required: true },
      { key: 'flux_lumineux_lm', label: 'Flux lumineux (lm) ≥ 3000', type: 'number', required: true, min: 3000 },
      { key: 'efficacite_lm_w', label: 'Efficacité (lm/W) ≥ 90', type: 'number', required: true, min: 90 },
      { key: 'duree_vie_h', label: 'Durée de vie L80B50 (h) ≥ 35 000', type: 'number', required: true, min: 35000 },
      { key: 'facteur_puissance', label: 'Facteur de puissance > 0,9', type: 'number', required: true, step: 0.01, min: 0.9, max: 1 },
      { key: 'ik', label: 'Indice IK', type: 'text', required: true, placeholder: 'ex: IK08' },
      { key: 'thd_percent', label: 'THD (%) < 25', type: 'number', required: true, max: 25, step: 0.1 },
      { key: 'groupe_risque', label: 'Groupe de risque photobiologique', type: 'select',
        options: [{ value: '0', label: '0 (exempt)' }, { value: '1', label: '1 (faible)' }], required: true },
      { key: 'gradation', label: 'Pré-équipé pour gradation', type: 'checkbox' },
    ],
    compute: (d) => {
      const sect = COEF_LED_TERTIAIRE[d.secteur_activite]
      if (!sect) return null
      const nb = Number(d.nb_luminaires) || 0
      const pw = Number(d.puissance_unitaire_w) || 0
      const puissance_totale = nb * pw
      const cumac = sect.coef * puissance_totale
      return { kwh_cumac: Math.round(cumac), puissance_totale_w: puissance_totale, duree_vie_ans: sect.duree_vie }
    },
  },

  'BAR-TH-171': {
    code: 'BAR-TH-171',
    label: 'PAC air/eau — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/eau dans un bâtiment résidentiel existant (> 2 ans).",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) — efficacité saisonnière", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance thermique nominale (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R32' },
      { key: 'residence_principale', label: 'Résidence principale', type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
    ],
    compute: (d) => {
      const type = d.type_logement
      const zone = d.zone_climatique
      const etas = Number(d.etas_percent) || 0
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!type || !zone || !etas || !surface) return null
      const palier = etas >= 126 ? 126 : 111
      let tranche
      if (type === 'maison') {
        tranche = surface < 70 ? '<70' : surface <= 90 ? '70-90' : '>90'
      } else {
        tranche = surface < 35 ? '<35' : surface <= 60 ? '35-60' : '>60'
      }
      const cumac = BAR_TH_171_TABLE[type]?.[palier]?.[zone]?.[tranche] || 0
      const coef = getCoefPrecarite(d.categorie_menage)
      return { kwh_cumac: Math.round(cumac * coef), palier_etas: palier, tranche_surface: tranche, coef_precarite: coef, categorie_menage: d.categorie_menage }
    },
  },

  'BAR-TH-129': {
    code: 'BAR-TH-129',
    label: 'PAC air/air — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/air (climatisation réversible) en résidentiel existant.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'seer', label: 'SEER', type: 'number', step: 0.01 },
      { key: 'scop', label: 'SCOP', type: 'number', required: true, step: 0.01, min: 3.9 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!zone || !surface) return null
      const coef = COEF_PAC_AIR_AIR[zone]
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return { kwh_cumac: Math.round(coef * (surface / 100) * coefPrec), coef_zone: coef, coef_precarite: coefPrec, categorie_menage: d.categorie_menage }
    },
  },

  'BAR-EN-101': {
    code: 'BAR-EN-101',
    label: 'Isolation combles / toitures',
    secteur: 'residentiel',
    description: "Isolation de combles perdus ou rampants de toiture dans un bâtiment résidentiel.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_isolee_m2', label: 'Surface isolée (m²)', type: 'number', required: true, min: 1 },
      { key: 'resistance_thermique', label: 'Résistance thermique R (m².K/W) ≥ 7', type: 'number', required: true, min: 7, step: 0.1 },
      { key: 'marque_isolant', label: "Marque de l'isolant", type: 'text', required: true },
      { key: 'reference_isolant', label: "Référence de l'isolant", type: 'text', required: true },
      { key: 'epaisseur_mm', label: 'Épaisseur (mm)', type: 'number', required: true, min: 1 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const s = Number(d.surface_isolee_m2) || 0
      if (!zone || !s) return null
      const coefs = { H1: 1600, H2: 1300, H3: 900 } // kWh cumac / m² (maison indiv., indicatif)
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return { kwh_cumac: Math.round((coefs[zone] || 0) * s * coefPrec), coef_precarite: coefPrec, categorie_menage: d.categorie_menage }
    },
  },

  'BAR-TH-143': {
    code: 'BAR-TH-143',
    label: 'Système solaire combiné',
    secteur: 'residentiel',
    description: "Installation d'un système solaire combiné (chauffage + eau chaude sanitaire).",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_capteurs_m2', label: 'Surface capteurs (m²)', type: 'number', required: true, step: 0.1 },
      { key: 'productivite_kwh_m2_an', label: 'Productivité (kWh/m²/an)', type: 'number', required: true },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'certification', label: 'Certification (Solar Keymark, CSTBat...)', type: 'text', required: true },
    ],
    compute: (d) => {
      const s = Number(d.surface_capteurs_m2) || 0
      const p = Number(d.productivite_kwh_m2_an) || 0
      if (!s || !p) return null
      // Approximation : cumac ≈ productivité × surface × durée_vie (20 ans)
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return { kwh_cumac: Math.round(s * p * 20 * coefPrec), coef_precarite: coefPrec, categorie_menage: d.categorie_menage }
    },
  },

  'BAR-TH-174': {
    code: 'BAR-TH-174',
    label: 'PAC air/eau individuelle — Maison / Appartement',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/eau individuelle en résidentiel existant (> 2 ans). Fiche mise à jour par arrêté du 7 janvier 2026 — résidences secondaires exclues.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) — efficacité saisonnière", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'energie_remplacee', label: 'Énergie remplacée', type: 'select',
        options: [
          { value: 'fioul', label: 'Fioul' },
          { value: 'gaz', label: 'Gaz' },
          { value: 'charbon', label: 'Charbon' },
          { value: 'electricite', label: 'Électricité (coef 1,9 depuis arrêté 7 jan 2026)' },
        ], required: true },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance thermique nominale (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R32' },
      { key: 'residence_principale', label: 'Résidence principale (obligatoire — RS exclues)', type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
      { key: 'installateur_rge_qualipac', label: 'Installateur RGE QualiPAC', type: 'checkbox' },
    ],
    compute: (d) => {
      const type = d.type_logement
      const zone = d.zone_climatique
      const etas = Number(d.etas_percent) || 0
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!type || !zone || !etas || !surface) return null
      const palier = etas >= 126 ? 126 : 111
      let tranche
      if (type === 'maison') {
        tranche = surface < 70 ? '<70' : surface <= 90 ? '70-90' : '>90'
      } else {
        tranche = surface < 35 ? '<35' : surface <= 60 ? '35-60' : '>60'
      }
      let cumac = BAR_TH_174_TABLE[type]?.[palier]?.[zone]?.[tranche] || 0
      // Coef électricité 1,9 (arrêté 7 jan 2026, ex-2,3)
      if (d.energie_remplacee === 'electricite') cumac = Math.round(cumac * 1.9 / 2.3)
      const coef = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coef),
        palier_etas: palier,
        tranche_surface: tranche,
        coef_precarite: coef,
        categorie_menage: d.categorie_menage,
        energie_remplacee: d.energie_remplacee,
      }
    },
  },

  'BAR-TH-179': {
    code: 'BAR-TH-179',
    label: 'PAC collective — Copropriété / logement collectif',
    secteur: 'collectif',
    description: "Installation d'une pompe à chaleur collective sur boucle d'eau chaude en copropriété ou logement collectif existant.",
    fields: [
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'nb_logements', label: 'Nombre de logements desservis', type: 'number', required: true, min: 2 },
      { key: 'surface_totale_m2', label: 'Surface totale chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) — efficacité saisonnière", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'energie_remplacee', label: 'Énergie remplacée', type: 'select',
        options: [
          { value: 'fioul', label: 'Fioul' },
          { value: 'gaz', label: 'Gaz' },
          { value: 'charbon', label: 'Charbon' },
          { value: 'electricite', label: 'Électricité' },
        ], required: true },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance thermique nominale (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R32' },
      { key: 'av_syndic', label: "Accord de l'AG / syndic obtenu", type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const s = Number(d.surface_totale_m2) || 0
      const etas = Number(d.etas_percent) || 0
      if (!zone || !s || !etas) return null
      const coef = BAR_TH_179_COEFS[zone] || 0
      // Bonus ETAS ≥ 126
      const mult = etas >= 126 ? 1.25 : 1
      let cumac = coef * s * mult
      // Coef électricité
      if (d.energie_remplacee === 'electricite') cumac = cumac * 1.9 / 2.3
      return {
        kwh_cumac: Math.round(cumac),
        coef_zone: coef,
        palier_etas: etas >= 126 ? 126 : 111,
        nb_logements: Number(d.nb_logements) || 0,
        energie_remplacee: d.energie_remplacee,
      }
    },
  },

  'BAR-EQ-117': {
    code: 'BAR-EQ-117',
    label: 'Borne de recharge IRVE résidentielle',
    secteur: 'residentiel',
    description: "Installation d'une borne de recharge pour véhicule électrique en résidentiel.",
    fields: [
      { key: 'nb_bornes', label: 'Nombre de bornes', type: 'number', required: true, min: 1 },
      { key: 'puissance_kw', label: 'Puissance par borne (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'installateur_irve', label: 'Installateur qualifié IRVE', type: 'checkbox' },
      { key: 'pilotage_energetique', label: 'Pilotage énergétique', type: 'checkbox' },
    ],
    compute: (d) => {
      // Forfait indicatif par borne
      const nb = Number(d.nb_bornes) || 0
      return { kwh_cumac: nb * 7400 }
    },
  },
}

// ==========================================================
// Helpers
// ==========================================================
export function getFiche(code) {
  return FICHES[code] || null
}

export function listFiches() {
  return Object.values(FICHES)
}

export function computeCumac(code, data) {
  const f = getFiche(code)
  if (!f || !f.compute) return null
  return f.compute(data || {})
}

// Délégataires CEE majeurs en France
export const DELEGATAIRES_CEE = [
  'TotalEnergies',
  'EDF',
  'Engie',
  'Geo France Finance',
  'Hellio',
  'Leclerc',
  'Capital Energy',
  'Vol-V',
  'Economie d\'Énergie (EDE)',
  'Sonergia',
  'Effy',
  'GreenYellow',
  'BHC Energy',
  'Certinergy',
  'Autre',
]

// ==========================================================
// Alertes de validité (12 mois après date de facture)
// ==========================================================
export function computeExpiryStatus(dateFacture) {
  if (!dateFacture) return { status: 'unknown', daysLeft: null, expiryDate: null }
  const facture = new Date(dateFacture)
  const expiry = new Date(facture)
  expiry.setMonth(expiry.getMonth() + CEE_VALIDITY_MONTHS)
  const now = new Date()
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))

  let status = 'ok'
  if (daysLeft < 0) status = 'expired'
  else if (daysLeft <= 30) status = 'critical'
  else if (daysLeft <= 90) status = 'warning'

  return { status, daysLeft, expiryDate: expiry }
}

export function formatExpiryLabel(dateFacture) {
  const { status, daysLeft } = computeExpiryStatus(dateFacture)
  if (status === 'unknown') return null
  if (status === 'expired') return `Expiré depuis ${Math.abs(daysLeft)}j`
  if (status === 'critical') return `Expire dans ${daysLeft}j`
  if (status === 'warning') return `Expire dans ${daysLeft}j`
  return `Valide ${daysLeft}j`
}

// ======================================================
// EXTENSIONS - Prime, Conformité, CSV
// ======================================================

export const PRIX_KWH_CUMAC_PAR_DELEGATAIRE = {
  'TotalEnergies': 0.0075,
  'EDF': 0.0072,
  'Engie': 0.0070,
  'Hellio': 0.0080,
  'Effy': 0.0078,
  'Sonergia': 0.0074,
  'GEO PLC': 0.0073,
  'Geo France Finance': 0.0073,
  'Leclerc': 0.0068,
  'Capital Energy': 0.0076,
  'Vol-V': 0.0070,
  "Economie d'\u00c9nergie (EDE)": 0.0074,
  'GreenYellow': 0.0072,
  'BHC Energy': 0.0075,
  'Certinergy': 0.0073,
  'Autre': 0.0072,
}

export const PRIX_KWH_CUMAC_DEFAULT = 0.0072

export function estimatePrime(kwh_cumac, delegataire) {
  if (!kwh_cumac) return 0
  const prix = PRIX_KWH_CUMAC_PAR_DELEGATAIRE[delegataire] ?? PRIX_KWH_CUMAC_DEFAULT
  return Math.round(kwh_cumac * prix * 100) / 100
}

export function checkConformity(fiche_code, data) {
  const issues = []
  if (!fiche_code || !data) return issues
  const d = data

  if (fiche_code === 'BAT-EQ-127') {
    if (d.flux_lumineux_lm && Number(d.flux_lumineux_lm) < 3000)
      issues.push({ level: 'error', field: 'flux_lumineux_lm', message: 'Flux lumineux < 3000 lm (non \u00e9ligible)' })
    if (d.efficacite_lm_w && Number(d.efficacite_lm_w) < 90)
      issues.push({ level: 'error', field: 'efficacite_lm_w', message: 'Efficacit\u00e9 < 90 lm/W (non \u00e9ligible)' })
    if (d.duree_vie_h && Number(d.duree_vie_h) < 35000)
      issues.push({ level: 'error', field: 'duree_vie_h', message: 'Dur\u00e9e de vie < 35 000 h (non \u00e9ligible)' })
    if (d.facteur_puissance && Number(d.facteur_puissance) <= 0.9)
      issues.push({ level: 'error', field: 'facteur_puissance', message: 'Facteur de puissance \u2264 0,9 (non \u00e9ligible)' })
    if (d.thd_percent && Number(d.thd_percent) >= 25)
      issues.push({ level: 'error', field: 'thd_percent', message: 'THD \u2265 25% (non \u00e9ligible)' })
    if (d.groupe_risque && d.groupe_risque !== '0' && d.groupe_risque !== '1')
      issues.push({ level: 'warning', field: 'groupe_risque', message: 'Groupe de risque photobiologique doit \u00eatre 0 ou 1' })
  }

  if (fiche_code === 'BAR-TH-171') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non \u00e9ligible)' })
    if (d.residence_principale === false)
      issues.push({ level: 'warning', field: 'residence_principale', message: 'Non r\u00e9sidence principale : v\u00e9rifier \u00e9ligibilit\u00e9' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'B\u00e2timent < 2 ans (non \u00e9ligible \u00e0 BAR-TH-171)' })
  }

  if (fiche_code === 'BAR-TH-129') {
    if (d.scop && Number(d.scop) < 3.9)
      issues.push({ level: 'error', field: 'scop', message: 'SCOP < 3,9 (non \u00e9ligible)' })
  }

  if (fiche_code === 'BAR-TH-174') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non \u00e9ligible)' })
    if (d.residence_principale === false)
      issues.push({ level: 'error', field: 'residence_principale', message: 'R\u00e9sidences secondaires exclues depuis arr\u00eat\u00e9 7 jan 2026' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'B\u00e2timent < 2 ans (non \u00e9ligible)' })
    if (d.installateur_rge_qualipac === false)
      issues.push({ level: 'warning', field: 'installateur_rge_qualipac', message: 'Installateur RGE QualiPAC requis pour PAC air/eau' })
  }

  if (fiche_code === 'BAR-TH-179') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non \u00e9ligible)' })
    if (d.av_syndic === false)
      issues.push({ level: 'warning', field: 'av_syndic', message: 'Accord AG/syndic requis pour op\u00e9ration en copropri\u00e9t\u00e9' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'B\u00e2timent < 2 ans (non \u00e9ligible)' })
    if (d.nb_logements && Number(d.nb_logements) < 2)
      issues.push({ level: 'error', field: 'nb_logements', message: 'Au moins 2 logements requis pour op\u00e9ration collective' })
  }

  if (fiche_code === 'BAR-EN-101') {
    if (d.resistance_thermique && Number(d.resistance_thermique) < 7)
      issues.push({ level: 'error', field: 'resistance_thermique', message: 'R < 7 m\u00b2.K/W (non \u00e9ligible)' })
  }

  const f = FICHES[fiche_code]
  if (f) {
    f.fields.forEach(field => {
      if (field.required && (d[field.key] === undefined || d[field.key] === '' || d[field.key] === null)) {
        issues.push({ level: 'warning', field: field.key, message: `Champ requis manquant : ${field.label}` })
      }
    })
  }

  return issues
}

export function exportDossierCSV(dossier) {
  const rows = []
  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v).replace(/"/g, '""')
    return /[",;\n]/.test(s) ? `"${s}"` : s
  }
  const add = (k, v) => rows.push([esc(k), esc(v)].join(';'))

  const c = dossier.chantier || {}
  const d = dossier.donnees_techniques || {}

  add('Champ', 'Valeur')
  add('R\u00e9f\u00e9rence dossier', dossier.reference_externe || dossier.id)
  add('Statut', dossier.statut)
  add('D\u00e9l\u00e9gataire', dossier.delegataire || '')
  add('R\u00e9f\u00e9rence d\u00e9l\u00e9gataire', dossier.reference_delegataire || '')
  add('Fiche FOS', dossier.fiche_code || '')
  add('Zone climatique', dossier.zone_climatique || '')
  add('kWh cumac', dossier.kwh_cumac || '')
  add('Prime estim\u00e9e (\u20ac)', dossier.montant_prime_estime || '')
  add('Prime re\u00e7ue (\u20ac)', dossier.montant_prime_recu || '')
  add('Date accord pr\u00e9alable', dossier.date_accord_prealable || '')
  add('Date facture', dossier.date_facture || '')
  add('Date d\u00e9p\u00f4t d\u00e9l\u00e9gataire', dossier.date_depot_delegataire || '')
  add('Date envoi', dossier.date_envoi || '')
  add('Date validation', dossier.date_validation || '')
  add('Client', c.client_name || '')
  add('Adresse', c.adresse || '')
  add('Email client', c.client_email || '')
  add('T\u00e9l\u00e9phone client', c.client_phone || '')
  Object.entries(d).forEach(([k, v]) => add(`tech.${k}`, v))

  return '\uFEFF' + rows.join('\n')
}

export function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
