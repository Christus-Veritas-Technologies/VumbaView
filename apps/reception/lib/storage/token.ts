import * as SecureStore from "expo-secure-store";
import type { Staff } from "@/lib/types";

const TOKEN_KEY = "vva_reception_token";
const STAFF_KEY = "vva_reception_staff";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Cached alongside the token (same store, same lifetime) so the app can
// show who's signed in — and let them straight through to every screen —
// the instant it launches, without waiting on a network round trip to
// /auth/me. That round trip still happens in the background (see
// auth-store.ts hydrate()), but a missed/offline attempt no longer blocks
// or signs the user out: the token is valid for 30 days regardless.
export async function getCachedStaff(): Promise<Staff | null> {
  const raw = await SecureStore.getItemAsync(STAFF_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Staff;
  } catch {
    return null;
  }
}

export async function setCachedStaff(staff: Staff): Promise<void> {
  await SecureStore.setItemAsync(STAFF_KEY, JSON.stringify(staff));
}

export async function clearCachedStaff(): Promise<void> {
  await SecureStore.deleteItemAsync(STAFF_KEY);
}
