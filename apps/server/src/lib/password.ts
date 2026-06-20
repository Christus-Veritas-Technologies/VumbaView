// Bun ships a built-in password hasher (bcrypt under the hood) — no extra
// dependency needed for the "lightweight custom auth" approach.

export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
