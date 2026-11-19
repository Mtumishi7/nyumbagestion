'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Printer, CheckCircle, Clock, AlertTriangle, MessageCircle, Loader2 } from 'lucide-react';
import { generateQuittancePDF } from '@/lib/pdfGenerator';

interface Payment {
  id: string;
  numero_quittance: string;
  tenant_name: string;
  nom_bien: string;
  mois_concerne: string;
  montant_attendu: number;
  montant_paye: number;
  montant_restant: number;
  mode_paiement: string;
  reference_transaction: string;
  statut: string;
  whatsapp: string;
  telephone: string;
}

interface LeaseOption {
  id: string;
  nom_bien: string;
  tenant_name: string;
  loyer_mensuel: number;
  charges: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [moisConcerne, setMoisConcerne] = useState('2026-10');
  const [montantAttendu, setMontantAttendu] = useState('');
  const [montantPaye, setMontantPaye] = useState('');
  const [modePaiement, setModePaiement] = useState('lumicash');
  const [reference, setReference] = useState('');

  const fetchData = async () => {
    try {
      const resPayments = await fetch('/api/payments');
      const dataPayments = await resPayments.json();
      if (Array.isArray(dataPayments)) setPayments(dataPayments);

      // Only fetch active leases (occupied properties)
      const resLeases = await fetch('/api/leases');
      const dataLeases = await resLeases.json();
      if (Array.isArray(dataLeases)) {
        setLeases(
          dataLeases
            .filter((l: any) => l.est_actif !== false)
              .map((l: any) => ({
                id: l.id,
                nom_bien: l.nom_bien || 'Bien immobilier',
                tenant_name: l.tenant_name || 'Locataire',
                loyer_mensuel: Number(l.loyer_mensuel) || 0,
                charges: Number(l.charges) || 0,
              }))
        );
      }
    } catch (err) {
      console.error('Error loading payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePropertySelect = (propertyId: string) => {
    setSelectedLeaseId(propertyId);
    const prop = leases.find(l => l.id === propertyId);
    if (prop) {
      const total = prop.loyer_mensuel + prop.charges;
      setMontantAttendu(total.toString());
      setMontantPaye(total.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lease_id: selectedLeaseId,
          mois_concerne: moisConcerne,
          montant_attendu: parseFloat(montantAttendu) || 0,
          montant_paye: parseFloat(montantPaye) || 0,
          mode_paiement: modePaiement,
          reference_transaction: reference,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setSelectedLeaseId('');
        setReference('');
        setMontantAttendu('');
        setMontantPaye('');
        fetchData();
      } else {
        alert(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      alert("Erreur de connexion au serveur");
    }
  };

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.montant_paye), 0);
  const totalArrears = payments.reduce((acc, p) => acc + Number(p.montant_restant), 0);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Encaissements & Quittances (PostgreSQL Local)</h1>
          <p className="text-sm text-slate-500">Enregistrez les règlements et envoyez instantanément les quittances par WhatsApp.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Saisir un Encaissement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Encaissé</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalCollected.toLocaleString()} BIF</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Quittances Émises</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length} Quittances</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Arriérés Restants</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{totalArrears.toLocaleString()} BIF</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <DollarSign className="w-12 h-12 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Aucun encaissement enregistré</h3>
          <p className="text-slate-500 text-sm max-w-sm">Enregistrez un premier versement de loyer pour générer automatiquement la quittance officielle.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Saisir un encaissement
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-x-auto overflow-y-auto relative">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                <tr className="border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4 bg-slate-100">N° Quittance</th>
                  <th className="p-4 bg-slate-100">Locataire & Bien</th>
                  <th className="p-4 bg-slate-100">Mois</th>
                  <th className="p-4 bg-slate-100">Montant Versé</th>
                  <th className="p-4 bg-slate-100">Mode / Référence</th>
                  <th className="p-4 bg-slate-100">Statut & Solde</th>
                  <th className="p-4 text-right bg-slate-100">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const payeNum = Number(p.montant_paye) || 0;
                  const resteNum = Number(p.montant_restant) || 0;
                  const phoneNum = p.whatsapp || p.telephone || '+25779000000';
                  const whatsappMessage = encodeURIComponent(
                    `Bonjour ${p.tenant_name},\n\nVoici votre quittance officielle ${p.numero_quittance} pour la location de ${p.nom_bien} (${p.mois_concerne}).\nMontant versé : ${payeNum.toLocaleString()} BIF via ${p.mode_paiement.toUpperCase()} (Réf: ${p.reference_transaction}).\n${resteNum > 0 ? `Solde restant dû : ${resteNum.toLocaleString()} BIF.\n` : 'Solde soldé avec succès ! Merci.'}\n\nNyumbaGestion — Bujumbura`
                  );
                  const whatsappUrl = `https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600 text-xs">{p.numero_quittance}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{p.tenant_name}</p>
                        <p className="text-xs text-slate-500">{p.nom_bien}</p>
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{p.mois_concerne}</td>
                      <td className="p-4 font-semibold text-slate-900">{payeNum.toLocaleString()} BIF</td>
                      <td className="p-4 text-slate-600">
                        <span className="uppercase text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded mr-1.5">
                          {p.mode_paiement}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{p.reference_transaction}</span>
                      </td>
                      <td className="p-4">
                        {p.statut === 'paye' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Payé
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full w-fit">
                              <Clock className="w-3 h-3" /> Partiel
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">Reste : {resteNum.toLocaleString()} BIF</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            let user = { nom_complet: 'Super Administrateur', role: 'admin' };
                            try {
                              const stored = localStorage.getItem('currentUser');
                              if (stored) user = JSON.parse(stored);
                            } catch (e) {}

                            generateQuittancePDF({
                              ...p,
                              manager_name: user.nom_complet,
                              bailleur_name: user.role === 'admin' ? user.nom_complet : 'Propriétaire / Représentant Légal',
                              bailleur_nif: '4000123456'
                            });
                          }}
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          PDF
                        </button>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'encaissement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900">Enregistrer un Encaissement</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner le locataire</label>
                <select
                  required
                  value={selectedLeaseId}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">-- Choisir un locataire --</option>
                  {leases.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.tenant_name} — {l.nom_bien} (Loyer : {(l.loyer_mensuel + l.charges).toLocaleString()} BIF/mois)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mois concerné (YYYY-MM)</label>
                <input
                  type="text"
                  required
                  value={moisConcerne}
                  onChange={(e) => setMoisConcerne(e.target.value)}
                  placeholder="2026-10"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Attendu (BIF)</label>
                  <input
                    type="number"
                    required
                    value={montantAttendu}
                    onChange={(e) => setMontantAttendu(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Versé (BIF)</label>
                  <input
                    type="number"
                    required
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Paiement</label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white uppercase font-semibold text-xs"
                >
                  <option value="lumicash">Lumicash</option>
                  <option value="ecocash">Ecocash</option>
                  <option value="virement">Virement Bancaire</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Référence de Transaction <span className="text-slate-400 font-normal">(Facultatif)</span>
                </label>
                <input
                  type="text"
                  required={false}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={modePaiement === 'especes' ? 'ex: Reçu caisse #01' : 'ex: LUMI-9847521'}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Valider l&apos;encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
