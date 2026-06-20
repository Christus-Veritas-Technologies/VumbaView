import { api, ApiClientError } from "@/lib/api";
import {
  bumpOutboxAttempt,
  enqueueOutbox,
  findPendingCreateForLocalId,
  getOutboxItems,
  getStudentCache,
  listStudentsCache,
  removeOutboxItem,
  replacePaymentId,
  replaceStudentId,
  resetOutboxAttempts,
  setMeta,
  upsertPaymentCache,
  upsertStudentCache,
} from "@/lib/storage/db";
import type { AcademicLevel, EnrollmentStatus, PaymentCategory, Payment, Student } from "@/lib/types";

const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 5 * 60_000;
const MAX_ATTEMPTS = 10;

function isLocalId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("local-");
}

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function studentCacheRowFromServer(student: Student, opts: { localOnly: boolean; pendingSync: boolean }) {
  return {
    id: student.id,
    fullName: student.fullName,
    level: student.level,
    status: student.status,
    dateOfBirth: student.dateOfBirth,
    photoUrl: student.photoUrl,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    guardianEmail: student.guardianEmail,
    guardianAddress: student.guardianAddress,
    admissionNo: student.admissionNo,
    feeAmount: student.fee?.feeAmount ?? null,
    feePaid: student.fee?.paid ?? null,
    feeBalance: student.fee?.balance ?? null,
    feeStatus: student.fee?.status ?? null,
    createdById: student.createdById,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    localOnly: opts.localOnly ? 1 : 0,
    pendingSync: opts.pendingSync ? 1 : 0,
  };
}

function paymentCacheRowFromServer(payment: Payment, opts: { localOnly: boolean; pendingSync: boolean }) {
  return {
    id: payment.id,
    studentId: payment.studentId,
    category: payment.category,
    amount: Number(payment.amount),
    note: payment.note,
    occurredAt: payment.occurredAt,
    termId: payment.termId,
    recordedById: payment.recordedById,
    createdAt: payment.createdAt,
    localOnly: opts.localOnly ? 1 : 0,
    pendingSync: opts.pendingSync ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// Outbox processing
// ---------------------------------------------------------------------------

/**
 * One pass over the outbox, oldest-first. Local ids are resolved to server
 * ids as creates land *within this same pass*, via an in-memory map — that's
 * what lets "create a student offline, then pay them offline" sync correctly
 * in one go: the student's CREATE row always has an earlier createdAt than
 * any row that depends on it, so it's always processed first.
 *
 * A row that depends on a still-unresolved local id is deferred (skipped,
 * no attempt increment, no error) rather than treated as a failure — it'll
 * be retried on the next pass once its dependency has a server id.
 */
export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  const items = getOutboxItems();
  const localIdToServerId = new Map<string, string>();
  let processed = 0;
  let failed = 0;
  const now = Date.now();

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) continue; // paused — needs manual retry via retryAllNow()
    if (item.nextAttemptAt > now) continue; // still inside its backoff window

    let path = item.path;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = item.body ? JSON.parse(item.body) : undefined;

    if (isLocalId(item.localId) && item.method !== "POST") {
      const serverId = localIdToServerId.get(item.localId);
      if (!serverId) continue; // this entity's create hasn't landed yet this pass
      path = path.replace(item.localId, serverId);
    }

    if (item.entity === "payment" && body && isLocalId(body.studentId)) {
      const serverId = localIdToServerId.get(body.studentId);
      if (!serverId) continue; // student this payment belongs to isn't synced yet — defer
      body = { ...body, studentId: serverId };
    }

    try {
      if (item.entity === "student" && item.method === "POST") {
        const created = await api.post<Student>(path, body);
        localIdToServerId.set(item.localId, created.id);
        replaceStudentId(item.localId, created.id);
        upsertStudentCache(studentCacheRowFromServer(created, { localOnly: false, pendingSync: false }));
      } else if (item.entity === "student" && item.method === "PATCH") {
        const updated = await api.patch<Student>(path, body);
        upsertStudentCache(studentCacheRowFromServer(updated, { localOnly: false, pendingSync: false }));
      } else if (item.entity === "payment" && item.method === "POST") {
        const created = await api.post<Payment>(path, body);
        replacePaymentId(item.localId, created.id, created.termId);
        upsertPaymentCache(paymentCacheRowFromServer(created, { localOnly: false, pendingSync: false }));

        // Refresh the student's cached balance now that a fee payment has
        // actually landed server-side (the optimistic local update was just
        // a guess at the time it was recorded).
        if (created.category === "FEES") {
          try {
            const fresh = await api.get<Student>(`/students/${created.studentId}`);
            upsertStudentCache(studentCacheRowFromServer(fresh, { localOnly: false, pendingSync: false }));
          } catch {
            // best-effort — the next pull() reconciles this regardless
          }
        }
      }

      removeOutboxItem(item.id);
      processed += 1;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Sync failed";
      const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** item.attempts);
      bumpOutboxAttempt(item.id, Date.now() + delay, message);
      failed += 1;
    }
  }

  return { processed, failed };
}

// ---------------------------------------------------------------------------
// Pull (server -> cache)
// ---------------------------------------------------------------------------

