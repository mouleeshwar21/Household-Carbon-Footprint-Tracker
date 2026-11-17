import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  User,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyPasswordResetCode,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ActivityInputs,
  CarbonAudit,
  CurrencyCode,
  HouseholdProfile,
  RegionId,
  ThemeId,
  UnitSystem,
} from '../types/carbon';
import {
  THEMES_CATALOG,
  buildEmptyAudit,
  buildSeedAudits,
  computeAuditBreakdown,
} from '../utils/calculations';

import { hashSecurityAnswer } from '../utils/security';

interface DeletedAuditBuffer {
  label: string;
  audits: CarbonAudit[];
}

interface LocalSecurityRecovery {
  uid: string;
  emailLower: string;
  question: string;
  answerHash: string;
}

export interface LocalHouseholdSession {
  uid: string;
  email: string;
  householdName: string;
}

export type AuthNoticeAction = 'switch_to_signin' | 'switch_to_signup' | null;

interface EcoTrackContextValue {
  user: User | null;
  localSession: LocalHouseholdSession | null;
  isDemoMode: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  authNotice: string | null;
  authNoticeAction: AuthNoticeAction;
  clearAuthNotice: () => void;
  securityQuestion: string | null;
  curtainVisible: boolean;
  startAnimVisible: boolean;
  dismissStartAnimation: () => void;
  shellEntranceKey: number;
  profile: HouseholdProfile;
  audits: CarbonAudit[];
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  activeAudit: CarbonAudit;
  previousAudit: CarbonAudit | null;
  completedHabits: string[];
  adoptedActionIds: string[];
  pendingUndoAudit: DeletedAuditBuffer | null;
  setTheme: (theme: ThemeId) => void;
  toggleDarkLight: () => void;
  toggleUnitSystem: () => void;
  updateProfileFields: (patch: Partial<HouseholdProfile>) => void;
  upsertAudit: (auditInput: Omit<CarbonAudit, 'id' | 'uid' | 'createdAtIso' | 'updatedAtIso' | 'totalKgCo2e'> & { id?: string }) => Promise<CarbonAudit>;
  quickAdjustStream: (field: keyof ActivityInputs, delta: number) => void;
  deleteAuditWithUndo: (auditId: string) => void;
  deleteAllAudits: () => void;
  undoDeleteAudit: () => void;
  dismissUndo: () => void;
  toggleHabit: (habitId: string) => void;
  toggleAdoptedAction: (actionId: string) => void;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (
    email: string,
    password: string,
    householdName?: string,
    securityQuestion?: string,
    securityAnswer?: string
  ) => Promise<boolean>;
  lookupSecurityQuestion: (
    email: string
  ) => Promise<{ found: boolean; question?: string; hasLocalPassword?: boolean; error?: string }>;
  verifySecurityAnswer: (
    email: string,
    answer: string
  ) => Promise<{ verified: boolean; resetToken?: string; hasLocalPassword?: boolean; error?: string }>;
  resetLocalAccountPassword: (
    email: string,
    resetToken: string,
    newPassword: string
  ) => Promise<{ ok: boolean; message: string }>;
  sendVerifiedPasswordReset: (email: string, resetToken: string) => Promise<{ ok: boolean; message: string }>;
  completePasswordResetWithCode: (oobCode: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  saveSecurityRecovery: (question: string, answer: string) => Promise<{ ok: boolean; message: string }>;
  changePasswordWithSecurityCheck: (
    securityAnswer: string,
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; message: string }>;
  signInDemo: () => void;
  signOutHousehold: () => Promise<void>;
}

const DEFAULT_PROFILE: HouseholdProfile = {
  uid: 'demo_household',
  householdName: 'Verdant Canopy Residence',
  members: 3,
  regionId: 'IN',
  currency: 'INR',
  unitSystem: 'metric',
  theme: 'botanical-sage',
  solarOffsetPct: 35,
  monthlyTargetKg: 500,
};

const STORAGE_KEYS = {
  demoActive: 'ecotrack_v22_demo_active',
  localSession: 'ecotrack_v22_household_session',
  profile: (uid: string) => `ecotrack_v22_profile_${uid}`,
  audits: (uid: string) => `ecotrack_v22_audits_${uid}`,
  auditsSeeded: (uid: string) => `ecotrack_v22_audits_seeded_${uid}`,
  habits: (uid: string, date: string) => `ecotrack_v22_habits_${uid}_${date}`,
  abatement: (uid: string) => `ecotrack_v22_abatement_${uid}`,
  security: (uid: string) => `ecotrack_v22_security_${uid}`,
  theme: 'ecotrack_v22_theme',
};

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

const VALID_REGIONS: RegionId[] = ['IN', 'GLOBAL', 'US', 'EU', 'UK', 'FR', 'BR_NO', 'AU', 'AFR'];
const VALID_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'BRL', 'KES', 'NGN'];
const VALID_THEMES: ThemeId[] = [
  'botanical-sage',
  'emerald-obsidian',
  'v22-blue-white',
  'midnight-aurora',
  'warm-alabaster',
  'nordic-frost',
];

function sanitizeRegion(regionId: RegionId | string | undefined): RegionId {
  return VALID_REGIONS.includes(regionId as RegionId) ? (regionId as RegionId) : 'IN';
}

