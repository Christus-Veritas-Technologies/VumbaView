import * as SecureStore from "expo-secure-store";
import type { Staff } from "@/lib/types";
import { authLog, tokenFingerprint } from "@/lib/debug-log";

const TOKEN_KEY = "vva_reception_token";
const STAFF_KEY = "vva_reception_staff";

export async function getToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  authLog("token:get", tokenFingerprint(token));
  return token;
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  // Read-back immediately, in the same tick, to catch a SecureStore write
  // that resolves its promise without the value actually being readable yet
  // (the leading theory if logs show "set" followed by a "get" miss).
  const readBack = await SecureStore.getItemAsync(TOKEN_KEY);
  authLog("token:set", tokenFingerprint(token), "readBackMatches=", readBack === token);
}

export async function clearToken(): Promise<void> {
  // Stack trace, not just a tag — this is the one call we most need to
  // pin on a specific caller: was it logout(), the hydrate() 401 branch, or
  // the global unauthorizedHandler in api.ts?
  authLog("token:clear", new Error("clearToken() called from:").stack);
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
  if (!raw) {
    authLog("staff:get", "(none)");
    return null;
  }
  try {
    const staff = JSON.parse(raw) as Staff;
    authLog("staff:get", staff.username, staff.role);
    return staff;
  } catch (err) {
    authLog("staff:get", "JSON.parse FAILED", err);
    return null;
  }
}

export async function setCachedStaff(staff: Staff): Promise<void> {
  authLog("staff:set", staff.username, staff.role);
  await SecureStore.setItemAsync(STAFF_KEY, JSON.stringify(staff));
}

export async function clearCachedStaff(): Promise<void> {
  authLog("staff:clear", new Error("clearCachedStaff() called from:").stack);
  await SecureStore.deleteItemAsync(STAFF_KEY);
}
