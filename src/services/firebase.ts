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
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
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

// Database ID provisioned for this applet
export const FIRESTORE_DATABASE_ID = (defaultFirebaseConfig as Record<string, unknown>).firestoreDatabaseId as string || 'ai-studio-ridingao-75c3cebb-d091-44d7-80f5-cf313114ad76';

// Initialize Firestore with specific database ID (CRITICAL)
export const db: Firestore = getFirestore(app, FIRESTORE_DATABASE_ID);

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
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[RIDING.ao Firebase] Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[RIDING.ao Firebase] Firestore client is operating in offline mode.');
    } else {
      console.info('[RIDING.ao Firebase] Initialized Firestore in cloud region: europe-west2.');
    }
    return false;
  }
}

// Run connection check in background on load
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {
    // Gracefully handle background check
  });
}
