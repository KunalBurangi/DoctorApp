import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  contact?: string;
  avatarUrl?: string; // e.g. base64 or blob url
  createdAt: number;
}

export interface DoctorImage {
  id: string;
  doctorId: string;
  imageBlob: Blob; // Store actual File/Blob object
  description?: string;
  createdAt: number;
}

interface DoctorDB extends DBSchema {
  doctors: {
    key: string;
    value: Doctor;
  };
  images: {
    key: string;
    value: DoctorImage;
    indexes: { 'by-doctor': string };
  };
}

let dbPromise: Promise<IDBPDatabase<DoctorDB>> | null = null;

function getDbPromise(): Promise<IDBPDatabase<DoctorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DoctorDB>('doctor-app-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('doctors')) {
          db.createObjectStore('doctors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('by-doctor', 'doctorId');
        }
      },
    });
  }
  return dbPromise;
}

export const dbParams = {
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
    // Delete doctor and their associated images
    const tx = db.transaction(['doctors', 'images'], 'readwrite');
    await tx.objectStore('doctors').delete(id);
    const index = tx.objectStore('images').index('by-doctor');
    let cursor = await index.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  async getDoctorImages(doctorId: string): Promise<DoctorImage[]> {
    const db = await getDbPromise();
    return db.getAllFromIndex('images', 'by-doctor', doctorId);
  },

  async addDoctorImage(image: DoctorImage): Promise<string> {
    const db = await getDbPromise();
    await db.put('images', image);
    return image.id;
  },

  async deleteDoctorImage(id: string): Promise<void> {
    const db = await getDbPromise();
    await db.delete('images', id);
  }
};
