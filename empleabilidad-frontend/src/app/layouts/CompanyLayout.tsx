import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Briefcase, Users, LayoutDashboard, LogOut, CheckSquare, User } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const CompanyLayout: React.FC = () => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/empresa/ofertas', icon: LayoutDashboard, label: 'Panel de Ofertas' },
    { to: '/empresa/candidatos', icon: Users, label: 'Candidatos' },
    { to: '/empresa/evaluaciones', icon: CheckSquare, label: 'Evaluaciones' },
    { to: '/empresa/perfil', icon: User, label: 'Mi Perfil' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Briefcase className="h-6 w-6 text-blue-500 mr-2" />
          <span className="text-lg font-bold">EmpleaPro Business</span>
        </div>
        
        <div className="p-4 flex-1">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gestión</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
               {user?.razonSocial?.charAt(0) || 'E'}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium truncate">{user?.razonSocial || 'Empresa'}</p>
               <p className="text-xs text-slate-400 truncate">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-slate-900">EmpleaPro Business</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-500">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
