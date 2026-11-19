import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, cancellation_reason, approval_status } = body;

    // Ensure columns exist
    await query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approuve';
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
    `);

    if (action === 'cancel') {
      const reason = cancellation_reason || 'Annulation sans motif spécifié';
      const result = await query(
        `UPDATE payments 
         SET statut = 'annule', cancellation_reason = $1, cancelled_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [reason, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
      }

      // Audit log
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
        ['admin@nyumbagestion.bi', 'ANNULATION_PAIEMENT', `Paiement ${result.rows[0].numero_quittance} annulé. Motif: ${reason}`]
      );

      return NextResponse.json(result.rows[0]);
    }

    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'approuve' : 'refuse';
      const result = await query(
        `UPDATE payments SET approval_status = $1 WHERE id = $2 RETURNING *`,
        [newStatus, id]
      );
      return NextResponse.json(result.rows[0]);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du paiement' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Zéro suppression physique pour les paiements : on redirige vers l'annulation
  return NextResponse.json(
    { error: 'Suppression physique interdite. Utilisez l’annulation avec motif pour conserver la traçabilité financière.' },
    { status: 403 }
  );
}
