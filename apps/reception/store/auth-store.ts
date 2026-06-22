import { create } from "zustand";
import { api, ApiClientError, setUnauthorizedHandler } from "@/lib/api";
import {
  clearCachedStaff,
  clearToken,
  getCachedStaff,
  getToken,
  setCachedStaff,
  setToken,
} from "@/lib/storage/token";
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

    // Restore the cached session immediately. The token is good for 30
    // days (see signStaffToken on the server) — its mere presence is
    // enough to let the user straight through to every screen, even if
    // the device is offline right now and /auth/me below never resolves.
    const cached = await getCachedStaff();
    set({ staff: cached, hydrated: true });

    try {
      const me = await api.get<Staff>("/auth/me");
      await setCachedStaff(me);
      set({ staff: me });
    } catch (err) {
      // Only a genuine 401 (bad/expired token, deactivated account) ends
      // the session here. A network failure (ApiClientError status 0) or
      // any other hiccup just means "keep using the cached session" —
      // exactly what makes the app usable offline after one online login.
      if (err instanceof ApiClientError && err.status === 401) {
        await clearToken();
        await clearCachedStaff();
        set({ staff: null });
      }
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
      await setCachedStaff(res.staff);
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
    await clearCachedStaff();
    set({ staff: null });
  },
}));

// Wired here — rather than inside api.ts, which can't import the store
// back without a circular import — so that a 401 on ANY authenticated
// request, on any screen, immediately clears the session. Every protected
// layout (admin/_layout.tsx, receptionist/_layout.tsx, index.tsx) already
// watches `staff` reactively and redirects to /login the moment it's null,
// so this one hook is what makes "redirect on a genuinely invalid/expired
// token, on every page" work without per-screen code.
setUnauthorizedHandler(() => {
  void clearToken();
  void clearCachedStaff();
  useAuthStore.setState({ staff: null });
});
