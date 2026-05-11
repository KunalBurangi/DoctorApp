import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  contact?: string;
  avatarUrl?: string;
  avatarBlob?: Blob;
  createdAt: number;
}

// Global image — not tied to any single doctor
export interface GlobalImage {
  id: string;
  imageBlob: Blob;
  name: string;
  createdAt: number;
}

// Junction: links a doctor to a global image (many-to-many)
export interface DoctorImageLink {
  id: string;
  doctorId: string;
  imageId: string;
  sortOrder: number;
}

interface DoctorDB extends DBSchema {
  doctors: {
    key: string;
    value: Doctor;
  };
  globalImages: {
    key: string;
    value: GlobalImage;
  };
  doctorImageLinks: {
    key: string;
    value: DoctorImageLink;
    indexes: { 'by-doctor': string; 'by-image': string };
  };
}

let dbPromise: Promise<IDBPDatabase<DoctorDB>> | null = null;

async function initDb(): Promise<IDBPDatabase<DoctorDB>> {
  try {
    return await openDB<DoctorDB>('doctor-app-db', 3, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // Fresh install — just create the v2 schema directly
        if (oldVersion < 1) {
          db.createObjectStore('doctors', { keyPath: 'id' });
        }

        // Version 2: Shared image library
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('globalImages')) {
            db.createObjectStore('globalImages', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('doctorImageLinks')) {
            const linkStore = db.createObjectStore('doctorImageLinks', { keyPath: 'id' });
            linkStore.createIndex('by-doctor', 'doctorId');
            linkStore.createIndex('by-image', 'imageId');
          }

          // If upgrading from v1, delete the old per-doctor images store
          if (oldVersion >= 1 && (db as unknown as { objectStoreNames: DOMStringList }).objectStoreNames.contains('images')) {
            (db as unknown as { deleteObjectStore(name: string): void }).deleteObjectStore('images');
          }
        }

        // Version 3: Add sortOrder to existing links (backfill with 0)
        if (oldVersion < 3) {
          const linkStore = transaction.objectStore('doctorImageLinks');
          linkStore.getAll().then(links => {
            for (const link of links) {
              if ((link as unknown as Record<string, unknown>).sortOrder === undefined) {
                linkStore.put({ ...link, sortOrder: 0 });
              }
            }
          });
        }
      },
    });
  } catch (e) {
    // DB is corrupted — nuke it and start fresh
    console.warn('Database corrupted, recreating...', e);
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('doctor-app-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    // Retry with a clean slate
    return openDB<DoctorDB>('doctor-app-db', 3, {
      upgrade(db) {
        db.createObjectStore('doctors', { keyPath: 'id' });
        db.createObjectStore('globalImages', { keyPath: 'id' });
        const linkStore = db.createObjectStore('doctorImageLinks', { keyPath: 'id' });
        linkStore.createIndex('by-doctor', 'doctorId');
        linkStore.createIndex('by-image', 'imageId');
      },
    });
  }
}

function getDbPromise(): Promise<IDBPDatabase<DoctorDB>> {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

export const dbParams = {
  // ── Doctors ───────────────────────────────────────
  async getDoctors(): Promise<Doctor[]> {
    const db = await getDbPromise();
    return db.getAll('doctors');
  },

  async getDoctor(id: string): Promise<Doctor | undefined> {
    const db = await getDbPromise();
    return db.get('doctors', id);
  },

  async addDoctor(doctor: Doctor): Promise<string> {
    const db = await getDbPromise();
    await db.put('doctors', doctor);
    return doctor.id;
  },

  async deleteDoctor(id: string): Promise<void> {
    const db = await getDbPromise();
    // Delete doctor and their links (NOT the images themselves)
    const tx = db.transaction(['doctors', 'doctorImageLinks'], 'readwrite');
    await tx.objectStore('doctors').delete(id);
    const index = tx.objectStore('doctorImageLinks').index('by-doctor');
    let cursor = await index.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  // ── Global Images ────────────────────────────────
  async getAllImages(): Promise<GlobalImage[]> {
    const db = await getDbPromise();
    return db.getAll('globalImages');
  },

  async addGlobalImage(image: GlobalImage): Promise<string> {
    const db = await getDbPromise();
    await db.put('globalImages', image);
    return image.id;
  },

  async deleteGlobalImage(id: string): Promise<void> {
    const db = await getDbPromise();
    // Delete image AND all links referencing it
    const tx = db.transaction(['globalImages', 'doctorImageLinks'], 'readwrite');
    await tx.objectStore('globalImages').delete(id);
    const index = tx.objectStore('doctorImageLinks').index('by-image');
    let cursor = await index.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  // ── Doctor ↔ Image Links ─────────────────────────
  async linkImageToDoctor(doctorId: string, imageId: string): Promise<void> {
    const db = await getDbPromise();
    // Check if link already exists
    const allLinks = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    if (allLinks.some(l => l.imageId === imageId)) return; // already linked
    // Auto-assign sortOrder as max+1 so new images go to the end
    const maxOrder = allLinks.reduce((max, l) => Math.max(max, l.sortOrder ?? 0), 0);
    await db.put('doctorImageLinks', {
      id: crypto.randomUUID(),
      doctorId,
      imageId,
      sortOrder: maxOrder + 1,
    });
  },

  async unlinkImageFromDoctor(doctorId: string, imageId: string): Promise<void> {
    const db = await getDbPromise();
    const allLinks = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    const link = allLinks.find(l => l.imageId === imageId);
    if (link) {
      await db.delete('doctorImageLinks', link.id);
    }
  },

  async getDoctorLinkedImages(doctorId: string): Promise<GlobalImage[]> {
    const db = await getDbPromise();
    const links = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    // Sort links by sortOrder so images come back in user-defined sequence
    const sortedLinks = [...links].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const images: GlobalImage[] = [];
    for (const link of sortedLinks) {
      const img = await db.get('globalImages', link.imageId);
      if (img) images.push(img);
    }
    return images;
  },

  /** Reorder images for a doctor. imageIds should be in the desired display order. */
  async reorderDoctorImages(doctorId: string, imageIds: string[]): Promise<void> {
    const db = await getDbPromise();
    const links = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    const tx = db.transaction('doctorImageLinks', 'readwrite');
    for (const link of links) {
      const newOrder = imageIds.indexOf(link.imageId);
      if (newOrder !== -1 && link.sortOrder !== newOrder) {
        await tx.store.put({ ...link, sortOrder: newOrder });
      }
    }
    await tx.done;
  },

  async getDoctorLinkedImageIds(doctorId: string): Promise<Set<string>> {
    const db = await getDbPromise();
    const links = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    return new Set(links.map(l => l.imageId));
  },
};
