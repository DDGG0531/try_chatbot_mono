import admin from 'firebase-admin';
import { config, hasFirebaseCredentials } from '@/config';

export function initFirebaseAdmin() {
  if (admin.apps.length) return;
  if (!hasFirebaseCredentials()) {
    console.warn('[auth] Missing Firebase Admin credentials. Token verification will fail.');
    return;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId!,
        clientEmail: config.firebase.clientEmail!,
        privateKey: config.firebase.privateKey!,
      }),
    });
  } catch (e) {
    console.error('[auth] Failed to initialize Firebase Admin:', e);
  }
}

export { admin };

