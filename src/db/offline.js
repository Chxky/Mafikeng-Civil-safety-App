import { openDB } from 'idb';

const DB_NAME = 'mahikeng-offline';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending civic reports (offline queue)
        if (!db.objectStoreNames.contains('pendingReports')) {
          const reportStore = db.createObjectStore('pendingReports', { keyPath: 'id' });
          reportStore.createIndex('createdAt', 'createdAt');
        }

        // Cached civic reports
        if (!db.objectStoreNames.contains('civicReports')) {
          const store = db.createObjectStore('civicReports', { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('category', 'category');
          store.createIndex('createdAt', 'createdAt');
        }

        // Cached safety incidents
        if (!db.objectStoreNames.contains('safetyIncidents')) {
          const store = db.createObjectStore('safetyIncidents', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('incidentType', 'incidentType');
        }

        // Cached map tiles metadata
        if (!db.objectStoreNames.contains('mapCache')) {
          db.createObjectStore('mapCache', { keyPath: 'key' });
        }

        // User data
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'key' });
        }

        // Emergency contacts
        if (!db.objectStoreNames.contains('emergencyContacts')) {
          db.createObjectStore('emergencyContacts', { keyPath: 'id' });
        }

        // Draft reports
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ============================================================
// PENDING REPORTS (Offline Queue)
// ============================================================
export async function addPendingReport(report) {
  const db = await getDB();
  await db.put('pendingReports', { ...report, createdAt: Date.now(), synced: false });
}

export async function getPendingReports() {
  const db = await getDB();
  return db.getAll('pendingReports');
}

export async function removePendingReport(id) {
  const db = await getDB();
  await db.delete('pendingReports', id);
}

export async function markReportSynced(id) {
  const db = await getDB();
  const report = await db.get('pendingReports', id);
  if (report) {
    report.synced = true;
    await db.put('pendingReports', report);
  }
}

// ============================================================
// CACHED REPORTS
// ============================================================
export async function cacheCivicReports(reports) {
  const db = await getDB();
  const tx = db.transaction('civicReports', 'readwrite');
  for (const report of reports) {
    await tx.store.put(report);
  }
  await tx.done;
}

export async function getCachedCivicReports() {
  const db = await getDB();
  return db.getAll('civicReports');
}

export async function getCachedReportById(id) {
  const db = await getDB();
  return db.get('civicReports', id);
}

// ============================================================
// SAFETY INCIDENTS
// ============================================================
export async function cacheSafetyIncidents(incidents) {
  const db = await getDB();
  const tx = db.transaction('safetyIncidents', 'readwrite');
  for (const incident of incidents) {
    await tx.store.put(incident);
  }
  await tx.done;
}

export async function getCachedSafetyIncidents() {
  const db = await getDB();
  return db.getAll('safetyIncidents');
}

// ============================================================
// USER DATA
// ============================================================
export async function saveUserData(key, value) {
  const db = await getDB();
  await db.put('userData', { key, value, updatedAt: Date.now() });
}

export async function getUserData(key) {
  const db = await getDB();
  const data = await db.get('userData', key);
  return data?.value;
}

// ============================================================
// EMERGENCY CONTACTS
// ============================================================
export async function saveEmergencyContacts(contacts) {
  const db = await getDB();
  await db.put('emergencyContacts', { id: 'contacts', contacts, updatedAt: Date.now() });
}

export async function getEmergencyContacts() {
  const db = await getDB();
  const data = await db.get('emergencyContacts', 'contacts');
  return data?.contacts || [];
}

// ============================================================
// DRAFTS
// ============================================================
export async function saveDraft(draft) {
  const db = await getDB();
  await db.put('drafts', { ...draft, updatedAt: Date.now() });
}

export async function getDrafts() {
  const db = await getDB();
  return db.getAll('drafts');
}

export async function removeDraft(id) {
  const db = await getDB();
  await db.delete('drafts', id);
}

// ============================================================
// SYNC MANAGER
// ============================================================
export async function syncPendingReports(apiClient) {
  const pending = await getPendingReports();
  const unsynced = pending.filter(r => !r.synced);

  const results = { success: 0, failed: 0 };

  for (const report of unsynced) {
    try {
      await apiClient.submitReport(report);
      await removePendingReport(report.id);
      results.success++;
    } catch (err) {
      console.error(`Failed to sync report ${report.id}:`, err);
      results.failed++;
    }
  }

  return results;
}
