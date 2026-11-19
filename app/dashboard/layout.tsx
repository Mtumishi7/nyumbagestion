'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, Users, FileText, DollarSign, LayoutDashboard, 
  ChevronRight, ShieldCheck, Activity, LogOut, UserCog
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Patrimoine', href: '/dashboard/properties', icon: Building2 },
    { label: 'Locataires', href: '/dashboard/tenants', icon: Users },
    { label: 'Contrats de Bail', href: '/dashboard/leases', icon: FileText },
    { label: 'Encaissements', href: '/dashboard/payments', icon: DollarSign },
    { label: 'Utilisateurs & Rôles', href: '/dashboard/users', icon: UserCog },
  ];

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

        <div className="flex items-center gap-5">
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">Administrateur</p>
              <p className="text-[10px] uppercase font-bold text-blue-600">Super Admin</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs shadow-sm border border-blue-200">
              AD
            </div>
            <Link href="/" className="text-slate-600 hover:text-red-600 text-xs font-bold ml-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-all hover:bg-red-50 inline-flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sortie
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container: Navigation strictly on the Left, Content on the Right */}
      <div className="flex-1 flex flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 shrink-0 shadow-sm min-h-[calc(100vh-5rem)]">
          <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Navigation</div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-4 h-4" /> {item.label}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
              </Link>
            );
          })}
        </aside>

        {/* Content Area on the Right */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}
