import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT expenses.*, properties.nom_bien 
      FROM expenses
      LEFT JOIN properties ON properties.id = expenses.property_id
      ORDER BY expenses.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    // If table doesn't exist yet, create it on the fly or return empty
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
          categorie VARCHAR(100) NOT NULL,
          type_charge VARCHAR(50) NOT NULL DEFAULT 'recuperable',
          montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
          date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
          fournisseur VARCHAR(150),
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      const retryResult = await query(`
        SELECT expenses.*, properties.nom_bien 
        FROM expenses
        LEFT JOIN properties ON properties.id = expenses.property_id
        ORDER BY expenses.created_at DESC
      `);
      return NextResponse.json(retryResult.rows);
    } catch (innerErr) {
      console.error('Error fetching/creating expenses:', innerErr);
      return NextResponse.json({ error: 'Erreur lors de la récupération des charges' }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { property_id, categorie, type_charge, montant, date_depense, fournisseur, description } = body;

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        categorie VARCHAR(100) NOT NULL,
        type_charge VARCHAR(50) NOT NULL DEFAULT 'recuperable',
        montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
        date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
        fournisseur VARCHAR(150),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const result = await query(
      `INSERT INTO expenses (property_id, categorie, type_charge, montant, date_depense, fournisseur, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [property_id, categorie || 'Maintenance générale', type_charge || 'recuperable', Number(montant) || 0, date_depense || new Date().toISOString().split('T')[0], fournisseur || 'Prestataire', description || '']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de la dépense" }, { status: 500 });
  }
}
