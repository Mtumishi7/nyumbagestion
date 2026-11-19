import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the lease
    const leaseRes = await query('SELECT * FROM leases WHERE id = $1', [id]);
    if (leaseRes.rows.length === 0) {
      return NextResponse.json({ error: 'Contrat de bail introuvable' }, { status: 404 });
    }
    const lease = leaseRes.rows[0];

    // Deactivate lease
    await query('UPDATE leases SET est_actif = FALSE, date_fin = CURRENT_DATE WHERE id = $1', [id]);

    // Free the property
    await query("UPDATE properties SET statut = 'vacant' WHERE id = $1", [lease.property_id]);

    return NextResponse.json({ success: true, message: 'Bail résilié et bien libéré avec succès' });
  } catch (error) {
    console.error('Error terminating lease:', error);
    return NextResponse.json({ error: 'Erreur lors de la résiliation du bail' }, { status: 500 });
  }
}
