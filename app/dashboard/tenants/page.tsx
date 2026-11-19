'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, FileBadge, Loader2, Home, DollarSign, MessageSquare, ExternalLink, Calendar, Search, Edit2, LogOut, History, Receipt } from 'lucide-react';

interface Tenant {
  id: string;
  nom_complet: string;
  telephone: string;
  whatsapp: string;
  email: string;
  numero_cni_passeport: string;
  lease_id?: string;
  date_debut?: string;
  montant_caution?: number;
  property_id?: string;
  nom_bien?: string;
  loyer_mensuel?: number;
  charges?: number;
  property_status?: string;
}

interface Property {
  id: string;
  nom_bien: string;
  loyer_mensuel: number;
  statut: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // History modal state
  const [historyTenant, setHistoryTenant] = useState<Tenant | null>(null);
  const [tenantPayments, setTenantPayments] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state for new / edit
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cni, setCni] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [montantCaution, setMontantCaution] = useState('');

  useEffect(() => {
    setDateDebut(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    try {
      const [tenantsRes, propsRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/properties')
      ]);
      const tenantsData = await tenantsRes.json();
      const propsData = await propsRes.json();

      if (Array.isArray(tenantsData)) setTenants(tenantsData);
      if (Array.isArray(propsData)) setProperties(propsData);
    } catch (err) {
      console.error('Error loading tenants or properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setNom('');
    setTelephone('');
    setWhatsapp('');
    setEmail('');
    setCni('');
    setPropertyId('');
    setMontantCaution('');
    setShowModal(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setNom(t.nom_complet);
    setTelephone(t.telephone);
    setWhatsapp(t.whatsapp || '');
    setEmail(t.email || '');
    setCni(t.numero_cni_passeport);
    setPropertyId(t.property_id || '');
    setMontantCaution(t.montant_caution ? String(t.montant_caution) : '');
    setShowModal(true);
  };

  const handleOpenHistory = async (t: Tenant) => {
    setHistoryTenant(t);
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter((p: any) => p.tenant_name === t.nom_complet || p.lease_id === t.lease_id);
        setTenantPayments(filtered);
      }
    } catch (err) {
      console.error('Error fetching tenant payments:', err);
      setTenantPayments([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTerminateLease = async (leaseId: string) => {
    if (!confirm('Voulez-vous vraiment libérer ce bien ? Le bail sera résilié et le bien repassera en statut Vacant.')) return;
    try {
      const res = await fetch(`/api/leases/${leaseId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la résiliation du bail');
      }
    } catch (err) {
      console.error('Error terminating lease:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        const res = await fetch(`/api/tenants/${editingTenant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_complet: nom,
            telephone,
            whatsapp: whatsapp || telephone,
            email,
            numero_cni_passeport: cni,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          fetchData();
        } else {
          const data = await res.json();
          alert(data.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_complet: nom,
            telephone,
            whatsapp: whatsapp || telephone,
            email,
            numero_cni_passeport: cni,
            property_id: propertyId || null,
            date_debut: dateDebut,
            montant_caution: montantCaution ? Number(montantCaution) : null,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setShowModal(false);
          fetchData();
        } else {
          alert(data.error || 'Erreur lors de la création');
        }
      }
    } catch (err) {
      console.error('Error submitting tenant:', err);
    }
  };

  const uniqueTenants = Array.from(new Map(tenants.map(t => [t.id, t])).values());

  const filteredTenants = uniqueTenants.filter(t => 
    t.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.telephone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.numero_cni_passeport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nom_bien && t.nom_bien.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Locataires</h1>
          <p className="text-sm text-slate-500">Répertoire complet, modification des infos et gestion des baux (départ / bien vacant).</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Locataire & Bail
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, CNI, bien..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total : <span className="font-bold text-slate-800">{filteredTenants.length}</span> locataire(s)
        </div>
      </div>

      {/* Tenants Table with Dual Scroll */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <Users className="w-12 h-12 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Aucun locataire trouvé</h3>
          <p className="text-slate-500 text-sm max-w-sm">Essayez de modifier votre recherche ou ajoutez un nouveau locataire.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Ajouter un locataire
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-x-auto overflow-y-auto relative">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                <tr className="border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4 bg-slate-100">1. Identité & CNI</th>
                  <th className="p-4 bg-slate-100">2. Contacts</th>
                  <th className="p-4 bg-slate-100">3. Bien & Bail</th>
                  <th className="p-4 bg-slate-100">4. Finances</th>
                  <th className="p-4 text-right bg-slate-100">5. Actions & Gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Identité & CNI */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.nom_complet.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{t.nom_complet}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-0.5">
                            <FileBadge className="w-3 h-3 text-slate-400" />
                            {t.numero_cni_passeport}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Contacts */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <a href={`tel:${t.telephone}`} className="hover:underline">{t.telephone}</a>
                        </div>
                        {t.whatsapp && (
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <a 
                              href={`https://wa.me/${t.whatsapp.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="hover:underline font-semibold"
                            >
                              WA: {t.whatsapp}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          {t.email || 'Aucun email'}
                        </div>
                      </div>
                    </td>

                    {/* 3. Bien & Bail */}
                    <td className="p-4">
                      {t.nom_bien ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Home className="w-3.5 h-3.5 text-blue-600" />
                            {t.nom_bien}
                          </div>
                          {t.date_debut && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              Entrée : {t.date_debut ? t.date_debut.substring(0, 10).split('-').reverse().join('/') : ''}
                            </div>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 w-fit">
                            Bail Actif
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700">
                          Aucun bien attribué
                        </span>
                      )}
                    </td>

                    {/* 4. Finances */}
                    <td className="p-4">
                      {t.loyer_mensuel ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {Number(t.loyer_mensuel).toLocaleString()} BIF / mois
                          </div>
                          {t.montant_caution && (
                            <div className="text-slate-500 text-[11px]">
                              Caution : {Number(t.montant_caution).toLocaleString()} BIF
                            </div>
                          )}
                          <span className="text-[10px] text-emerald-600 font-semibold">À jour</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Non défini</span>
                      )}
                    </td>

                    {/* 5. Actions & Gestion */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Modifier */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Modifier les informations"
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Bouton Historique des paiements & solde */}
                        <button
                          onClick={() => handleOpenHistory(t)}
                          title="Historique des paiements & solde"
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Bouton Libérer / Rendre vacant */}
                        {t.lease_id ? (
                          <button
                            onClick={() => handleTerminateLease(t.lease_id!)}
                            title="Rendre le bien vacant (Départ)"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors font-semibold text-xs"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Libérer
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Historique des Paiements & Solde */}
      {historyTenant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Historique des paiements : {historyTenant.nom_complet}
                </h3>
                <p className="text-xs text-slate-500">
                  Bien : {historyTenant.nom_bien || 'Aucun bien actif'} | Loyer : {historyTenant.loyer_mensuel ? Number(historyTenant.loyer_mensuel).toLocaleString() + ' BIF' : 'N/A'}
                </p>
              </div>
              <button onClick={() => setHistoryTenant(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : tenantPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Aucun paiement enregistré pour ce locataire.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Versé</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {tenantPayments.reduce((sum, p) => sum + Number(p.montant_paye || 0), 0).toLocaleString()} BIF
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nombre de versements</span>
                    <span className="font-bold text-slate-900 text-sm">{tenantPayments.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Statut du solde</span>
                    <span className="font-bold text-emerald-600 text-sm">À jour</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="p-3">Mois concerné</th>
                        <th className="p-3">Montant payé</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3">Quittance</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenantPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{p.mois_concerne}</td>
                          <td className="p-3 font-bold text-emerald-700">{Number(p.montant_paye).toLocaleString()} BIF</td>
                          <td className="p-3 text-slate-600">{p.mode_paiement}</td>
                          <td className="p-3 font-mono text-slate-500">{p.numero_quittance}</td>
                          <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryTenant(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingTenant ? 'Modifier le locataire' : 'Nouveau Locataire & Bail'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTenant ? 'Mise à jour des informations personnelles.' : 'Renseignez les 5 piliers de gestion locative.'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: Jean Ndayishimiye"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+257 79..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+257 79..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@gmail.com"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">N° CNI ou Passeport *</label>
                  <input
                    type="text"
                    required
                    value={cni}
                    onChange={(e) => setCni(e.target.value)}
                    placeholder="101/1990/..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {!editingTenant && (
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Affectation du Bien & Bail Initial</h4>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner un bien immobilier *</label>
                      <select
                        required
                        value={propertyId}
                        onChange={(e) => {
                          setPropertyId(e.target.value);
                          const p = properties.find(item => item.id === e.target.value);
                          if (p && !montantCaution) {
                            setMontantCaution(String(Number(p.loyer_mensuel) * 2));
                          }
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                      >
                        <option value="">-- Choisir un bien vacant --</option>
                        {properties
                          .filter(p => p.statut === 'vacant' || p.id === propertyId)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nom_bien} ({Number(p.loyer_mensuel).toLocaleString()} BIF/mois) - {p.statut}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date d&apos;entrée (Bail)</label>
                        <input
                          type="date"
                          value={dateDebut}
                          onChange={(e) => setDateDebut(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Caution (BIF)</label>
                        <input
                          type="number"
                          value={montantCaution}
                          onChange={(e) => setMontantCaution(e.target.value)}
                          placeholder="ex: 200000"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  {editingTenant ? 'Mettre à jour' : 'Enregistrer & Attribuer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
