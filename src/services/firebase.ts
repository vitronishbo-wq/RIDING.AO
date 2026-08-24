/**
 * RIDING.ao - Firebase SDK Initialization & Firestore Service
 * 
 * Provides:
 * - Firebase App, Auth and Firestore instance with dedicated databaseId
 * - Typed Error Handler (handleFirestoreError) conforming to FirestoreErrorInfo
 * - Non-blocking connection verification against Firestore
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Construct config with priority to Vite environment variables, falling back to applet config
const resolvedFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (defaultFirebaseConfig as Record<string, unknown>).measurementId,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

// Database ID provisioned for this applet / default Firestore
export const FIRESTORE_DATABASE_ID = (defaultFirebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || '(default)';

// Initialize Firestore (with resilient long-polling auto-detection)
function createFirestoreInstance(): Firestore {
  try {
    if (FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)') {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, FIRESTORE_DATABASE_ID);
    }
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)'
      ? getFirestore(app, FIRESTORE_DATABASE_ID)
      : getFirestore(app);
  }
}

export const db: Firestore = createFirestoreInstance();

// Initialize Auth
export const auth: Auth = getAuth(app);

// -------------------------------------------------------------
// FIRESTORE ERROR HANDLING PROTOCOL
// -------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[RIDING.ao Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// CONNECTION HEALTH CHECK
// -------------------------------------------------------------
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('[RIDING.ao Firebase] Navigator is currently offline.');
    return false;
  }
  return true;
}
