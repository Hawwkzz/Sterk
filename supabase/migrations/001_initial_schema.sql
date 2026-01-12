-- =============================================
-- STERK LED - Schema de base de données Supabase
-- =============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Table des équipes
CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    responsable VARCHAR(100),
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'equipe' CHECK (role IN ('equipe', 'admin')),
    equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des chantiers
CREATE TABLE IF NOT EXISTS chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    
    -- Infos chantier
    adresse TEXT NOT NULL,
    led_count INTEGER NOT NULL CHECK (led_count > 0),
    date_intervention DATE DEFAULT CURRENT_DATE,
    commentaire TEXT,
    
    -- Infos client
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    
    -- Statut et validation
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'PENDING_CLIENT', 'VALIDE', 'REFUSE', 'CORRIGE')),
    validation_token VARCHAR(64) UNIQUE,
    validation_expires_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des photos de chantier
CREATE TABLE IF NOT EXISTS chantier_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des refus (quand un client refuse)
CREATE TABLE IF NOT EXISTS chantier_refus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    commentaire TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des photos de refus
CREATE TABLE IF NOT EXISTS refus_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refus_id UUID NOT NULL REFERENCES chantier_refus(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de logs pour les notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chantier_id UUID REFERENCES chantiers(id) ON DELETE SET NULL,
    type VARCHAR(20) CHECK (type IN ('email', 'sms')),
    recipient VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_chantiers_equipe_id ON chantiers(equipe_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_status ON chantiers(status);
CREATE INDEX IF NOT EXISTS idx_chantiers_created_at ON chantiers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chantiers_validation_token ON chantiers(validation_token);
CREATE INDEX IF NOT EXISTS idx_profiles_equipe_id ON profiles(equipe_id);
CREATE INDEX IF NOT EXISTS idx_chantier_photos_chantier_id ON chantier_photos(chantier_id);

-- =============================================
-- TRIGGERS pour updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_equipes_updated_at
    BEFORE UPDATE ON equipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chantiers_updated_at
    BEFORE UPDATE ON chantiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Créer un profil à l'inscription
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantier_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantier_refus ENABLE ROW LEVEL SECURITY;
ALTER TABLE refus_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour equipes
CREATE POLICY "Equipes visibles par tous les utilisateurs authentifiés"
    ON equipes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins peuvent tout faire sur equipes"
    ON equipes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Les admins peuvent voir tous les profils"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policies pour chantiers
CREATE POLICY "Les équipes voient leurs propres chantiers"
    ON chantiers FOR SELECT
    TO authenticated
    USING (
        equipe_id IN (
            SELECT equipe_id FROM profiles WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Les équipes peuvent créer des chantiers"
    ON chantiers FOR INSERT
    TO authenticated
    WITH CHECK (
        equipe_id IN (
            SELECT equipe_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Les équipes peuvent modifier leurs chantiers"
    ON chantiers FOR UPDATE
    TO authenticated
    USING (
        equipe_id IN (
            SELECT equipe_id FROM profiles WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy pour accès anonyme (validation client)
CREATE POLICY "Accès public pour validation par token"
    ON chantiers FOR SELECT
    TO anon
    USING (validation_token IS NOT NULL);

CREATE POLICY "Mise à jour anonyme pour validation"
    ON chantiers FOR UPDATE
    TO anon
    USING (validation_token IS NOT NULL)
    WITH CHECK (validation_token IS NOT NULL);

-- Policies pour chantier_photos
CREATE POLICY "Photos visibles avec le chantier"
    ON chantier_photos FOR SELECT
    TO authenticated
    USING (
        chantier_id IN (
            SELECT id FROM chantiers WHERE equipe_id IN (
                SELECT equipe_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Photos visibles anonymement si chantier accessible"
    ON chantier_photos FOR SELECT
    TO anon
    USING (
        chantier_id IN (
            SELECT id FROM chantiers WHERE validation_token IS NOT NULL
        )
    );

CREATE POLICY "Équipes peuvent ajouter des photos"
    ON chantier_photos FOR INSERT
    TO authenticated
    WITH CHECK (
        chantier_id IN (
            SELECT id FROM chantiers WHERE equipe_id IN (
                SELECT equipe_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Policies pour chantier_refus
CREATE POLICY "Refus visibles avec le chantier"
    ON chantier_refus FOR SELECT
    TO authenticated
    USING (
        chantier_id IN (
            SELECT id FROM chantiers WHERE equipe_id IN (
                SELECT equipe_id FROM profiles WHERE id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Clients peuvent créer des refus (anonyme)"
    ON chantier_refus FOR INSERT
    TO anon
    WITH CHECK (
        chantier_id IN (
            SELECT id FROM chantiers WHERE validation_token IS NOT NULL
        )
    );

-- Policies pour refus_photos
CREATE POLICY "Photos de refus visibles"
    ON refus_photos FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Clients peuvent ajouter des photos de refus"
    ON refus_photos FOR INSERT
    TO anon
    WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================

-- Créer le bucket pour les photos (à faire dans le dashboard Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chantier-photos', 'chantier-photos', true);

-- =============================================
-- DONNÉES DE TEST (optionnel)
-- =============================================

-- Créer une équipe de test
-- INSERT INTO equipes (name, responsable) VALUES ('Équipe Alpha', 'Jean Dupont');
-- INSERT INTO equipes (name, responsable) VALUES ('Équipe Beta', 'Marie Martin');
-- INSERT INTO equipes (name, responsable) VALUES ('Équipe Gamma', 'Pierre Durant');
