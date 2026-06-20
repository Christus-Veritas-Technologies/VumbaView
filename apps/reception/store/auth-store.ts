import { create } from "zustand";
import { api, ApiClientError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/storage/token";
import type { Staff } from "@/lib/types";

interface AuthState {
  staff: Staff | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  staff: null,
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async () => {
    const token = await getToken();

    if (!token) {
      set({ hydrated: true });
      return;
    }

    try {
      const me = await api.get<Staff>("/auth/me");
      set({ staff: me, hydrated: true });
    } catch {
      await clearToken();
      set({ staff: null, hydrated: true });
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });

    try {
      const res = await api.post<{ token: string; staff: Staff }>(
        "/auth/login",
        { username, password },
        { auth: false },
      );
      await setToken(res.token);
      set({ staff: res.staff, loading: false });
      return true;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Login failed — check your connection";
      set({ error: message, loading: false });
      return false;
    }
  },

  logout: async () => {
    await clearToken();
    set({ staff: null });
  },
}));
