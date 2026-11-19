import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom_complet, email, telephone, role, password, assigned_property_ids, is_active } = body;

    // If just toggling status
    if (typeof is_active === 'boolean' && !nom_complet) {
      const resActive = await query(
        `UPDATE profiles SET is_active = $1 WHERE id = $2 RETURNING id, email, nom_complet, telephone, role, is_active, created_at`,
        [is_active, id]
      );
      return NextResponse.json(resActive.rows[0]);
    }

    let queryText = '';
    let queryParams: any[] = [];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      queryText = `
        UPDATE profiles 
        SET nom_complet = $1, email = $2, telephone = $3, role = $4, password_hash = $5 
        WHERE id = $6 
        RETURNING id, email, nom_complet, telephone, role, is_active, created_at
      `;
      queryParams = [nom_complet, email, telephone, role, password_hash, id];
    } else {
      queryText = `
        UPDATE profiles 
        SET nom_complet = $1, email = $2, telephone = $3, role = $4 
        WHERE id = $5 
        RETURNING id, email, nom_complet, telephone, role, is_active, created_at
      `;
      queryParams = [nom_complet, email, telephone, role, id];
    }

    const result = await query(queryText, queryParams);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Update assigned properties if provided
    if (Array.isArray(assigned_property_ids)) {
      // First unassign properties previously assigned to this user that are not in the new list
      await query(`UPDATE properties SET assigned_to = NULL WHERE assigned_to = $1`, [id]);
      // Then assign the new ones
      for (const propId of assigned_property_ids) {
        await query(`UPDATE properties SET assigned_to = $1 WHERE id = $2`, [id, propId]);
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Unassign properties first
    await query(`UPDATE properties SET assigned_to = NULL WHERE assigned_to = $1`, [id]);
    
    const result = await query(`DELETE FROM profiles WHERE id = $1 RETURNING id`, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, { status: 500 });
  }
}
