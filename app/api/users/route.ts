import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(150) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nom_complet VARCHAR(150) NOT NULL,
        telephone VARCHAR(20) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'gestionnaire',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Ensure is_active column exists if table was already there
    await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;`);

    const result = await query(`
      SELECT p.id, p.email, p.nom_complet, p.telephone, p.role, p.is_active, p.created_at,
             (SELECT COUNT(*) FROM properties prop WHERE prop.assigned_to = p.id) as assigned_properties_count
      FROM profiles p 
      ORDER BY p.created_at DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des utilisateurs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom_complet, email, telephone, role, password, assigned_property_ids } = body;

    if (!telephone || !nom_complet || !password) {
      return NextResponse.json({ error: 'Téléphone (identifiant), nom et mot de passe requis' }, { status: 400 });
    }

    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(150) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nom_complet VARCHAR(150) NOT NULL,
        telephone VARCHAR(20) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'gestionnaire',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO profiles (email, password_hash, nom_complet, telephone, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, email, nom_complet, telephone, role, is_active, created_at`,
      [email || `${telephone}@nyumbagestion.bi`, password_hash, nom_complet, telephone, role || 'gestionnaire']
    );

    const newUser = result.rows[0];

    // If assigned properties are provided, update properties table
    if (Array.isArray(assigned_property_ids)) {
      // First unassign properties previously assigned to this user if editing, or assign new ones
      await query(`UPDATE properties SET assigned_to = NULL WHERE assigned_to = $1`, [newUser.id]);
      if (assigned_property_ids.length > 0) {
        for (const propId of assigned_property_ids) {
          await query(`UPDATE properties SET assigned_to = $1 WHERE id = $2`, [newUser.id, propId]);
        }
      }
    }

    // Record audit log
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email VARCHAR(150) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await query(
      `INSERT INTO audit_logs (user_email, action, details) VALUES ($1, $2, $3)`,
      [email, 'CREATION_UTILISATEUR', `Création du compte ${nom_complet} (${role})`]
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création de l\'utilisateur' }, { status: 500 });
  }
}
