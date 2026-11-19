'use client';

import { useState, useEffect } from 'react';
import PropertiesPage from '@/app/dashboard/properties/page';
import UsersManagementPage from '@/app/dashboard/users/page';
import TenantsPage from '@/app/dashboard/tenants/page';
import PaymentsPage from '@/app/dashboard/payments/page';
import SettingsPage from '@/app/dashboard/settings/page';
import { generateQuittancePDF, generateContractPDF } from '@/lib/pdfGenerator';
import { 
  Building2, Users, FileText, DollarSign, Plus, MapPin, Tag, 
  Phone, Mail, FileBadge, CheckCircle, Clock, AlertTriangle, 
  MessageCircle, Loader2, LayoutDashboard, TrendingUp, AlertCircle as AlertIcon,
  Search, Bell, ChevronRight, ShieldCheck, ArrowUpRight, Sparkles, Activity, Key, Percent, UserCog, Shield, UserPlus, History, FileSpreadsheet, Settings, Download, Upload, Database, Check
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [obrData, setObrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Users state for Super Admin
  const [appUsers, setAppUsers] = useState<any[]>([
    { id: '1', nom_complet: 'Administrateur Gitega', email: 'admin@nyumbagestion.bi', role: 'Super Admin', statut: 'Actif', derniere_connexion: 'Aujourd\'hui' },
    { id: '2', nom_complet: 'Jean Ndayishimiye', email: 'gestionnaire@nyumbagestion.bi', role: 'Gestionnaire', statut: 'Actif', derniere_connexion: 'Hier' },
    { id: '3', nom_complet: 'Marie Nkurunziza', email: 'comptable@nyumbagestion.bi', role: 'Comptable', statut: 'Actif', derniere_connexion: 'Il y a 3 jours' }
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uRole, setURole] = useState('gestionnaire');
  const [uPassword, setUPassword] = useState('');
  const [selectedUserProps, setSelectedUserProps] = useState<string[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const handleToggleUserStatus = (id: string) => {
    setAppUsers(appUsers.map(u => u.id === id ? { ...u, statut: u.statut === 'Actif' ? 'Suspendu' : 'Actif' } : u));
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    }
  };

  // Settings state
  const [companyName, setCompanyName] = useState('NKURADOAPP Immobilier S.A.');
  const [companyNif, setCompanyNif] = useState('4001234567');
  const [companyRc, setCompanyRc] = useState('12345/2026');
  const [companyPhone, setCompanyPhone] = useState('+257 79 00 00 00');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Auth states
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (e) { setUser(null); }
    }
  }, []);
  const [loginEmail, setLoginEmail] = useState('admin@nyumbagestion.bi');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        loadData();
      } else {
        setLoginError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      setLoginError('Erreur de connexion au serveur');
    }
  };

  // Modals
  const [showPropModal, setShowPropModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [nomBien, setNomBien] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeBien, setTypeBien] = useState('appartement');
  const [loyer, setLoyer] = useState('');
  const [charges, setCharges] = useState('');
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [propStatut, setPropStatut] = useState('vacant');

  const openCreatePropertyModal = () => {
    setEditingProperty(null);
    setNomBien('');
    setAdresse('');
    setTypeBien('appartement');
    setLoyer('');
    setCharges('');
    setPropStatut('vacant');
    setShowPropModal(true);
  };

  const openEditPropertyModal = (p: any) => {
    setEditingProperty(p);
    setNomBien(p.nom_bien);
    setAdresse(p.adresse);
    setTypeBien(p.type_bien || 'appartement');
    setLoyer(p.loyer_mensuel?.toString() || '');
    setCharges(p.charges?.toString() || '');
    setPropStatut(p.statut || 'vacant');
    setShowPropModal(true);
  };

  const [selectedQuittance, setSelectedQuittance] = useState<any | null>(null);

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bien immobilier ?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        loadData();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
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
          loyer_mensuel: Number(loyer) || 0,
          charges: Number(charges) || 0,
          statut: propStatut
        })
      });
      if (res.ok) {
        setShowPropModal(false);
        setEditingProperty(null);
        setNomBien('');
        setAdresse('');
        setLoyer('');
        setCharges('');
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [tNom, setTNom] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tWhatsapp, setTWhatsapp] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tCni, setTCni] = useState('');
  const [tPropId, setTPropId] = useState('');
  const [tDateDebut, setTDateDebut] = useState('');
  const [tCaution, setTCaution] = useState('');

  const [lPropId, setLPropId] = useState('');
  const [lTenantId, setLTenantId] = useState('');
  const [lDateDebut, setLDateDebut] = useState('');
  const [lCaution, setLCaution] = useState('');
  const [lEcheance, setLEcheance] = useState('5');

  const [pPropId, setPPropId] = useState('');
  const [pMois, setPMois] = useState('2026-10');
  const [pAttendu, setPAttendu] = useState('');
  const [pPaye, setPPaye] = useState('');
  const [pMode, setPMode] = useState('lumicash');
  const [pRef, setPRef] = useState('');

  const [expenses, setExpenses] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const [ePropId, setEPropId] = useState('');
  const [eCat, setECat] = useState('Maintenance');
  const [eType, setEType] = useState('recuperable');
  const [eMontant, setEMontant] = useState('');
  const [eFournisseur, setEFournisseur] = useState('');
  const [eDesc, setEDesc] = useState('');

  const [mPropId, setMPropId] = useState('');
  const [mTitre, setMTitre] = useState('');
  const [mCat, setMCat] = useState('plomberie');
  const [mPrio, setMPrio] = useState('moyenne');
  const [mPrestataire, setMPrestataire] = useState('');
  const [mDesc, setMDesc] = useState('');

  const loadData = async () => {
    try {
      const isManager = user?.role === 'gestionnaire';
      const queryParams = isManager && user?.id ? `?userId=${user.id}&role=gestionnaire` : '';

      const [resProp, resTenant, resLease, resPay, resExp, resMaint, resAudit, resObr, resUsers] = await Promise.all([
        fetch(`/api/properties${queryParams}`).then(r => r.json()).catch(() => []),
        fetch(`/api/tenants${queryParams}`).then(r => r.json()).catch(() => []),
        fetch(`/api/leases${queryParams}`).then(r => r.json()).catch(() => []),
        fetch(`/api/payments${queryParams}`).then(r => r.json()).catch(() => []),
        fetch('/api/expenses').then(r => r.json()).catch(() => []),
        fetch('/api/maintenance').then(r => r.json()).catch(() => []),
        fetch('/api/audit').then(r => r.json()).catch(() => []),
        fetch('/api/obr').then(r => r.json()).catch(() => null),
        fetch('/api/users').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(resProp)) setProperties(resProp);
      if (Array.isArray(resTenant)) setTenants(resTenant);
      if (Array.isArray(resLease)) setLeases(resLease);
      if (Array.isArray(resPay)) setPayments(resPay);
      if (Array.isArray(resExp)) setExpenses(resExp);
      if (Array.isArray(resMaint)) setMaintenance(resMaint);
      if (Array.isArray(resAudit)) setAuditLogs(resAudit);
      if (Array.isArray(resUsers)) setAppUsers(resUsers);
      if (resObr) setObrData(resObr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_complet: uName,
          email: uEmail,
          telephone: uPhone,
          role: uRole,
          password: uPassword,
          assigned_property_ids: selectedUserProps
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création');
        return;
      }
      setShowUserModal(false);
      setUName(''); setUEmail(''); setUPhone(''); setUPassword(''); setSelectedUserProps([]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };



  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nom_complet: tNom, 
        telephone: tPhone, 
        whatsapp: tWhatsapp, 
        email: tEmail, 
        numero_cni_passeport: tCni,
        property_id: tPropId,
        date_debut: tDateDebut,
        montant_caution: Number(tCaution)
      })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la création du locataire');
      return;
    }
    setShowTenantModal(false);
    setTNom(''); setTPhone(''); setTWhatsapp(''); setTEmail(''); setTCni(''); setTPropId(''); setTDateDebut(''); setTCaution('');
    loadData();
  };

  const handleTerminateLease = async (leaseId: string) => {
    if (!confirm('Confirmer le départ de ce locataire et la libération du bien ?')) return;
    const res = await fetch(`/api/leases/${leaseId}`, { method: 'DELETE' });
    if (res.ok) {
      loadData();
    } else {
      alert('Erreur lors de la libération du bien');
    }
  };

  const handleAddLease = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: lPropId, tenant_id: lTenantId, date_debut: lDateDebut, montant_caution: Number(lCaution), jour_echeance_paiement: Number(lEcheance) })
    });
    setShowLeaseModal(false);
    setLPropId(''); setLTenantId(''); setLDateDebut(''); setLCaution('');
    loadData();
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lease_id: pPropId, mois_concerne: pMois, montant_attendu: Number(pAttendu), montant_paye: Number(pPaye), mode_paiement: pMode, reference_transaction: pRef })
    });
    setShowPaymentModal(false);
    setPPropId(''); setPRef(''); setPAttendu(''); setPPaye('');
    loadData();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: ePropId, categorie: eCat, type_charge: eType, montant: Number(eMontant), fournisseur: eFournisseur, description: eDesc })
    });
    setShowExpenseModal(false);
    setEPropId(''); setECat(''); setEMontant(''); setEFournisseur(''); setEDesc('');
    loadData();
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: mPropId, titre: mTitre, categorie: mCat, priorite: mPrio, prestataire: mPrestataire, description: mDesc })
    });
    setShowMaintenanceModal(false);
    setMPropId(''); setMTitre(''); setMPrestataire(''); setMDesc('');
    loadData();
  };

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.montant_paye || 0), 0);
  const totalExpected = payments.reduce((acc, p) => acc + Number(p.montant_attendu || 0), 0) || (totalCollected + 1);
  const collectionRate = Math.min(100, Math.round((totalCollected / totalExpected) * 100));
  const totalArrears = payments.reduce((acc, p) => acc + Number(p.montant_restant || 0), 0);
  const occupiedProperties = properties.filter(p => p.statut === 'occupe').length;

  const filteredProperties = properties.filter(p => {
    if (!p) return false;
    const name = String(p.nom_bien || '').toLowerCase();
    const addr = String(p.adresse || '').toLowerCase();
    const query = String(searchQuery || '').toLowerCase();
    return name.includes(query) || addr.includes(query);
  });

  const filteredTenants = tenants.filter(t => 
    t.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.telephone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg p-10 md:p-12 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-2xl shadow-lg">
              NK
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">NKURADOAPP</h1>
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-widest">Portail de Gestion Immobilière • Gitega, Burundi</p>
          </div>

          {loginError && (
            <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-blue-200 mb-2">Adresse Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-slate-900/60 border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-200 mb-2">Mot de passe</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-900/60 border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 font-mono" />
            </div>
            <button type="submit" className="mt-2 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all">
              Se connecter
            </button>
          </form>

          <button 
            type="button" 
            onClick={async () => {
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'admin@nyumbagestion.bi', password: 'admin123' })
                });
                const data = await res.json();
                if (res.ok) {
                  setUser(data.user);
                  localStorage.setItem('currentUser', JSON.stringify(data.user));
                  loadData();
                } else {
                  alert(data.error || 'Erreur quick login');
                }
              } catch (e) {
                alert('Erreur serveur quick login');
              }
            }} 
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 font-bold text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" /> Connexion Rapide Super Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] flex items-center justify-center font-black text-white shadow-md text-base">
           NK 
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight">NKURADOAPP</h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                GITEGA BURUNDI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text" 
              placeholder="Rechercher bien, locataire..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs w-64 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.nom_complet}</p>
              <p className="text-[10px] uppercase font-bold text-blue-600">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs shadow-sm border border-blue-200">
              {user.nom_complet.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <button onClick={() => { setUser(null); localStorage.removeItem('currentUser'); }} className="text-slate-600 hover:text-red-600 text-xs font-bold ml-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-all hover:bg-red-50">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Navigation strictly on the Left, Content on the Right */}
      <div className="flex-1 flex flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 shrink-0 shadow-sm min-h-[calc(100vh-5rem)]">
          <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
            {user?.role === 'admin' ? 'Navigation Super Admin' : 'Navigation Gestionnaire'}
          </div>
          
          {[
            { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
            { id: 'properties', label: 'Patrimoine', icon: Building2, count: properties.length },
            { id: 'tenants', label: 'Locataires', icon: Users, count: tenants.length },
            { id: 'leases', label: 'Contrats de Bail', icon: FileText, count: leases.length },
            { id: 'payments', label: 'Encaissements', icon: DollarSign, count: payments.length },
            { id: 'expenses', label: 'Charges & Dépenses', icon: Tag, count: expenses.length },
            { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle, count: maintenance.length },
            { id: 'users', label: 'Gestion Utilisateurs', icon: UserCog, count: appUsers.length },
            { id: 'audit', label: 'Journal d\'Audit', icon: History, count: auditLogs.length },
            { id: 'obr', label: 'Rapports Fiscaux OBR', icon: FileSpreadsheet },
            { id: 'settings', label: 'Paramètres & Sauvegarde', icon: Settings }
          ]
          .filter(tab => {
            if (user?.role === 'gestionnaire') {
              return ['dashboard', 'properties', 'tenants', 'leases', 'payments', 'expenses', 'maintenance'].includes(tab.id);
            }
            return true;
          })
          .map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  loadData();
                }} 
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-4 h-4" /> {tab.label}
                </div>
                {tab.count !== undefined && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Area on the Right */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-[#f8fafc]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-48 gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Chargement des données...</p>
            </div>
          ) : (
            <>
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-10 max-w-7xl mx-auto">
                  <div className="elite-card p-10 flex flex-col justify-between gap-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-xs text-blue-700 w-fit font-bold">
                        <Activity className="w-3.5 h-3.5 text-blue-600" /> NKURADOAPP • GITEGA BURUNDI
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Pilotez votre parc immobilier en toute sérénité
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button onClick={openCreatePropertyModal} className="elite-button px-6 py-3.5 text-xs flex items-center gap-2.5 shadow-sm">
                        <Plus className="w-4 h-4" /> Ajouter un bien
                      </button>
                      <button onClick={() => setShowPaymentModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-xl text-xs transition-all flex items-center gap-2.5 shadow-sm">
                        <DollarSign className="w-4 h-4" /> Saisir un encaissement
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="elite-card p-7 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Patrimoine</p>
                          <h3 className="text-4xl font-black text-slate-900 mt-3">{properties.length}</h3>
                        </div>
                        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl"><Building2 className="w-6 h-6" /></div>
                      </div>
                      <p className="text-xs text-emerald-600 mt-6 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> {occupiedProperties} biens occupés
                      </p>
                    </div>

                    <div className="elite-card p-7 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Taux de Recouvrement</p>
                          <h3 className="text-4xl font-black text-blue-700 mt-3">{collectionRate}%</h3>
                        </div>
                        <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl"><Percent className="w-6 h-6" /></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-6 font-semibold">Performance financière globale</p>
                    </div>

                    <div className="elite-card p-7 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Total Encaissé</p>
                          <h3 className="text-3xl font-black text-slate-900 mt-3">{totalCollected.toLocaleString()} FBU</h3>
                        </div>
                        <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
                      </div>
                      <p className="text-xs text-emerald-600 mt-6 font-bold">Devise : FBU</p>
                    </div>

                    <div className="elite-card p-7 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Arriérés Dûs</p>
                          <h3 className="text-3xl font-black text-amber-600 mt-3">{totalArrears.toLocaleString()} FBU</h3>
                        </div>
                        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl"><AlertIcon className="w-6 h-6" /></div>
                      </div>
                      <p className="text-xs text-amber-600 mt-6 font-bold">Suivi automatique</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROPERTIES TAB */}
              {activeTab === 'properties' && <PropertiesPage />}

              {/* TENANTS TAB */}
              {activeTab === 'tenants' && <TenantsPage />}

              {/* LEASES TAB */}
              {activeTab === 'leases' && (
                <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                  <div className="elite-card p-8 flex justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Contrats de Bail</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Liaison officielle entre biens et locataires</p>
                    </div>
                    <button onClick={() => setShowLeaseModal(true)} className="elite-button px-5 py-3 text-xs flex items-center gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> Nouveau Contrat de Bail
                    </button>
                  </div>

                  {leases.length === 0 ? (
                    <div className="elite-card p-20 text-center flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <FileText className="w-14 h-14 text-slate-400" />
                      <h3 className="font-bold text-slate-800 text-base">Aucun bail actif</h3>
                      <button onClick={() => setShowLeaseModal(true)} className="elite-button text-xs px-5 py-2.5">Créer un bail</button>
                    </div>
                  ) : (
                    <div className="elite-card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-5">Bien Immobilier</th>
                            <th className="p-5">Locataire</th>
                            <th className="p-5">Date Début</th>
                            <th className="p-5">Échéance</th>
                            <th className="p-5">Caution</th>
                            <th className="p-5">Statut</th>
                            <th className="p-5 text-right">Contrat PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                          {leases.map((l, idx) => (
                            <tr key={`lease-${l.id || idx}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 font-bold text-slate-900 flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 text-blue-600" /> {l.nom_bien}
                              </td>
                              <td className="p-5 font-bold text-slate-800">{l.tenant_name}</td>
                              <td className="p-5 font-mono text-slate-500">{new Date(l.date_debut).toLocaleDateString()}</td>
                              <td className="p-5 text-slate-700">Le {l.jour_echeance_paiement} du mois</td>
                              <td className="p-5 font-bold text-slate-900">{Number(l.montant_caution).toLocaleString()} FBU</td>
                              <td className="p-5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3" /> Actif
                                </span>
                              </td>
                              <td className="p-5 text-right">
                                <button onClick={() => generateContractPDF(l)} className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-xl text-[11px] transition-all inline-flex items-center gap-1.5 shadow-sm">
                                  <FileText className="w-3.5 h-3.5" /> PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && <PaymentsPage />}

              {/* EXPENSES TAB */}
              {activeTab === 'expenses' && (
                <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                  <div className="elite-card p-8 flex justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Charges & Dépenses</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Suivi des charges récupérables et non récupérables (FBU)</p>
                    </div>
                    <button onClick={() => setShowExpenseModal(true)} className="elite-button px-5 py-3 text-xs flex items-center gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> Ajouter une dépense
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="elite-card p-20 text-center flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <Tag className="w-14 h-14 text-slate-400" />
                      <h3 className="font-bold text-slate-800 text-base">Aucune dépense enregistrée</h3>
                      <button onClick={() => setShowExpenseModal(true)} className="elite-button text-xs px-5 py-2.5">Ajouter une dépense</button>
                    </div>
                  ) : (
                    <div className="elite-card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-5">Bien Immobilier</th>
                            <th className="p-5">Catégorie</th>
                            <th className="p-5">Type de charge</th>
                            <th className="p-5">Montant</th>
                            <th className="p-5">Fournisseur</th>
                            <th className="p-5">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                          {expenses.map((ex, idx) => (
                            <tr key={`exp-${ex.id || idx}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 font-bold text-slate-900 flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 text-blue-600" /> {ex.nom_bien || 'N/A'}
                              </td>
                              <td className="p-5 font-bold text-slate-800">{ex.categorie}</td>
                              <td className="p-5">
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                                  ex.type_charge === 'recuperable' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {ex.type_charge}
                                </span>
                              </td>
                              <td className="p-5 font-black text-slate-900 text-sm">{Number(ex.montant).toLocaleString()} FBU</td>
                              <td className="p-5 text-slate-600">{ex.fournisseur}</td>
                              <td className="p-5 font-mono text-slate-500">{new Date(ex.date_depense).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* MAINTENANCE TAB */}
              {activeTab === 'maintenance' && (
                <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                  <div className="elite-card p-8 flex justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Maintenance & Interventions</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Suivi des tickets de réparation et incidents</p>
                    </div>
                    <button onClick={() => setShowMaintenanceModal(true)} className="elite-button px-5 py-3 text-xs flex items-center gap-2 shadow-sm">
                      <Plus className="w-4 h-4" /> Nouveau ticket
                    </button>
                  </div>

                  {maintenance.length === 0 ? (
                    <div className="elite-card p-20 text-center flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <AlertTriangle className="w-14 h-14 text-slate-400" />
                      <h3 className="font-bold text-slate-800 text-base">Aucun ticket de maintenance</h3>
                      <button onClick={() => setShowMaintenanceModal(true)} className="elite-button text-xs px-5 py-2.5">Créer un ticket</button>
                    </div>
                  ) : (
                    <div className="elite-card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-5">Bien</th>
                            <th className="p-5">Intitulé du Problème</th>
                            <th className="p-5">Catégorie</th>
                            <th className="p-5">Priorité</th>
                            <th className="p-5">Prestataire</th>
                            <th className="p-5">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                          {maintenance.map((m, idx) => (
                            <tr key={`maint-${m.id || idx}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 font-bold text-slate-900 flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 text-blue-600" /> {m.nom_bien || 'N/A'}
                              </td>
                              <td className="p-5 font-black text-slate-900">{m.titre}</td>
                              <td className="p-5 uppercase font-bold text-blue-700">{m.categorie}</td>
                              <td className="p-5">
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                                  m.priorite === 'urgente' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {m.priorite}
                                </span>
                              </td>
                              <td className="p-5 text-slate-700">{m.prestataire}</td>
                              <td className="p-5">
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold uppercase border border-blue-200">
                                  {m.statut}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* USERS MANAGEMENT TAB */}
              {activeTab === 'users' && <UsersManagementPage />}

              {/* AUDIT LOGS TAB */}
              {activeTab === 'audit' && (
                <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                  <div className="elite-card p-8 flex justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Journal d&apos;Audit en Temps Réel ({auditLogs.length})</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Traçabilité complète des actions critiques du système</p>
                    </div>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="elite-card p-20 text-center flex flex-col items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <History className="w-14 h-14 text-slate-400" />
                      <h3 className="font-bold text-slate-800 text-base">Aucun journal d&apos;audit enregistré</h3>
                    </div>
                  ) : (
                    <div className="elite-card overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <tr>
                            <th className="p-5">Action</th>
                            <th className="p-5">Utilisateur / IP</th>
                            <th className="p-5">Détails</th>
                            <th className="p-5 text-right">Horodatage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                          {auditLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 font-bold text-blue-700 uppercase">{log.action || log.type_action || 'ACTION'}</td>
                              <td className="p-5 text-slate-600 font-mono">{log.utilisateur || log.email || 'Admin'}</td>
                              <td className="p-5 text-slate-800">{log.details || log.description || 'Opération système'}</td>
                              <td className="p-5 text-right font-mono text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleString() : 'Récemment'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* OBR TAX REPORT TAB */}
              {activeTab === 'obr' && (
                <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                  <div className="elite-card p-8 flex justify-between items-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Conformité Fiscale OBR</h2>
                      <p className="text-xs text-slate-500 mt-0.5">États financiers et déclarations de revenus locatifs (Burundi)</p>
                    </div>
                    <button onClick={() => alert('Exportation du rapport OBR en cours...')} className="elite-button px-5 py-3 text-xs flex items-center gap-2 shadow-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Exporter le Bilan OBR
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="elite-card p-7 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Revenu Locatif Brut Annuel</p>
                      <h3 className="text-3xl font-black text-slate-900 mt-2">{(totalCollected * 12).toLocaleString()} FBU</h3>
                      <p className="text-xs text-emerald-600 mt-4 font-semibold">Conforme barème fiscal</p>
                    </div>
                    <div className="elite-card p-7 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Impôt Prévu (Taux Légal)</p>
                      <h3 className="text-3xl font-black text-blue-700 mt-2">{Math.round(totalCollected * 12 * 0.2).toLocaleString()} FBU</h3>
                      <p className="text-xs text-slate-500 mt-4 font-semibold">Base 20% revenus fonciers</p>
                    </div>
                    <div className="elite-card p-7 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase">Statut Déclaratif OBR</p>
                      <h3 className="text-3xl font-black text-emerald-600 mt-2">À JOUR</h3>
                      <p className="text-xs text-emerald-600 mt-4 font-semibold">NIF : 4001234567</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS & BACKUP TAB */}
              {activeTab === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Compte Utilisateur</h3>
                <p className="text-xs text-slate-500 mt-0.5">Créez un accès sécurisé et assignez des biens immobiliers.</p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all font-bold">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="flex flex-col gap-6 mt-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">1. Rôle & Niveau d&apos;Accès</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setURole('gestionnaire')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                      uRole === 'gestionnaire' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                        <UserCog className={`w-4 h-4 ${uRole === 'gestionnaire' ? 'text-blue-600' : 'text-slate-400'}`} />
                        Gestionnaire
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${uRole === 'gestionnaire' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                        {uRole === 'gestionnaire' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">Gère uniquement les biens et locataires assignés.</p>
                  </div>

                  <div 
                    onClick={() => setURole('admin')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                      uRole === 'admin' ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                        <ShieldCheck className={`w-4 h-4 ${uRole === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                        Super Admin
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${uRole === 'admin' ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                        {uRole === 'admin' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">Accès complet à l&apos;ensemble de la plateforme.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">2. Informations Personnelles</label>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Nom Complet</label>
                  <input type="text" required value={uName} onChange={e => setUName(e.target.value)} placeholder="Ex: Jean Bosco Nkurunziza" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Adresse Email</label>
                    <input type="email" required value={uEmail} onChange={e => setUEmail(e.target.value)} placeholder="jean@nyumbagestion.bi" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Téléphone</label>
                    <input type="text" required value={uPhone} onChange={e => setUPhone(e.target.value)} placeholder="+257 79 00 00 00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Mot de passe temporaire</label>
                  <input type="password" required value={uPassword} onChange={e => setUPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  3. Biens Assignés ({selectedUserProps.length})
                </label>
                <div className="max-h-44 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                  {properties.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aucun bien disponible.</p>
                  ) : (
                    properties.map(prop => {
                      const isSelected = selectedUserProps.includes(prop.id);
                      return (
                        <div
                          key={prop.id}
                          onClick={() => {
                            if (isSelected) setSelectedUserProps(selectedUserProps.filter(id => id !== prop.id));
                            else setSelectedUserProps([...selectedUserProps, prop.id]);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isSelected} onChange={() => {}} className="pointer-events-none w-4 h-4" />
                            <span>{prop.nom_bien}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{prop.adresse}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Annuler</button>
                <button type="submit" className="bg-[#1e3a8a] hover:bg-blue-900 text-white text-xs font-bold px-7 py-3 rounded-xl shadow-md">Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPropModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProperty ? 'Modifier le bien immobilier' : 'Ajouter un bien immobilier'}
              </h3>
              <button onClick={() => setShowPropModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveProperty} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom du bien</label>
                <input type="text" required value={nomBien} onChange={e => setNomBien(e.target.value)} placeholder="ex: Appartement Gitega" className="elite-input text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse</label>
                <input type="text" required value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="ex: Avenue de l'Indépendance" className="elite-input text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de bien</label>
                  <select value={typeBien} onChange={e => setTypeBien(e.target.value)} className="elite-input text-xs font-semibold">
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="boutique">Boutique</option>
                    <option value="bureau">Bureau</option>
                  </select>
                </div>
                {editingProperty && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Statut</label>
                    <select value={propStatut} onChange={e => setPropStatut(e.target.value)} className="elite-input text-xs font-semibold">
                      <option value="vacant">Vacant</option>
                      <option value="occupe">Occupé</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Loyer mensuel (FBU)</label>
                  <input type="number" required value={loyer} onChange={e => setLoyer(e.target.value)} placeholder="450000" className="elite-input text-xs font-bold text-blue-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Charges (FBU)</label>
                  <input type="number" value={charges} onChange={e => setCharges(e.target.value)} placeholder="50000" className="elite-input text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowPropModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTenantModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Nouveau locataire & Attribution</h3>
              <button onClick={() => setShowTenantModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            {properties.filter(p => p.statut === 'vacant').length === 0 ? (
              <div className="flex flex-col gap-4 text-center py-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold leading-relaxed">
                  ⚠️ Aucun bien vacant disponible. Veuillez d&apos;abord ajouter un bien immobilier ou libérer un bien existant.
                </div>
                <button type="button" onClick={() => setShowTenantModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bien vacant à assigner</label>
                  <select required value={tPropId} onChange={e => {
                    setTPropId(e.target.value);
                    const prop = properties.find(p => p.id === e.target.value);
                    if (prop) {
                      setTCaution((Number(prop.loyer_mensuel) * 2).toString());
                    }
                  }} className="elite-input text-xs font-bold text-blue-700">
                    <option value="">-- Choisir un bien vacant --</option>
                    {properties.filter(p => p.statut === 'vacant').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom_bien} ({Number(p.loyer_mensuel).toLocaleString()} FBU/mois)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom complet</label>
                  <input type="text" required value={tNom} onChange={e => setTNom(e.target.value)} placeholder="ex: Jean Ndayishimiye" className="elite-input text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone</label>
                    <input type="text" required value={tPhone} onChange={e => setTPhone(e.target.value)} placeholder="+257 79..." className="elite-input text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp</label>
                    <input type="text" value={tWhatsapp} onChange={e => setTWhatsapp(e.target.value)} placeholder="+257 79..." className="elite-input text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="jean@gmail.com" className="elite-input text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">N° CNI ou Passeport</label>
                    <input type="text" required value={tCni} onChange={e => setTCni(e.target.value)} placeholder="101/1990/..." className="elite-input text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Caution versée (FBU)</label>
                    <input type="number" required value={tCaution} onChange={e => setTCaution(e.target.value)} placeholder="ex: 900000" className="elite-input text-xs font-bold text-emerald-700" />
                  </div>
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowTenantModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                  <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Enregistrer & Assigner</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showLeaseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Nouveau Contrat de Bail</h3>
              <button onClick={() => setShowLeaseModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddLease} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sélectionner le bien</label>
                <select required value={lPropId} onChange={e => setLPropId(e.target.value)} className="elite-input text-xs">
                  <option value="">-- Choisir un bien --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.nom_bien}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sélectionner le locataire</label>
                <select required value={lTenantId} onChange={e => setLTenantId(e.target.value)} className="elite-input text-xs">
                  <option value="">-- Choisir un locataire --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nom_complet}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date de début</label>
                  <input type="date" required value={lDateDebut} onChange={e => setLDateDebut(e.target.value)} className="elite-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jour d&apos;échéance</label>
                  <input type="number" min="1" max="31" required value={lEcheance} onChange={e => setLEcheance(e.target.value)} className="elite-input text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Caution (FBU)</label>
                <input type="number" required value={lCaution} onChange={e => setLCaution(e.target.value)} placeholder="ex: 900000" className="elite-input text-xs" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowLeaseModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Créer le bail</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Saisir un encaissement</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sélectionner le bien</label>
                <select required value={pPropId} onChange={e => {
                  setPPropId(e.target.value);
                  const prop = properties.find(p => p.id === e.target.value);
                  if (prop) {
                    const total = Number(prop.loyer_mensuel) + Number(prop.charges);
                    setPAttendu(total.toString());
                    setPPaye(total.toString());
                  }
                }} className="elite-input text-xs">
                  <option value="">-- Choisir un bien --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.nom_bien} ({Number(p.loyer_mensuel) + Number(p.charges)} FBU)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mois concerné (YYYY-MM)</label>
                <input type="text" required value={pMois} onChange={e => setPMois(e.target.value)} placeholder="2026-10" className="elite-input text-xs font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendu (FBU)</label>
                  <input type="number" required value={pAttendu} onChange={e => setPAttendu(e.target.value)} className="elite-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Versé (FBU)</label>
                  <input type="number" required value={pPaye} onChange={e => setPPaye(e.target.value)} className="elite-input text-xs text-emerald-700 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mode de Paiement</label>
                <select value={pMode} onChange={e => setPMode(e.target.value)} className="elite-input text-xs uppercase font-bold">
                  <option value="lumicash">Lumicash</option>
                  <option value="ecocash">Ecocash</option>
                  <option value="virement">Virement</option>
                  <option value="especes">Espèces</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence de transaction</label>
                <input type="text" required value={pRef} onChange={e => setPRef(e.target.value)} placeholder="ex: LUMI-9847521" className="elite-input text-xs font-mono" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Enregistrer une dépense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bien concerné</label>
                <select required value={ePropId} onChange={e => setEPropId(e.target.value)} className="elite-input text-xs">
                  <option value="">-- Choisir un bien --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.nom_bien}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie</label>
                  <input type="text" required value={eCat} onChange={e => setECat(e.target.value)} placeholder="ex: Plomberie" className="elite-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de charge</label>
                  <select value={eType} onChange={e => setEType(e.target.value)} className="elite-input text-xs">
                    <option value="recuperable">Récupérable</option>
                    <option value="non_recuperable">Non Récupérable</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant (FBU)</label>
                  <input type="number" required value={eMontant} onChange={e => setEMontant(e.target.value)} placeholder="50000" className="elite-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Fournisseur</label>
                  <input type="text" value={eFournisseur} onChange={e => setEFournisseur(e.target.value)} placeholder="Quincaillerie..." className="elite-input text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <input type="text" value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Réparation fuite robinet" className="elite-input text-xs" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="elite-card max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Nouveau ticket de maintenance</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddMaintenance} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bien concerné</label>
                <select required value={mPropId} onChange={e => setMPropId(e.target.value)} className="elite-input text-xs">
                  <option value="">-- Choisir un bien --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.nom_bien}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre du problème</label>
                <input type="text" required value={mTitre} onChange={e => setMTitre(e.target.value)} placeholder="ex: Panne disjoncteur" className="elite-input text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie</label>
                  <select value={mCat} onChange={e => setMCat(e.target.value)} className="elite-input text-xs">
                    <option value="plomberie">Plomberie</option>
                    <option value="electricite">Électricité</option>
                    <option value="menuiserie">Menuiserie</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Priorité</label>
                  <select value={mPrio} onChange={e => setMPrio(e.target.value)} className="elite-input text-xs">
                    <option value="moyenne">Moyenne</option>
                    <option value="urgente">Urgente</option>
                    <option value="basse">Basse</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Prestataire assigné</label>
                <input type="text" value={mPrestataire} onChange={e => setMPrestataire(e.target.value)} placeholder="Nom du technicien" className="elite-input text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <input type="text" value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Détails de l'intervention..." className="elite-input text-xs" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl border border-slate-200">Annuler</button>
                <button type="submit" className="flex-1 elite-button py-3 text-xs shadow-sm">Créer le ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUITTANCE PREVIEW MODAL */}
      {selectedQuittance && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#047857] p-8 text-white relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide text-blue-200">NKURADOAPP</h3>
                    <p className="text-[11px] text-slate-300">Gestion des loyers • Gitega, Burundi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-mono font-bold tracking-wider text-white border border-white/20">
                    N° {selectedQuittance.numero_quittance || 'QL-2026-000001'}
                  </span>
                  <button onClick={() => setSelectedQuittance(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-all">✕</button>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Quittance de loyer</h2>
                  <p className="text-xs text-emerald-200 mt-1 font-medium">Établie à Gitega, le {new Date(selectedQuittance.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Original</p>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-lg inline-flex items-center gap-1.5 uppercase tracking-wider">
                  ✓ Payée
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 flex flex-col gap-6 bg-[#f8fafc] max-h-[75vh] overflow-y-auto">
              {/* Main Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Montant Reçu</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                      {Number(selectedQuittance.montant_paye).toLocaleString()}
                    </h3>
                    <span className="font-extrabold text-blue-700 text-sm">FBu</span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-1 font-medium">Paiement intégral · Solde 0 FBu</p>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Période</span>
                    <span className="font-bold text-slate-800">{selectedQuittance.mois_concerne}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Reçu le</span>
                    <span className="font-bold text-slate-800">{new Date(selectedQuittance.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Mode de paiement</span>
                    <span className="font-bold uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{selectedQuittance.mode_paiement}</span>
                  </div>
                </div>
              </div>

              {/* Bailleur & Locataire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-200">
                    MC
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bailleur</p>
                    <h4 className="font-black text-slate-900 text-sm">MAYOYA Consolate Félicité</h4>
                    <p className="text-[11px] text-slate-500">+257 79 00 00 00 · NIF: 4000123456</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                    {selectedQuittance.tenant_name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Locataire</p>
                    <h4 className="font-black text-slate-900 text-sm">{selectedQuittance.tenant_name}</h4>
                    <p className="text-[11px] text-slate-500">Téléphone vérifié · CNI enregistrée</p>
                  </div>
                </div>
              </div>

              {/* Bien loué */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Bien loué</p>
                    <h4 className="font-black text-slate-900 text-sm">{selectedQuittance.nom_bien}</h4>
                    <p className="text-slate-500 text-[11px]">Magarama, commune de Gitega, province de Gitega</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500">Réf. bien : MAG-001</span>
                  <p className="text-[11px] font-bold text-slate-500">Réf. bail : BAIL-2026-001</p>
                </div>
              </div>

              {/* Financial table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-3 text-[11px] font-black uppercase tracking-wider flex justify-between">
                  <span>Détail du paiement</span>
                  <span>Montant (FBu)</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  <div className="px-6 py-3 flex justify-between"><span>Loyer principal</span><span className="font-bold">{Number(selectedQuittance.montant_attendu || selectedQuittance.montant_paye).toLocaleString()} FBu</span></div>
                  <div className="px-6 py-3 flex justify-between"><span>Charges</span><span>0 FBu</span></div>
                  <div className="px-6 py-3 flex justify-between"><span>Pénalités / autres</span><span>0 FBu</span></div>
                  <div className="px-6 py-3 flex justify-between font-bold bg-slate-50 text-slate-900"><span>Total dû</span><span>{Number(selectedQuittance.montant_attendu || selectedQuittance.montant_paye).toLocaleString()} FBu</span></div>
                  <div className="px-6 py-4 flex justify-between font-black text-sm bg-emerald-600 text-white"><span>Montant reçu</span><span>{Number(selectedQuittance.montant_paye).toLocaleString()} FBu</span></div>
                  <div className="px-6 py-3 flex justify-between font-bold text-emerald-700 bg-emerald-50/50"><span>Solde restant dû</span><span>0 FBu</span></div>
                </div>
              </div>

              {/* Attestation */}
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed font-medium">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-700 block mb-1">Attestation</span>
                Je soussigné <b>Rémy Gahutu</b>, gestionnaire, agissant par délégation et pour le compte de <b>MAYOYA Consolate Félicité</b>, propriétaire du bien désigné ci-dessus, déclare avoir reçu de <b>{selectedQuittance.tenant_name}</b> la somme de {Number(selectedQuittance.montant_paye).toLocaleString()} FBu au titre du loyer de la période indiquée, et lui en donne quittance, sous réserve de tous droits.
              </div>

              {/* Signature, seal & QR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Encaisse et signé par</span>
                    <h4 className="font-black text-slate-900 text-sm mt-0.5">Rémy Gahutu <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold ml-1">Gestionnaire</span></h4>
                    <div className="my-3 py-2 border-y border-dashed border-slate-200">
                      <div className="h-8 flex items-end">
                        <svg className="w-36 h-6 text-indigo-800 opacity-80" viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 25 Q 20 5, 35 20 T 65 15 T 95 22 T 115 10" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    <p>Empreinte : <strong className="text-slate-800">89ED-FF47-B97E</strong></p>
                    <p>{new Date(selectedQuittance.created_at || Date.now()).toLocaleString()} (CAT, UTC+2)</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-slate-500 flex flex-col gap-1">
                    <span className="font-black text-slate-800 uppercase tracking-wider">Sceau Numérique</span>
                    <p>Document vérifié et authentifié par le système central de NyumbaGestion.</p>
                    <span className="text-emerald-700 font-bold mt-2">✓ Validé & Signé</span>
                  </div>
                  <div className="w-24 h-24 border-2 border-dashed border-emerald-500 rounded-xl p-1.5 flex items-center justify-center bg-emerald-50/30 shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-mono text-center p-1">
                      [QR CODE VERIF]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setSelectedQuittance(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                Fermer
              </button>
              <button onClick={() => generateQuittancePDF(selectedQuittance)} className="elite-button px-6 py-2.5 text-xs flex items-center gap-2 shadow-sm">
                <FileText className="w-4 h-4" /> Télécharger le PDF Officiel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
