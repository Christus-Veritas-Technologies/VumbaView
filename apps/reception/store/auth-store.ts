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
import { authLog } from "@/lib/debug-log";

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
    authLog("hydrate:start");
    const token = await getToken();

    if (!token) {
      authLog("hydrate:no-token -> hydrated=true, staff stays null");
      set({ hydrated: true });
      return;
    }

    // Restore the cached session immediately. The token is good for 30
    // days (see signStaffToken on the server) — its mere presence is
    // enough to let the user straight through to every screen, even if
    // the device is offline right now and /auth/me below never resolves.
    const cached = await getCachedStaff();
    authLog("hydrate:restoring-cached-staff", cached?.username ?? "(none cached)");
    set({ staff: cached, hydrated: true });

    try {
      const me = await api.get<Staff>("/auth/me");
      authLog("hydrate:/auth/me succeeded", me.username, me.role);
      await setCachedStaff(me);
      set({ staff: me });
    } catch (err) {
      // Only a genuine 401 (bad/expired token, deactivated account) ends
      // the session here. A network failure (ApiClientError status 0) or
      // any other hiccup just means "keep using the cached session" —
      // exactly what makes the app usable offline after one online login.
      const status = err instanceof ApiClientError ? err.status : "n/a";
      authLog("hydrate:/auth/me FAILED", "status=", status, err instanceof Error ? err.message : err);
      if (err instanceof ApiClientError && err.status === 401) {
        authLog("hydrate: genuine 401 on /auth/me -> clearing session");
        await clearToken();
        await clearCachedStaff();
        set({ staff: null });
      } else {
        authLog("hydrate: non-401 failure -> keeping cached session as-is");
      }
    }
  },

  login: async (username, password) => {
    authLog("login:start", username);
    set({ loading: true, error: null });

    try {
      const res = await api.post<{ token: string; staff: Staff }>(
        "/auth/login",
        { username, password },
        { auth: false },
      );
      authLog("login:server-ok", res.staff.username, res.staff.role);
      await setToken(res.token);
      await setCachedStaff(res.staff);
      set({ staff: res.staff, loading: false });
      authLog("login:store-updated, staff set to", res.staff.username);
      return true;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Login failed — check your connection";
      authLog("login:FAILED", message);
      set({ error: message, loading: false });
      return false;
    }
  },

  logout: async () => {
    authLog("logout:explicit-call", new Error("logout() called from:").stack);
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
  const current = useAuthStore.getState().staff;
  authLog("unauthorizedHandler:FIRED", "clearing staff (was:", current?.username ?? "(already null)", ")");
  void clearToken();
  void clearCachedStaff();
  useAuthStore.setState({ staff: null });
});
