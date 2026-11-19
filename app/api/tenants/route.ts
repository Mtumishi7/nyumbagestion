import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request?: Request) {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom_complet VARCHAR(150) NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        whatsapp VARCHAR(20),
        email VARCHAR(150),
        numero_cni_passeport VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS leases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE,
        montant_caution NUMERIC(15, 2) DEFAULT 0,
        jour_echeance_paiement INT DEFAULT 5,
        est_actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    let userId = null;
    let role = null;
    if (request && request.url) {
      try {
        const url = new URL(request.url, 'http://localhost');
        userId = url.searchParams.get('userId');
        role = url.searchParams.get('role');
      } catch (e) {}
    }

    let queryText = `
      SELECT DISTINCT ON (tenants.id) tenants.*, 
             leases.id as lease_id,
             leases.date_debut,
             leases.montant_caution,
             properties.id as property_id,
             properties.nom_bien,
             properties.loyer_mensuel,
             properties.charges,
             properties.statut as property_status
      FROM tenants
      LEFT JOIN leases ON leases.tenant_id = tenants.id AND leases.est_actif = TRUE
      LEFT JOIN properties ON properties.id = leases.property_id
    `;
    let queryParams: any[] = [];

    if (role === 'gestionnaire' && userId) {
      queryText += ` WHERE properties.assigned_to = $1`;
      queryParams.push(userId);
    }

    queryText += ` ORDER BY tenants.id, tenants.created_at DESC`;

    const result = await query(queryText, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des locataires' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom_complet, telephone, whatsapp, email, numero_cni_passeport, property_id, date_debut, montant_caution, jour_echeance_paiement } = body;

    if (!property_id) {
      return NextResponse.json({ error: 'Un bien vacant doit être impérativement sélectionné pour ajouter un locataire.' }, { status: 400 });
    }

    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom_complet VARCHAR(150) NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        whatsapp VARCHAR(20),
        email VARCHAR(150),
        numero_cni_passeport VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS leases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL,
        tenant_id UUID NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE,
        montant_caution NUMERIC(15, 2) DEFAULT 0,
        jour_echeance_paiement INT DEFAULT 5,
        est_actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Verify property is vacant
    const propRes = await query('SELECT * FROM properties WHERE id = $1', [property_id]);
    if (propRes.rows.length === 0) {
      return NextResponse.json({ error: 'Bien immobilier introuvable.' }, { status: 404 });
    }
    const prop = propRes.rows[0];
    if (prop.statut !== 'vacant') {
      return NextResponse.json({ error: `Le bien "${prop.nom_bien}" n'est pas vacant (statut: ${prop.statut}).` }, { status: 400 });
    }

    // Insert tenant
    const tenantRes = await query(
      `INSERT INTO tenants (nom_complet, telephone, whatsapp, email, numero_cni_passeport) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nom_complet, telephone, whatsapp || telephone, email, numero_cni_passeport]
    );
    const newTenant = tenantRes.rows[0];

    // Create lease
    const leaseRes = await query(
      `INSERT INTO leases (property_id, tenant_id, date_debut, montant_caution, jour_echeance_paiement, est_actif) 
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
      [property_id, newTenant.id, date_debut || new Date().toISOString().split('T')[0], montant_caution || (Number(prop.loyer_mensuel) * 2), jour_echeance_paiement || 5]
    );

    // Update property status to 'occupe'
    await query(`UPDATE properties SET statut = 'occupe' WHERE id = $1`, [property_id]);

    return NextResponse.json({ tenant: newTenant, lease: leaseRes.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du locataire (Vérifiez le numéro CNI unique)' }, { status: 500 });
  }
}
