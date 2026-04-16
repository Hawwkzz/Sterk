-- Migration : Module apporteur d'affaires
-- Objectif : tracer les leads apportés par des tiers et gérer le commissionnement

CREATE TABLE IF NOT EXISTS apporteurs_affaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  societe TEXT,
  siret TEXT,
  -- Taux de commission par défaut (% de la prime CEE)
  taux_commission_default NUMERIC(5,2) DEFAULT 10.00 CHECK (taux_commission_default >= 0 AND taux_commission_default <= 100),
  -- Mode de commissionnement : pourcentage OU forfait
  mode_commission TEXT DEFAULT 'pourcentage' CHECK (mode_commission IN ('pourcentage', 'forfait')),
  forfait_default NUMERIC(10,2),
  commentaire TEXT,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apporteurs_entreprise ON apporteurs_affaires(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_apporteurs_actif ON apporteurs_affaires(actif);

-- Ajout lien apporteur sur les dossiers CEE
ALTER TABLE dossiers_cee
  ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES apporteurs_affaires(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_montant NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS commission_statut TEXT DEFAULT 'due' CHECK (commission_statut IN ('due', 'payee', 'annulee'));

CREATE INDEX IF NOT EXISTS idx_dossiers_cee_apporteur ON dossiers_cee(apporteur_id);

-- Vue : récap des commissions par apporteur
CREATE OR REPLACE VIEW v_apporteurs_recap AS
SELECT
  a.id,
  a.entreprise_id,
  a.nom,
  a.societe,
  a.taux_commission_default,
  a.mode_commission,
  a.actif,
  COUNT(d.id) AS nb_dossiers,
  COUNT(d.id) FILTER (WHERE d.statut = 'PRIME_RECUE') AS nb_dossiers_primes_recues,
  COALESCE(SUM(d.commission_montant), 0) AS commission_totale,
  COALESCE(SUM(d.commission_montant) FILTER (WHERE d.commission_statut = 'payee'), 0) AS commission_payee,
  COALESCE(SUM(d.commission_montant) FILTER (WHERE d.commission_statut = 'due'), 0) AS commission_due
FROM apporteurs_affaires a
LEFT JOIN dossiers_cee d ON d.apporteur_id = a.id
GROUP BY a.id;

-- RLS : un apporteur n'est visible que par l'entreprise qui l'a créé
ALTER TABLE apporteurs_affaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apporteurs visibles par entreprise" ON apporteurs_affaires;
CREATE POLICY "Apporteurs visibles par entreprise" ON apporteurs_affaires
  FOR ALL USING (
    entreprise_id IN (
      SELECT entreprise_id FROM user_entreprise_link WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE apporteurs_affaires IS 'Apporteurs d''affaires tiers qui fournissent des leads à l''entreprise (module v1)';
COMMENT ON COLUMN apporteurs_affaires.taux_commission_default IS 'Commission par défaut en % de la prime CEE';
COMMENT ON COLUMN dossiers_cee.commission_montant IS 'Montant dû à l''apporteur (calculé à partir du taux ou forfait)';
