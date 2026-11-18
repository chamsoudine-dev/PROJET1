// Synchronization engine for offline-first architecture
import {
  getOfflineDB,
  getPendingSyncItems,
  updateSyncItemStatus,
  clearSyncedItems,
  getAllOfflineRecords,
  putOfflineRecord,
  getOfflineRecord,
} from './index';

interface SyncResult {
  success: number;
  failed: number;
  conflicts: number;
}

export async function syncWithServer(): Promise<SyncResult> {
  const result: SyncResult = { success: 0, failed: 0, conflicts: 0 };

  const pendingItems = await getPendingSyncItems();

  if (pendingItems.length === 0) {
    return result;
  }

  // Process items in order (FIFO)
  for (const item of pendingItems) {
    await updateSyncItemStatus(item.id, 'syncing');

    try {
      let success = false;

      switch (item.type) {
        case 'patient':
          success = await syncPatient(item);
          break;
        case 'consultation':
          success = await syncConsultation(item);
          break;
        case 'vaccination':
          success = await syncVaccination(item);
          break;
      }

      if (success) {
        await updateSyncItemStatus(item.id, 'success');
        result.success++;
      } else {
        await updateSyncItemStatus(item.id, 'error', 'Sync returned failure');
        result.failed++;
      }
    } catch (error) {
      await updateSyncItemStatus(item.id, 'error', error instanceof Error ? error.message : 'Unknown error');
      result.failed++;
    }
  }

  // Clean up successful items
  await clearSyncedItems();

  return result;
}

async function syncPatient(item: any): Promise<boolean> {
  const { action, payload } = item;

  try {
    let response: Response;

    switch (action) {
      case 'create':
        response = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'update':
        response = await fetch(`/api/patients/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'delete':
        response = await fetch(`/api/patients/${payload.id}`, {
          method: 'DELETE',
        });
        break;
      default:
        return false;
    }

    if (response.ok) {
      const result = await response.json();

      // If create was successful, update local record with server ID
      if (action === 'create' && result.data?.id) {
        const db = await getOfflineDB();
        const localRecord = await db.get('patients', payload.id);
        if (localRecord) {
          // Update with server ID and mark as synced
          await db.delete('patients', payload.id);
          await db.put('patients', {
            ...localRecord,
            id: result.data.id,
            identifiantNational: result.data.identifiantNational,
            synced: true,
          });
        }
      }

      return true;
    } else if (response.status === 409) {
      // Conflict - server has different version
      await updateSyncItemStatus(item.id, 'conflict', 'Server conflict');
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

async function syncConsultation(item: any): Promise<boolean> {
  const { action, payload } = item;

  try {
    let response: Response;

    switch (action) {
      case 'create':
        response = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'update':
        response = await fetch(`/api/consultations/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'delete':
        response = await fetch(`/api/consultations/${payload.id}`, {
          method: 'DELETE',
        });
        break;
      default:
        return false;
    }

    if (response.ok) {
      const result = await response.json();

      if (action === 'create' && result.data?.id) {
        const db = await getOfflineDB();
        const localRecord = await db.get('consultations', payload.id);
        if (localRecord) {
          await db.delete('consultations', payload.id);
          await db.put('consultations', {
            ...localRecord,
            id: result.data.id,
            synced: true,
          });
        }
      }

      return true;
    } else if (response.status === 409) {
      await updateSyncItemStatus(item.id, 'conflict', 'Server conflict');
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

async function syncVaccination(item: any): Promise<boolean> {
  const { action, payload } = item;

  try {
    let response: Response;

    switch (action) {
      case 'create':
        response = await fetch('/api/vaccinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'update':
        response = await fetch(`/api/vaccinations/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        break;
      case 'delete':
        response = await fetch(`/api/vaccinations/${payload.id}`, {
          method: 'DELETE',
        });
        break;
      default:
        return false;
    }

    if (response.ok) {
      const result = await response.json();

      if (action === 'create' && result.data?.id) {
        const db = await getOfflineDB();
        const localRecord = await db.get('vaccinations', payload.id);
        if (localRecord) {
          await db.delete('vaccinations', payload.id);
          await db.put('vaccinations', {
            ...localRecord,
            id: result.data.id,
            synced: true,
          });
        }
      }

      return true;
    } else if (response.status === 409) {
      await updateSyncItemStatus(item.id, 'conflict', 'Server conflict');
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

// Auto-sync with exponential backoff
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

export function startAutoSync(intervalMs: number = 30000) {
  if (syncInterval) return;

  const performSync = async () => {
    if (isSyncing) return;
    isSyncing = true;

    try {
      await syncWithServer();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      isSyncing = false;
    }
  };

  // Initial sync
  performSync();

  // Periodic sync
  syncInterval = setInterval(performSync, intervalMs);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function triggerSync() {
  if (!isSyncing) {
    syncWithServer();
  }
}

// Get sync status for UI
export async function getSyncStatus() {
  const db = await getOfflineDB();
  const [pending, syncing, errors, conflicts] = await Promise.all([
    db.getAllFromIndex('syncQueue', 'by-status', 'pending'),
    db.getAllFromIndex('syncQueue', 'by-status', 'syncing'),
    db.getAllFromIndex('syncQueue', 'by-status', 'error'),
    db.getAllFromIndex('syncQueue', 'by-status', 'conflict'),
  ]);

  return {
    pending: pending.length,
    syncing: syncing.length,
    errors: errors.length,
    conflicts: conflicts.length,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

// Force sync a specific item (retry)
export async function retrySyncItem(id: string) {
  await updateSyncItemStatus(id, 'pending');
  await syncWithServer();
}