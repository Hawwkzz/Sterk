// Définitions des Fiches d'Opérations Standardisées (FOS) CEE
// Sources: arrêtés officiels du Ministère de la Transition Écologique
// ⚠️  Corrigé avril 2026 — valeurs vérifiées contre les fiches officielles publiées sur ecologie.gouv.fr

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
// Source : fiche officielle ecologie.gouv.fr (vérifiée avril 2026)
// Formule : Montant = Base_kWhc × Facteur_Surface × Facteur_Zone
// Paliers ETAS : 111% (basse) et 140% (haute)  —  PAS 126% !
// Durée de vie conventionnelle : 17 ans
const BAR_TH_171 = {
  bases: {
    appartement: { 111: 48700, 140: 58900 },
    maison:      { 111: 90900, 140: 109200 },
  },
  surfaceFactors: {
    appartement: [
      { max: 35, factor: 0.5 },  // S < 35
      { max: 60, factor: 0.7 },  // 35 ≤ S < 60
      { max: Infinity, factor: 1 }, // S ≥ 60
    ],
    maison: [
      { max: 70, factor: 0.5 },  // S < 70
      { max: 90, factor: 0.7 },  // 70 ≤ S < 90
      { max: Infinity, factor: 1 }, // S ≥ 90
    ],
  },
  zoneFactors: { H1: 1.2, H2: 1, H3: 0.7 },
}

function getSurfaceFactor171(type, surface) {
  const brackets = BAR_TH_171.surfaceFactors[type]
  if (!brackets) return 1
  for (const b of brackets) {
    if (surface < b.max) return b.factor
  }
  return 1
}

// ==========================================================
// BAR-TH-129 — PAC air/air résidentiel
// ==========================================================
// Source : fiche officielle ADEME (calculateur-cee.ademe.fr)
// Montants FIXES par type de logement, SCOP et zone climatique
// PAS de formule coefficient × surface !
const BAR_TH_129_TABLE = {
  appartement: {
    // SCOP ≥ 3.9 (un seul palier pour appartements)
    H1: 21300,
    H2: 17400,
    H3: 11600,
  },
  maison_scop_39: {
    // Maison individuelle, SCOP 3.9 à 4.3
    H1: 77900,
    H2: 63700,
    H3: 42500,
  },
  maison_scop_43: {
    // Maison individuelle, SCOP ≥ 4.3
    H1: 80200,
    H2: 65600,
    H3: 43700,
  },
}

// ==========================================================
// BAR-TH-174 — Rénovation d'ampleur d'une maison individuelle
// ==========================================================
// Source : fiche officielle BAR-TH-174 vA80-3 (17/01/2026), ecologie.gouv.fr
// ⚠️  CE N'EST PAS une fiche PAC ! C'est une rénovation globale basée sur les sauts de classe DPE.
// Formule : Montant = Base_kWhc(nb_sauts) × Facteur_Surface(S_hab)
// Durée de vie conventionnelle : 30 ans
// Pas de facteur zone climatique
const BAR_TH_174 = {
  bases: {
    2: 360200,   // 2 sauts de classe DPE
    3: 447900,   // 3 sauts de classe DPE
    4: 568600,   // 4 sauts ou plus
  },
  surfaceFactors: [
    { max: 35,  factor: 0.4 },   // S_hab < 35 m²
    { max: 60,  factor: 0.5 },   // 35 ≤ S_hab < 60
    { max: 90,  factor: 0.8 },   // 60 ≤ S_hab < 90
    { max: 110, factor: 1 },     // 90 ≤ S_hab < 110
    { max: 131, factor: 1.2 },   // 110 ≤ S_hab ≤ 130
    { max: Infinity, factor: 1.3 }, // S_hab > 130
  ],
}

function getSurfaceFactor174(surface) {
  for (const b of BAR_TH_174.surfaceFactors) {
    if (surface < b.max) return b.factor
  }
  return 1.3
}

// ==========================================================
// BAR-TH-143 — Système solaire combiné (chauffage + ECS)
// ==========================================================
// Source : fiche officielle (opera-energie.com, vérifiée)
// Montants FIXES par zone climatique — PAS une formule dynamique
const BAR_TH_143_TABLE = {
  H1: 134800,
  H2: 121000,
  H3: 100500,
}

