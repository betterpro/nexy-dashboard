import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
  }),
};

// Initialize Firebase Admin
const app =
  getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const auth = getAuth(app);
const admin = getFirestore(app);

export { auth, admin };
