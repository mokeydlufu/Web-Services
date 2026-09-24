import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingBag, 
  Store, 
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Shield,
  FileStack,
  Search,
  LogOut,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

interface SubmenuChild {
  label: string;
  path: string;
  icon?: any;
  badge?: string;
}

interface MenuItem {
  key?: string;
  icon: any;
  label: string;
  path: string;
  badge?: string;
  hasSubmenu?: boolean;
  children?: SubmenuChild[];
}

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    if (user) {
      logout();
    }
    navigate('/admin/login');
  };

  // Estado para controlar qué submenús están abiertos/cerrados
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    usuarios: location.pathname.startsWith('/admin/usuarios'),
    ofertas: location.pathname.startsWith('/admin/ofertas'),
    postulaciones: location.pathname.startsWith('/admin/postulaciones'),
  });

  // Mantener abierto el submenú activo si la URL cambia
  useEffect(() => {
    if (location.pathname.startsWith('/admin/usuarios')) {
      setOpenSubmenus(prev => ({ ...prev, usuarios: true }));
    } else if (location.pathname.startsWith('/admin/ofertas')) {
      setOpenSubmenus(prev => ({ ...prev, ofertas: true }));
    } else if (location.pathname.startsWith('/admin/postulaciones')) {
      setOpenSubmenus(prev => ({ ...prev, postulaciones: true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuSections: MenuItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      key: 'usuarios',
      icon: Users,
      label: 'Gestión de Usuarios',
      path: '/admin/usuarios',
      hasSubmenu: true,
      children: [
        { label: 'Usuarios', path: '/admin/usuarios/listado', icon: Users },
        { label: 'Candidatos', path: '/admin/usuarios/candidatos', icon: Shield },
        { label: 'Empresas', path: '/admin/usuarios/empresas', icon: Store },
        { label: 'Roles y Permisos', path: '/admin/usuarios/roles', icon: Shield },
      ],
    },
    {
      key: 'ofertas',
      icon: ShoppingBag,
      label: 'Gestión de Ofertas',
      path: '/admin/ofertas',
      hasSubmenu: true,
      children: [
        { label: 'Ofertas de Empleo', path: '/admin/ofertas/listado', icon: ShoppingBag },
        { label: 'Categorías', path: '/admin/ofertas/categorias', icon: FileStack },
      ],
    },
    {
      key: 'postulaciones',
      icon: FileText,
      label: 'Gestión de Postulaciones',
      path: '/admin/postulaciones',
      hasSubmenu: true,
      children: [
        { label: 'Postulaciones', path: '/admin/postulaciones/listado', icon: FileText },
        { label: 'Estados', path: '/admin/postulaciones/estados', icon: MessageSquare },
        { label: 'Entrevistas', path: '/admin/postulaciones/entrevistas', icon: Calendar },
      ],
    },
    {
      icon: BarChart3,
      label: 'Estadísticas',
      path: '/admin/estadisticas',
    },
    {
      icon: Mail,
      label: 'Notificaciones',
      path: '/admin/notificaciones',
    },
    {
      icon: FileStack,
      label: 'Reportes',
      path: '/admin/reportes',
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/admin/configuracion',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar fijo */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-600/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">EmpleoAdmin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {menuSections.map((item) => {
            const isSubmenuActive = item.hasSubmenu && location.pathname.startsWith(item.path);
            const isOpen = item.key ? !!openSubmenus[item.key] : false;

            if (item.hasSubmenu && item.children) {
              return (
                <div key={item.key || item.path} className="space-y-1">
                  {/* Encabezado del menú padre */}
                  <div
                    onClick={() => {
                      if (item.key) {
                        toggleSubmenu(item.key);
                      }
                      navigate(item.children![0].path);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer select-none ${
                      isSubmenuActive
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        if (item.key) toggleSubmenu(item.key, e);
                      }}
                      className="p-1 hover:bg-violet-100/50 rounded-md transition-transform"
                      title={isOpen ? 'Colapsar submenú' : 'Expandir submenú'}
                    >
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-90 text-violet-600' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Submenú desplegable */}
                  {isOpen && (
                    <div className="pl-6 space-y-1 border-l-2 border-violet-100 ml-5 my-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-violet-100 text-violet-800 font-semibold shadow-xs'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                          <span className="flex-1">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-100 text-violet-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center flex-1 gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en el panel..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <img
                src={(user as any)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'Admin')}&background=6366f1&color=fff`}
                alt="User"
                className="w-8 h-8 rounded-full border border-slate-200"
              />
              <span className="text-xs font-semibold hidden md:inline text-slate-700">
                {user?.email || 'Administrador'}
              </span>
              <LogOut className="w-4 h-4 text-slate-400 hover:text-red-600" />
            </button>
          </div>
        </header>

        {/* Page Content - UN SOLO OUTLET */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
