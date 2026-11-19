import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Ensure profiles table exists
    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nom_complet VARCHAR(150) NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'gestionnaire',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Check if default admin exists, if not create one
    const checkAdmin = await query('SELECT * FROM profiles WHERE email = $1', ['admin@nyumbagestion.bi']);
    if (checkAdmin.rows.length === 0) {
      const defaultHash = await bcrypt.hash('admin123', 10);
      await query(
        `INSERT INTO profiles (email, password_hash, nom_complet, telephone, role) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@nyumbagestion.bi', defaultHash, 'Super Administrateur', '+257 79 000 000', 'admin']
      );
    }

    const result = await query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const user = result.rows[0];
    if (user.is_active === false) {
      return NextResponse.json({ error: 'Votre compte a été révoqué par l’administrateur. Accès refusé.' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Return user without password hash
    const { password_hash, ...userInfo } = user;
    return NextResponse.json({ success: true, user: userInfo });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
