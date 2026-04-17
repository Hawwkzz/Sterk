-- =============================================
-- Ajout des champs RGE sur la table entreprises
-- =============================================

ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS rge_numero VARCHAR(50);
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS rge_organisme VARCHAR(100);
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS rge_certificate_url TEXT;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS rge_date_expiration DATE;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS rge_updated_at TIMESTAMPTZ;
