import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  KeyRound,
  Leaf,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { SECURITY_QUESTIONS, extractResetOobCode } from '../utils/security';

type AuthMode = 'signin' | 'signup' | 'forgot';
type ForgotStep = 'email' | 'question' | 'reset';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signInDemo,
    authNotice,
    authNoticeAction,
    clearAuthNotice,
    lookupSecurityQuestion,
    verifySecurityAnswer,
    resetLocalAccountPassword,
    sendVerifiedPasswordReset,
    completePasswordResetWithCode,
    isAuthenticated,
    signOutHousehold,
    user,
    localSession,
    isDemoMode,
  } = useEcoTrack();

  const initialMode: AuthMode = location.pathname === '/register' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Forgot password & security question recovery state
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [hasLocalPassword, setHasLocalPassword] = useState(false);
  const [resetOobInput, setResetOobInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
  } | null>(null);

  // Support Firebase password reset callback (?mode=resetPassword&oobCode=...)
  useEffect(() => {
    const queryMode = searchParams.get('mode');
    const oob = searchParams.get('oobCode');
    if (queryMode === 'resetPassword' && oob) {
      setMode('forgot');
      setForgotStep('reset');
      setResetOobInput(oob);
      setForgotFeedback({
        type: 'info',
        text: 'Reset code detected from your email link. Enter your new password below.',
      });
    }
  }, [searchParams]);

  const effectiveSecurityQuestion =
    selectedQuestion === '__custom__' ? customQuestion.trim() : selectedQuestion;

  const switchMode = (next: AuthMode) => {
    clearAuthNotice();
    setForgotFeedback(null);
    setPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetOobInput('');
    setRecoveryAnswer('');
    setMode(next);
    if (next === 'forgot') {
      setForgotStep('email');
      setRecoveryQuestion('');
      setResetToken('');
      setHasLocalPassword(false);
      setResetLinkSent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const ok =
      mode === 'signin'
        ? await signInWithEmail(email, password)
        : await registerWithEmail(
            email,
            password,
            householdName,
            effectiveSecurityQuestion,
            securityAnswer
          );
    setSubmitting(false);
    if (ok) {
      navigate('/dashboard');
    }
  };

  const handleLookupQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setForgotFeedback(null);
    setSubmitting(true);
    const res = await lookupSecurityQuestion(email);
    setSubmitting(false);
    if (res.found && res.question) {
      setRecoveryQuestion(res.question);
      setRecoveryAnswer('');
      setForgotStep('question');
    } else {
      setForgotFeedback({
        type: 'error',
        text:
          res.error ||
          'No recovery security question was found for this email. If you use Google Sign-In, continue with Google below.',
      });
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryAnswer.trim()) return;
    setForgotFeedback(null);
    setSubmitting(true);
    const res = await verifySecurityAnswer(email, recoveryAnswer);
    setSubmitting(false);
    if (res.verified && res.resetToken) {
      setResetToken(res.resetToken);
      setHasLocalPassword(Boolean(res.hasLocalPassword));
      setForgotStep('reset');
      setForgotFeedback({
        type: 'success',
        text: res.hasLocalPassword
          ? 'Security answer verified. Enter your new password below.'
          : 'Security answer verified. You can now send a reset email and change your password.',
      });
    } else {
      setForgotFeedback({
        type: 'error',
        text:
          res.error ||
          'Incorrect security answer. Password change remains locked until the correct answer is entered.',
      });
    }
  };

  const handleDispatchResetEmail = async () => {
    if (!resetToken) return;
    setForgotFeedback(null);
    setSubmitting(true);
    const res = await sendVerifiedPasswordReset(email, resetToken);
    setSubmitting(false);
    if (res.ok) {
      setResetLinkSent(true);
      setForgotFeedback({ type: 'success', text: res.message });
    } else {
      setForgotFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCompleteResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractResetOobCode(resetOobInput);
    if (!code) {
      setForgotFeedback({
        type: 'error',
        text: 'Paste the reset link or verification code from your password reset email.',
      });
      return;
    }
    if (newPassword.length < 6) {
      setForgotFeedback({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotFeedback({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    setSubmitting(true);
    const res = await completePasswordResetWithCode(code, newPassword);
    setSubmitting(false);
    if (res.ok) {
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetOobInput('');
      setMode('signin');
      setForgotFeedback(null);
      clearAuthNotice();
      setForgotStep('email');
      setForgotFeedback({ type: 'success', text: res.message });
    } else {
      setForgotFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (newPassword.length < 6) {
      setForgotFeedback({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotFeedback({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSubmitting(true);
    const res = await resetLocalAccountPassword(email, resetToken, newPassword);
    setSubmitting(false);
    if (res.ok) {
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetToken('');
      setHasLocalPassword(false);
      setMode('signin');
      clearAuthNotice();
      setForgotStep('email');
      setForgotFeedback({ type: 'success', text: res.message });
    } else {
      setForgotFeedback({ type: 'error', text: res.message });
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const ok = await signInWithGoogle();
    setSubmitting(false);
    if (ok) {
      navigate('/dashboard');
    }
  };

  const handleDemo = () => {
    signInDemo();
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-[#071915]">
      {/* Full-bleed eco-home forest backdrop */}
      {!imgFailed && (
        <img
          src="/src/assets/images/login_eco_forest_1794720792838.jpg"
          alt="Sustainable timber and solar eco-home in misty emerald forest"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
      )}

      {/* Dark emerald contrast scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#061713]/85 via-[#09211b]/75 to-[#040f0c]/90"
      />

      {/* Ambient biophilic blur orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#fcd34d]/15 blur-[140px]"
      />

      {/* Centered Liquid Glass Optical Panel */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative z-10 w-full max-w-[460px] liquid-glass-panel rounded-[28px] p-6 sm:p-8 text-white"
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fcd34d] text-[#132a26] flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">EcoTrack</h1>
              <p className="font-editorial text-xs text-emerald-100/80">
                TerraLedger Household Carbon Ledger
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold text-[#fcd34d] hover:underline whitespace-nowrap shrink-0"
            >
              Return to App →
            </button>
          )}
        </div>

        {/* Segmented Liquid Glass Switcher or Forgot Password Header */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/25 border border-white/15 mb-5">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2 rounded-xl text-xs font-semibold transition-all btn-press ${
                mode === 'signin'
                  ? 'bg-white text-[#132a26] shadow-md'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 rounded-xl text-xs font-semibold transition-all btn-press ${
                mode === 'signup'
                  ? 'bg-white text-[#132a26] shadow-md'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mb-5 flex items-center justify-between gap-2 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#fcd34d]" />
              <span className="text-sm font-bold text-white">Password Recovery</span>
            </div>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-xs font-semibold text-emerald-200 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {authNotice && (
          <div className="mb-4 p-3 rounded-xl bg-amber-400/15 border border-amber-300/35 text-xs text-amber-100 leading-relaxed space-y-2">
            <p>{authNotice}</p>
            {authNoticeAction === 'switch_to_signin' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fcd34d] text-[#132a26] font-bold text-[11px] btn-press"
              >
                <span>Switch to Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {authNoticeAction === 'switch_to_signup' && (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fcd34d] text-[#132a26] font-bold text-[11px] btn-press"
              >
                <span>Switch to Sign Up</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {forgotFeedback && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
              forgotFeedback.type === 'error'
                ? 'bg-rose-500/15 border-rose-400/35 text-rose-100'
                : forgotFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-100'
                : 'bg-sky-500/15 border-sky-400/35 text-sky-100'
            }`}
          >
            {forgotFeedback.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
            )}
            <span>{forgotFeedback.text}</span>
          </div>
        )}

        {/* SIGN IN / SIGN UP FORM */}
        {mode !== 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-emerald-100/85 mb-1.5">
                  Household Name (optional)
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-emerald-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={80}
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="e.g. Verdant Canopy Residence"
                    className="liquid-glass-input w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100/85 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="household@example.com"
                  className="liquid-glass-input w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-emerald-100/85">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-semibold text-[#fcd34d] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="liquid-glass-input w-full h-11 pl-10 pr-11 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-emerald-100/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="pt-1 space-y-3 border-t border-white/10">
                <div>
                  <label className="block text-xs font-medium text-emerald-100/85 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#fcd34d]" />
                    <span>Security Question (for password reset)</span>
                  </label>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="liquid-glass-input w-full h-10 px-3 rounded-xl text-xs text-white bg-[#09211b]/90"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q} className="bg-[#09211b] text-white">
                        {q}
                      </option>
                    ))}
                    <option value="__custom__" className="bg-[#09211b] text-white">
                      Write my own custom security question...
                    </option>
                  </select>
                </div>

                {selectedQuestion === '__custom__' && (
                  <div>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={160}
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Enter your custom security question"
                      className="liquid-glass-input w-full h-10 px-3.5 rounded-xl text-xs text-white placeholder:text-emerald-100/45"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-emerald-100/85 mb-1.5">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Enter a memorable answer (not case-sensitive)"
                    className="liquid-glass-input w-full h-10 px-3.5 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 rounded-xl bg-[#fcd34d] text-[#132a26] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-105 shadow-lg btn-press disabled:opacity-60"
            >
              <span>
                {submitting
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Household Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD: STEP 1 (EMAIL) */}
        {mode === 'forgot' && forgotStep === 'email' && (
          <form onSubmit={handleLookupQuestion} className="space-y-4">
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Enter your registered email address. You must answer your saved security question correctly before changing your password.
            </p>
            <div>
              <label className="block text-xs font-medium text-emerald-100/85 mb-1.5">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="household@example.com"
                  className="liquid-glass-input w-full h-11 pl-10 pr-4 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#fcd34d] text-[#132a26] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-105 shadow-lg btn-press disabled:opacity-60"
            >
              <span>{submitting ? 'Checking...' : 'Find Security Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD: STEP 2 (VERIFY SECURITY ANSWER) */}
        {mode === 'forgot' && forgotStep === 'question' && (
          <form onSubmit={handleVerifyAnswer} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
              <p className="text-[11px] uppercase tracking-wider text-[#fcd34d] font-bold mb-1">
                Security Question for {email}
              </p>
              <p className="text-sm font-semibold text-white">{recoveryQuestion}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100/85 mb-1.5">
                Your Security Answer
              </label>
              <input
                type="text"
                required
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value)}
                placeholder="Enter exact answer"
                className="liquid-glass-input w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setForgotFeedback(null);
                  setForgotStep('email');
                }}
                className="h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white btn-press"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-[#fcd34d] text-[#132a26] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-105 shadow-lg btn-press disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Verifying...' : 'Verify Answer'}</span>
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD: STEP 3 (UNLOCKED ONLY AFTER CORRECT ANSWER) */}
        {mode === 'forgot' && forgotStep === 'reset' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-400/15 border border-emerald-300/30 flex items-center gap-2.5 text-xs text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Security verification complete. Password reset unlocked.</span>
            </div>

            {hasLocalPassword && resetToken && !searchParams.get('oobCode') ? (
              <form onSubmit={handleDirectPasswordReset} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-emerald-100/85 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-200/70 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="liquid-glass-input w-full h-10 pl-9 pr-10 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/70 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-100/85 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="liquid-glass-input w-full h-10 px-3.5 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-[#fcd34d] text-[#132a26] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-105 shadow-lg btn-press disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{submitting ? 'Updating Password...' : 'Change Password'}</span>
                </button>
              </form>
            ) : (
              <>
                {resetToken && !searchParams.get('oobCode') && (
                  <button
                    type="button"
                    disabled={submitting || resetLinkSent}
                    onClick={handleDispatchResetEmail}
                    className="w-full h-11 rounded-xl bg-[#fcd34d] text-[#132a26] text-sm font-bold flex items-center justify-center gap-2 hover:brightness-105 shadow-lg btn-press disabled:opacity-60"
                  >
                    <Mail className="w-4 h-4" />
                    <span>
                      {resetLinkSent
                        ? 'Reset Email Dispatched'
                        : submitting
                        ? 'Sending...'
                        : 'Send Password Reset Link to Email'}
                    </span>
                  </button>
                )}

                <form
                  onSubmit={handleCompleteResetWithCode}
                  className="space-y-3 pt-2 border-t border-white/15"
                >
                  <p className="text-[11px] text-emerald-100/75 leading-relaxed">
                    Opened the reset email? Paste the reset link or verification code below to set your new password:
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-emerald-100/85 mb-1">
                      Reset Link or Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetOobInput}
                      onChange={(e) => setResetOobInput(e.target.value)}
                      placeholder="Paste reset link or code"
                      className="liquid-glass-input w-full h-10 px-3.5 rounded-xl text-xs font-mono text-white placeholder:text-emerald-100/45"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-100/85 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-emerald-200/70 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="liquid-glass-input w-full h-10 pl-9 pr-10 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/70 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-100/85 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="liquid-glass-input w-full h-10 px-3.5 rounded-xl text-sm text-white placeholder:text-emerald-100/45"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-emerald-400 text-[#071915] text-xs font-bold flex items-center justify-center gap-2 hover:brightness-105 btn-press disabled:opacity-60"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{submitting ? 'Updating Password...' : 'Change Password'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-[11px] text-emerald-100/50">
          <span className="h-px flex-1 bg-white/15" />
          <span>or continue with</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="h-10 px-3 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2 btn-press"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
              />
            </svg>
            <span>Google Sign-In</span>
          </button>

          <button
            type="button"
            onClick={handleDemo}
            className="h-10 px-3 rounded-xl bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-300/30 text-xs font-semibold text-emerald-100 flex items-center justify-center gap-1.5 btn-press"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fcd34d]" />
            <span>Demo Account</span>
          </button>
        </div>

        {isAuthenticated && (
          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100/75">
            <span>
              Signed in as{' '}
              <strong className="text-white">
                {user?.email || localSession?.email || (isDemoMode ? 'Demo Household' : 'Member')}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => void signOutHousehold()}
              className="text-rose-300 hover:underline font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
