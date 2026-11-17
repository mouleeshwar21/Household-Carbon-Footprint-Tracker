import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActivityInputsMetric,
  CurrencyCode,
  UnitSystem,
} from '../utils/calculations';
import { LANGUAGES, SupportedLanguage, TRANSLATIONS } from '../utils/i18n';
import { APP_THEMES, AppThemeConfig, AppThemeId } from '../utils/themes';
import {
  GoalSettings,
  HomeType,
  HouseholdProfile,
  MonthlyAuditRecord,
  carbonApi,
} from '../services/carbonApi';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  fetchFirestoreHouseholdProfile,
  upsertFirestoreHouseholdProfile,
  User,
} from '../firebase';

interface CarbonContextValue {
  profile: HouseholdProfile;
  firebaseUser: User | null;
  authReady: boolean;
  theme: AppThemeConfig;
  records: MonthlyAuditRecord[];
  draftInputs: ActivityInputsMetric;
  adoptedQuickWins: string[];
  adoptedSavings: {
    totalMonthlyKgSaved: number;
    totalMonthlyUsdSaved: number;
    totalMonthlyInrSaved: number;
    annualTreesEquivalent: number;
    count: number;
  };
  goalSettings: GoalSettings;
  showWelcomeModal: boolean;
  lastDeletedRecord: MonthlyAuditRecord | null;
  t: (typeof TRANSLATIONS)['en'];
  locale: string;
  updateProfile: (patch: Partial<HouseholdProfile>) => void;
  setTheme: (themeId: AppThemeId) => void;
  toggleUnitSystem: () => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setEasyVisualMode: (enabled: boolean) => void;
  updateDraftInputs: (patch: Partial<ActivityInputsMetric>) => void;
  upsertAuditRecord: (record: MonthlyAuditRecord) => void;
  deleteAuditRecord: (id: string) => void;
  undoDeleteAuditRecord: () => void;
  dismissUndoPopup: () => void;
  toggleQuickWin: (actionId: string) => void;
  updateGoalSettings: (settings: GoalSettings) => void;
  loginDemo: () => void;
  loginWithCredentials: (email: string, password?: string) => void;
  signInWithGoogle: () => Promise<void>;
  registerOrMigrate: (params: {
    email: string;
    password?: string;
    householdName: string;
    country: string;
    stateRegion: string;
    members: number;
    homeType: HomeType;
    sizeM2: number;
    unitSystem: UnitSystem;
    currency: CurrencyCode;
    migrateGuestData: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  closeWelcomeModal: () => void;
}

const CarbonContext = createContext<CarbonContextValue | null>(null);

export const CarbonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<HouseholdProfile>(() => {
    const p = carbonApi.getProfile();
    p.theme = p.theme || 'sage';
    return p;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [records, setRecords] = useState<MonthlyAuditRecord[]>(() => carbonApi.getRecords());
  const [draftInputs, setDraftInputs] = useState<ActivityInputsMetric>(() =>
    carbonApi.getDraftInputs()
  );
  const [adoptedQuickWins, setAdoptedQuickWins] = useState<string[]>(() =>
    carbonApi.getAdoptedQuickWins()
  );
  const [goalSettings, setGoalSettings] = useState<GoalSettings>(() => {
    const recs = carbonApi.getRecords();
    const latestKg = recs[recs.length - 1]?.result.totalKgCO2e || 550;
    return carbonApi.getGoalSettings(latestKg);
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [lastDeletedRecord, setLastDeletedRecord] = useState<MonthlyAuditRecord | null>(null);

  const langMeta = LANGUAGES.find((l) => l.code === profile.language) || LANGUAGES[0];
  const t = TRANSLATIONS[profile.language] || TRANSLATIONS.en;
  const activeThemeId: AppThemeId = profile.theme || 'sage';
  const theme = APP_THEMES[activeThemeId] || APP_THEMES.sage;

  // Apply dir="rtl" or "ltr", lang, data-theme, and .dark class on <html>
  useEffect(() => {
    document.documentElement.dir = langMeta.dir;
    document.documentElement.lang = langMeta.code;
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.classList.toggle('dark', theme.isDark);
  }, [langMeta, theme]);

  // Listen to Firebase Auth state changes and sync Firestore profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (user && user.email) {
        try {
          const remoteDoc = await fetchFirestoreHouseholdProfile(user.uid);
          if (remoteDoc) {
            const syncedProfile: HouseholdProfile = {
              id: user.uid,
              email: remoteDoc.email || user.email,
              householdName: remoteDoc.householdName,
              country: remoteDoc.country,
              stateRegion: remoteDoc.stateRegion,
              members: remoteDoc.members,
              homeType: remoteDoc.homeType,
              sizeM2: remoteDoc.sizeM2,
              unitSystem: remoteDoc.unitSystem,
              currency: remoteDoc.currency as CurrencyCode,
              language: (remoteDoc.language as SupportedLanguage) || 'en',
              theme: 'sage',
              easyVisualMode: false,
              isGuest: false,
              authProvider: 'google',
              createdAt: new Date().toISOString(),
            };
            carbonApi.saveProfile(syncedProfile);
            setProfile(syncedProfile);
            setRecords(carbonApi.getRecords());
          } else {
            const currentLocal = carbonApi.getProfile();
            const defaultName = user.displayName
              ? `${user.displayName}'s Household`
              : currentLocal.householdName;
            await upsertFirestoreHouseholdProfile(user.uid, {
              email: user.email,
              householdName: defaultName,
              country: currentLocal.country,
              stateRegion: currentLocal.stateRegion,
              members: currentLocal.members,
              homeType: currentLocal.homeType,
              sizeM2: currentLocal.sizeM2,
              unitSystem: currentLocal.unitSystem,
              currency: currentLocal.currency,
              language: currentLocal.language,
            });
            const createdProfile: HouseholdProfile = {
              ...currentLocal,
              id: user.uid,
              email: user.email,
              householdName: defaultName,
              isGuest: false,
              authProvider: 'google',
              theme: currentLocal.theme || 'sage',
            };
            carbonApi.saveProfile(createdProfile);
            setProfile(createdProfile);
            setRecords(carbonApi.getRecords());
          }
        } catch (err) {
          console.error('Error syncing Firebase user profile:', err);
        }
      }
    });

    return () => unsub();
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<HouseholdProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        carbonApi.saveProfile(next);
        setRecords(carbonApi.getRecords());
        if (patch.country || patch.members) {
          setDraftInputs((prevDraft) => {
            const updatedDraft = {
              ...prevDraft,
              regionId: next.country,
              householdMembers: next.members,
            };
            carbonApi.saveDraftInputs(updatedDraft);
            return updatedDraft;
          });
        }
        if (firebaseUser && !next.isGuest) {
          upsertFirestoreHouseholdProfile(firebaseUser.uid, {
            email: next.email,
            householdName: next.householdName,
            country: next.country,
            stateRegion: next.stateRegion,
            members: next.members,
            homeType: next.homeType,
            sizeM2: next.sizeM2,
            unitSystem: next.unitSystem,
            currency: next.currency,
            language: next.language,
          }).catch((e) => console.error('Failed to sync profile update to Firestore:', e));
        }
        return next;
      });
    },
    [firebaseUser]
  );

  const setTheme = useCallback(
    (themeId: AppThemeId) => {
      localStorage.setItem('hct_v22_theme_override', themeId);
      updateProfile({ theme: themeId });
    },
    [updateProfile]
  );

  const toggleUnitSystem = useCallback(() => {
    updateProfile({
      unitSystem: profile.unitSystem === 'metric' ? 'imperial' : 'metric',
    });
  }, [profile.unitSystem, updateProfile]);

  const setCurrency = useCallback(
    (currency: CurrencyCode) => {
      updateProfile({ currency });
    },
    [updateProfile]
  );

  const setLanguage = useCallback(
    (language: SupportedLanguage) => {
      updateProfile({ language });
    },
    [updateProfile]
  );

  const setEasyVisualMode = useCallback(
    (easyVisualMode: boolean) => {
      updateProfile({ easyVisualMode });
    },
    [updateProfile]
  );

  const updateDraftInputs = useCallback((patch: Partial<ActivityInputsMetric>) => {
    setDraftInputs((prev) => {
      const next = { ...prev, ...patch };
      carbonApi.saveDraftInputs(next);
      return next;
    });
  }, []);

  const upsertAuditRecord = useCallback((record: MonthlyAuditRecord) => {
    const next = carbonApi.upsertRecord(record);
    setRecords(next);
  }, []);

  const deleteAuditRecord = useCallback((id: string) => {
    const { updated, deleted } = carbonApi.deleteRecord(id);
    setRecords(updated);
    if (deleted) {
      setLastDeletedRecord(deleted);
    }
  }, []);

  const undoDeleteAuditRecord = useCallback(() => {
    if (!lastDeletedRecord) return;
    const next = carbonApi.restoreRecord(lastDeletedRecord);
    setRecords(next);
    setLastDeletedRecord(null);
  }, [lastDeletedRecord]);

  const dismissUndoPopup = useCallback(() => {
    setLastDeletedRecord(null);
  }, []);

  const toggleQuickWin = useCallback((actionId: string) => {
    const next = carbonApi.toggleQuickWin(actionId);
    setAdoptedQuickWins(next);
  }, []);

  const updateGoalSettings = useCallback((settings: GoalSettings) => {
    const saved = carbonApi.saveGoalSettings(settings);
    setGoalSettings(saved);
  }, []);

  const loginDemo = useCallback(() => {
    const { profile: demoProf, records: demoRecs } = carbonApi.loginDemoHousehold();
    const withCurrentTheme = { ...demoProf, theme: profile.theme || 'sage' };
    carbonApi.saveProfile(withCurrentTheme);
    setProfile(withCurrentTheme);
    setRecords(demoRecs);
    setDraftInputs(demoRecs[demoRecs.length - 1].inputs);
    setShowWelcomeModal(true);
  }, [profile.theme]);

  const loginWithCredentials = useCallback(
    (email: string, password?: string) => {
      const { profile: signedProf, records: signedRecs } = carbonApi.loginWithCredentials(
        email,
        password
      );
      const withTheme = { ...signedProf, theme: profile.theme || 'sage' };
      carbonApi.saveProfile(withTheme);
      setProfile(withTheme);
      setRecords(signedRecs);
      setDraftInputs(signedRecs[signedRecs.length - 1].inputs);
      setShowWelcomeModal(true);
    },
    [profile.theme]
  );

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      setShowWelcomeModal(true);
    }
  }, []);

  const registerOrMigrate = useCallback(
    async (params: {
      email: string;
      password?: string;
      householdName: string;
      country: string;
      stateRegion: string;
      members: number;
      homeType: HomeType;
      sizeM2: number;
      unitSystem: UnitSystem;
      currency: CurrencyCode;
      migrateGuestData: boolean;
    }) => {
      const { profile: newProf, records: newRecs } = carbonApi.registerOrMigrateHousehold({
        ...params,
        id: firebaseUser?.uid,
        authProvider: firebaseUser ? 'google' : 'password',
      });
      const withTheme = { ...newProf, theme: profile.theme || 'sage' };
      carbonApi.saveProfile(withTheme);
      setProfile(withTheme);
      setRecords(newRecs);
      setDraftInputs(newRecs[newRecs.length - 1].inputs);

      if (firebaseUser) {
        await upsertFirestoreHouseholdProfile(firebaseUser.uid, {
          email: withTheme.email,
          householdName: withTheme.householdName,
          country: withTheme.country,
          stateRegion: withTheme.stateRegion,
          members: withTheme.members,
          homeType: withTheme.homeType,
          sizeM2: withTheme.sizeM2,
          unitSystem: withTheme.unitSystem,
          currency: withTheme.currency,
          language: withTheme.language,
        });
      }

      setShowWelcomeModal(true);
    },
    [profile.theme, firebaseUser]
  );

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    const { profile: guestProf, records: guestRecs } = carbonApi.logoutHousehold();
    setProfile(guestProf);
    setRecords(guestRecs);
    setDraftInputs(guestRecs[guestRecs.length - 1].inputs);
    setShowWelcomeModal(false);
  }, []);

  const closeWelcomeModal = useCallback(() => {
    carbonApi.markWelcomeModalSeen();
    setShowWelcomeModal(false);
  }, []);

  const adoptedSavings = carbonApi.getAdoptedSavingsSummary(adoptedQuickWins);

  return (
    <CarbonContext.Provider
      value={{
        profile,
        firebaseUser,
        authReady,
        theme,
        records,
        draftInputs,
        adoptedQuickWins,
        adoptedSavings,
        goalSettings,
        showWelcomeModal,
        lastDeletedRecord,
        t,
        locale: langMeta.locale,
        updateProfile,
        setTheme,
        toggleUnitSystem,
        setCurrency,
        setLanguage,
        setEasyVisualMode,
        updateDraftInputs,
        upsertAuditRecord,
        deleteAuditRecord,
        undoDeleteAuditRecord,
        dismissUndoPopup,
        toggleQuickWin,
        updateGoalSettings,
        loginDemo,
        loginWithCredentials,
        signInWithGoogle,
        registerOrMigrate,
        logout,
        closeWelcomeModal,
      }}
    >
      {children}
    </CarbonContext.Provider>
  );
};

export function useCarbon(): CarbonContextValue {
  const ctx = useContext(CarbonContext);
  if (!ctx) {
    throw new Error('useCarbon must be used within a CarbonProvider');
  }
  return ctx;
}
