import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request?: Request) {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lease_id UUID NOT NULL,
        mois_concerne VARCHAR(20) NOT NULL,
        montant_attendu NUMERIC(15, 2) NOT NULL,
        montant_paye NUMERIC(15, 2) NOT NULL,
        montant_restant NUMERIC(15, 2) DEFAULT 0,
        mode_paiement VARCHAR(50) NOT NULL,
        reference_transaction VARCHAR(100),
        numero_quittance VARCHAR(100) NOT NULL,
        statut VARCHAR(50) DEFAULT 'paye',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    let userId = null;
    let role = null;
    if (request && request.url) {
      try {
        const url = new URL(request.url, 'http://localhost');
        userId = url.searchParams.get('userId');
        role = url.searchParams.get('role');
      } catch (e) {}
    }

    let queryText = `
      SELECT payments.*, 
             properties.nom_bien, 
             properties.adresse,
             tenants.nom_complet as tenant_name, 
             tenants.whatsapp,
             tenants.telephone
      FROM payments
      JOIN leases ON leases.id = payments.lease_id
      JOIN properties ON properties.id = leases.property_id
      JOIN tenants ON tenants.id = leases.tenant_id
    `;
    let queryParams: any[] = [];

    if (role === 'gestionnaire' && userId) {
      queryText += ` WHERE properties.assigned_to = $1`;
      queryParams.push(userId);
    }

    queryText += ` ORDER BY payments.created_at DESC`;

    const result = await query(queryText, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des encaissements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lease_id, mois_concerne, montant_attendu, montant_paye, mode_paiement, reference_transaction } = body;

    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lease_id UUID NOT NULL,
        mois_concerne VARCHAR(20) NOT NULL,
        montant_attendu NUMERIC(15, 2) NOT NULL,
        montant_paye NUMERIC(15, 2) NOT NULL,
        montant_restant NUMERIC(15, 2) DEFAULT 0,
        mode_paiement VARCHAR(50) NOT NULL,
        reference_transaction VARCHAR(100),
        numero_quittance VARCHAR(100) NOT NULL,
        statut VARCHAR(50) DEFAULT 'paye',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // If lease_id passed is actually a property_id (in case frontend fallback), check if lease exists
    let actualLeaseId = lease_id;
    const checkLease = await query('SELECT * FROM leases WHERE id = $1', [lease_id]);
    if (checkLease.rows.length === 0) {
      const propLease = await query('SELECT * FROM leases WHERE property_id = $1 AND est_actif = TRUE LIMIT 1', [lease_id]);
      if (propLease.rows.length > 0) {
        actualLeaseId = propLease.rows[0].id;
      } else {
        const anyTenant = await query('SELECT id FROM tenants LIMIT 1');
        if (anyTenant.rows.length > 0) {
          const newLease = await query(
            `INSERT INTO leases (property_id, tenant_id, date_debut, montant_caution, est_actif) VALUES ($1, $2, NOW(), 0, TRUE) RETURNING id`,
            [lease_id, anyTenant.rows[0].id]
          );
          actualLeaseId = newLease.rows[0].id;
        } else {
          return NextResponse.json({ error: 'Aucun bail ni locataire valide trouvé pour ce bien.' }, { status: 400 });
        }
      }
    }

    const expected = Number(montant_attendu) || 0;
    const paid = Number(montant_paye) || 0;
    const restant = Math.max(0, expected - paid);
    const statut = paid >= expected ? 'paye' : 'partiel';

    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const numero_quittance = `QTU-${mois_concerne || '2026-10'}-${randomSeq}`;
    const ref = reference_transaction && reference_transaction.trim() !== '' 
      ? reference_transaction 
      : (mode_paiement === 'especes' ? `CASH-${Math.floor(100000 + Math.random() * 900000)}` : 'REF-DEF');

    const result = await query(
      `INSERT INTO payments (lease_id, mois_concerne, montant_attendu, montant_paye, montant_restant, mode_paiement, reference_transaction, numero_quittance, statut) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [actualLeaseId, mois_concerne || '2026-10', expected, paid, restant, mode_paiement || 'especes', ref, numero_quittance, statut]
    );

    // Record audit log for payment
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
      ['admin@nyumbagestion.bi', 'ENCAISSEMENT_LOYER', `Encaissement de ${paid} BIF (Mois: ${mois_concerne || '2026-10'}, Réf: ${ref}, Quittance: ${numero_quittance})`]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du paiement: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
