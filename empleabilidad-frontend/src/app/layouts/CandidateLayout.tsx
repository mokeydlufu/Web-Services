import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Search, User, FileText, Calendar, LogOut, Briefcase } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const CandidateLayout: React.FC = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/candidato/buscar', icon: Search, label: 'Buscar' },
    { to: '/candidato/perfil', icon: User, label: 'Mi Perfil' },
    { to: '/candidato/postulaciones', icon: FileText, label: 'Postulaciones' },
    { to: '/candidato/entrevistas', icon: Calendar, label: 'Entrevistas' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-blue-600">
              <Briefcase className="h-6 w-6" />
              <span className="text-xl font-bold text-slate-900 hidden sm:block">EmpleaPro</span>
            </div>
            
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.nombres || user?.email}</p>
                <p className="text-xs text-slate-500">Candidato</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                {user?.fotoPerfil ? (
                  <img src={user.fotoPerfil} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
};
