import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom_bien, adresse, type_bien, loyer_mensuel, charges, statut } = body;

    const result = await query(
      `UPDATE properties 
       SET nom_bien = COALESCE($1, nom_bien),
           adresse = COALESCE($2, adresse),
           type_bien = COALESCE($3, type_bien),
           loyer_mensuel = COALESCE($4, loyer_mensuel),
           charges = COALESCE($5, charges),
           statut = COALESCE($6, statut)
       WHERE id = $7
       RETURNING *`,
      [nom_bien, adresse, type_bien, loyer_mensuel, charges, statut, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Bien immobilier introuvable' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du bien' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const checkRes = await query('SELECT statut FROM properties WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Bien immobilier introuvable' }, { status: 404 });
    }

    const property = checkRes.rows[0];
    if (property.statut === 'occupe') {
      return NextResponse.json({ error: 'Impossible de supprimer ou archiver un bien actuellement occupé' }, { status: 400 });
    }

    // Soft delete / archive to preserve accounting and lease foreign key history
    await query("UPDATE properties SET statut = 'archive' WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: 'Bien immobilier archivé avec succès' });
  } catch (error) {
    console.error('Error archiving property:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du bien' }, { status: 500 });
  }
}
