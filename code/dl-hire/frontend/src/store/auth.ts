import { create } from 'zustand';
import api, { User } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: string; company_id?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('dl_hire_token'),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('dl_hire_token', res.token);
      localStorage.setItem('dl_hire_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.auth.register(data);
      localStorage.setItem('dl_hire_token', res.token);
      localStorage.setItem('dl_hire_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('dl_hire_token');
    localStorage.removeItem('dl_hire_user');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('dl_hire_token');
    if (!token) return;
    try {
      const user = await api.auth.me();
      set({ user, token });
    } catch {
      localStorage.removeItem('dl_hire_token');
      localStorage.removeItem('dl_hire_user');
      set({ user: null, token: null });
    }
  },
}));
