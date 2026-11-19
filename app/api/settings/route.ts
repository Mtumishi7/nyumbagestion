import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'agency_config',
        company_name VARCHAR(150) DEFAULT 'NKURADOAPP',
        company_nif VARCHAR(50) DEFAULT '4001234567',
        company_rc VARCHAR(50) DEFAULT 'RC-GITEGA-001',
        company_phone VARCHAR(50) DEFAULT '+257 67 34 83 32',
        whatsapp_number VARCHAR(50) DEFAULT '+257 67 34 83 32',
        reminder_template TEXT DEFAULT 'Bonjour {nom}, rappel concernant votre loyer du mois de {mois}. Montant dû : {montant} FBu.',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const result = await query('SELECT * FROM settings WHERE id = $1', ['agency_config']);
    if (result.rows.length === 0) {
      const defaultSettings = await query(
        `INSERT INTO settings (id, company_name, company_nif, company_rc, company_phone, whatsapp_number, reminder_template) 
         VALUES ('agency_config', 'NKURADOAPP', '4001234567', 'RC-GITEGA-001', '+257 67 34 83 32', '+257 67 34 83 32', 'Bonjour {nom}, rappel concernant votre loyer du mois de {mois}. Montant dû : {montant} FBu.') 
         RETURNING *`
      );
      return NextResponse.json(defaultSettings.rows[0]);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des paramètres' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { company_name, company_nif, company_rc, company_phone, whatsapp_number, reminder_template } = body;

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'agency_config',
        company_name VARCHAR(150) DEFAULT 'NKURADOAPP',
        company_nif VARCHAR(50) DEFAULT '4001234567',
        company_rc VARCHAR(50) DEFAULT 'RC-GITEGA-001',
        company_phone VARCHAR(50) DEFAULT '+257 67 34 83 32',
        whatsapp_number VARCHAR(50) DEFAULT '+257 67 34 83 32',
        reminder_template TEXT DEFAULT 'Bonjour {nom}, rappel concernant votre loyer du mois de {mois}. Montant dû : {montant} FBu.',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const result = await query(
      `INSERT INTO settings (id, company_name, company_nif, company_rc, company_phone, whatsapp_number, reminder_template, updated_at) 
       VALUES ('agency_config', $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE 
       SET company_name = EXCLUDED.company_name,
           company_nif = EXCLUDED.company_nif,
           company_rc = EXCLUDED.company_rc,
           company_phone = EXCLUDED.company_phone,
           whatsapp_number = EXCLUDED.whatsapp_number,
           reminder_template = EXCLUDED.reminder_template,
           updated_at = NOW()
       RETURNING *`,
      [company_name, company_nif, company_rc, company_phone, whatsapp_number, reminder_template]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des paramètres' }, { status: 500 });
  }
}
