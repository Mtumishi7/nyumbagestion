import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT maintenance_tickets.*, properties.nom_bien 
      FROM maintenance_tickets
      LEFT JOIN properties ON properties.id = maintenance_tickets.property_id
      ORDER BY maintenance_tickets.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS maintenance_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
          titre VARCHAR(150) NOT NULL,
          categorie VARCHAR(50) NOT NULL DEFAULT 'plomberie',
          priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne',
          statut VARCHAR(30) NOT NULL DEFAULT 'nouveau',
          prestataire VARCHAR(150),
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      const retryResult = await query(`
        SELECT maintenance_tickets.*, properties.nom_bien 
        FROM maintenance_tickets
        LEFT JOIN properties ON properties.id = maintenance_tickets.property_id
        ORDER BY maintenance_tickets.created_at DESC
      `);
      return NextResponse.json(retryResult.rows);
    } catch (innerErr) {
      console.error('Error fetching/creating maintenance tickets:', innerErr);
      return NextResponse.json({ error: 'Erreur lors de la récupération des tickets de maintenance' }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { property_id, titre, categorie, priorite, prestataire, description } = body;

    await query(`
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        titre VARCHAR(150) NOT NULL,
        categorie VARCHAR(50) NOT NULL DEFAULT 'plomberie',
        priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne',
        statut VARCHAR(30) NOT NULL DEFAULT 'nouveau',
        prestataire VARCHAR(150),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const result = await query(
      `INSERT INTO maintenance_tickets (property_id, titre, categorie, priorite, prestataire, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [property_id, titre, categorie || 'plomberie', priorite || 'moyenne', prestataire || 'Technicien', description || '']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    return NextResponse.json({ error: "Erreur lors de la création du ticket de maintenance" }, { status: 500 });
  }
}
