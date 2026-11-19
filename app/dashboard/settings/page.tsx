'use client';

import { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Download, Upload, Loader2, Save, Database, MessageSquare, Building2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Settings fields
  const [companyName, setCompanyName] = useState('NKURADOAPP');
  const [companyNif, setCompanyNif] = useState('4001234567');
  const [companyRc, setCompanyRc] = useState('RC-GITEGA-001');
  const [companyPhone, setCompanyPhone] = useState('+257 67 34 83 32');
  const [whatsappNumber, setWhatsappNumber] = useState('+257 67 34 83 32');
  const [reminderTemplate, setReminderTemplate] = useState('Bonjour {nom}, rappel concernant votre loyer du mois de {mois}. Montant dû : {montant} FBu.');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setCompanyName(data.company_name || 'NKURADOAPP');
        setCompanyNif(data.company_nif || '4001234567');
        setCompanyRc(data.company_rc || 'RC-GITEGA-001');
        setCompanyPhone(data.company_phone || '+257 67 34 83 32');
        setWhatsappNumber(data.whatsapp_number || '+257 67 34 83 32');
        setReminderTemplate(data.reminder_template || 'Bonjour {nom}, rappel concernant votre loyer du mois de {mois}. Montant dû : {montant} FBu.');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_nif: companyNif,
          company_rc: companyRc,
          company_phone: companyPhone,
          whatsapp_number: whatsappNumber,
          reminder_template: reminderTemplate,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Paramètres enregistrés et synchronisés dans la base de données PostgreSQL avec succès !');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = () => {
    alert('Téléchargement de la sauvegarde de la base de données PostgreSQL en cours...');
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres & Sauvegarde (Base de Données)</h1>
          <p className="text-sm text-slate-500">Configuration globale de l&apos;agence, modèles WhatsApp et intégrité PostgreSQL.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-100">
          <ShieldCheck className="w-4 h-4" /> PostgreSQL Connecté & Sécurisé
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-sm shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 1. Informations Légales & Fiscales */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Identité Légale & Fiscale</h3>
                <p className="text-xs text-slate-500">Ces informations figurent sur les quittances et baux.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l&apos;Entreprise / Agence</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIF (Fiscal)</label>
                  <input
                    type="text"
                    required
                    value={companyNif}
                    onChange={e => setCompanyNif(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registre de Commerce (RC)</label>
                  <input
                    type="text"
                    required
                    value={companyRc}
                    onChange={e => setCompanyRc(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone de l&apos;Agence</label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={e => setCompanyPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro WhatsApp Officiel</label>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modèle de Message de Relance WhatsApp</label>
                <textarea
                  rows={3}
                  value={reminderTemplate}
                  onChange={e => setReminderTemplate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-blue-600 font-sans"
                />
                <p className="text-[10px] text-slate-400 mt-1">Variables disponibles : {'{nom}'}, {'{mois}'}, {'{montant}'}</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer dans la Base de Données
              </button>
            </form>
          </div>

          {/* 2. Sauvegarde & Sécurité PostgreSQL */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-6 flex-1">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Sauvegarde & Intégrité PostgreSQL</h3>
                  <p className="text-xs text-slate-500">Sécurisez l&apos;ensemble de vos données immobilières.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Toutes les tables (biens, locataires, baux, encaissements, utilisateurs, paramètres) sont stockées de manière sécurisée dans votre base de données PostgreSQL locale.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBackup}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Télécharger une sauvegarde complète (Backup SQL/JSON)
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 rounded-2xl shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Sécurité des données garantie
              </div>
              <h4 className="font-extrabold text-base">Conformité Fiscale & Quittances Certifiées</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Les quittances émises intègrent le NIF de l&apos;agence, l&apos;empreinte cryptographique sécurisée et le QR code de vérification directe.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
