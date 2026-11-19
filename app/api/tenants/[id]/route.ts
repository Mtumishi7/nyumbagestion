import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom_complet, telephone, whatsapp, email, numero_cni_passeport } = body;

    const result = await query(
      `UPDATE tenants 
       SET nom_complet = $1, telephone = $2, whatsapp = $3, email = $4, numero_cni_passeport = $5 
       WHERE id = $6 RETURNING *`,
      [nom_complet, telephone, whatsapp || telephone, email, numero_cni_passeport, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du locataire' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check active leases
    const leaseRes = await query('SELECT property_id FROM leases WHERE tenant_id = $1 AND est_actif = TRUE', [id]);
    for (const lease of leaseRes.rows) {
      await query("UPDATE properties SET statut = 'vacant' WHERE id = $1", [lease.property_id]);
      await query('UPDATE leases SET est_actif = FALSE, date_fin = CURRENT_DATE WHERE tenant_id = $1 AND est_actif = TRUE', [id]);
    }

    await query('DELETE FROM tenants WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Locataire supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du locataire' }, { status: 500 });
  }
}
