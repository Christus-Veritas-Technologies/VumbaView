// Temporary diagnostic logging for the "redirected back to sign-in right
// after a successful login" bug. The client-side logs (apps/reception/lib/
// debug-log.ts) proved the app sends back the exact, freshly-issued token —
// so whatever's failing is on this side. These logs are meant to be read
// directly from the `bun run --hot src/index.ts` terminal during a repro,
// alongside the Metro logs, to line the two up by timestamp.
export function authLog(tag: string, ...args: unknown[]): void {
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
  console.log(`[srv-auth ${ts}] [${tag}]`, ...args);
}
