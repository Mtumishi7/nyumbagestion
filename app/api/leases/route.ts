import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
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

    const result = await query(`
      SELECT leases.*, 
             properties.nom_bien, 
             properties.loyer_mensuel,
             properties.charges,
             tenants.nom_complet as tenant_name
      FROM leases
      JOIN properties ON properties.id = leases.property_id
      JOIN tenants ON tenants.id = leases.tenant_id
      ORDER BY leases.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des baux' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { property_id, tenant_id, date_debut, date_fin, montant_caution, jour_echeance_paiement } = body;

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

    const result = await query(
      `INSERT INTO leases (property_id, tenant_id, date_debut, date_fin, montant_caution, jour_echeance_paiement) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [property_id, tenant_id, date_debut, date_fin || null, montant_caution || 0, jour_echeance_paiement || 5]
    );

    // Mettre le bien en statut 'occupe'
    await query(`UPDATE properties SET statut = 'occupe' WHERE id = $1`, [property_id]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating lease:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du contrat de bail' }, { status: 500 });
  }
}
