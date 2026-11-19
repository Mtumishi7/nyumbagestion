import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(150) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    let result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    if (result.rows.length === 0) {
      await query(
        'INSERT INTO audit_logs (user_email, action, details) VALUES ($1, $2, $3)',
        ['admin@nyumbagestion.bi', 'INITIALISATION_SYSTEME', 'Démarrage du système de gestion locative Nyumbagestion (Burundi)']
      );
      result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du journal d’audit' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_email, action, details } = body;
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(150) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    const result = await query(
      'INSERT INTO audit_logs (user_email, action, details) VALUES ($1, $2, $3) RETURNING *',
      [user_email || 'admin@nyumbagestion.bi', action, details]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Erreur lors de l’enregistrement de l’audit' }, { status: 500 });
  }
}
