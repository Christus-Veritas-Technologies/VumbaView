// Temporary, verbose instrumentation for tracking down the "redirected back
// to sign-in right after a successful login" bug. Every log line is tagged
// and timestamped (ms precision) so the full sequence — token writes, every
// API request/response, every auth-store transition, every route guard's
// render decision — can be reconstructed in order from `npx expo start`'s
// terminal output or `adb logcat` / Xcode console on a built app.
//
// Safe to delete once the bug is confirmed fixed — nothing here is gated
// behind __DEV__ on purpose, since the bug reproduces in built/EAS dev
// client runs too, not just Metro dev mode.
export function authLog(tag: string, ...args: unknown[]): void {
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  // eslint-disable-next-line no-console
  console.log(`[auth ${ts}] [${tag}]`, ...args);
}

/** First/last few chars only — enough to tell two tokens apart in logs without printing a full bearer credential. */
export function tokenFingerprint(token: string | null | undefined): string {
  if (!token) return "(none)";
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}…${token.slice(-6)} (len ${token.length})`;
}
