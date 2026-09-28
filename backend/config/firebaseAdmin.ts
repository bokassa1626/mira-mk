import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

let adminApp: App;

const currentApps = getApps();
if (currentApps.length > 0 && currentApps[0]) {
  adminApp = currentApps[0];
} else {
  try {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  } catch {
    adminApp = getApps()[0] || initializeApp({
      projectId: firebaseConfig.projectId
    });
  }
}

export const adminAuth: Auth = getAuth(adminApp);
export const adminFirestore: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(adminApp);
export { adminApp };
