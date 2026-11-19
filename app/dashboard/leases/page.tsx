'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

interface Lease {
  id: string;
  nom_bien: string;
  tenant_name: string;
  date_debut: string;
  jour_echeance_paiement: number;
  montant_caution: number;
  est_actif: boolean;
}

interface Property {
  id: string;
  nom_bien: string;
}

interface Tenant {
  id: string;
  nom_complet: string;
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [caution, setCaution] = useState('');
  const [echeance, setEcheance] = useState('5');

  const fetchData = async () => {
    try {
      const [resLeases, resProps, resTenants] = await Promise.all([
        fetch('/api/leases'),
        fetch('/api/properties'),
        fetch('/api/tenants')
      ]);
      const dataLeases = await resLeases.json();
      const dataProps = await resProps.json();
      const dataTenants = await resTenants.json();

      if (Array.isArray(dataLeases)) setLeases(dataLeases);
      if (Array.isArray(dataProps)) setProperties(dataProps);
      if (Array.isArray(dataTenants)) setTenants(dataTenants);
    } catch (err) {
      console.error('Error loading leases data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          tenant_id: tenantId,
          date_debut: dateDebut,
          date_fin: dateFin || null,
          montant_caution: parseFloat(caution) || 0,
          jour_echeance_paiement: parseInt(echeance) || 5,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setPropertyId('');
        setTenantId('');
        setDateDebut('');
        setDateFin('');
        setCaution('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating lease:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contrats de Bail</h1>
          <p className="text-sm text-slate-500">Liaison entre biens immobiliers et locataires, suivi des cautions et échéances.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Contrat de Bail
        </button>
      </div>

      {/* Leases Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : leases.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Aucun contrat de bail actif</h3>
          <p className="text-slate-500 text-sm max-w-sm">Associez un locataire à un bien immobilier pour créer un contrat de bail.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Créer un bail
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                  <th className="p-4">Bien Immobilier</th>
                  <th className="p-4">Locataire</th>
                  <th className="p-4">Date de Début</th>
                  <th className="p-4">Échéance</th>
                  <th className="p-4">Montant Caution</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leases.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {l.nom_bien}
                    </td>
                    <td className="p-4 text-slate-800 font-medium">{l.tenant_name}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(l.date_debut).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">Le {l.jour_echeance_paiement} du mois</td>
                    <td className="p-4 font-semibold text-slate-900">{Number(l.montant_caution).toLocaleString()} BIF</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Actif
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900">Nouveau Contrat de Bail</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner le bien</label>
                <select
                  required
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">-- Choisir un bien --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom_bien}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner le locataire</label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">-- Choisir un locataire --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom_complet}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    required
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jour d&apos;échéance</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={echeance}
                    onChange={(e) => setEcheance(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant de la Caution (BIF)</label>
                <input
                  type="number"
                  required
                  value={caution}
                  onChange={(e) => setCaution(e.target.value)}
                  placeholder="ex: 900000"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
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
                  Créer le bail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
