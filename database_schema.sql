-- =========================================================================
-- NYUMBAGESTION — SCHÉMA POSTGRESQL 100% LOCAL ET AUTONOME
-- =========================================================================

-- Nettoyage préalable si besoin
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_mode CASCADE;
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 1. ENUMÉRATIONS DE STRUCTURE
CREATE TYPE user_role AS ENUM ('admin', 'gestionnaire');
CREATE TYPE property_type AS ENUM ('appartement', 'maison', 'boutique', 'bureau');
CREATE TYPE property_status AS ENUM ('vacant', 'occupe', 'maintenance');
CREATE TYPE payment_mode AS ENUM ('ecocash', 'lumicash', 'virement', 'especes');
CREATE TYPE payment_status AS ENUM ('paye', 'partiel', 'en_attente');

-- 2. TABLE DES UTILISATEURS / PROFILS LOCAUX
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom_complet VARCHAR(150) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    role user_role NOT NULL DEFAULT 'gestionnaire',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE DES BIENS IMMOBILIERS (Patrimoine)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_bien VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    type_bien property_type NOT NULL DEFAULT 'appartement',
    statut property_status NOT NULL DEFAULT 'vacant',
    loyer_mensuel NUMERIC(12, 2) NOT NULL CHECK (loyer_mensuel >= 0),
    charges NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (charges >= 0),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DES LOCATAIRES
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(150) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(150),
    numero_cni_passeport VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE DES CONTRATS DE BAIL
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    montant_caution NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (montant_caution >= 0),
    jour_echeance_paiement INT NOT NULL DEFAULT 5 CHECK (jour_echeance_paiement BETWEEN 1 AND 31),
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE DES ENCAISSEMENTS & QUITTANCES
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
    mois_concerne VARCHAR(7) NOT NULL, -- Format 'YYYY-MM'
    montant_attendu NUMERIC(12, 2) NOT NULL CHECK (montant_attendu >= 0),
    montant_paye NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (montant_paye >= 0),
    montant_restant NUMERIC(12, 2) NOT NULL DEFAULT 0,
    mode_paiement payment_mode NOT NULL,
    reference_transaction VARCHAR(100) NOT NULL,
    statut payment_status NOT NULL DEFAULT 'en_attente',
    numero_quittance VARCHAR(50) UNIQUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 7. RÈGLES MÉTIER & CALCULS FINANCIERS AUTOMATIQUES (TRIGGERS)
-- =========================================================================

CREATE OR REPLACE FUNCTION process_payment_rules()
RETURNS TRIGGER AS $$
BEGIN
    NEW.montant_restant := GREATEST(0, NEW.montant_attendu - NEW.montant_paye);
    
    IF NEW.montant_paye >= NEW.montant_attendu THEN
        NEW.statut := 'paye';
    ELSIF NEW.montant_paye > 0 THEN
        NEW.statut := 'partiel';
    ELSE
        NEW.statut := 'en_attente';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_payment_rules
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION process_payment_rules();
