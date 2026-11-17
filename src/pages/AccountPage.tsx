import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldAlert,
  ShieldCheck,
  SunMedium,
  UserCircle2,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import {
  CURRENCY_CONFIG,
  REGIONAL_PRESETS,
} from '../utils/calculations';
import { SECURITY_QUESTIONS } from '../utils/security';
import { CurrencyCode, RegionId } from '../types/carbon';
import ecoAvatarHousehold from '../assets/images/eco_avatar_household_1794720793438.jpg';

export const AccountPage: React.FC = () => {
  const {
    user,
    localSession,
    isDemoMode,
    profile,
    securityQuestion,
    updateProfileFields,
    toggleUnitSystem,
    signInWithGoogle,
    signOutHousehold,
    saveSecurityRecovery,
    verifySecurityAnswer,
    changePasswordWithSecurityCheck,
  } = useEcoTrack();
  const navigate = useNavigate();

  const [householdName, setHouseholdName] = useState(profile.householdName);
  const [members, setMembers] = useState(profile.members);
  const [regionId, setRegionId] = useState<RegionId>(profile.regionId);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [solarOffsetPct, setSolarOffsetPct] = useState(profile.solarOffsetPct);
  const [monthlyTargetKg, setMonthlyTargetKg] = useState(profile.monthlyTargetKg);
  const [saved, setSaved] = useState(false);

  // Sync form fields when profile hydrates asynchronously
  useEffect(() => {
    setHouseholdName(profile.householdName);
    setMembers(profile.members);
    setRegionId(profile.regionId);
    setCurrency(profile.currency);
    setSolarOffsetPct(profile.solarOffsetPct);
    setMonthlyTargetKg(profile.monthlyTargetKg);
  }, [profile]);

  // One-time security question setup state (shown only for password accounts lacking one)
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [newSecAnswer, setNewSecAnswer] = useState('');
  const [secFeedback, setSecFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingSec, setSavingSec] = useState(false);

  // On-demand password change drawer state (once security question is configured)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [verifyAnswerInput, setVerifyAnswerInput] = useState('');
  const [answerVerified, setAnswerVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwFeedback, setPwFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [updatingPw, setUpdatingPw] = useState(false);

  const hasPasswordProvider = Boolean(
    localSession || user?.providerData?.some((p) => p.providerId === 'password')
  );
  const isGoogleUser = Boolean(
    user && !localSession && user.providerData?.some((p) => p.providerId === 'google.com')
  );
  const accountEmail = user?.email || localSession?.email;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileFields({
      householdName: householdName.trim().slice(0, 80) || 'My Household',
      members: Math.min(25, Math.max(1, Math.round(members || 1))),
      regionId,
      currency,
      solarOffsetPct: Math.min(100, Math.max(0, Number(solarOffsetPct) || 0)),
      monthlyTargetKg: Math.min(50000, Math.max(50, Number(monthlyTargetKg) || 500)),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecFeedback(null);
    const q = selectedQuestion === '__custom__' ? customQuestion : selectedQuestion;
    setSavingSec(true);
    const res = await saveSecurityRecovery(q, newSecAnswer);
    setSavingSec(false);
    if (res.ok) {
      setNewSecAnswer('');
      setCustomQuestion('');
      setAnswerVerified(false);
      // One-time setup card automatically dismisses because securityQuestion becomes populated;
      // display confirmation neatly in the Account Security banner and auto-clear it.
      setPwFeedback({
        type: 'ok',
        text: 'Security question saved. Your account recovery protection is now active.',
      });
      window.setTimeout(() => setPwFeedback(null), 4500);
    } else {
      setSecFeedback({ type: 'err', text: res.message });
    }
  };

  const handleVerifyBeforeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail) return;
    setPwFeedback(null);
    setUpdatingPw(true);
    const res = await verifySecurityAnswer(accountEmail, verifyAnswerInput);
    setUpdatingPw(false);
    if (res.verified) {
      setAnswerVerified(true);
      setPwFeedback({
        type: 'ok',
        text: 'Security answer verified. Enter your new password below.',
      });
    } else {
      setAnswerVerified(false);
      setPwFeedback({
        type: 'err',
        text: res.error || 'Incorrect security answer. Please try again.',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPassword.length < 6) {
      setPwFeedback({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwFeedback({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }
    setUpdatingPw(true);
    const res = await changePasswordWithSecurityCheck(
      verifyAnswerInput,
      currentPassword,
      newPassword
    );
    setUpdatingPw(false);
    if (res.ok) {
      setVerifyAnswerInput('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAnswerVerified(false);
      setShowChangePassword(false);
      setPwFeedback({ type: 'ok', text: res.message });
      window.setTimeout(() => setPwFeedback(null), 4500);
    } else {
      setPwFeedback({ type: 'err', text: res.message });
    }
  };

  const resetPasswordDrawer = () => {
    setShowChangePassword((v) => !v);
    setVerifyAnswerInput('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAnswerVerified(false);
    setPwFeedback(null);
  };

  const handleSignOut = async () => {
    await signOutHousehold();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Household Identity &amp; Preferences
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
            Account &amp; Household Profile
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="h-10 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 self-start whitespace-nowrap btn-press"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Identity Overview Card */}
      <section className="bento-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoURL || ecoAvatarHousehold}
            alt="Household avatar"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-strong)] shrink-0"
          />
          <div>
            <h2 className="text-lg font-bold">
              {user?.displayName || localSession?.householdName || profile.householdName}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{accountEmail || 'Guest Demo Workspace'}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isGoogleUser
                  ? 'Google Account Connected'
                  : user
                  ? user.emailVerified
                    ? 'Cloud Sync Active'
                    : 'Email Verification Pending'
                  : localSession
                  ? 'Household Account Active'
                  : isDemoMode
                  ? 'Guest Demo Mode'
                  : 'Standard Workspace'}
              </span>
            </p>
          </div>
        </div>

        {!user && !localSession && (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 btn-press"
          >
            <UserCircle2 className="w-4 h-4" />
            <span>Connect Google Account</span>
          </button>
        )}
      </section>

      {/* Household Configuration Form */}
      <form onSubmit={handleSave} className="bento-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[var(--accent-secondary)]" />
            <span>Household Carbon Settings</span>
          </h3>
          <button
            type="button"
            onClick={toggleUnitSystem}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs font-mono font-semibold btn-press"
          >
            Units: {profile.unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="text-xs block sm:col-span-2 lg:col-span-1">
            <span className="font-semibold text-[var(--text-secondary)]">Household Name</span>
            <input
              type="text"
              maxLength={80}
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
            />
          </label>

          <label className="text-xs block">
            <span className="font-semibold text-[var(--text-secondary)]">Residents</span>
            <input
              type="number"
              min={1}
              max={25}
              value={members}
              onChange={(e) => setMembers(Math.min(25, Math.max(1, Number(e.target.value) || 1)))}
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
            />
          </label>

          <label className="text-xs block">
            <span className="font-semibold text-[var(--text-secondary)]">Regional Grid Preset</span>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value as RegionId)}
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs font-medium"
            >
              {Object.values(REGIONAL_PRESETS).map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.gridKgPerKwh} kg/kWh)
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs block">
            <span className="font-semibold text-[var(--text-secondary)]">Display Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-xs"
            >
              {Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => (
                <option key={code} value={code}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs block">
            <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1">
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              <span>Rooftop Solar Offset (%)</span>
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={solarOffsetPct}
              onChange={(e) =>
                setSolarOffsetPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
            />
          </label>

          <label className="text-xs block">
            <span className="font-semibold text-[var(--text-secondary)]">
              Monthly Carbon Budget (kg CO₂e)
            </span>
            <input
              type="number"
              min={50}
              max={50000}
              value={monthlyTargetKg}
              onChange={(e) =>
                setMonthlyTargetKg(Math.min(50000, Math.max(50, Number(e.target.value) || 500)))
              }
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] font-mono text-sm"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="h-10 px-5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-2 btn-press"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Household Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Password & Security: Shown ONLY for email/password accounts (never Google Sign-In or Demo).
          Security question setup appears ONCE only if missing, and auto-dismisses as soon as saved. */}
      {hasPasswordProvider && !isGoogleUser && (
        <section className="bento-card rounded-2xl p-6 space-y-4">
          {!securityQuestion ? (
            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <span>Set Up Recovery Security Question</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure this once to protect password resets and changes. This setup prompt will dismiss automatically after saving.
                </p>
              </div>

              {secFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                    secFeedback.type === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {secFeedback.type === 'ok' ? (
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <span>{secFeedback.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs block">
                  <span className="font-semibold text-[var(--text-secondary)]">Security Question</span>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                    <option value="__custom__">Write custom security question...</option>
                  </select>
                </label>

                <label className="text-xs block">
                  <span className="font-semibold text-[var(--text-secondary)]">Security Answer</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={newSecAnswer}
                    onChange={(e) => setNewSecAnswer(e.target.value)}
                    placeholder="Enter a memorable answer"
                    className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                  />
                </label>

                {selectedQuestion === '__custom__' && (
                  <label className="text-xs block md:col-span-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Custom Question</span>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={160}
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Enter your custom question"
                      className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-xs"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSec}
                  className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 btn-press disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{savingSec ? 'Saving...' : 'Save Security Question'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--accent-secondary)]" />
                    <span>Password &amp; Recovery</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Security question recovery protection is active for this account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetPasswordDrawer}
                  className="h-9 px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-[var(--border-strong)] text-xs font-semibold flex items-center gap-1.5 self-start whitespace-nowrap btn-press"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{showChangePassword ? 'Cancel' : 'Change Password'}</span>
                  {showChangePassword ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {pwFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                    pwFeedback.type === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {pwFeedback.type === 'ok' ? (
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <span>{pwFeedback.text}</span>
                </div>
              )}

              {showChangePassword && (
                <div className="pt-4 border-t border-[var(--border-subtle)] max-w-md">
                  {!answerVerified ? (
                    <form onSubmit={handleVerifyBeforeChange} className="space-y-3">
                      <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)]">
                        <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                          Security Question
                        </p>
                        <p className="text-xs font-bold mt-0.5">{securityQuestion}</p>
                      </div>
                      <label className="text-xs block">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          Your Answer
                        </span>
                        <input
                          type="text"
                          required
                          value={verifyAnswerInput}
                          onChange={(e) => setVerifyAnswerInput(e.target.value)}
                          placeholder="Enter your saved answer"
                          className="mt-1.5 w-full h-10 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={updatingPw}
                        className="h-9 px-4 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 btn-press disabled:opacity-60"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{updatingPw ? 'Verifying...' : 'Verify Answer'}</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      {user && (
                        <label className="text-xs block">
                          <span className="font-semibold text-[var(--text-secondary)]">
                            Current Password (if requested)
                          </span>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1 w-full h-9 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                          />
                        </label>
                      )}
                      <label className="text-xs block">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          New Password
                        </span>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="mt-1 w-full h-9 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                        />
                      </label>
                      <label className="text-xs block">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          Confirm New Password
                        </span>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="mt-1 w-full h-9 px-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-subtle)] text-sm"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={updatingPw}
                        className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 btn-press disabled:opacity-60"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{updatingPw ? 'Updating...' : 'Update Password'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

