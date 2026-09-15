"use client";

import type { NormalizedDocument } from "@/types/document";

const DB_NAME = "lexiguide_db";
const STORE_NAME = "documents";
const DB_VERSION = 1;

/**
 * Returns a promise that resolves to the IndexedDB database.
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Stores the full document arrays in IndexedDB.
 */
export async function idbSaveDocumentArrays(doc: NormalizedDocument): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const payload = {
        id: doc.id,
        sections: doc.sections || [],
        chunks: doc.chunks || [],
        pages: doc.pages || [],
      };

      const request = store.put(payload);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB save failed:", err);
  }
}

/**
 * Retrieves the full document arrays from IndexedDB.
 */
export async function idbGetDocumentArrays(id: string): Promise<Partial<NormalizedDocument> | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB get failed:", err);
    return null;
  }
}

/**
 * Deletes a document's arrays from IndexedDB.
 */
export async function idbDeleteDocumentArrays(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB delete failed:", err);
  }
}

/**
 * Clears all documents from IndexedDB.
 */
export async function idbClearAll(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB clear failed:", err);
  }
}