function sanitizeProfilePayload(p: HouseholdProfile, uid: string): Record<string, unknown> {
  const safeName = (p.householdName || 'My Household').trim().slice(0, 80) || 'My Household';
  const safeTheme = VALID_THEMES.includes(p.theme) ? p.theme : 'botanical-sage';
  const safeCurrency = VALID_CURRENCIES.includes(p.currency) ? p.currency : 'INR';
  const safeUnit: UnitSystem = p.unitSystem === 'imperial' ? 'imperial' : 'metric';
  return {
    uid,
    householdName: safeName,
    members: Math.min(25, Math.max(1, Math.round(Number(p.members) || 1))),
    regionId: sanitizeRegion(p.regionId),
    currency: safeCurrency,
    unitSystem: safeUnit,
    theme: safeTheme,
    solarOffsetPct: Math.min(100, Math.max(0, Number(p.solarOffsetPct) || 0)),
    monthlyTargetKg: Math.min(50000, Math.max(0, Number(p.monthlyTargetKg) || 500)),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeAuditPayload(
  audit: CarbonAudit,
  uid: string,
  mode: 'create' | 'update_with_ts' | 'update_partial',
  existingCreatedAt?: Timestamp
): Record<string, unknown> {
  const clamp = (v: number | undefined, max: number) =>
    Math.min(max, Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0));

  const safeId = audit.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'audit_entry';
  const safeMonth = /^\d{4}-\d{2}$/.test(audit.month) ? audit.month : '2026-11';
  const safeLabel = (audit.label || safeMonth).trim().slice(0, 64) || safeMonth;

  const payload: Record<string, unknown> = {
    id: safeId,
    uid,
    month: safeMonth,
    label: safeLabel,
    regionId: sanitizeRegion(audit.regionId),
    members: Math.min(25, Math.max(1, Math.round(Number(audit.members) || 1))),
    solarOffsetPct: clamp(audit.solarOffsetPct, 100),
    electricityKwh: clamp(audit.electricityKwh, 100000),
    lpgKg: clamp(audit.lpgKg, 5000),
    petrolL: clamp(audit.petrolL, 10000),
    dieselL: clamp(audit.dieselL, 10000),
    airTravelKm: clamp(audit.airTravelKm, 250000),
    pngM3: clamp(audit.pngM3, 10000),
    waterM3: clamp(audit.waterM3, 50000),
    wasteKg: clamp(audit.wasteKg, 10000),
    compostKg: clamp(audit.compostKg, 10000),
    evKm: clamp(audit.evKm, 100000),
    motorcycleKm: clamp(audit.motorcycleKm, 100000),
    transitKm: clamp(audit.transitKm, 100000),
    biomassKg: clamp(audit.biomassKg, 10000),
    totalKgCo2e: clamp(audit.totalKgCo2e, 500000),
    notes: (audit.notes || '').slice(0, 400),
    updatedAt: serverTimestamp(),
  };

  if (mode === 'create') {
    payload.createdAt = serverTimestamp();
  } else if (mode === 'update_with_ts' && existingCreatedAt) {
    payload.createdAt = existingCreatedAt;
  }

  return payload;
}

const EcoTrackContext = createContext<EcoTrackContextValue | null>(null);

export const EcoTrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [localSession, setLocalSession] = useState<LocalHouseholdSession | null>(() =>
    safeReadJson<LocalHouseholdSession | null>(STORAGE_KEYS.localSession, null)
  );
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.demoActive) === 'true'
  );
  const [authReady, setAuthReady] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authNoticeAction, setAuthNoticeAction] = useState<AuthNoticeAction>(null);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);

  const [curtainVisible, setCurtainVisible] = useState(false);
  const [startAnimVisible, setStartAnimVisible] = useState(true);
  const [shellEntranceKey, setShellEntranceKey] = useState(1);

  const initialTheme = (localStorage.getItem(STORAGE_KEYS.theme) as ThemeId) || 'botanical-sage';
  const [profile, setProfile] = useState<HouseholdProfile>({
    ...DEFAULT_PROFILE,
    theme: THEMES_CATALOG.some((t) => t.id === initialTheme) ? initialTheme : 'botanical-sage',
  });
  const [audits, setAudits] = useState<CarbonAudit[]>(() => buildSeedAudits('demo_household', 'IN'));
  const [activeMonth, setActiveMonth] = useState<string>('2026-11');
  const [completedHabits, setCompletedHabits] = useState<string[]>(['ac-eco', 'compost-scraps']);
  const [adoptedActionIds, setAdoptedActionIds] = useState<string[]>(['ac-24c', 'home-compost']);
  const [pendingUndoAudit, setPendingUndoAudit] = useState<DeletedAuditBuffer | null>(null);

  const createdAtMapRef = useRef<Record<string, Timestamp>>({});
  const hadCloudAuditsRef = useRef<Record<string, boolean>>({});
  const undoTimerRef = useRef<number | null>(null);
  const curtainTimerRef = useRef<number | null>(null);

  const activeUid = user?.uid || localSession?.uid || 'demo_household';
  const canUseCloudFirestore = Boolean(user && user.emailVerified);

  const triggerOpeningCurtain = useCallback(() => {
    if (curtainTimerRef.current) {
      window.clearTimeout(curtainTimerRef.current);
    }
    setCurtainVisible(true);
    curtainTimerRef.current = window.setTimeout(() => {
      setCurtainVisible(false);
      setShellEntranceKey((k) => k + 1);
    }, 680);
  }, []);

  const dismissStartAnimation = useCallback(() => {
    setStartAnimVisible(false);
    setShellEntranceKey((k) => k + 1);
  }, []);

  // Apply theme & .dark class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', profile.theme);
    const meta = THEMES_CATALOG.find((t) => t.id === profile.theme);
    if (meta?.mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, profile.theme);
  }, [profile.theme]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsDemoMode(false);
        localStorage.removeItem(STORAGE_KEYS.demoActive);
        setAuthNoticeAction(null);
        if (!firebaseUser.emailVerified) {
          setAuthNotice(
            'Verification link sent to your inbox. Please verify your email address to enable cloud sync.'
          );
        } else {
          setAuthNotice(null);
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Load local data and attach Firestore listeners when authenticated & verified
  useEffect(() => {
    if (!authReady) return;

    const uid = user?.uid || localSession?.uid || 'demo_household';
    const localProfile = safeReadJson<HouseholdProfile>(STORAGE_KEYS.profile(uid), {
      ...DEFAULT_PROFILE,
      uid,
      householdName: user?.displayName
        ? `${user.displayName.split(' ')[0]}'s Eco Residence`
        : localSession?.householdName || DEFAULT_PROFILE.householdName,
      theme: profile.theme,
    });
    setProfile(localProfile);

    const rawLocalAudits = localStorage.getItem(STORAGE_KEYS.audits(uid));
    const wasSeededLocally = localStorage.getItem(STORAGE_KEYS.auditsSeeded(uid)) === 'true';
    let localAudits: CarbonAudit[];
    if (rawLocalAudits !== null) {
      localAudits = safeReadJson<CarbonAudit[]>(STORAGE_KEYS.audits(uid), []);
    } else if (wasSeededLocally || (canUseCloudFirestore && user)) {
      localAudits = [];
    } else {
      localAudits = buildSeedAudits(uid, localProfile.regionId);
      safeWriteJson(STORAGE_KEYS.audits(uid), localAudits);
      localStorage.setItem(STORAGE_KEYS.auditsSeeded(uid), 'true');
    }
    const sortedLocal = [...localAudits].sort((a, b) => a.month.localeCompare(b.month));
    setAudits(sortedLocal);
    if (sortedLocal.length > 0) {
      setActiveMonth((prev) =>
        sortedLocal.some((a) => a.month === prev) ? prev : sortedLocal[sortedLocal.length - 1].month
      );
    }

    const todayKey = todayIsoDate();
    setCompletedHabits(
      safeReadJson<string[]>(STORAGE_KEYS.habits(uid, todayKey), ['ac-eco', 'compost-scraps'])
    );
    setAdoptedActionIds(
      safeReadJson<string[]>(STORAGE_KEYS.abatement(uid), ['ac-24c', 'home-compost'])
    );

    const localSecurity = safeReadJson<LocalSecurityRecovery | null>(
      STORAGE_KEYS.security(uid),
      null
    );
    setSecurityQuestion(localSecurity?.question || null);

    if (!canUseCloudFirestore || !user) return;

    let isBrandNewCloudUser = false;
    let initialProfileChecked = false;
    const profileRef = doc(db, `users/${user.uid}/profile`, 'household');
    const auditsPath = `users/${user.uid}/audits`;

    const checkAndSeedIfBrandNew = async () => {
      if (
        hadCloudAuditsRef.current[user.uid] ||
        localStorage.getItem(STORAGE_KEYS.auditsSeeded(user.uid)) === 'true' ||
        localStorage.getItem(STORAGE_KEYS.audits(user.uid)) !== null
      ) {
        setAudits([]);
        safeWriteJson(STORAGE_KEYS.audits(user.uid), []);
        localStorage.setItem(STORAGE_KEYS.auditsSeeded(user.uid), 'true');
        return;
      }

      if (!initialProfileChecked) {
        try {
          const snap = await getDoc(profileRef);
          isBrandNewCloudUser = !snap.exists();
          initialProfileChecked = true;
        } catch {
          isBrandNewCloudUser = false;
        }
      }

      if (isBrandNewCloudUser) {
        isBrandNewCloudUser = false;
        hadCloudAuditsRef.current[user.uid] = true;
        localStorage.setItem(STORAGE_KEYS.auditsSeeded(user.uid), 'true');
        const seed = buildSeedAudits(user.uid, localProfile.regionId);
        seed.forEach((item) => {
          const docRef = doc(db, auditsPath, item.id);
          setDoc(docRef, sanitizeAuditPayload(item, user.uid, 'create')).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, `${auditsPath}/${item.id}`)
          );
        });
        setAudits(seed);
        safeWriteJson(STORAGE_KEYS.audits(user.uid), seed);
      } else {
        localStorage.setItem(STORAGE_KEYS.auditsSeeded(user.uid), 'true');
        setAudits([]);
        safeWriteJson(STORAGE_KEYS.audits(user.uid), []);
      }
    };

    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          initialProfileChecked = true;
          const data = snap.data() as Partial<HouseholdProfile>;
          const merged: HouseholdProfile = {
            ...localProfile,
            ...data,
            uid: user.uid,
          };
          setProfile(merged);
          safeWriteJson(STORAGE_KEYS.profile(user.uid), merged);
        } else {
          if (!initialProfileChecked) {
            isBrandNewCloudUser = true;
            initialProfileChecked = true;
          }
          const initialDoc = sanitizeProfilePayload(localProfile, user.uid);
          setDoc(profileRef, initialDoc).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/profile/household`)
          );
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/profile/household`)
    );

    const auditsQuery = query(collection(db, auditsPath), where('uid', '==', user.uid));
    const unsubAudits = onSnapshot(
      auditsQuery,
      (snap) => {
        if (snap.empty) {
          void checkAndSeedIfBrandNew();
        } else {
          hadCloudAuditsRef.current[user.uid] = true;
          localStorage.setItem(STORAGE_KEYS.auditsSeeded(user.uid), 'true');
          const nextAudits: CarbonAudit[] = snap.docs
            .map((d) => {
              const data = d.data() as any;
              if (data.createdAt instanceof Timestamp) {
                createdAtMapRef.current[d.id] = data.createdAt;
              }
              const createdIso =
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate().toISOString()
                  : new Date().toISOString();
              const updatedIso =
                data.updatedAt instanceof Timestamp
                  ? data.updatedAt.toDate().toISOString()
                  : new Date().toISOString();
              return {
                id: d.id,
                uid: data.uid,
                month: data.month,
                label: data.label,
                regionId: data.regionId,
                members: data.members,
                solarOffsetPct: data.solarOffsetPct,
                electricityKwh: data.electricityKwh,
                lpgKg: data.lpgKg,
                petrolL: data.petrolL,
                dieselL: data.dieselL,
                airTravelKm: data.airTravelKm,
                pngM3: data.pngM3,
                waterM3: data.waterM3,
                wasteKg: data.wasteKg,
                compostKg: data.compostKg,
                evKm: data.evKm || 0,
                motorcycleKm: data.motorcycleKm || 0,
                transitKm: data.transitKm || 0,
                biomassKg: data.biomassKg || 0,
                totalKgCo2e: data.totalKgCo2e,
                notes: data.notes || '',
                createdAtIso: createdIso,
                updatedAtIso: updatedIso,
              };
            })
            .sort((a, b) => a.month.localeCompare(b.month));
          setAudits(nextAudits);
          safeWriteJson(STORAGE_KEYS.audits(user.uid), nextAudits);
          if (nextAudits.length > 0) {
            setActiveMonth((prev) =>
              nextAudits.some((a) => a.month === prev)
                ? prev
                : nextAudits[nextAudits.length - 1].month
            );
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, auditsPath)
    );

    const habitPath = `users/${user.uid}/habits/${todayKey}`;
    const unsubHabits = onSnapshot(
      doc(db, habitPath),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { completedIds?: string[] };
          if (Array.isArray(data.completedIds)) {
            setCompletedHabits(data.completedIds);
            safeWriteJson(STORAGE_KEYS.habits(user.uid, todayKey), data.completedIds);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, habitPath)
    );

    const abatementPath = `users/${user.uid}/abatement/plan`;
    const unsubAbatement = onSnapshot(
      doc(db, abatementPath),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { adoptedIds?: string[] };
          if (Array.isArray(data.adoptedIds)) {
            setAdoptedActionIds(data.adoptedIds);
            safeWriteJson(STORAGE_KEYS.abatement(user.uid), data.adoptedIds);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, abatementPath)
    );

    const securityPath = `users/${user.uid}/security/recovery`;
    const unsubSecurity = onSnapshot(
      doc(db, securityPath),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as {
            uid?: string;
            emailLower?: string;
            question?: string;
            answerHash?: string;
          };
          if (data.question) {
            setSecurityQuestion(data.question);
            safeWriteJson(STORAGE_KEYS.security(user.uid), {
              uid: user.uid,
              emailLower: data.emailLower || (user.email || '').toLowerCase(),
              question: data.question,
              answerHash: data.answerHash || '',
            });
          }
        } else if (
          localSecurity &&
          localSecurity.uid === user.uid &&
          localSecurity.question.length >= 5 &&
          /^[a-f0-9]{64}$/.test(localSecurity.answerHash)
        ) {
          setDoc(doc(db, securityPath), {
            uid: user.uid,
            emailLower: localSecurity.emailLower,
            question: localSecurity.question.slice(0, 160),
            answerHash: localSecurity.answerHash,
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, securityPath));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, securityPath)
    );

    return () => {
      unsubProfile();
      unsubAudits();
      unsubHabits();
      unsubAbatement();
      unsubSecurity();
    };
  }, [authReady, canUseCloudFirestore, user]);

  const persistProfile = useCallback(
    (next: HouseholdProfile) => {
      safeWriteJson(STORAGE_KEYS.profile(next.uid), next);
      if (canUseCloudFirestore && user) {
        const ref = doc(db, `users/${user.uid}/profile`, 'household');
        setDoc(ref, sanitizeProfilePayload(next, user.uid)).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/profile/household`)
        );
      }
    },
    [canUseCloudFirestore, user]
  );

  const updateProfileFields = useCallback(
    (patch: Partial<HouseholdProfile>) => {
      setProfile((prev) => {
        const next: HouseholdProfile = { ...prev, ...patch, uid: activeUid };
        persistProfile(next);
        return next;
      });
    },
    [activeUid, persistProfile]
  );

  const setTheme = useCallback(
    (theme: ThemeId) => {
      updateProfileFields({ theme });
    },
    [updateProfileFields]
  );

  const toggleDarkLight = useCallback(() => {
    setProfile((prev) => {
      const currentMeta = THEMES_CATALOG.find((t) => t.id === prev.theme);
      const nextTheme: ThemeId =
        currentMeta?.mode === 'dark' ? 'botanical-sage' : 'emerald-obsidian';
      const next = { ...prev, theme: nextTheme, uid: activeUid };
      persistProfile(next);
      return next;
    });
  }, [activeUid, persistProfile]);

  const toggleUnitSystem = useCallback(() => {
    setProfile((prev) => {
      const nextUnit: UnitSystem = prev.unitSystem === 'metric' ? 'imperial' : 'metric';
      const next = { ...prev, unitSystem: nextUnit, uid: activeUid };
      persistProfile(next);
      return next;
    });
  }, [activeUid, persistProfile]);

  const activeAudit = useMemo(() => {
    const found = audits.find((a) => a.month === activeMonth);
    if (found) return found;
    if (audits.length > 0) return audits[audits.length - 1];
    return buildEmptyAudit(activeUid, profile.regionId, profile.members, profile.solarOffsetPct);
  }, [audits, activeMonth, activeUid, profile.regionId, profile.members, profile.solarOffsetPct]);

  const previousAudit = useMemo(() => {
    const idx = audits.findIndex((a) => a.month === activeAudit.month);
    if (idx > 0) return audits[idx - 1];
    return null;
  }, [audits, activeAudit.month]);

  const upsertAudit = useCallback(
    async (
      auditInput: Omit<CarbonAudit, 'id' | 'uid' | 'createdAtIso' | 'updatedAtIso' | 'totalKgCo2e'> & {
        id?: string;
      }
    ): Promise<CarbonAudit> => {
      const rawId =
        auditInput.id || `audit_${auditInput.month.replace('-', '_')}`;
      const existing = audits.find((a) => a.id === rawId || a.month === auditInput.month);
      const finalId = (existing?.id || rawId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'audit_entry';
      const calc = computeAuditBreakdown(
        auditInput,
        auditInput.regionId,
        auditInput.members,
        auditInput.solarOffsetPct,
        profile.unitSystem
      );
      const nowIso = new Date().toISOString();
      const fullAudit: CarbonAudit = {
        ...auditInput,
        id: finalId,
        uid: activeUid,
        totalKgCo2e: calc.totalKgCo2e,
        createdAtIso: existing?.createdAtIso || nowIso,
        updatedAtIso: nowIso,
      };

      setAudits((prev) => {
        const filtered = prev.filter((a) => a.id !== finalId);
        const updated = [...filtered, fullAudit].sort((a, b) => a.month.localeCompare(b.month));
        safeWriteJson(STORAGE_KEYS.audits(activeUid), updated);
        return updated;
      });
      setActiveMonth(fullAudit.month);

      if (canUseCloudFirestore && user) {
        const path = `users/${user.uid}/audits/${finalId}`;
        const docRef = doc(db, `users/${user.uid}/audits`, finalId);
        const existingTs = createdAtMapRef.current[finalId];
        if (existingTs) {
          const payload = sanitizeAuditPayload(fullAudit, user.uid, 'update_with_ts', existingTs);
          setDoc(docRef, payload).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, path)
          );
        } else if (existing) {
          const updatePayload = sanitizeAuditPayload(fullAudit, user.uid, 'update_partial');
          updateDoc(docRef, updatePayload).catch((err: any) => {
            if (err?.code === 'not-found') {
              const createPayload = sanitizeAuditPayload(fullAudit, user.uid, 'create');
              setDoc(docRef, createPayload).catch((createErr) =>
                handleFirestoreError(createErr, OperationType.CREATE, path)
              );
            } else {
              handleFirestoreError(err, OperationType.UPDATE, path);
            }
          });
        } else {
          const payload = sanitizeAuditPayload(fullAudit, user.uid, 'create');
          setDoc(docRef, payload).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, path)
          );
        }
      }

      return fullAudit;
    },
    [activeUid, audits, canUseCloudFirestore, profile.unitSystem, user]
  );

  const quickAdjustStream = useCallback(
    (field: keyof ActivityInputs, delta: number) => {
      const currentVal = Number(activeAudit[field] || 0);
      const nextVal = Math.max(0, Number((currentVal + delta).toFixed(2)));
      void upsertAudit({
        ...activeAudit,
        [field]: nextVal,
      });
    },
    [activeAudit, upsertAudit]
  );

  const deleteAuditWithUndo = useCallback(
    (auditId: string) => {
      const target = audits.find((a) => a.id === auditId);
      if (!target) return;

      setPendingUndoAudit({ label: target.label, audits: [target] });
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setPendingUndoAudit(null);
      }, 10000);

      localStorage.setItem(STORAGE_KEYS.auditsSeeded(activeUid), 'true');
      setAudits((prev) => {
        const next = prev.filter((a) => a.id !== auditId);
        safeWriteJson(STORAGE_KEYS.audits(activeUid), next);
        return next;
      });

      if (canUseCloudFirestore && user) {
        hadCloudAuditsRef.current[user.uid] = true;
        const path = `users/${user.uid}/audits/${auditId}`;
        deleteDoc(doc(db, `users/${user.uid}/audits`, auditId)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, path)
        );
      }
    },
    [activeUid, audits, canUseCloudFirestore, user]
  );

  const deleteAllAudits = useCallback(() => {
    if (audits.length === 0) return;
    const snapshot = [...audits];

    setPendingUndoAudit({
      label: `all ${snapshot.length} ${snapshot.length === 1 ? 'audit' : 'audits'}`,
      audits: snapshot,
    });
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setPendingUndoAudit(null);
    }, 10000);

    localStorage.setItem(STORAGE_KEYS.auditsSeeded(activeUid), 'true');
    setAudits([]);
    safeWriteJson(STORAGE_KEYS.audits(activeUid), []);

    if (canUseCloudFirestore && user) {
      hadCloudAuditsRef.current[user.uid] = true;
      snapshot.forEach((item) => {
        const path = `users/${user.uid}/audits/${item.id}`;
        deleteDoc(doc(db, `users/${user.uid}/audits`, item.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, path)
        );
      });
    }
  }, [activeUid, audits, canUseCloudFirestore, user]);

  const undoDeleteAudit = useCallback(() => {
    if (!pendingUndoAudit) return;
    const restored = pendingUndoAudit.audits;
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setPendingUndoAudit(null);

    setAudits((prev) => {
      const restoredIds = new Set(restored.map((r) => r.id));
      const next = [...prev.filter((a) => !restoredIds.has(a.id)), ...restored].sort((a, b) =>
        a.month.localeCompare(b.month)
      );
      safeWriteJson(STORAGE_KEYS.audits(activeUid), next);
      return next;
    });

    if (canUseCloudFirestore && user) {
      restored.forEach((audit) => {
        const safeId = audit.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'audit_entry';
        const path = `users/${user.uid}/audits/${safeId}`;
        const payload = sanitizeAuditPayload(audit, user.uid, 'create');
        setDoc(doc(db, `users/${user.uid}/audits`, safeId), payload).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, path)
        );
      });
    }
  }, [activeUid, canUseCloudFirestore, pendingUndoAudit, user]);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setPendingUndoAudit(null);
  }, []);

  const toggleHabit = useCallback(
    (habitId: string) => {
      const todayKey = todayIsoDate();
      setCompletedHabits((prev) => {
        const exists = prev.includes(habitId);
        const next = exists ? prev.filter((id) => id !== habitId) : [...prev, habitId].slice(0, 10);
        safeWriteJson(STORAGE_KEYS.habits(activeUid, todayKey), next);
        if (canUseCloudFirestore && user) {
          const path = `users/${user.uid}/habits/${todayKey}`;
          setDoc(doc(db, path), {
            uid: user.uid,
            date: todayKey,
            completedIds: next,
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
        }
        return next;
      });
    },
    [activeUid, canUseCloudFirestore, user]
  );

  const toggleAdoptedAction = useCallback(
    (actionId: string) => {
      setAdoptedActionIds((prev) => {
        const exists = prev.includes(actionId);
        const next = exists ? prev.filter((id) => id !== actionId) : [...prev, actionId].slice(0, 24);
        safeWriteJson(STORAGE_KEYS.abatement(activeUid), next);
        if (canUseCloudFirestore && user) {
          const path = `users/${user.uid}/abatement/plan`;
          setDoc(doc(db, path), {
            uid: user.uid,
            adoptedIds: next,
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
        }
        return next;
      });
    },
    [activeUid, canUseCloudFirestore, user]
  );

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthNotice(null);
    setAuthNoticeAction(null);
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem(STORAGE_KEYS.localSession);
      setLocalSession(null);
      triggerOpeningCurtain();
      return true;
    } catch (err: any) {
      setAuthNotice(err?.message || 'Google Sign-In could not be completed.');
      return false;
    }
  }, [triggerOpeningCurtain]);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setAuthNotice(null);
      setAuthNoticeAction(null);
      const cleanEmail = email.trim();

      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        localStorage.removeItem(STORAGE_KEYS.localSession);
        setLocalSession(null);
        triggerOpeningCurtain();
        return true;
      } catch (err: any) {
        const code = err?.code || '';

        // If Firebase Email/Password is not enabled yet OR account lives in household recovery store,
        // verify against salted scrypt household auth endpoints so account existence & login work cleanly.
        if (code === 'auth/operation-not-allowed' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          try {
            const hhRes = await fetch('/api/auth/household/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password }),
            });
            const hhData = await hhRes.json();
            if (hhRes.ok && hhData.ok) {
              const session: LocalHouseholdSession = {
                uid: hhData.uid,
                email: hhData.email,
                householdName: hhData.householdName,
              };
              safeWriteJson(STORAGE_KEYS.localSession, session);
              localStorage.removeItem(STORAGE_KEYS.demoActive);
              setIsDemoMode(false);
              setLocalSession(session);
              if (hhData.question) setSecurityQuestion(hhData.question);
              triggerOpeningCurtain();
              return true;
            }
            if (hhRes.status === 401 && hhData.code === 'WRONG_PASSWORD') {
              setAuthNotice(hhData.error || 'Incorrect password. Please try again or use Forgot password?.');
              return false;
            }
            if (hhRes.status === 404 && (code === 'auth/operation-not-allowed' || code === 'auth/user-not-found')) {
              setAuthNotice('Account does not exist. Please sign up first.');
              setAuthNoticeAction('switch_to_signup');
              return false;
            }
          } catch {
            // Fall through to standard error handling below
          }
        }

        if (code === 'auth/user-not-found') {
          setAuthNotice('Account does not exist. Please sign up first.');
          setAuthNoticeAction('switch_to_signup');
        } else if (code === 'auth/invalid-credential') {
          const qCheck = await fetch('/api/auth/recovery/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          })
            .then((r) => r.json())
            .catch(() => ({ found: false }));
          if (!qCheck.found) {
            setAuthNotice('Account does not exist. Please sign up first.');
            setAuthNoticeAction('switch_to_signup');
          } else {
            setAuthNotice('Incorrect password. Please try again or use Forgot password? below.');
          }
        } else if (code === 'auth/wrong-password') {
          setAuthNotice('Incorrect password. Please try again or use Forgot password? below.');
        } else {
          setAuthNotice(err?.message || 'Unable to sign in with email and password.');
        }
        return false;
      }
    },
    [triggerOpeningCurtain]
  );

  const registerWithEmail = useCallback(
    async (
      email: string,
      password: string,
      householdName?: string,
      secQuestion?: string,
      secAnswer?: string
    ): Promise<boolean> => {
      setAuthNotice(null);
      setAuthNoticeAction(null);

      const cleanEmail = email.trim();
      const cleanQuestion = (secQuestion || '').trim().slice(0, 160);
      const cleanAnswer = (secAnswer || '').trim();
      if (cleanQuestion.length < 5 || cleanAnswer.length < 2) {
        setAuthNotice('Please select a security question and provide an answer (at least 2 characters) for account recovery.');
        return false;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (householdName?.trim()) {
          await updateProfile(cred.user, { displayName: householdName.trim() });
          const nextProfile: HouseholdProfile = {
            ...DEFAULT_PROFILE,
            uid: cred.user.uid,
            householdName: householdName.trim().slice(0, 80),
            theme: profile.theme,
          };
          safeWriteJson(STORAGE_KEYS.profile(cred.user.uid), nextProfile);
          setProfile(nextProfile);
        }

        const answerHash = await hashSecurityAnswer(cleanEmail, cleanAnswer);
        const recoveryRecord: LocalSecurityRecovery = {
          uid: cred.user.uid,
          emailLower: cleanEmail.toLowerCase(),
          question: cleanQuestion,
          answerHash,
        };
        safeWriteJson(STORAGE_KEYS.security(cred.user.uid), recoveryRecord);
        setSecurityQuestion(cleanQuestion);

        await fetch('/api/auth/recovery/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            uid: cred.user.uid,
            householdName: householdName?.trim(),
            question: cleanQuestion,
            answer: cleanAnswer,
          }),
        }).catch(() => {});

        await sendEmailVerification(cred.user).catch(() => {});
        triggerOpeningCurtain();
        return true;
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/email-already-in-use') {
          setAuthNotice('This account already exists. Please sign in instead.');
          setAuthNoticeAction('switch_to_signin');
          return false;
        }
        if (code === 'auth/operation-not-allowed') {
          try {
            const hhRes = await fetch('/api/auth/household/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: cleanEmail,
                password,
                householdName: householdName?.trim(),
                question: cleanQuestion,
                answer: cleanAnswer,
              }),
            });
            const hhData = await hhRes.json();
            if (hhRes.status === 409 && hhData.code === 'EMAIL_EXISTS') {
              setAuthNotice('This account already exists. Please sign in instead.');
              setAuthNoticeAction('switch_to_signin');
              return false;
            }
            if (hhRes.ok && hhData.ok) {
              const session: LocalHouseholdSession = {
                uid: hhData.uid,
                email: hhData.email,
                householdName: hhData.householdName,
              };
              safeWriteJson(STORAGE_KEYS.localSession, session);
              localStorage.removeItem(STORAGE_KEYS.demoActive);
              setIsDemoMode(false);
              setLocalSession(session);
              setSecurityQuestion(cleanQuestion);

              const nextProfile: HouseholdProfile = {
                ...DEFAULT_PROFILE,
                uid: hhData.uid,
                householdName: hhData.householdName,
                theme: profile.theme,
              };
              safeWriteJson(STORAGE_KEYS.profile(hhData.uid), nextProfile);
              setProfile(nextProfile);

              const answerHash = await hashSecurityAnswer(cleanEmail, cleanAnswer);
              safeWriteJson(STORAGE_KEYS.security(hhData.uid), {
                uid: hhData.uid,
                emailLower: cleanEmail.toLowerCase(),
                question: cleanQuestion,
                answerHash,
              });

              triggerOpeningCurtain();
              return true;
            }
            setAuthNotice(hhData.error || 'Unable to register account.');
            return false;
          } catch {
            setAuthNotice('Unable to register account.');
            return false;
          }
        }
        if (code === 'auth/weak-password') {
          setAuthNotice('Password is too weak. Please choose at least 6 characters.');
        } else {
          setAuthNotice(err?.message || 'Unable to register account.');
        }
        return false;
      }
    },
    [profile.theme, triggerOpeningCurtain]
  );

  const lookupSecurityQuestion = useCallback(
    async (
      email: string
    ): Promise<{ found: boolean; question?: string; hasLocalPassword?: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/recovery/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        return {
          found: Boolean(data.found),
          question: data.question,
          hasLocalPassword: Boolean(data.hasLocalPassword),
          error: data.error,
        };
      } catch {
        return { found: false, error: 'Unable to check security question right now.' };
      }
    },
    []
  );

  const verifySecurityAnswer = useCallback(
    async (
      email: string,
      answer: string
    ): Promise<{ verified: boolean; resetToken?: string; hasLocalPassword?: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/recovery/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), answer }),
        });
        const data = await res.json();
        if (res.ok && data.verified) {
          return {
            verified: true,
            resetToken: data.resetToken,
            hasLocalPassword: Boolean(data.hasLocalPassword),
          };
        }
        return {
          verified: false,
          error: data.error || 'Incorrect security answer. Please try again.',
        };
      } catch {
        return { verified: false, error: 'Unable to verify security answer right now.' };
      }
    },
    []
  );

  const resetLocalAccountPassword = useCallback(
    async (email: string, resetToken: string, newPassword: string): Promise<{ ok: boolean; message: string }> => {
      try {
        const res = await fetch('/api/auth/household/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            resetToken,
            newPassword,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          return {
            ok: true,
            message: data.message || 'Password updated successfully. You can now sign in.',
          };
        }
        return {
          ok: false,
          message: data.error || 'Failed to update password.',
        };
      } catch {
        return { ok: false, message: 'Unable to update password right now.' };
      }
    },
    []
  );

  const sendVerifiedPasswordReset = useCallback(
    async (email: string, resetToken: string): Promise<{ ok: boolean; message: string }> => {
      try {
        const consumeRes = await fetch('/api/auth/recovery/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), resetToken }),
        });
        const consumeData = await consumeRes.json();
        if (!consumeRes.ok || !consumeData.authorized) {
          return {
            ok: false,
            message: consumeData.error || 'Security answer verification is required before changing password.',
          };
        }

        await sendPasswordResetEmail(auth, email.trim());
        return {
          ok: true,
          message: `Password reset link sent to ${email.trim()}. Open the email link (or paste the reset link/code below) to set your new password.`,
        };
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            message:
              'Email password reset is unavailable for this account type. Please try signing in with Google.',
          };
        }
        return {
          ok: false,
          message: err?.message || 'Unable to send password reset email.',
        };
      }
    },
    []
  );

  const completePasswordResetWithCode = useCallback(
    async (oobCode: string, newPassword: string): Promise<{ ok: boolean; message: string }> => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
        await confirmPasswordReset(auth, oobCode, newPassword);
        return {
          ok: true,
          message: 'Your password has been updated. You can now sign in with your new password.',
        };
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
          return {
            ok: false,
            message: 'This reset code is invalid or expired. Please request a fresh password reset link.',
          };
        }
        return {
          ok: false,
          message: err?.message || 'Unable to complete password change.',
        };
      }
    },
    []
  );

  const saveSecurityRecovery = useCallback(
    async (question: string, answer: string): Promise<{ ok: boolean; message: string }> => {
      const targetEmail = user?.email || localSession?.email;
      const targetUid = user?.uid || localSession?.uid;
      if (!targetEmail || !targetUid) {
        return { ok: false, message: 'Sign in with a household account to save a security question.' };
      }
      const cleanQuestion = question.trim().slice(0, 160);
      const cleanAnswer = answer.trim();
      if (cleanQuestion.length < 5 || cleanAnswer.length < 2) {
        return { ok: false, message: 'Provide a valid security question and answer (min 2 characters).' };
      }

      try {
        const answerHash = await hashSecurityAnswer(targetEmail, cleanAnswer);
        const emailLower = targetEmail.trim().toLowerCase();
        safeWriteJson(STORAGE_KEYS.security(targetUid), {
          uid: targetUid,
          emailLower,
          question: cleanQuestion,
          answerHash,
        });
        setSecurityQuestion(cleanQuestion);

        await fetch('/api/auth/recovery/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            uid: targetUid,
            question: cleanQuestion,
            answer: cleanAnswer,
          }),
        });

        if (canUseCloudFirestore && user) {
          const securityPath = `users/${user.uid}/security/recovery`;
          await setDoc(doc(db, securityPath), {
            uid: user.uid,
            emailLower,
            question: cleanQuestion,
            answerHash,
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.WRITE, securityPath));
        }

        return { ok: true, message: 'Security question and recovery answer saved.' };
      } catch (err: any) {
        return { ok: false, message: err?.message || 'Failed to save security question.' };
      }
    },
    [canUseCloudFirestore, localSession, user]
  );

  const changePasswordWithSecurityCheck = useCallback(
    async (
      securityAnswer: string,
      currentPassword: string,
      newPassword: string
    ): Promise<{ ok: boolean; message: string }> => {
      const targetEmail = user?.email || localSession?.email;
      if (!targetEmail) {
        return { ok: false, message: 'No signed-in user session found.' };
      }

      // First verify security question answer strictly
      const verifyRes = await verifySecurityAnswer(targetEmail, securityAnswer);
      let verified = verifyRes.verified;

      if (!verified && user) {
        const localRec = safeReadJson<LocalSecurityRecovery | null>(STORAGE_KEYS.security(user.uid), null);
        if (localRec?.answerHash) {
          const computed = await hashSecurityAnswer(targetEmail, securityAnswer);
          if (computed === localRec.answerHash) {
            verified = true;
          }
        }
      }

      if (!verified) {
        return {
          ok: false,
          message: verifyRes.error || 'Incorrect security answer. Password cannot be changed.',
        };
      }

      if (!user && localSession && verifyRes.resetToken) {
        return resetLocalAccountPassword(localSession.email, verifyRes.resetToken, newPassword);
      }

      if (!user) {
        return { ok: false, message: 'Unable to verify recovery session.' };
      }

      try {
        await updatePassword(user, newPassword);
        return { ok: true, message: 'Password updated successfully.' };
      } catch (err: any) {
        if (err?.code === 'auth/requires-recent-login') {
          if (!currentPassword) {
            return {
              ok: false,
              message: 'For security, please enter your current password to confirm this change.',
            };
          }
          try {
            const cred = EmailAuthProvider.credential(targetEmail, currentPassword);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, newPassword);
            return { ok: true, message: 'Password updated successfully.' };
          } catch (reauthErr: any) {
            return {
              ok: false,
              message: reauthErr?.message || 'Current password verification failed.',
            };
          }
        }
        return { ok: false, message: err?.message || 'Unable to update password.' };
      }
    },
    [localSession, resetLocalAccountPassword, user, verifySecurityAnswer]
  );

  const signInDemo = useCallback(() => {
    setAuthNotice(null);
    setAuthNoticeAction(null);
    localStorage.removeItem(STORAGE_KEYS.localSession);
    setLocalSession(null);
    localStorage.setItem(STORAGE_KEYS.demoActive, 'true');
    setIsDemoMode(true);
    triggerOpeningCurtain();
  }, [triggerOpeningCurtain]);

  const signOutHousehold = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEYS.demoActive);
    localStorage.removeItem(STORAGE_KEYS.localSession);
    setLocalSession(null);
    setIsDemoMode(false);
    setSecurityQuestion(null);
    setAuthNotice(null);
    setAuthNoticeAction(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  }, []);

  const value: EcoTrackContextValue = {
    user,
    localSession,
    isDemoMode,
    isAuthenticated: Boolean(user) || Boolean(localSession) || isDemoMode,
    authReady,
    authNotice,
    authNoticeAction,
    clearAuthNotice: () => {
      setAuthNotice(null);
      setAuthNoticeAction(null);
    },
    securityQuestion,
    curtainVisible,
    startAnimVisible,
    dismissStartAnimation,
    shellEntranceKey,
    profile,
    audits,
    activeMonth,
    setActiveMonth,
    activeAudit,
    previousAudit,
    completedHabits,
    adoptedActionIds,
    pendingUndoAudit,
    setTheme,
    toggleDarkLight,
    toggleUnitSystem,
    updateProfileFields,
    upsertAudit,
    quickAdjustStream,
    deleteAuditWithUndo,
    deleteAllAudits,
    undoDeleteAudit,
    dismissUndo,
    toggleHabit,
    toggleAdoptedAction,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    lookupSecurityQuestion,
    verifySecurityAnswer,
    resetLocalAccountPassword,
    sendVerifiedPasswordReset,
    completePasswordResetWithCode,
    saveSecurityRecovery,
    changePasswordWithSecurityCheck,
    signInDemo,
    signOutHousehold,
  };

  return <EcoTrackContext.Provider value={value}>{children}</EcoTrackContext.Provider>;
};

export function useEcoTrack(): EcoTrackContextValue {
  const ctx = useContext(EcoTrackContext);
  if (!ctx) throw new Error('useEcoTrack must be used inside EcoTrackProvider');
  return ctx;
}
