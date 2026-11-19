import { jsPDF } from 'jspdf';

export function generateQuittancePDF(payment: {
  numero_quittance: string;
  tenant_name: string;
  nom_bien: string;
  adresse?: string;
  mois_concerne: string;
  montant_paye: number;
  montant_attendu?: number;
  montant_restant?: number;
  mode_paiement: string;
  reference_transaction?: string;
  created_at: string;
  manager_name?: string;
  bailleur_name?: string;
  bailleur_nif?: string;
}) {
  const doc = new jsPDF();
  
  // Clean Professional Background / Watermark (NKURIKIYE Adolphe)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(45);
  doc.setTextColor(242, 246, 244);
  doc.text('NKURIKIYE Adolphe', 30, 160, { angle: -20 });

  // --- HEADER SECTION ---
  doc.setFillColor(15, 23, 42); // Deep Charcoal / Navy
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(16, 185, 129); // Emerald Line
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NKURADOL — REÇU DE LOYER OFFICIEL', 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Gitega, Burundi • Contact: +257 67 34 83 32', 14, 25);
  doc.text(`Quittance N° : ${payment.numero_quittance || 'QL-2026-000142'}   |   Date : ${new Date(payment.created_at || Date.now()).toLocaleDateString('fr-FR')}`, 14, 31);

  let y = 48;

  // --- INFO SECTIONS (Bailleur & Locataire) ---
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);

  // Bailleur Box
  doc.roundedRect(14, y, 88, 32, 2, 2, 'FD');
  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 1.5, 32, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('PROPRIÉTAIRE / BAILLEUR', 18, y + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const bailleurName = payment.bailleur_name || 'NKURIKIYE Adolphe';
  const bailleurNif = payment.bailleur_nif || '4000123456';
  doc.text(bailleurName, 18, y + 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tél : +257 67 34 83 32   |   NIF : ' + bailleurNif, 18, y + 22);

  // Locataire Box
  doc.roundedRect(108, y, 88, 32, 2, 2, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(108, y, 1.5, 32, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('LOCATAIRE', 112, y + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.tenant_name, 112, y + 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Statut : Locataire Actif & À jour', 112, y + 22);

  y += 38;

  // --- PROPERTY & PERIOD ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BIEN IMMOBILIER & PÉRIODE CONCERNÉE', 18, y + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${payment.nom_bien} — ${payment.adresse || 'Magarama, Gitega'}`, 18, y + 13);
  doc.text(`Période : ${payment.mois_concerne}`, 150, y + 13);

  y += 26;

  // --- FINANCIAL TABLE ---
  const montantAttendu = Number(payment.montant_attendu || payment.montant_paye);
  const montantPaye = Number(payment.montant_paye);
  const montantRestant = Number(payment.montant_restant || 0);

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAIL DES MONTANTS', 18, y + 5.5);
  doc.text('MONTANT (FBu)', 155, y + 5.5);

  y += 8;
  const rows = [
    ['Loyer principal (' + payment.mois_concerne + ')', montantAttendu.toLocaleString() + ' FBu'],
    ['Charges locatives', '0 FBu'],
    ['MONTANT TOTAL PAYÉ', montantPaye.toLocaleString() + ' FBu'],
    ['Solde restant dû', montantRestant.toLocaleString() + ' FBu']
  ];

  doc.setFontSize(9);
  rows.forEach((row, idx) => {
    doc.setDrawColor(226, 232, 240);
    if (idx === 2) {
      doc.setFillColor(209, 250, 229);
      doc.rect(14, y, 182, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, y, 182, 8, 'FD');
      doc.setFont('helvetica', idx === 2 ? 'bold' : 'normal');
      doc.setTextColor(15, 23, 42);
    }
    doc.text(row[0], 18, y + 5.5);
    doc.text(row[1], 155, y + 5.5);
    y += 8;
  });

  y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Mode de règlement : ' + payment.mode_paiement.toUpperCase() + ` (Réf: ${payment.reference_transaction || 'N/A'})`, 14, y);

  y += 8;

  // --- LEGAL ATTESTATION ---
  const managerName = payment.manager_name || payment.created_by_name || 'NKURIKIYE Adolphe';
  const isSuperAdmin = managerName.toLowerCase().includes('super') || managerName.toLowerCase().includes('admin') || managerName.toLowerCase().includes('nkurikiye');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);

  const attestationText = isSuperAdmin
    ? `« Je soussigné(e) ${managerName}, propriétaire du bien désigné ci-dessus, déclare avoir reçu de ${payment.tenant_name} la somme de ${montantPaye.toLocaleString()} FBu au titre du loyer de la période de ${payment.mois_concerne}, et lui en donne quittance libératoire. »`
    : `« Je soussigné(e) ${managerName}, agissant par délégation et pour le compte de ${bailleurName}, propriétaire du bien désigné ci-dessus, déclare avoir reçu de ${payment.tenant_name} la somme de ${montantPaye.toLocaleString()} FBu au titre du loyer de la période de ${payment.mois_concerne}, et lui en donne quittance libératoire. »`;

  doc.text(doc.splitTextToSize(attestationText, 174), 18, y + 6);

  y += 32;

  // --- SIGNATURE & AUTOMATIC QR CODE (Pointing to +25767348332) ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ÉMIS ET VALIDÉ PAR :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(managerName + ' (NKURADOL)', 14, y + 5);
  doc.text('Contact officiel : +257 67 34 83 32', 14, y + 10);
  doc.text('Date : ' + new Date(payment.created_at || Date.now()).toLocaleString('fr-FR'), 14, y + 15);

  // QR Code pointing to WhatsApp / Direct Contact +25767348332
  const qrX = 165;
  const qrY = y - 2;
  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://wa.me/25767348332?text=Bonjour,%20je%20souhaite%20verifier%20la%20quittance%20' + payment.numero_quittance)}`;
    doc.addImage(qrApiUrl, 'PNG', qrX, qrY, 26, 26);
  } catch (e) {
    doc.setFillColor(15, 23, 42);
    doc.rect(qrX, qrY, 26, 26, 'F');
  }

  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235);
  doc.text('Scan WhatsApp : +257 67 34 83 32', 70, y + 5);
  doc.setTextColor(148, 163, 184);
  doc.text('Quittance N° ' + payment.numero_quittance + ' | Certifiée authentique', 70, y + 10);

  y += 28;

  // Legal Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const legalFooter = 'Cette quittance annule tout reçu antérieur pour la même période. Document généré et certifié par NKURADOL. Contact officiel / WhatsApp : +257 67 34 83 32.';
  doc.text(doc.splitTextToSize(legalFooter, 182), 14, y);

  doc.save(`Quittance_${payment.numero_quittance}.pdf`);
}

export function generateContractPDF(lease: {
  nom_bien: string;
  tenant_name: string;
  date_debut: string;
  montant_caution: number;
  jour_echeance_paiement: number;
}) {
  const doc = new jsPDF();
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('NKURADOL', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Contrat de Location Officiel • Gitega, Burundi', 14, 30);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE BAIL D\'HABITATION', 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.save(`Contrat_Bail_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`);
}