/**
 * Pulls the full student list. Always runs *after* processOutbox() within
 * syncNow(), so by the time this runs, any local edit has already been sent
 * — the server's snapshot already reflects whichever write actually landed
 * last (last-write-wins, satisfied by ordering). As a defensive backstop,
 * any cache row still marked pendingSync is left alone rather than
 * overwritten, in case an edit is mid-flight on a future concurrent call.
 */
export async function pull(): Promise<void> {
  const list = await api.get<Student[]>("/students");
  const cached = new Map(listStudentsCache().map((s) => [s.id, s]));

  for (const student of list) {
    const existing = cached.get(student.id);
    if (existing && existing.pendingSync) continue;
    upsertStudentCache(studentCacheRowFromServer(student, { localOnly: false, pendingSync: false }));
  }

  setMeta("lastSyncedAt", new Date().toISOString());
}

export async function pullPaymentsForStudent(studentId: string): Promise<void> {
  const list = await api.get<Payment[]>("/payments", { studentId });
  for (const payment of list) {
    upsertPaymentCache(paymentCacheRowFromServer(payment, { localOnly: false, pendingSync: false }));
  }
}

// ---------------------------------------------------------------------------
// Top-level sync entry points
// ---------------------------------------------------------------------------

let syncing = false;

export async function syncNow(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    await processOutbox();
    await pull();
  } catch {
    // Dropped mid-sync (e.g. connection died between the two steps) — the
    // next reconnect event or foreground poll will pick it back up.
  } finally {
    syncing = false;
  }
}

/** Manual escape hatch for outbox rows that hit MAX_ATTEMPTS and paused. */
export function retryAllNow(): Promise<void> {
  resetOutboxAttempts();
  return syncNow();
}

// ---------------------------------------------------------------------------
// Optimistic mutation helpers — write local cache + enqueue outbox together
// ---------------------------------------------------------------------------

export interface NewStudentInput {
  fullName: string;
  level: AcademicLevel;
  dateOfBirth?: string;
  photoUrl?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
}

export function queueCreateStudent(input: NewStudentInput, createdById: string | null): string {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  upsertStudentCache({
    id: localId,
    fullName: input.fullName,
    level: input.level,
    status: "ACTIVE",
    dateOfBirth: input.dateOfBirth ?? null,
    photoUrl: input.photoUrl ?? null,
    guardianName: input.guardianName ?? null,
    guardianPhone: input.guardianPhone ?? null,
    guardianEmail: input.guardianEmail ?? null,
    guardianAddress: input.guardianAddress ?? null,
    admissionNo: null,
    feeAmount: 0,
    feePaid: 0,
    feeBalance: 0,
    feeStatus: "UNPAID",
    createdById,
    createdAt: now,
    updatedAt: now,
    localOnly: 1,
    pendingSync: 1,
  });

  enqueueOutbox({ entity: "student", localId, method: "POST", path: "/students", body: input });
  return localId;
}

export type StudentUpdateInput = Partial<NewStudentInput> & { status?: EnrollmentStatus };

export function queueUpdateStudent(id: string, patch: StudentUpdateInput): void {
  const existing = getStudentCache(id);
  if (!existing) return;

  upsertStudentCache({ ...existing, ...patch, pendingSync: 1 });

  if (isLocalId(id)) {
    // Student hasn't synced yet — merge straight into its still-queued
    // create body rather than queuing a PATCH the server has no id for.
    const pendingCreate = findPendingCreateForLocalId(id);
    if (pendingCreate) {
      const mergedBody = { ...(pendingCreate.body ? JSON.parse(pendingCreate.body) : {}), ...patch };
      removeOutboxItem(pendingCreate.id);
      enqueueOutbox({ entity: "student", localId: id, method: "POST", path: "/students", body: mergedBody });
      return;
    }
  }

  enqueueOutbox({ entity: "student", localId: id, method: "PATCH", path: `/students/${id}`, body: patch });
}

export interface NewPaymentInput {
  studentId: string;
  category: PaymentCategory;
  amount: number;
  note?: string;
  occurredAt?: string;
}

export function queueRecordPayment(input: NewPaymentInput, recordedById: string | null): string {
  const localId = generateLocalId();
  const now = new Date().toISOString();

  upsertPaymentCache({
    id: localId,
    studentId: input.studentId,
    category: input.category,
    amount: input.amount,
    note: input.note ?? null,
    occurredAt: input.occurredAt ?? now,
    termId: null,
    recordedById,
    createdAt: now,
    localOnly: 1,
    pendingSync: 1,
  });

  // Optimistic balance update — fees only, per the v1 rule that
  // uniforms/custom payments are record-keeping only and don't move balance.
  if (input.category === "FEES") {
    const student = getStudentCache(input.studentId);
    if (student) {
      const paid = (student.feePaid ?? 0) + input.amount;
      const balance = (student.feeAmount ?? 0) - paid;
      upsertStudentCache({
        ...student,
        feePaid: paid,
        feeBalance: balance,
        feeStatus: balance <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      });
    }
  }

  // input.studentId may itself still be a local- id (paying a student who
  // hasn't synced yet) — processOutbox() resolves it from that student's
  // create the moment it lands, within the same pass.
  enqueueOutbox({ entity: "payment", localId, method: "POST", path: "/payments", body: input });
  return localId;
}
