import { create } from 'zustand';
import type { UsuarioResponseDTO } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: UsuarioResponseDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UsuarioResponseDTO) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts loading to check token
  
  login: (token, user) => {
    localStorage.setItem('jwt_token', token);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  
  logout: () => {
    localStorage.removeItem('jwt_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/acceso';
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('jwt_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
