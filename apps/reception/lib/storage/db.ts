import * as SQLite from "expo-sqlite";
import type { AcademicLevel, EnrollmentStatus, FeeStatus, PaymentCategory } from "@/lib/types";

const db = SQLite.openDatabaseSync("vva_reception.db");

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS students_cache (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      level TEXT NOT NULL,
      status TEXT NOT NULL,
      dateOfBirth TEXT,
      photoUrl TEXT,
      guardianName TEXT,
      guardianPhone TEXT,
      guardianEmail TEXT,
      guardianAddress TEXT,
      admissionNo INTEGER,
      feeAmount REAL,
      feePaid REAL,
      feeBalance REAL,
      feeStatus TEXT,
      createdById TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      localOnly INTEGER NOT NULL DEFAULT 0,
      pendingSync INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payments_cache (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      occurredAt TEXT,
      termId TEXT,
      recordedById TEXT,
      createdAt TEXT,
      localOnly INTEGER NOT NULL DEFAULT 0,
      pendingSync INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      localId TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      body TEXT,
      createdAt INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      nextAttemptAt INTEGER NOT NULL DEFAULT 0,
      lastError TEXT
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// ---- Students ----

export interface StudentCacheRow {
  id: string;
  fullName: string;
  level: AcademicLevel;
  status: EnrollmentStatus;
  dateOfBirth: string | null;
  photoUrl: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianAddress: string | null;
  admissionNo: number | null;
  feeAmount: number | null;
  feePaid: number | null;
  feeBalance: number | null;
  feeStatus: FeeStatus | null;
  createdById: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  localOnly: number;
  pendingSync: number;
}

export function upsertStudentCache(row: StudentCacheRow): void {
  db.runSync(
    `INSERT INTO students_cache (
      id, fullName, level, status, dateOfBirth, photoUrl, guardianName, guardianPhone,
      guardianEmail, guardianAddress, admissionNo, feeAmount, feePaid, feeBalance, feeStatus,
      createdById, createdAt, updatedAt, localOnly, pendingSync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      fullName=excluded.fullName, level=excluded.level, status=excluded.status,
      dateOfBirth=excluded.dateOfBirth, photoUrl=excluded.photoUrl, guardianName=excluded.guardianName,
      guardianPhone=excluded.guardianPhone, guardianEmail=excluded.guardianEmail,
      guardianAddress=excluded.guardianAddress, admissionNo=excluded.admissionNo,
      feeAmount=excluded.feeAmount, feePaid=excluded.feePaid, feeBalance=excluded.feeBalance,
      feeStatus=excluded.feeStatus, createdById=excluded.createdById, createdAt=excluded.createdAt,
      updatedAt=excluded.updatedAt, localOnly=excluded.localOnly, pendingSync=excluded.pendingSync`,
    [
      row.id,
      row.fullName,
      row.level,
      row.status,
      row.dateOfBirth,
      row.photoUrl,
      row.guardianName,
      row.guardianPhone,
      row.guardianEmail,
      row.guardianAddress,
      row.admissionNo,
      row.feeAmount,
      row.feePaid,
      row.feeBalance,
      row.feeStatus,
      row.createdById,
      row.createdAt,
      row.updatedAt,
      row.localOnly,
      row.pendingSync,
    ],
  );
}

export function replaceStudentId(localId: string, serverId: string): void {
  db.runSync(`UPDATE students_cache SET id = ?, localOnly = 0, pendingSync = 0 WHERE id = ?`, [
    serverId,
    localId,
  ]);
  db.runSync(`UPDATE payments_cache SET studentId = ? WHERE studentId = ?`, [serverId, localId]);
}

export function listStudentsCache(
  filters: { q?: string; level?: string; status?: string } = {},
): StudentCacheRow[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.q) {
    clauses.push("fullName LIKE ?");
    params.push(`%${filters.q}%`);
  }
  if (filters.level) {
    clauses.push("level = ?");
    params.push(filters.level);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.getAllSync<StudentCacheRow>(`SELECT * FROM students_cache ${where} ORDER BY fullName ASC`, params);
}

export function getStudentCache(id: string): StudentCacheRow | null {
  return db.getFirstSync<StudentCacheRow>(`SELECT * FROM students_cache WHERE id = ?`, [id]) ?? null;
}

export function deleteStudentCache(id: string): void {
  db.runSync(`DELETE FROM students_cache WHERE id = ?`, [id]);
}

export function setStudentPendingSync(id: string, pending: boolean): void {
  db.runSync(`UPDATE students_cache SET pendingSync = ? WHERE id = ?`, [pending ? 1 : 0, id]);
}

// ---- Payments ----

export interface PaymentCacheRow {
  id: string;
  studentId: string;
  category: PaymentCategory;
  amount: number;
  note: string | null;
  occurredAt: string | null;
  termId: string | null;
  recordedById: string | null;
  createdAt: string | null;
  localOnly: number;
  pendingSync: number;
}

export function upsertPaymentCache(row: PaymentCacheRow): void {
  db.runSync(
    `INSERT INTO payments_cache (
      id, studentId, category, amount, note, occurredAt, termId, recordedById, createdAt, localOnly, pendingSync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      studentId=excluded.studentId, category=excluded.category, amount=excluded.amount, note=excluded.note,
      occurredAt=excluded.occurredAt, termId=excluded.termId, recordedById=excluded.recordedById,
      createdAt=excluded.createdAt, localOnly=excluded.localOnly, pendingSync=excluded.pendingSync`,
    [
      row.id,
      row.studentId,
      row.category,
      row.amount,
      row.note,
      row.occurredAt,
      row.termId,
      row.recordedById,
      row.createdAt,
      row.localOnly,
      row.pendingSync,
    ],
  );
}

export function replacePaymentId(localId: string, serverId: string, termId?: string): void {
  if (termId) {
    db.runSync(`UPDATE payments_cache SET id = ?, localOnly = 0, pendingSync = 0, termId = ? WHERE id = ?`, [
      serverId,
      termId,
      localId,
    ]);
  } else {
    db.runSync(`UPDATE payments_cache SET id = ?, localOnly = 0, pendingSync = 0 WHERE id = ?`, [
      serverId,
      localId,
    ]);
  }
}

export function listPaymentsCache(studentId: string): PaymentCacheRow[] {
  return db.getAllSync<PaymentCacheRow>(
    `SELECT * FROM payments_cache WHERE studentId = ? ORDER BY occurredAt DESC, createdAt DESC`,
    [studentId],
  );
}

export function getPaymentCache(id: string): PaymentCacheRow | null {
  return db.getFirstSync<PaymentCacheRow>(`SELECT * FROM payments_cache WHERE id = ?`, [id]) ?? null;
}

// ---- Outbox ----

export interface OutboxRow {
  id: number;
  entity: string;
  localId: string;
  method: string;
  path: string;
  body: string | null;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError: string | null;
}

export function enqueueOutbox(entry: {
  entity: string;
  localId: string;
  method: string;
  path: string;
  body?: unknown;
}): void {
  db.runSync(
    `INSERT INTO outbox (entity, localId, method, path, body, createdAt, attempts, nextAttemptAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      entry.entity,
      entry.localId,
      entry.method,
      entry.path,
      entry.body !== undefined ? JSON.stringify(entry.body) : null,
      Date.now(),
    ],
  );
}

export function getOutboxItems(): OutboxRow[] {
  return db.getAllSync<OutboxRow>(`SELECT * FROM outbox ORDER BY createdAt ASC, id ASC`);
}

export function getOutboxCount(): number {
  const row = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM outbox`);
  return row?.count ?? 0;
}

export function updateOutboxBody(id: number, body: unknown): void {
  db.runSync(`UPDATE outbox SET body = ? WHERE id = ?`, [JSON.stringify(body), id]);
}

export function findPendingCreateForLocalId(localId: string): OutboxRow | null {
  return (
    db.getFirstSync<OutboxRow>(
      `SELECT * FROM outbox WHERE localId = ? AND method = 'POST' ORDER BY createdAt ASC LIMIT 1`,
      [localId],
    ) ?? null
  );
}

export function removeOutboxItem(id: number): void {
  db.runSync(`DELETE FROM outbox WHERE id = ?`, [id]);
}

export function bumpOutboxAttempt(id: number, nextAttemptAt: number, lastError: string): void {
  db.runSync(`UPDATE outbox SET attempts = attempts + 1, nextAttemptAt = ?, lastError = ? WHERE id = ?`, [
    nextAttemptAt,
    lastError,
    id,
  ]);
}

export function resetOutboxAttempts(): void {
  db.runSync(`UPDATE outbox SET attempts = 0, nextAttemptAt = 0, lastError = NULL`);
}

// ---- Meta ----

export function getMeta(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>(`SELECT value FROM meta WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  db.runSync(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [
    key,
    value,
  ]);
}
