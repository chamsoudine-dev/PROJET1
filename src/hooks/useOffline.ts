// React hooks for offline functionality
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  onNetworkStatusChange,
  getSyncStatus,
  startAutoSync,
  stopAutoSync,
  triggerSync,
  retrySyncItem,
} from '@/lib/offline';

// Type definitions for offline stores
type OfflineStoreName = 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata';

async function addOfflineRecord(
  storeName: OfflineStoreName,
  record: any
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  return db.add(storeName, record);
}

async function putOfflineRecord(
  storeName: OfflineStoreName,
  record: any
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  return db.put(storeName, record);
}

async function getOfflineRecord(
  storeName: OfflineStoreName,
  key: string
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  return db.get(storeName, key);
}

async function getAllOfflineRecords(
  storeName: OfflineStoreName
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  return db.getAll(storeName);
}

async function deleteOfflineRecord(
  storeName: OfflineStoreName,
  key: string
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  return db.delete(storeName, key);
}

async function addToSyncQueue(
  type: 'patient' | 'consultation' | 'vaccination',
  action: 'create' | 'update' | 'delete',
  payload: any
) {
  const db = await (await import('@/lib/offline')).getOfflineDB();
  const id = `${type}-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add('syncQueue', {
    id,
    type,
    action,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  });
  return id;
}

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    syncing: 0,
    errors: 0,
    conflicts: 0,
    isOnline: true,
  });

  useEffect(() => {
    // Initial check
    setOnline(isOnline());

    // Subscribe to network changes
    const unsubscribe = onNetworkStatusChange((status) => {
      setOnline(status);
      setSyncStatus(prev => ({ ...prev, isOnline: status }));
    });

    // Initial sync status
    getSyncStatus().then(setSyncStatus);

    // Start auto-sync
    startAutoSync(30000); // 30 seconds

    // Periodic sync status update
    const statusInterval = setInterval(() => {
      getSyncStatus().then(setSyncStatus);
    }, 5000);

    return () => {
      unsubscribe();
      stopAutoSync();
      clearInterval(statusInterval);
    };
  }, []);

  const forceSync = useCallback(async () => {
    await triggerSync();
    const status = await getSyncStatus();
    setSyncStatus(status);
  }, []);

  const retry = useCallback(async (id: string) => {
    await retrySyncItem(id);
    const status = await getSyncStatus();
    setSyncStatus(status);
  }, []);

  return {
    online,
    syncStatus,
    forceSync,
    retry,
  };
}

// Hook for offline-first data operations
export function useOfflineData<T>(
  storeName: 'patients' | 'consultations' | 'vaccinations',
  fetchFromServer: () => Promise<T[]>,
  transform?: (data: T) => any
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { online } = useOnlineStatus();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (online) {
        // Try server first
        const serverData = await fetchFromServer();
        setData(serverData);

        // Cache in IndexedDB
        if (transform) {
          for (const item of serverData) {
            await putOfflineRecord(storeName, transform(item));
          }
        }
      } else {
        // Offline - load from IndexedDB
        const offlineData = await getAllOfflineRecords(storeName);
        setData(offlineData as T[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      // Fallback to offline
      try {
        const offlineData = await getAllOfflineRecords(storeName);
        setData(offlineData as T[]);
      } catch {
        // No offline data either
      }
    } finally {
      setLoading(false);
    }
  }, [online, fetchFromServer, storeName, transform]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const create = useCallback(async (item: T) => {
    const localItem = {
      ...item,
      id: generateLocalId(),
      synced: false,
      localId: generateLocalId(),
    } as any;

    await addOfflineRecord(storeName, localItem);
    await addToSyncQueue(storeName.slice(0, -1) as any, 'create', item);

    setData(prev => [localItem, ...prev]);
  }, [storeName]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    const existing = await getOfflineRecord(storeName, id);
    if (existing) {
      const updated = { ...existing, ...updates, synced: false } as any;
      await putOfflineRecord(storeName, updated);
      await addToSyncQueue(storeName.slice(0, -1) as any, 'update', updated);

      setData(prev => prev.map(item =>
        (item as any).id === id ? { ...item, ...updates } : item
      ));
    }
  }, [storeName]);

  const remove = useCallback(async (id: string) => {
    await deleteOfflineRecord(storeName, id);
    await addToSyncQueue(storeName.slice(0, -1) as any, 'delete', { id });

    setData(prev => prev.filter(item => (item as any).id !== id));
  }, [storeName]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
    create,
    update,
    remove,
  };
}

// Hook for pending mutations count
export function usePendingMutations() {
  const { syncStatus } = useOnlineStatus();
  return syncStatus.pending + syncStatus.syncing + syncStatus.errors + syncStatus.conflicts;
}