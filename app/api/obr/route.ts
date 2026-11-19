import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Calculate total collected and estimated OBR tax (20% standard rental income tax in Burundi)
    const paymentsRes = await query('SELECT SUM(montant_paye) as total_collected FROM payments');
    const totalCollected = Number(paymentsRes.rows[0]?.total_collected || 0);
    const taxRate = 0.20; // 20% IRR Burundaise
    const estimatedTax = totalCollected * taxRate;

    const propertiesRes = await query('SELECT COUNT(*) as total_props FROM properties');
    const totalProps = Number(propertiesRes.rows[0]?.total_props || 0);

    return NextResponse.json({
      total_collected: totalCollected,
      tax_rate_percent: 20,
      estimated_obr_tax: estimatedTax,
      total_properties: totalProps,
      currency: 'FBU',
      compliant_status: 'Certifié Conforme OBR simulation'
    });
  } catch (error) {
    console.error('Error fetching OBR report:', error);
    return NextResponse.json({ error: 'Erreur lors du calcul du rapport OBR' }, { status: 500 });
  }
}
