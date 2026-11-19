'use client';

import { useState, useEffect } from 'react';
import { 
  Users, UserCog, ShieldCheck, Plus, Search, Mail, Phone, 
  Building2, Trash2, Edit2, X, Loader2, Key, CheckCircle2, Eye, EyeOff, Sparkles, Check
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  nom_complet: string;
  telephone: string;
  role: 'admin' | 'gestionnaire';
  is_active: boolean;
  created_at: string;
  assigned_properties_count: string | number;
}

interface Property {
  id: string;
  nom_bien: string;
  adresse: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState<'admin' | 'gestionnaire'>('gestionnaire');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, propsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/properties')
      ]);
      const usersData = await usersRes.json();
      const propsData = await propsRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(propsData)) setProperties(propsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%!';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNomComplet('');
    setEmail('');
    setTelephone('');
    setRole('gestionnaire');
    setPassword('');
    setSelectedProperties([]);
    setPropertySearch('');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = async (user: User) => {
    setEditingUser(user);
    setNomComplet(user.nom_complet);
    setEmail(user.email);
    setTelephone(user.telephone);
    setRole(user.role);
    setPassword('');
    setPropertySearch('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/properties');
      const propsData = await res.json();
      if (Array.isArray(propsData)) {
        const assigned = propsData.filter((p: any) => p.assigned_to === user.id).map((p: any) => p.id);
        setSelectedProperties(assigned);
      }
    } catch (err) {
      console.error('Error loading assigned properties:', err);
      setSelectedProperties([]);
    }

    setShowModal(true);
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.is_active;
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        nom_complet: nomComplet,
        email,
        telephone,
        role,
        assigned_property_ids: selectedProperties,
      };

      if (password) {
        payload.password = password;
      }

      if (!editingUser && !password) {
        setErrorMessage('Le mot de passe est requis pour un nouvel utilisateur.');
        setSubmitting(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.telephone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const filteredProperties = properties.filter(p => 
    p.nom_bien.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.adresse.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalManagers = users.filter(u => u.role === 'gestionnaire').length;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <UserCog className="w-7 h-7 text-blue-600" />
            Gestion des Utilisateurs & Rôles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervisez les accès administrateurs et gestionnaires, et assignez les portefeuilles immobiliers.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Utilisateurs</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{users.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Super Admins</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalAdmins}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gestionnaires Actifs</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalManagers}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Rôle :</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Super Admin</option>
            <option value="gestionnaire">Gestionnaire</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <Users className="w-12 h-12 text-slate-300" />
          <h3 className="font-bold text-slate-800 text-base">Aucun utilisateur trouvé</h3>
          <p className="text-slate-500 text-xs max-w-sm">Modifiez vos critères de recherche ou créez un nouveau compte.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-center">Biens Assignés</th>
                  <th className="p-4">Date de Création</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {u.nom_complet.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{u.nom_complet}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {u.telephone || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                        {u.role === 'admin' ? 'Super Admin' : 'Gestionnaire'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-sm ${
                          u.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                        title="Cliquer pour basculer le statut (Actif / Révoqué)"
                      >
                        <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {u.is_active !== false ? 'Actif' : 'Révoqué'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {u.assigned_properties_count} bien(s)
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border shadow-sm ${
                            u.is_active !== false
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {u.is_active !== false ? <ShieldCheck className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {u.is_active !== false ? 'Révoquer' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-all border border-blue-200 shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition-all border border-red-200 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expert Modal for Create or Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingUser ? 'Modifier le compte utilisateur' : 'Nouveau Compte Utilisateur'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingUser ? 'Mise à jour des informations et du portefeuille assigné.' : 'Créez un accès sécurisé et assignez des biens immobiliers.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6">
              {/* Section 1: Rôle du Système */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">
                  1. Rôle & Niveau d&apos;Accès
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setRole('gestionnaire')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                      role === 'gestionnaire' 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                        <UserCog className={`w-4 h-4 ${role === 'gestionnaire' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Gestionnaire
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        role === 'gestionnaire' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {role === 'gestionnaire' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Gère uniquement les biens et locataires de son portefeuille assigné.
                    </p>
                  </div>

                  <div 
                    onClick={() => setRole('admin')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                      role === 'admin' 
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                        <ShieldCheck className={`w-4 h-4 ${role === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                        Super Admin
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        role === 'admin' ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {role === 'admin' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Accès complet à l&apos;ensemble de la plateforme et gestion des utilisateurs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Informations Personnelles */}
              <div className="flex flex-col gap-4">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  2. Informations Personnelles & Contacts
                </label>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    placeholder="Ex: Jean Bosco Nkurunziza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Adresse Email Professionnelle</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jean@nyumbagestion.bi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Téléphone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="+257 79 00 00 00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-slate-500">
                      {editingUser ? 'Nouveau Mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe sécurisé'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Générer un mot de passe fort
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...(!editingUser ? { required: true } : {})}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Attribution des Biens Immobiliers */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    3. Portefeuille de Biens Assignés ({selectedProperties.length} sélectionné(s))
                  </label>
                  {properties.length > 0 && (
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedProperties(properties.map(p => p.id))}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Tout sélectionner
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedProperties([])}
                        className="text-slate-500 font-bold hover:underline"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer les biens immobiliers..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
                  {filteredProperties.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center">Aucun bien immobilier ne correspond à votre recherche.</p>
                  ) : (
                    filteredProperties.map((prop) => {
                      const isSelected = selectedProperties.includes(prop.id);
                      return (
                        <div
                          key={prop.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProperties(selectedProperties.filter(id => id !== prop.id));
                            } else {
                              setSelectedProperties([...selectedProperties, prop.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300 font-bold text-blue-900 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div onClick for better UX
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 pointer-events-none"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{prop.nom_bien}</p>
                              <p className="text-[10px] text-slate-400">{prop.adresse}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              Assigné
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white text-xs font-bold px-7 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingUser ? 'Enregistrer les modifications' : 'Créer le compte utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
