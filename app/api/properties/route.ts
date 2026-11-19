import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request?: Request) {
  try {
    let userId = null;
    let role = null;
    if (request && request.url) {
      try {
        const url = new URL(request.url, 'http://localhost');
        userId = url.searchParams.get('userId');
        role = url.searchParams.get('role');
      } catch (e) {
        // ignore url parse error if any
      }
    }

    if (role === 'gestionnaire' && userId) {
      const result = await query("SELECT * FROM properties WHERE assigned_to = $1 ORDER BY created_at DESC", [userId]);
      return NextResponse.json(result.rows);
    }

    const result = await query("SELECT * FROM properties ORDER BY created_at DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties from DB:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des biens depuis la base de données' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom_bien, adresse, type_bien, loyer_mensuel, charges, statut } = body;

    const result = await query(
      `INSERT INTO properties (nom_bien, adresse, type_bien, loyer_mensuel, charges, statut) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nom_bien, adresse, type_bien || 'appartement', loyer_mensuel || 0, charges || 0, statut || 'vacant']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du bien' }, { status: 500 });
  }
}
