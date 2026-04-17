// Définitions des Fiches d'Opérations Standardisées (FOS) CEE
// Sources: arrêtés officiels du Ministère de la Transition Écologique
// Corrigé avril 2026 — TOUTES les valeurs vérifiées contre les fiches officielles ecologie.gouv.fr
// et les arrêtés publiés au JORF / Légifrance

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
// BAR-TH-171 — PAC air/eau résidentiel
// ==========================================================
// Source : fiche officielle ecologie.gouv.fr (vérifiée avril 2026)
// Formule : Montant = Base_kWhc × Facteur_Surface × Facteur_Zone
// Paliers ETAS : 111% (basse) et 140% (haute)
// Durée de vie conventionnelle : 17 ans
const BAR_TH_171 = {
  bases: {
    appartement: { 111: 48700, 140: 58900 },
    maison:      { 111: 90900, 140: 109200 },
  },
  surfaceFactors: {
    appartement: [
      { max: 35, factor: 0.5 },     // S < 35
      { max: 60, factor: 0.7 },     // 35 ≤ S < 60
      { max: Infinity, factor: 1 }, // S ≥ 60
    ],
    maison: [
      { max: 70, factor: 0.5 },     // S < 70
      { max: 90, factor: 0.7 },     // 70 ≤ S < 90
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
// Source : fiche officielle ADEME (calculateur-cee.ademe.fr), Hellio FAQ
// Montants FIXES par type de logement, SCOP et zone climatique
// Puissance nominale max 12 kW, SCOP min 3.9
const BAR_TH_129_TABLE = {
  appartement: {
    // SCOP ≥ 3.9 (un seul palier pour appartements)
    H1: 21300,
    H2: 17400,
    H3: 11600,
  },
  maison_scop_39: {
    // Maison individuelle, 3.9 ≤ SCOP < 4.3
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
// BAR-TH-172 — PAC eau/eau ou eau glycolée/eau (géothermique) — Maisons individuelles
// ==========================================================
// Source : fiche officielle BAR-TH-172 vA78.4 (01/01/2026), ecologie.gouv.fr
// PDF vérifié page 3 — table "5. Montant de certificats en kWh cumac"
// Formule : Montant = Base_kWhc × Facteur_Surface × Facteur_Zone
// Secteur : maisons individuelles existantes UNIQUEMENT (pas d'appartements)
// ETAS min : 126% basse temp, 111% moyenne/haute temp
// Non cumulable : BAR-TH-101, BAR-TH-124, BAR-TH-143, BAR-TH-148, BAR-TH-168
// Durée de vie conventionnelle : 20 ans
const BAR_TH_172 = {
  bases: { 111: 101400, 170: 119400 },
  surfaceFactors: [
    { max: 70, factor: 0.5 },     // S < 70
    { max: 90, factor: 0.7 },     // 70 ≤ S < 90
    { max: Infinity, factor: 1 }, // S ≥ 90
  ],
  zoneFactors: { H1: 1.2, H2: 1, H3: 0.7 },
}

function getSurfaceFactor172(surface) {
  for (const b of BAR_TH_172.surfaceFactors) {
    if (surface < b.max) return b.factor
  }
  return 1
}

// ==========================================================
// BAR-TH-148 — Chauffe-eau thermodynamique résidentiel
// ==========================================================
// Source : fiche officielle BAR-TH-148 vA73-3 (01/11/2025)
// Montants FIXES par type de logement et zone climatique
// COP min : > 2.4 (ou > 2.5 pour air extrait/VMC)
// Non cumulable avec BAR-TH-171 et BAR-TH-172 depuis le 01/11/2025
// Durée de vie conventionnelle : 17 ans
const BAR_TH_148_TABLE = {
  maison:      { H1: 10500, H2: 9300, H3: 6200 },
  appartement: { H1: 6700,  H2: 5900, H3: 3900 },
}

// ==========================================================
// BAR-EN-102 — Isolation des murs (résidentiel)
// ==========================================================
// Source : fiche officielle BAR-EN-102 vA65-4 (01/01/2025)
// Coefficients kWh cumac par m² isolé
// Distinction par énergie de chauffage (électricité vs combustibles)
// R ≥ 3.7 m².K/W (intérieur et extérieur)
// Durée de vie conventionnelle : 30 ans
const BAR_EN_102_COEFS = {
  electricite:  { H1: 2400, H2: 2000, H3: 1300 },
  combustibles: { H1: 3800, H2: 3100, H3: 2100 },
}

// ==========================================================
// BAR-EN-103 — Isolation plancher bas (résidentiel)
// ==========================================================
// Source : fiche officielle BAR-EN-103 vA64-6 (01/01/2025)
// Coefficients kWh cumac par m² isolé
// R ≥ 3 m².K/W
// Durée de vie conventionnelle : 20 ans
// ⚠️ Fiche abrogée au 01/05/2027
const BAR_EN_103_COEFS = { H1: 1600, H2: 1300, H3: 900 }

// ==========================================================
// BAR-EN-104 — Fenêtres / portes-fenêtres (résidentiel)
// ==========================================================
// Source : fiche officielle BAR-EN-104 vA54-2 (01/01/2024)
// Coefficients kWh cumac par m² de fenêtre
// Uw ≤ 1.5 W/m².K
// Durée de vie conventionnelle : 30 ans
const BAR_EN_104_COEFS = { H1: 3800, H2: 3100, H3: 2100 }

// ==========================================================
// BAR-TH-174 — Rénovation d'ampleur d'une maison individuelle
// ==========================================================
// Source : fiche officielle BAR-TH-174 vA80-3 (17/01/2026), ecologie.gouv.fr
// PDF vérifié page 4 — table "5. Montant de certificats en kWh cumac"
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
    { max: 35,  factor: 0.4 },      // S_hab < 35 m²
    { max: 60,  factor: 0.5 },      // 35 ≤ S_hab < 60
    { max: 90,  factor: 0.8 },      // 60 ≤ S_hab < 90
    { max: 110, factor: 1 },        // 90 ≤ S_hab < 110
    { max: 131, factor: 1.2 },      // 110 ≤ S_hab ≤ 130
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
// Source : fiche officielle BAR-TH-143 vA79-6 (01/01/2026)
// Montants FIXES par zone climatique, par installation
// Conditions : surface capteurs ≥ 8 m², productivité ≥ 600 W/m²,
//              stockage > 400 L, certification Solar Keymark / CSTBat
// Durée de vie conventionnelle : 20 ans
const BAR_TH_143_TABLE = {
  H1: 134800,
  H2: 121000,
  H3: 100500,
}

// ==========================================================
// BAR-TH-179 — PAC collective air/eau (copropriété / collectif)
// ==========================================================
// Source : fiche officielle BAR-TH-179 vA75-1 (01/01/2026)
// Arrêté du 6 septembre 2025 (JORF)
// Formule : Montant = Base_par_logement(ETAS, zone, usage) × N_logements × R
// R = facteur de correction si PAC < 40% puissance chaufferie → R = P_pac / P_chaufferie
// R = 1 sinon
// Bonus Coup de Pouce ×3 si remplacement chaudière fossile
// Durée de vie conventionnelle : 22 ans
// Puissance PAC max : 400 kW
const BAR_TH_179_TABLE = {
  // Usage : chauffage seul — kWh cumac PAR LOGEMENT
  chauffage: {
    // ETAS 111% à 126%
    111: { H1: 100000, H2: 84000, H3: 60000 },
    // ETAS 126% à 150%
    126: { H1: 107000, H2: 89000, H3: 64000 },
    // ETAS 150% à 175%
    150: { H1: 112000, H2: 93000, H3: 67000 },
    // ETAS 175% à 190%
    175: { H1: 115000, H2: 96000, H3: 69000 },
    // ETAS ≥ 190%
    190: { H1: 117000, H2: 97000, H3: 70000 },
  },
  // Usage : chauffage + ECS — kWh cumac PAR LOGEMENT
  chauffage_ecs: {
    111: { H1: 146000, H2: 127000, H3: 100000 },
    126: { H1: 155000, H2: 135000, H3: 107000 },
    150: { H1: 163000, H2: 142000, H3: 112000 },
    175: { H1: 167000, H2: 146000, H3: 115000 },
    190: { H1: 170000, H2: 148000, H3: 117000 },
  },
}

function getEtasPalier179(etas) {
  if (etas >= 190) return 190
  if (etas >= 175) return 175
  if (etas >= 150) return 150
  if (etas >= 126) return 126
  return 111
}


// ==========================================================
// BAR-EN-101 — Isolation combles / toitures
// ==========================================================
// Source : fiche officielle
// Coefficients kWh cumac par m² isolé, maison individuelle
// R minimum ≥ 7 m².K/W
const BAR_EN_101_COEFS = { H1: 1700, H2: 1400, H3: 900 }


// ==========================================================
// Schémas de formulaire par fiche
// ==========================================================
export const FICHES = {
  // BAT-EQ-127 (LED tertiaire) — SUPPRIMÉE par arrêté du 23/02/2026 (JORF 24/02/2026).
  // Pas de fiche de remplacement. LED tertiaire n'est plus éligible au dispositif CEE.

  'BAR-TH-171': {
    code: 'BAR-TH-171',
    label: 'PAC air/eau — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une PAC air/eau en résidentiel existant (> 2 ans). Formule : Base × Facteur_Surface × Facteur_Zone. Paliers ETAS : 111% et 140%. Durée de vie : 17 ans.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) ≥ 111%", type: 'number', required: true, min: 111, step: 0.1 },
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
        duree_vie_ans: 17,
      }
    },
  },

  'BAR-TH-129': {
    code: 'BAR-TH-129',
    label: 'PAC air/air — Résidentiel',
    secteur: 'residentiel',
    description: "Installation d'une PAC air/air en résidentiel existant. Montants fixes par type de logement, SCOP et zone. SCOP min 3,9. Puissance max 12 kW.",
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
    description: "Isolation de combles perdus ou rampants de toiture en résidentiel. R ≥ 7 m².K/W. Coefficients : H1=1700, H2=1400, H3=900 kWh cumac/m².",
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
      const coef = BAR_EN_101_COEFS[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(coef * s * coefPrec),
        coef_zone: coef,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
      }
    },
  },

  'BAR-TH-143': {
    code: 'BAR-TH-143',
    label: 'Système solaire combiné',
    secteur: 'residentiel',
    description: "SSC (chauffage + ECS) en maison individuelle existante. Montants fixes par zone. Capteurs ≥ 8 m², productivité ≥ 600 W/m², stockage > 400 L. Certification Solar Keymark ou CSTBat. Durée de vie : 20 ans.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_capteurs_m2', label: 'Surface capteurs (m²) ≥ 8', type: 'number', required: true, step: 0.1, min: 8 },
      { key: 'productivite_w_m2', label: 'Productivité (W/m²) ≥ 600', type: 'number', required: true, min: 600 },
      { key: 'volume_stockage_l', label: 'Volume stockage (L) > 400', type: 'number', required: true, min: 401 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'certification', label: 'Certification (Solar Keymark, CSTBat...)', type: 'text', required: true },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      if (!zone) return null
      const surface = Number(d.surface_capteurs_m2) || 0
      const productivite = Number(d.productivite_w_m2) || 0
      const volume = Number(d.volume_stockage_l) || 0
      if (surface < 8 || productivite < 600 || volume <= 400) return null

      const cumac = BAR_TH_143_TABLE[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coefPrec),
        montant_base: cumac,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
        duree_vie_ans: 20,
      }
    },
  },

  'BAR-TH-174': {
    code: 'BAR-TH-174',
    label: 'Rénovation d\'ampleur — Maison individuelle',
    secteur: 'residentiel',
    description: "Rénovation thermique d'ampleur d'une maison individuelle (France métro). Sauts de classe DPE. Audit énergétique obligatoire. Min 2 postes d'enveloppe sur 4. Durée de vie : 30 ans. Fiche vA80-3 du 17/01/2026. Valide jusqu'au 31/12/2030.",
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
      { key: 'nb_postes_enveloppe', label: "Postes d'enveloppe traités (min 2/4)", type: 'select',
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

      const sautKey = sauts >= 4 ? 4 : sauts
      const base = BAR_TH_174.bases[sautKey] || 0
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
    description: "PAC collective air/eau en copropriété existante (> 2 ans). Formule : Base_par_logement(ETAS, zone, usage) × N_logements × R. 5 paliers ETAS. Puissance max 400 kW. Durée de vie : 22 ans. Fiche vA75-1 (01/01/2026).",
    fields: [
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'nb_logements', label: 'Nombre de logements desservis', type: 'number', required: true, min: 2 },
      { key: 'usage_pac', label: 'Usage de la PAC', type: 'select',
        options: [
          { value: 'chauffage', label: 'Chauffage seul' },
          { value: 'chauffage_ecs', label: 'Chauffage + Eau chaude sanitaire' },
        ], required: true },
      { key: 'etas_percent', label: "ETAS (%) ≥ 111%", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'puissance_pac_kw', label: 'Puissance PAC (kW) ≤ 400', type: 'number', required: true, step: 0.1, max: 400 },
      { key: 'puissance_chaufferie_kw', label: 'Puissance totale chaufferie (kW)', type: 'number', required: true, step: 0.1,
        placeholder: 'Puissance utile totale de la nouvelle chaufferie' },
      { key: 'energie_remplacee', label: 'Énergie remplacée', type: 'select',
        options: [
          { value: 'fioul', label: 'Fioul' },
          { value: 'gaz', label: 'Gaz' },
          { value: 'charbon', label: 'Charbon' },
          { value: 'electricite', label: 'Électricité' },
          { value: 'autre', label: 'Autre / Aucune' },
        ], required: true },
      { key: 'coup_de_pouce', label: 'Coup de Pouce Chauffage (remplace chaudière fossile)', type: 'checkbox' },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R32' },
      { key: 'av_syndic', label: "Accord de l'AG / syndic obtenu", type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const nb = Number(d.nb_logements) || 0
      const etas = Number(d.etas_percent) || 0
      const usage = d.usage_pac || 'chauffage'
      const pPac = Number(d.puissance_pac_kw) || 0
      const pChauff = Number(d.puissance_chaufferie_kw) || 0
      if (!zone || !nb || etas < 111 || !pPac) return null

      // Palier ETAS (5 paliers)
      const palier = getEtasPalier179(etas)
      const table = BAR_TH_179_TABLE[usage]
      if (!table) return null
      const base = table[palier]?.[zone] || 0

      // Facteur R : correction si PAC < 40% puissance chaufferie
      let R = 1
      if (pChauff > 0 && (pPac / pChauff) < 0.4) {
        R = pPac / pChauff
      }

      // Bonus Coup de Pouce ×3 si remplacement chaudière fossile
      const coupDePouce = d.coup_de_pouce && ['fioul', 'gaz', 'charbon'].includes(d.energie_remplacee) ? 3 : 1

      const cumac = base * nb * R * coupDePouce

      return {
        kwh_cumac: Math.round(cumac),
        base_par_logement: base,
        nb_logements: nb,
        facteur_R: Math.round(R * 1000) / 1000,
        palier_etas: palier,
        usage: usage,
        coup_de_pouce: coupDePouce,
        energie_remplacee: d.energie_remplacee,
        duree_vie_ans: 22,
      }
    },
  },

  'BAR-TH-172': {
    code: 'BAR-TH-172',
    label: 'PAC géothermique eau/eau — Maison individuelle',
    secteur: 'residentiel',
    description: "PAC eau/eau ou eau glycolée/eau en maison individuelle existante (> 2 ans). Formule : Base × Surface × Zone. Paliers ETAS : 111-170% et ≥170%. Non cumulable avec BAR-TH-148. Durée de vie : 20 ans. Fiche vA78.4 du 01/01/2026.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select',
        options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_chauffee_m2', label: 'Surface chauffée (m²)', type: 'number', required: true, min: 1 },
      { key: 'etas_percent', label: "ETAS (%) ≥ 111%", type: 'number', required: true, min: 111, step: 0.1 },
      { key: 'type_application', label: "Type d'application", type: 'select',
        options: [
          { value: 'basse_temp', label: 'Basse température (plancher chauffant, ETAS ≥ 126%)' },
          { value: 'moyenne_haute', label: 'Moyenne ou haute température (ETAS ≥ 111%)' },
        ], required: true },
      { key: 'type_captage', label: "Type d'eau dans le capteur", type: 'select',
        options: [
          { value: 'eau_nappe', label: 'Eau de nappe (eau souterraine)' },
          { value: 'eau_glycolee', label: 'Eau glycolée (sondes géothermiques)' },
        ], required: true },
      { key: 'usage_pac', label: 'Usage de la PAC', type: 'select',
        options: [
          { value: 'chauffage', label: 'Chauffage seul' },
          { value: 'chauffage_ecs', label: 'Chauffage + ECS' },
        ], required: true },
      { key: 'marque', label: 'Marque PAC', type: 'text', required: true },
      { key: 'reference', label: 'Référence PAC', type: 'text', required: true },
      { key: 'puissance_kw', label: 'Puissance thermique nominale (kW)', type: 'number', required: true, step: 0.1 },
      { key: 'cop', label: 'COP', type: 'number', required: true, step: 0.01 },
      { key: 'fluide_frigorigene', label: 'Fluide frigorigène', type: 'text', required: true, placeholder: 'ex: R410A' },
      { key: 'classe_regulateur', label: 'Classe du régulateur (IV à VIII)', type: 'text', required: true },
      { key: 'note_dimensionnement', label: 'Note de dimensionnement remise', type: 'checkbox' },
      { key: 'batiment_plus_2_ans', label: 'Bâtiment achevé depuis plus de 2 ans', type: 'checkbox' },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const etas = Number(d.etas_percent) || 0
      const surface = Number(d.surface_chauffee_m2) || 0
      if (!zone || etas < 111 || !surface) return null

      // Vérif ETAS min selon type d'application
      if (d.type_application === 'basse_temp' && etas < 126) return null

      const palier = etas >= 170 ? 170 : 111
      const base = BAR_TH_172.bases[palier] || 0
      const surfFactor = getSurfaceFactor172(surface)
      const zoneFactor = BAR_TH_172.zoneFactors[zone] || 1
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
        duree_vie_ans: 20,
      }
    },
  },

  'BAR-TH-148': {
    code: 'BAR-TH-148',
    label: 'Chauffe-eau thermodynamique',
    secteur: 'residentiel',
    description: "Chauffe-eau thermodynamique en résidentiel existant. Montants fixes par type et zone. COP > 2,4 (ou > 2,5 air extrait). Non cumulable avec BAR-TH-171 et BAR-TH-172. Durée de vie : 17 ans. Fiche vA73-3 du 01/11/2025.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'type_logement', label: 'Type de logement', type: 'select',
        options: [{ value: 'maison', label: 'Maison individuelle' }, { value: 'appartement', label: 'Appartement' }],
        required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'type_source', label: "Source d'énergie du CET", type: 'select',
        options: [
          { value: 'air_exterieur', label: 'Air extérieur' },
          { value: 'air_extrait', label: 'Air extrait (VMC) — COP > 2,5' },
          { value: 'air_ambiant', label: 'Air ambiant' },
        ], required: true },
      { key: 'cop', label: 'COP (EN 16147) > 2,4', type: 'number', required: true, step: 0.01, min: 2.4 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
      { key: 'volume_l', label: 'Volume du ballon (L)', type: 'number', required: true },
    ],
    compute: (d) => {
      const type = d.type_logement
      const zone = d.zone_climatique
      const cop = Number(d.cop) || 0
      if (!type || !zone) return null

      // COP min selon source
      const copMin = d.type_source === 'air_extrait' ? 2.5 : 2.4
      if (cop <= copMin) return null

      const cumac = BAR_TH_148_TABLE[type]?.[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(cumac * coefPrec),
        montant_base: cumac,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
        duree_vie_ans: 17,
      }
    },
  },

  'BAR-EN-102': {
    code: 'BAR-EN-102',
    label: 'Isolation des murs',
    secteur: 'residentiel',
    description: "Isolation des murs par l'intérieur ou l'extérieur en résidentiel existant. R ≥ 3,7 m².K/W. Coefficients différenciés selon énergie de chauffage (élec / combustibles). Durée de vie : 30 ans. Fiche vA65-4 du 01/01/2025.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'energie_chauffage', label: 'Énergie de chauffage', type: 'select',
        options: [
          { value: 'electricite', label: 'Électricité' },
          { value: 'combustibles', label: 'Combustibles (gaz, fioul, bois...)' },
        ], required: true },
      { key: 'surface_isolee_m2', label: 'Surface isolée (m²)', type: 'number', required: true, min: 1 },
      { key: 'resistance_thermique', label: 'Résistance thermique R (m².K/W) ≥ 3,7', type: 'number', required: true, min: 3.7, step: 0.1 },
      { key: 'type_pose', label: 'Type de pose', type: 'select',
        options: [
          { value: 'iti', label: "Isolation par l'intérieur (ITI)" },
          { value: 'ite', label: "Isolation par l'extérieur (ITE)" },
        ], required: true },
      { key: 'marque_isolant', label: "Marque de l'isolant", type: 'text', required: true },
      { key: 'reference_isolant', label: "Référence de l'isolant", type: 'text', required: true },
      { key: 'epaisseur_mm', label: 'Épaisseur (mm)', type: 'number', required: true, min: 1 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const energie = d.energie_chauffage
      const s = Number(d.surface_isolee_m2) || 0
      if (!zone || !energie || !s) return null
      const coef = BAR_EN_102_COEFS[energie]?.[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(coef * s * coefPrec),
        coef_zone: coef,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
        duree_vie_ans: 30,
      }
    },
  },

  'BAR-EN-103': {
    code: 'BAR-EN-103',
    label: 'Isolation plancher bas',
    secteur: 'residentiel',
    description: "Isolation du plancher bas (sur sous-sol, vide sanitaire, garage) en résidentiel existant. R ≥ 3 m².K/W. Durée de vie : 20 ans. Fiche vA64-6. ⚠️ Abrogée au 01/05/2027.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_isolee_m2', label: 'Surface isolée (m²)', type: 'number', required: true, min: 1 },
      { key: 'resistance_thermique', label: 'Résistance thermique R (m².K/W) ≥ 3', type: 'number', required: true, min: 3, step: 0.1 },
      { key: 'marque_isolant', label: "Marque de l'isolant", type: 'text', required: true },
      { key: 'reference_isolant', label: "Référence de l'isolant", type: 'text', required: true },
      { key: 'epaisseur_mm', label: 'Épaisseur (mm)', type: 'number', required: true, min: 1 },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const s = Number(d.surface_isolee_m2) || 0
      if (!zone || !s) return null
      const coef = BAR_EN_103_COEFS[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(coef * s * coefPrec),
        coef_zone: coef,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
        duree_vie_ans: 20,
      }
    },
  },

  'BAR-EN-104': {
    code: 'BAR-EN-104',
    label: 'Fenêtres / portes-fenêtres',
    secteur: 'residentiel',
    description: "Remplacement de fenêtres ou portes-fenêtres avec vitrage isolant en résidentiel existant. Uw ≤ 1,5 W/m².K. Calcul au m² de fenêtre. Durée de vie : 30 ans. Fiche vA54-2.",
    fields: [
      { key: 'categorie_menage', label: 'Catégorie de ménage', type: 'select',
        options: CATEGORIES_MENAGE.map(c => ({ value: c.value, label: c.label })), required: true },
      { key: 'zone_climatique', label: 'Zone climatique', type: 'select', options: ZONES_CLIMATIQUES, required: true },
      { key: 'surface_fenetres_m2', label: 'Surface totale des fenêtres (m²)', type: 'number', required: true, min: 0.1, step: 0.1 },
      { key: 'uw', label: 'Coefficient Uw (W/m².K) ≤ 1,5', type: 'number', required: true, max: 1.5, step: 0.01 },
      { key: 'nb_fenetres', label: 'Nombre de fenêtres', type: 'number', required: true, min: 1 },
      { key: 'marque', label: 'Marque', type: 'text', required: true },
      { key: 'reference', label: 'Référence', type: 'text', required: true },
    ],
    compute: (d) => {
      const zone = d.zone_climatique
      const s = Number(d.surface_fenetres_m2) || 0
      const uw = Number(d.uw) || 0
      if (!zone || !s || uw > 1.5) return null
      const coef = BAR_EN_104_COEFS[zone] || 0
      const coefPrec = getCoefPrecarite(d.categorie_menage)
      return {
        kwh_cumac: Math.round(coef * s * coefPrec),
        coef_zone: coef,
        coef_precarite: coefPrec,
        categorie_menage: d.categorie_menage,
        duree_vie_ans: 30,
      }
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

  if (fiche_code === 'BAR-TH-171') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non éligible)' })
    if (d.residence_principale === false)
      issues.push({ level: 'warning', field: 'residence_principale', message: 'Non résidence principale : vérifier éligibilité' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'Bâtiment < 2 ans (non éligible)' })
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
      issues.push({ level: 'error', field: 'audit_energetique', message: 'Audit énergétique obligatoire' })
    if (d.nb_postes_enveloppe && Number(d.nb_postes_enveloppe) < 2)
      issues.push({ level: 'error', field: 'nb_postes_enveloppe', message: "Min 2 postes d'enveloppe requis (murs, planchers bas, toiture, fenêtres)" })
  }

  if (fiche_code === 'BAR-TH-143') {
    if (d.surface_capteurs_m2 && Number(d.surface_capteurs_m2) < 8)
      issues.push({ level: 'error', field: 'surface_capteurs_m2', message: 'Surface capteurs < 8 m² (non éligible)' })
    if (d.productivite_w_m2 && Number(d.productivite_w_m2) < 600)
      issues.push({ level: 'error', field: 'productivite_w_m2', message: 'Productivité < 600 W/m² (non éligible)' })
    if (d.volume_stockage_l && Number(d.volume_stockage_l) <= 400)
      issues.push({ level: 'error', field: 'volume_stockage_l', message: 'Volume stockage ≤ 400 L (non éligible, doit être > 400 L)' })
  }

  if (fiche_code === 'BAR-TH-179') {
    if (d.etas_percent && Number(d.etas_percent) < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non éligible)' })
    if (d.puissance_pac_kw && Number(d.puissance_pac_kw) > 400)
      issues.push({ level: 'error', field: 'puissance_pac_kw', message: 'Puissance PAC > 400 kW (non éligible)' })
    if (d.av_syndic === false)
      issues.push({ level: 'warning', field: 'av_syndic', message: 'Accord AG/syndic requis' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'Bâtiment < 2 ans (non éligible)' })
    if (d.nb_logements && Number(d.nb_logements) < 2)
      issues.push({ level: 'error', field: 'nb_logements', message: 'Min 2 logements pour opération collective' })
  }

  if (fiche_code === 'BAR-EN-101') {
    if (d.resistance_thermique && Number(d.resistance_thermique) < 7)
      issues.push({ level: 'error', field: 'resistance_thermique', message: 'R < 7 m².K/W (non éligible)' })
  }

  if (fiche_code === 'BAR-TH-172') {
    const etas = Number(d.etas_percent) || 0
    if (etas && etas < 111)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 111% (non éligible)' })
    if (d.type_application === 'basse_temp' && etas && etas < 126)
      issues.push({ level: 'error', field: 'etas_percent', message: 'ETAS < 126% en basse température (non éligible)' })
    if (d.note_dimensionnement === false)
      issues.push({ level: 'error', field: 'note_dimensionnement', message: 'Note de dimensionnement obligatoire pour BAR-TH-172' })
    if (d.batiment_plus_2_ans === false)
      issues.push({ level: 'error', field: 'batiment_plus_2_ans', message: 'Bâtiment < 2 ans (non éligible)' })
  }

  if (fiche_code === 'BAR-TH-148') {
    const cop = Number(d.cop) || 0
    const copMin = d.type_source === 'air_extrait' ? 2.5 : 2.4
    if (cop && cop <= copMin)
      issues.push({ level: 'error', field: 'cop', message: `COP ≤ ${copMin} (non éligible, doit être > ${copMin})` })
  }

  if (fiche_code === 'BAR-EN-102') {
    if (d.resistance_thermique && Number(d.resistance_thermique) < 3.7)
      issues.push({ level: 'error', field: 'resistance_thermique', message: 'R < 3,7 m².K/W (non éligible)' })
  }

  if (fiche_code === 'BAR-EN-103') {
    if (d.resistance_thermique && Number(d.resistance_thermique) < 3)
      issues.push({ level: 'error', field: 'resistance_thermique', message: 'R < 3 m².K/W (non éligible)' })
    issues.push({ level: 'warning', field: '_abrogation', message: 'BAR-EN-103 sera abrogée au 01/05/2027 — vérifier date d\'engagement' })
  }

  if (fiche_code === 'BAR-EN-104') {
    if (d.uw && Number(d.uw) > 1.5)
      issues.push({ level: 'error', field: 'uw', message: 'Uw > 1,5 W/m².K (non éligible)' })
  }

  // Vérification champs requis manquants
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
// Fichier CSV (séparateur ;) compatible Excel, à joindre lors du
// dépôt du dossier CEE auprès du délégataire qui rachète les certificats.
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