// ==========================================================
// BAR-TH-179 — PAC collective (logement collectif / copropriété)
// ==========================================================
// Source : fiche officielle BAR-TH-179 vA75-1 (01/01/2026)
// ⚠️  Valeurs indicatives — la fiche officielle a une structure complexe
//     dépendant du nombre de logements, ETAS et type de couverture.
//     Les coefficients ci-dessous sont une approximation par m² de surface chauffée.
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
    description: "Installation d'une pompe à chaleur air/eau dans un bâtiment résidentiel existant (> 2 ans). Formule : Base × Facteur_Surface × Facteur_Zone. Paliers ETAS : 111% et 140%.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) — efficacité saisonnière ≥ 111%", type: 'number', required: true, min: 111, step: 0.1 },
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
      if (!type || !zone || etas < 111 || !surface) return null

      // Palier ETAS : 111-140% (basse) ou ≥140% (haute)
      const palier = etas >= 140 ? 140 : 111
      const base = BAR_TH_171.bases[type]?.[palier] || 0
      const surfFactor = getSurfaceFactor171(type, surface)
      const zoneFactor = BAR_TH_171.zoneFactors[zone] || 1
      const cumac = base * surfFactor * zoneFactor

      const coef = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coef),
        base_kwhc: base,
        facteur_surface: surfFactor,
        facteur_zone: zoneFactor,
        palier_etas: palier,
        coef_precarite: coef,
        categorie_menage: d.categorie_menage,
      }
    },
  },

  'BAR-TH-129': {
    code: 'BAR-TH-129',
    label: 'PAC air/air — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une pompe à chaleur air/air en résidentiel existant. Montants fixes par type de logement et zone climatique. SCOP minimum 3,9. Puissance max 12 kW.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'scop', label: 'SCOP ≥ 3,9', type: 'number', required: true, step: 0.01, min: 3.9 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance nominale (kW) ≤ 12', type: 'number', required: true, step: 0.1, max: 12 },
      { key: 'seer', label: 'SEER', type: 'number', step: 0.01 },
    ],
    compute: (d) => {
      const type = d.type_logement
      const zone = d.zone_climatique
      const scop = Number(d.scop) || 0
      if (!type || !zone || scop < 3.9) return null

      let cumac = 0
      if (type === 'appartement') {
        cumac = BAR_TH_129_TABLE.appartement[zone] || 0
      } else {
        // Maison : palier SCOP
        const key = scop >= 4.3 ? 'maison_scop_43' : 'maison_scop_39'
        cumac = BAR_TH_129_TABLE[key][zone] || 0
      }

      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coefPrec),
        montant_base: cumac,
        palier_scop: type === 'maison' ? (scop >= 4.3 ? '≥4.3' : '3.9-4.3') : '≥3.9',
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
      }
    },
  },

  'BAR-EN-101': {
    code: 'BAR-EN-101',
    label: 'Isolation combles / toitures',
    secteur: 'residentiel',
    description: "Isolation de combles perdus ou rampants de toiture dans un bâtiment résidentiel. R ≥ 7 m².K/W.",
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
      // Coefficients officiels kWh cumac / m² (maison individuelle)
      const coefs = { H1: 1700, H2: 1400, H3: 900 }
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round((coefs[zone] || 0) * s * coefPrec),
        coef_zone: coefs[zone],
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
      }
    },
  },

  'BAR-TH-143': {
    code: 'BAR-TH-143',
    label: 'Système solaire combiné',
    secteur: 'residentiel',
    description: "Installation d'un système solaire combiné (chauffage + eau chaude sanitaire) en résidentiel existant. Montants fixes par zone climatique.",
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
      const zone = d.zone_climatique
      if (!zone) return null
      // Montants fixes par zone — source fiche officielle BAR-TH-143
      const cumac = BAR_TH_143_TABLE[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coefPrec),
        montant_base: cumac,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
      }
    },
  },

  'BAR-TH-174': {
    code: 'BAR-TH-174',
    label: 'Rénovation d\'ampleur — Maison individuelle',
    secteur: 'residentiel',
    description: "Rénovation thermique d'ampleur d'une maison individuelle existante (France métropolitaine). Basée sur le nombre de sauts de classe DPE. Audit énergétique obligatoire. Au moins 2 postes d'enveloppe requis. Durée de vie : 30 ans. Fiche vA80-3 du 17/01/2026.",
    fields: [
      { key: 'nb_sauts_classe', label: 'Nombre de sauts de classe DPE', type: 'select',
        options: [
          { value: '2', label: '2 sauts de classe' },
          { value: '3', label: '3 sauts de classe' },
          { value: '4', label: '4 sauts ou plus' },
        ], required: true },
      { key: 'classe_avant', label: 'Classe DPE avant travaux', type: 'select',
        options: [
          { value: 'G', label: 'G' },
          { value: 'F', label: 'F' },
          { value: 'E', label: 'E' },
          { value: 'D', label: 'D' },
        ], required: true },
      { key: 'classe_apres', label: 'Classe DPE après travaux', type: 'select',
        options: [
          { value: 'A', label: 'A' },
          { value: 'B', label: 'B' },
          { value: 'C', label: 'C' },
          { value: 'D', label: 'D' },
          { value: 'E', label: 'E' },
        ], required: true },
      { key: 'surface_habitable_m2', label: 'Surface habitable (m²)', type: 'number', required: true, min: 1 },
      { key: 'audit_energetique', label: 'Audit énergétique réalisé', type: 'checkbox' },
      { key: 'nb_postes_enveloppe', label: "Nombre de postes d'enveloppe traités (min 2 sur 4)", type: 'select',
        options: [
          { value: '2', label: '2 postes' },
          { value: '3', label: '3 postes' },
          { value: '4', label: '4 postes' },
        ], required: true },
      { key: 'postes_enveloppe', label: 'Postes traités', type: 'text', required: true,
        placeholder: 'ex: murs + combles + fenêtres' },
      { key: 'cep_initial', label: 'Cep initial (kWh/m².an)', type: 'number', step: 0.1 },
      { key: 'cep_projet', label: 'Cep projet (kWh/m².an)', type: 'number', step: 0.1 },
    ],
    compute: (d) => {
      const sauts = Number(d.nb_sauts_classe) || 0
      const surface = Number(d.surface_habitable_m2) || 0
      if (sauts < 2 || !surface) return null

      // Montant unitaire par nombre de sauts
      const sautKey = sauts >= 4 ? 4 : sauts
      const base = BAR_TH_174.bases[sautKey] || 0

      // Facteur correctif surface habitable
      const surfFactor = getSurfaceFactor174(surface)

      const cumac = base * surfFactor
      return {
        kwh_cumac: Math.round(cumac),
        base_kwhc: base,
        facteur_surface: surfFactor,
        nb_sauts: sauts,
        classe_avant: d.classe_avant,
        classe_apres: d.classe_apres,
        duree_vie_ans: 30,
      }
    },
  },

  'BAR-TH-179': {
    code: 'BAR-TH-179',
    label: 'PAC collective — Copropriété / logement collectif',
    secteur: 'collectif',
    description: "Installation d'une pompe à chaleur collective sur boucle d'eau chaude en copropriété ou logement collectif existant. ⚠️ Coefficients approximatifs — consulter la fiche officielle pour les cas complexes.",
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

  // ⚠️ BAR-EQ-117 SUPPRIMÉ — cette fiche n'existe PAS dans le dispositif CEE.
  // Il n'y a pas de fiche CEE résidentielle pour les bornes IRVE.
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
      issues.push({ level: 'error', field: 'flux_lumineux_lm', message: 'Flux lumineux < 3000 lm (non éligible)' })
    if (d.efficacite_lm_w && Number(d.efficacite_lm_w) < 90)
      issues.push({ level: 'error', field: 'efficacite_lm_w', message: 'Efficacité < 90 lm/W (non éligible)' })
    if (d.duree_vie_h && Number(d.duree_vie_h) < 35000)
      issues.push({ level: 'error', field: 'duree_vie_h', message: 'Durée de vie < 35 000 h (non éligible)' })
    if (d.facteur_puissance && Number(d.facteur_puissance) <= 0.9)
      issues.push({ level: 'error', field: 'facteur_puissance', message: 'Facteur de puissance ≤ 0,9 (non éligible)' })
    if (d.thd_percent && Number(d.thd_percent) >= 25)
      issues.push({ level: 'error', field: 'thd_percent', message: 'THD ≥ 25% (non éligible)' })
    if (d.groupe_risque && d.groupe_risque !== '0' && d.groupe_risque !== '1')
      issues.push({ level: 'warning', field: 'groupe_risque', message: 'Groupe de risque photobiologique doit être 0 ou 1' })
  }

  if (fiche_code === 'BAR-TH-171') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non éligible)' })
    if (d.residence_principale === false)
      issues.push({ level: 'warning', field: 'residence_principale', message: 'Non résidence principale : vérifier éligibilité' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'Bâtiment < 2 ans (non éligible à BAR-TH-171)' })
  }

  if (fiche_code === 'BAR-TH-129') {
    if (d.scop && Number(d.scop) < 3.9)
      issues.push({ level: 'error', field: 'scop', message: 'SCOP < 3,9 (non éligible)' })
    if (d.puissance_kw && Number(d.puissance_kw) > 12)
      issues.push({ level: 'error', field: 'puissance_kw', message: 'Puissance > 12 kW (non éligible BAR-TH-129)' })
  }

  if (fiche_code === 'BAR-TH-174') {
    if (d.nb_sauts_classe && Number(d.nb_sauts_classe) < 2)
      issues.push({ level: 'error', field: 'nb_sauts_classe', message: 'Minimum 2 sauts de classe DPE requis' })
    if (d.audit_energetique === false)
      issues.push({ level: 'error', field: 'audit_energetique', message: 'Audit énergétique obligatoire pour BAR-TH-174' })
    if (d.nb_postes_enveloppe && Number(d.nb_postes_enveloppe) < 2)
      issues.push({ level: 'error', field: 'nb_postes_enveloppe', message: "Au moins 2 postes d'enveloppe requis (sur 4 : murs, planchers bas, toiture, fenêtres)" })
  }

  if (fiche_code === 'BAR-TH-179') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non éligible)' })
    if (d.av_syndic === false)
      issues.push({ level: 'warning', field: 'av_syndic', message: 'Accord AG/syndic requis pour opération en copropriété' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'Bâtiment < 2 ans (non éligible)' })
    if (d.nb_logements && Number(d.nb_logements) < 2)
      issues.push({ level: 'error', field: 'nb_logements', message: 'Au moins 2 logements requis pour opération collective' })
  }

  if (fiche_code === 'BAR-EN-101') {
    if (d.resistance_thermique && Number(d.resistance_thermique) < 7)
      issues.push({ level: 'error', field: 'resistance_thermique', message: 'R < 7 m².K/W (non éligible)' })
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

// ==========================================================
// Export CSV délégataire
// ==========================================================
// Le CSV délégataire permet d'exporter les données d'un dossier CEE
// dans un format tabulaire (point-virgule) compatible Excel, pour
// transmission au délégataire (TotalEnergies, Hellio, etc.) qui
// rachète les certificats. C'est le fichier qu'on joint quand on
// dépose le dossier chez le délégataire.
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
  add('Référence dossier', dossier.reference_externe || dossier.id)
  add('Statut', dossier.statut)
  add('Délégataire', dossier.delegataire || '')
  add('Référence délégataire', dossier.reference_delegataire || '')
  add('Fiche FOS', dossier.fiche_code || '')
  add('Zone climatique', dossier.zone_climatique || '')
  add('kWh cumac', dossier.kwh_cumac || '')
  add('Prime estimée (€)', dossier.montant_prime_estime || '')
  add('Prime reçue (€)', dossier.montant_prime_recu || '')
  add('Date accord préalable', dossier.date_accord_prealable || '')
  add('Date facture', dossier.date_facture || '')
  add('Date dépôt délégataire', dossier.date_depot_delegataire || '')
  add('Date envoi', dossier.date_envoi || '')
  add('Date validation', dossier.date_validation || '')
  add('Client', c.client_name || '')
  add('Adresse', c.adresse || '')
  add('Email client', c.client_email || '')
  add('Téléphone client', c.client_phone || '')
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
