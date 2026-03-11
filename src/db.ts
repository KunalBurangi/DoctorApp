import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  contact?: string;
  avatarUrl?: string;
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
  // Keep old 'images' store definition for migration (will be deleted after migration)
  images: {
    key: string;
    value: { id: string; doctorId: string; imageBlob: Blob; description?: string; createdAt: number };
    indexes: { 'by-doctor': string };
  };
}

let dbPromise: Promise<IDBPDatabase<DoctorDB>> | null = null;

function getDbPromise(): Promise<IDBPDatabase<DoctorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DoctorDB>('doctor-app-db', 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // Version 1: Original schema
        if (oldVersion < 1) {
          db.createObjectStore('doctors', { keyPath: 'id' });
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('by-doctor', 'doctorId');
        }

        // Version 2: Shared image library
        if (oldVersion < 2) {
          // Create new stores
          db.createObjectStore('globalImages', { keyPath: 'id' });
          const linkStore = db.createObjectStore('doctorImageLinks', { keyPath: 'id' });
          linkStore.createIndex('by-doctor', 'doctorId');
          linkStore.createIndex('by-image', 'imageId');

          // Migrate existing images → globalImages + doctorImageLinks
          const oldImageStore = transaction.objectStore('images');
          oldImageStore.getAll().then(oldImages => {
            const globalImgStore = transaction.objectStore('globalImages');
            const linkStoreRef = transaction.objectStore('doctorImageLinks');

            for (const old of oldImages) {
              // Add to global images
              globalImgStore.put({
                id: old.id,
                imageBlob: old.imageBlob,
                name: old.description || `Image ${old.id.slice(0, 6)}`,
                createdAt: old.createdAt,
              });
              // Create link to original doctor
              linkStoreRef.put({
                id: crypto.randomUUID(),
                doctorId: old.doctorId,
                imageId: old.id,
              });
            }
          });

          // Delete old images store
          db.deleteObjectStore('images');
        }
      },
    });
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
    await db.put('doctorImageLinks', {
      id: crypto.randomUUID(),
      doctorId,
      imageId,
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
    const images: GlobalImage[] = [];
    for (const link of links) {
      const img = await db.get('globalImages', link.imageId);
      if (img) images.push(img);
    }
    return images.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getDoctorLinkedImageIds(doctorId: string): Promise<Set<string>> {
    const db = await getDbPromise();
    const links = await db.getAllFromIndex('doctorImageLinks', 'by-doctor', doctorId);
    return new Set(links.map(l => l.imageId));
  },
};
