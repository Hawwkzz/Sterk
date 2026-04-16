-- Migration : Ajout des métadonnées EXIF (horodatage + GPS) sur les photos chantier
-- Objectif : conformité CEE 2026 (loi 30 juin 2025, contrôles sur site des PAC)
--
-- À exécuter une seule fois dans l'éditeur SQL Supabase.

ALTER TABLE chantier_photos
  ADD COLUMN IF NOT EXISTS exif_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exif_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exif_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exif_source TEXT CHECK (exif_source IN ('exif', 'browser', 'none')),
  ADD COLUMN IF NOT EXISTS exif_device TEXT;

-- Index pour faciliter les recherches par zone géographique ou audit temporel
CREATE INDEX IF NOT EXISTS idx_chantier_photos_exif_timestamp ON chantier_photos(exif_timestamp);
CREATE INDEX IF NOT EXISTS idx_chantier_photos_exif_geo ON chantier_photos(exif_lat, exif_lng);

-- Vue de conformité : photos horodatées ET géolocalisées
CREATE OR REPLACE VIEW v_photos_conformes AS
SELECT
  cp.*,
  CASE
    WHEN cp.exif_timestamp IS NOT NULL AND cp.exif_lat IS NOT NULL AND cp.exif_lng IS NOT NULL
    THEN TRUE ELSE FALSE
  END AS conforme_cee_2026
FROM chantier_photos cp;

COMMENT ON COLUMN chantier_photos.exif_timestamp IS 'Horodatage EXIF (DateTimeOriginal) ou lastModified du fichier';
COMMENT ON COLUMN chantier_photos.exif_lat IS 'Latitude (WGS84) : EXIF GPS ou géoloc navigateur';
COMMENT ON COLUMN chantier_photos.exif_lng IS 'Longitude (WGS84)';
COMMENT ON COLUMN chantier_photos.exif_source IS 'Source du GPS : exif (appareil photo), browser (navigateur), none';
COMMENT ON COLUMN chantier_photos.exif_device IS 'Marque/modèle appareil (Make + Model EXIF)';
