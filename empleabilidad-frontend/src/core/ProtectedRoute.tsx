import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.rol;
    const hasRole = userRole ? allowedRoles.includes(userRole) : false;

    if (!hasRole) {
      // Redirigir al dashboard legítimo según su rol
      if (userRole === 'ADMINISTRADOR') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (userRole === 'EMPRESA' || userRole === 'RECLUTADOR') {
        return <Navigate to="/empresa/ofertas" replace />;
      }
      return <Navigate to="/candidato/buscar" replace />;
    }
  }

  return <Outlet />;
};
