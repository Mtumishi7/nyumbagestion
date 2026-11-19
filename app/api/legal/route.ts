import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS legal_notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        property_id UUID NOT NULL,
        motif VARCHAR(255) NOT NULL,
        montant_du NUMERIC(15, 2) NOT NULL,
        delai_jours INT DEFAULT 8,
        statut VARCHAR(50) DEFAULT 'emis',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    const result = await query(`
      SELECT legal_notices.*, tenants.nom_complet as tenant_name, tenants.telephone, properties.nom_bien, properties.adresse
      FROM legal_notices
      JOIN tenants ON tenants.id = legal_notices.tenant_id
      JOIN properties ON properties.id = legal_notices.property_id
      ORDER BY legal_notices.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching legal notices:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des mises en demeure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, property_id, motif, montant_du, delai_jours } = body;
    await query(`
      CREATE TABLE IF NOT EXISTS legal_notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        property_id UUID NOT NULL,
        motif VARCHAR(255) NOT NULL,
        montant_du NUMERIC(15, 2) NOT NULL,
        delai_jours INT DEFAULT 8,
        statut VARCHAR(50) DEFAULT 'emis',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    const result = await query(
      `INSERT INTO legal_notices (tenant_id, property_id, motif, montant_du, delai_jours) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenant_id, property_id, motif || 'Impayé de loyer', montant_du || 0, delai_jours || 8]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating legal notice:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la mise en demeure' }, { status: 500 });
  }
}
