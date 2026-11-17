import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore on boot
async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation synchronicity constants matching firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  UID_MAX: 128,
  UID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  EMAIL_MIN: 3,
  EMAIL_MAX: 160,
  HOUSEHOLD_NAME_MIN: 1,
  HOUSEHOLD_NAME_MAX: 100,
  COUNTRY_MIN: 1,
  COUNTRY_MAX: 40,
  STATE_MIN: 1,
  STATE_MAX: 80,
  MEMBERS_MIN: 1,
  MEMBERS_MAX: 25,
  SIZE_M2_MIN: 10,
  SIZE_M2_MAX: 10000,
  CURRENCY_MIN: 3,
  CURRENCY_MAX: 8,
  LANG_MIN: 2,
  LANG_MAX: 8,
};

export interface FirestoreHouseholdDoc {
  uid: string;
  email: string;
  householdName: string;
  country: string;
  stateRegion: string;
  members: number;
  homeType:
    | 'Apartment'
    | 'Independent House'
    | 'Detached House'
    | 'Row Home'
    | 'Villa'
    | 'Rural Homestead';
  sizeM2: number;
  unitSystem: 'metric' | 'imperial';
  currency: string;
  language: string;
}

export async function fetchFirestoreHouseholdProfile(
  uid: string
): Promise<FirestoreHouseholdDoc | null> {
  if (!BLUEPRINT_CONSTRAINTS.UID_PATTERN.test(uid)) return null;
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid || uid),
      email: String(data.email || ''),
      householdName: String(data.householdName || 'Registered Household'),
      country: String(data.country || 'global'),
      stateRegion: String(data.stateRegion || 'Metropolitan District'),
      members: Number(data.members || 3),
      homeType: data.homeType || 'Apartment',
      sizeM2: Number(data.sizeM2 || 110),
      unitSystem: data.unitSystem === 'imperial' ? 'imperial' : 'metric',
      currency: String(data.currency || 'USD'),
      language: String(data.language || 'en'),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

export async function upsertFirestoreHouseholdProfile(
  uid: string,
  payload: Omit<FirestoreHouseholdDoc, 'uid'>
): Promise<void> {
  const safeUid = uid.slice(0, BLUEPRINT_CONSTRAINTS.UID_MAX);
  if (!BLUEPRINT_CONSTRAINTS.UID_PATTERN.test(safeUid)) {
    throw new Error('Invalid UID format');
  }
  const userPath = `users/${safeUid}`;
  const docRef = doc(db, 'users', safeUid);

  const sanitized = {
    email: (payload.email || 'user@terraledger.org')
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.EMAIL_MAX),
    householdName: (payload.householdName || 'Registered Household')
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.HOUSEHOLD_NAME_MAX),
    country: (payload.country || 'global')
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.COUNTRY_MAX),
    stateRegion: (payload.stateRegion || 'Metropolitan District')
      .trim()
      .slice(0, BLUEPRINT_CONSTRAINTS.STATE_MAX),
    members: Math.min(
      BLUEPRINT_CONSTRAINTS.MEMBERS_MAX,
      Math.max(BLUEPRINT_CONSTRAINTS.MEMBERS_MIN, Math.round(Number(payload.members) || 1))
    ),
    homeType: payload.homeType || 'Apartment',
    sizeM2: Math.min(
      BLUEPRINT_CONSTRAINTS.SIZE_M2_MAX,
      Math.max(BLUEPRINT_CONSTRAINTS.SIZE_M2_MIN, Math.round(Number(payload.sizeM2) || 100))
    ),
    unitSystem: payload.unitSystem === 'imperial' ? ('imperial' as const) : ('metric' as const),
    currency: (payload.currency || 'USD').slice(0, BLUEPRINT_CONSTRAINTS.CURRENCY_MAX),
    language: (payload.language || 'en').slice(0, BLUEPRINT_CONSTRAINTS.LANG_MAX),
  };

  let exists = false;
  try {
    const existingSnap = await getDoc(docRef);
    exists = existingSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (exists) {
    try {
      await updateDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  } else {
    try {
      await setDoc(docRef, {
        uid: safeUid,
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  }
}

export { signInWithPopup, firebaseSignOut, onAuthStateChanged };
export type { User };
