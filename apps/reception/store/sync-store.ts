import { useEffect, useRef } from "react";
import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";
import { retryAllNow, syncNow } from "@/lib/sync";
import { getMeta, getOutboxCount } from "@/lib/storage/db";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  /** Result of the most recent manual sync (null = never manually synced). */
  syncResult: { processed: number; failed: number } | null;
  /** Error message from the most recent manual sync, if it threw. */
  syncError: string | null;
  setOnline: (online: boolean) => void;
  refreshPendingCount: () => void;
  runSync: () => Promise<void>;
  runRetryAllNow: () => Promise<void>;
  clearSyncFeedback: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  syncResult: null,
  syncError: null,

  setOnline: (online) => set({ isOnline: online }),

  refreshPendingCount: () => {
    set({ pendingCount: getOutboxCount(), lastSyncedAt: getMeta("lastSyncedAt") });
  },

  clearSyncFeedback: () => set({ syncResult: null, syncError: null }),

  runSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    try {
      await syncNow();
    } finally {
      get().refreshPendingCount();
      set({ isSyncing: false });
    }
  },

  runRetryAllNow: async () => {
    set({ isSyncing: true });
    try {
      await retryAllNow();
    } finally {
      get().refreshPendingCount();
      set({ isSyncing: false });
    }
  },
}));

const FOREGROUND_POLL_MS = 30_000;

/**
 * Registers connectivity + polling triggers once, from the root layout.
 * Covers both "actually offline" (NetInfo transition back online) and
 * "online per NetInfo but requests still failing" (the 30s poll retries
 * whenever there's a nonzero pending count, independent of what NetInfo
 * currently reports).
 */
export function useSyncEngine(): void {
  const setOnline = useSyncStore((s) => s.setOnline);
  const runSync = useSyncStore((s) => s.runSync);
  const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);
  const wasOffline = useRef(false);

  useEffect(() => {
    refreshPendingCount();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      setOnline(online);
      if (online && wasOffline.current) {
        runSync();
      }
      wasOffline.current = !online;
    });

    const interval = setInterval(() => {
      const { isOnline, pendingCount } = useSyncStore.getState();
      if (isOnline && pendingCount > 0) {
        runSync();
      }
    }, FOREGROUND_POLL_MS);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
