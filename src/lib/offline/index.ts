// IndexedDB wrapper for offline storage
import { openDB, IDBPDatabase } from 'idb';

interface OfflinePatient {
  id: string;
  identifiantNational: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  ageEstime: number | null;
  sexe: 'M' | 'F';
  village: string | null;
  quartier: string | null;
  telephone: string | null;
  personneContactNom: string | null;
  personneContactTel: string | null;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  localId: string;
}

interface OfflineConsultation {
  id: string;
  patientId: string;
  motif: string;
  cim10Code: string | null;
  cim10Libelle: string | null;
  diagnosticSecondaire: string[];
  traitement: Array<{
    dci: string;
    dose: string;
    duree: string;
    frequence: string;
  }>;
  evolution: string | null;
  refererVersId: string | null;
  observations: string | null;
  createdAt: string;
  synced: boolean;
  localId: string;
}

interface OfflineVaccination {
  id: string;
  patientId: string;
  vaccin: string;
  doseNumero: number;
  lotNumero: string | null;
  datePeremption: string | null;
  siteInjection: string | null;
  reaction: string | null;
  createdAt: string;
  synced: boolean;
  localId: string;
}

interface SyncQueueItem {
  id: string;
  type: 'patient' | 'consultation' | 'vaccination';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'success' | 'error' | 'conflict';
  error?: string;
}

interface MetadataItem {
  key: string;
  value: any;
}

type OfflineStoreName = 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata';

let dbInstance: IDBPDatabase | null = null;

export async function getOfflineDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('sante-numerique-offline', 1, {
    upgrade(db) {
      // Patients store
      const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
      patientStore.createIndex('by-nom', 'nom');
      patientStore.createIndex('by-identifiant', 'identifiantNational');
      patientStore.createIndex('by-synced', 'synced');

      // Consultations store
      const consultationStore = db.createObjectStore('consultations', { keyPath: 'id' });
      consultationStore.createIndex('by-patient', 'patientId');
      consultationStore.createIndex('by-synced', 'synced');

      // Vaccinations store
      const vaccinationStore = db.createObjectStore('vaccinations', { keyPath: 'id' });
      vaccinationStore.createIndex('by-patient', 'patientId');
      vaccinationStore.createIndex('by-synced', 'synced');

      // Sync queue store
      const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncQueueStore.createIndex('by-status', 'status');
      syncQueueStore.createIndex('by-timestamp', 'timestamp');

      // Metadata store
      db.createObjectStore('metadata', { keyPath: 'key' });
    },
  });

  return dbInstance;
}

// Re-export sync functions
export {
  syncWithServer,
  startAutoSync,
  stopAutoSync,
  triggerSync,
  getSyncStatus,
  retrySyncItem,
} from './sync';

// Generic CRUD operations
export async function addOfflineRecord(
  storeName: OfflineStoreName,
  record: any
) {
  const db = await getOfflineDB();
  return db.add(storeName, record);
}

export async function putOfflineRecord(
  storeName: 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata',
  record: any
) {
  const db = await getOfflineDB();
  return db.put(storeName, record);
}

export async function getOfflineRecord(
  storeName: 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata',
  key: string
) {
  const db = await getOfflineDB();
  return db.get(storeName, key);
}

export async function getAllOfflineRecords(
  storeName: 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata'
) {
  const db = await getOfflineDB();
  return db.getAll(storeName);
}

export async function getOfflineRecordsByIndex(
  storeName: 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata',
  indexName: string,
  value: any
) {
  const db = await getOfflineDB();
  return db.getAllFromIndex(storeName, indexName, value);
}

export async function deleteOfflineRecord(
  storeName: 'patients' | 'consultations' | 'vaccinations' | 'syncQueue' | 'metadata',
  key: string
) {
  const db = await getOfflineDB();
  return db.delete(storeName, key);
}

// Sync Queue operations
export async function addToSyncQueue(
  type: 'patient' | 'consultation' | 'vaccination',
  action: 'create' | 'update' | 'delete',
  payload: any
) {
  const db = await getOfflineDB();
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

export async function getPendingSyncItems() {
  const db = await getOfflineDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

export async function updateSyncItemStatus(
  id: string,
  status: 'pending' | 'syncing' | 'success' | 'error' | 'conflict',
  error?: string
) {
  const db = await getOfflineDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.status = status;
    item.error = error;
    if (status === 'syncing') item.retryCount += 1;
    await db.put('syncQueue', item);
  }
}

export async function clearSyncedItems() {
  const db = await getOfflineDB();
  const syncedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'success');
  for (const item of syncedItems) {
    await db.delete('syncQueue', item.id);
  }
}

// Metadata helpers
export async function setMetadata(key: string, value: any) {
  const db = await getOfflineDB();
  await db.put('metadata', { key, value });
}

export async function getMetadata(key: string) {
  const db = await getOfflineDB();
  const result = await db.get('metadata', key);
  return result?.value;
}

// Generate local ID for offline records
export function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if we're online
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// Network status listener
export function onNetworkStatusChange(callback: (online: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
}