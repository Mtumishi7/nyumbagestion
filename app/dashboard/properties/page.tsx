'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Tag, Loader2 } from 'lucide-react';

interface Property {
  id: string;
  nom_bien: string;
  adresse: string;
  type_bien: string;
  statut: string;
  loyer_mensuel: number;
  charges: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);

  // Form state
  const [nomBien, setNomBien] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeBien, setTypeBien] = useState('appartement');
  const [loyer, setLoyer] = useState('');
  const [charges, setCharges] = useState('');
  const [statut, setStatut] = useState('vacant');

  const fetchProperties = async () => {
    try {
      let url = '/api/properties';
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.role === 'gestionnaire') {
            setIsAdmin(false);
            url = `/api/properties?userId=${u.id}&role=gestionnaire`;
          }
        }
      } catch (e) {}

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProperties(data);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openCreateModal = () => {
    setEditingProperty(null);
    setNomBien('');
    setAdresse('');
    setTypeBien('appartement');
    setLoyer('');
    setCharges('');
    setStatut('vacant');
    setShowModal(true);
  };

  const openEditModal = (p: Property) => {
    setEditingProperty(p);
    setNomBien(p.nom_bien);
    setAdresse(p.adresse);
    setTypeBien(p.type_bien);
    setLoyer(p.loyer_mensuel.toString());
    setCharges(p.charges.toString());
    setStatut(p.statut);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bien immobilier ?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        fetchProperties();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_bien: nomBien,
          adresse,
          type_bien: typeBien,
          loyer_mensuel: parseFloat(loyer) || 0,
          charges: parseFloat(charges) || 0,
          statut,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingProperty(null);
        setNomBien('');
        setAdresse('');
        setLoyer('');
        setCharges('');
        setStatut('vacant');
        fetchProperties();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch (err) {
      console.error('Error saving property:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">Patrimoine Immobilier</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Gestion complète de l’ensemble du parc immobilier.' : 'Portefeuille de biens assignés à votre gestion.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Bien
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <Building2 className="w-12 h-12 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Aucun bien enregistré</h3>
          <p className="text-slate-500 text-sm max-w-sm">Commencez par ajouter votre premier bien immobilier (appartement, maison, boutique, bureau).</p>
          <button
            onClick={openCreateModal}
            className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Ajouter un bien
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const loyerNum = Number(p.loyer_mensuel) || 0;
            const chargesNum = Number(p.charges) || 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-6 hover:border-blue-300 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize">
                      <Tag className="w-3.5 h-3.5" />
                      {p.type_bien}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.statut === 'occupe' ? 'bg-emerald-100 text-emerald-800' :
                      p.statut === 'vacant' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.statut === 'occupe' ? 'Occupé' : p.statut === 'vacant' ? 'Vacant' : 'Maintenance'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{p.nom_bien}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {p.adresse}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Loyer mensuel :</span>
                    <span className="font-bold text-slate-900">{loyerNum.toLocaleString()} BIF</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Charges forfaitaires :</span>
                    <span className="font-medium text-slate-700">{chargesNum.toLocaleString()} BIF</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 mt-1 flex justify-between text-xs font-bold text-blue-900">
                    <span>Total Dû :</span>
                    <span>{(loyerNum + chargesNum).toLocaleString()} BIF</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingProperty ? 'Modifier le bien immobilier' : 'Ajouter un bien immobilier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du bien</label>
                <input
                  type="text"
                  required
                  value={nomBien}
                  onChange={(e) => setNomBien(e.target.value)}
                  placeholder="ex: Appartement Rohero II"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="ex: Avenue de la Gloire, Bujumbura"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de bien</label>
                  <select
                    value={typeBien}
                    onChange={(e) => setTypeBien(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="boutique">Boutique</option>
                    <option value="bureau">Bureau</option>
                  </select>
                </div>
                {editingProperty && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Statut</label>
                    <select
                      value={statut}
                      onChange={(e) => setStatut(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="vacant">Vacant</option>
                      <option value="occupe">Occupé</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loyer (BIF)</label>
                  <input
                    type="number"
                    required
                    value={loyer}
                    onChange={(e) => setLoyer(e.target.value)}
                    placeholder="450000"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Charges (BIF)</label>
                  <input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(e.target.value)}
                    placeholder="50000"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
