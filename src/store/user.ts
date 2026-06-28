import { create } from "zustand";
import type { User } from "@/lib/types";
import { api, getStoredUser, getToken, setAuth, clearAuth } from "@/lib/api";

interface UserState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: getStoredUser(),
  loading: false,

  init: async () => {
    const token = getToken();
    if (!token) return;
    try {
      set({ loading: true });
      const r = await api.me();
      set({ user: r.data, loading: false });
    } catch {
      clearAuth();
      set({ user: null, loading: false });
    }
  },

  login: async (username, password) => {
    const r = await api.login(username, password);
    setAuth(r.data.token, r.data.user);
    set({ user: r.data.user });
  },

  register: async (username, password) => {
    const r = await api.register(username, password);
    setAuth(r.data.token, r.data.user);
    set({ user: r.data.user });
  },

  logout: () => {
    clearAuth();
    set({ user: null });
  },
}));
