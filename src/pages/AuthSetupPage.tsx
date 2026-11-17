import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCheck,
  ArrowRight,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Globe,
  KeyRound,
  MailCheck,
  Phone,
  Leaf,
  Eye,
  EyeOff,
  Lock,
  Mail,
  LayoutGrid,
} from 'lucide-react';
import { useCarbon } from '../context/CarbonContext';
import {
  CURRENCIES,
  CurrencyCode,
  REGION_GRID_PRESETS,
  UnitSystem,
  toDisplayUnit,
  fromDisplayUnit,
} from '../utils/calculations';
import { HomeType } from '../services/carbonApi';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { playUiSound } from '../utils/soundEffects';

const HOME_TYPES: HomeType[] = [
  'Apartment',
  'Independent House',
  'Detached House',
  'Row Home',
  'Villa',
  'Rural Homestead',
];

type AuthSubView =
  | 'login'
  | 'register'
  | 'verify-email'
  | 'verify-phone'
  | 'forgot-password'
  | 'reset-password';

export const AuthSetupPage: React.FC = () => {
  const {
    profile,
    records,
    loginDemo,
    loginWithCredentials,
    signInWithGoogle,
    registerOrMigrate,
    logout,
  } = useCarbon();
  const latestRecord = records[records.length - 1];
  const navigate = useNavigate();
  const location = useLocation();

  const resolveSubView = (pathname: string): AuthSubView => {
    if (pathname === '/register') return 'register';
    if (pathname === '/verify-email') return 'verify-email';
    if (pathname === '/verify-phone') return 'verify-phone';
    if (pathname === '/forgot-password') return 'forgot-password';
    if (pathname === '/reset-password') return 'reset-password';
    return 'login';
  };

  const [mode, setMode] = useState<AuthSubView>(() => resolveSubView(location.pathname));

  useEffect(() => {
    setMode(resolveSubView(location.pathname));
  }, [location.pathname]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('demo@carbontracker.org');
  const [loginPassword, setLoginPassword] = useState('Demo@12345');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // OTP / Recovery state
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string>('482910');
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [recoveryEmail, setRecoveryEmail] = useState('demo@carbontracker.org');
  const [newResetPassword, setNewResetPassword] = useState('');

  // Register / Profile Setup state
  const [email, setEmail] = useState(
    profile.isGuest ? 'household@terraledger.org' : profile.email
  );
  const [registerPassword, setRegisterPassword] = useState('');
  const [householdName, setHouseholdName] = useState(profile.householdName);
  const [country, setCountry] = useState(profile.country);
  const [stateRegion, setStateRegion] = useState(profile.stateRegion);
  const [members, setMembers] = useState(profile.members);
  const [homeType, setHomeType] = useState<HomeType>(profile.homeType);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [sizeDisplay, setSizeDisplay] = useState<number>(() =>
    toDisplayUnit(profile.sizeM2, 'area', profile.unitSystem)
  );
  const [migrateGuestData, setMigrateGuestData] = useState<boolean>(true);

  const handleUnitChange = (nextUnit: UnitSystem) => {
    const currentM2 = fromDisplayUnit(sizeDisplay, 'area', unitSystem);
    setUnitSystem(nextUnit);
    setSizeDisplay(toDisplayUnit(currentM2, 'area', nextUnit));
  };

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    const preset = REGION_GRID_PRESETS.find((r) => r.id === nextCountry);
    if (preset) {
      setCurrency(preset.defaultCurrency);
      handleUnitChange(preset.defaultUnit);
    }
  };

  const generateNewOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedOtpCode(code);
    setOtpInput(code);
    playUiSound('ding');
    setAuthMessage(`Simulated Verification Code Sent: ${code} (Auto-filled for instant testing)`);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthMessage(null);
    setIsSubmitting(true);
    playUiSound('click');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In was cancelled or could not be completed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    playUiSound('click');
    try {
      loginWithCredentials(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsSubmitting(true);
    playUiSound('click');
    try {
      const sizeM2 = Math.max(15, Math.round(fromDisplayUnit(sizeDisplay, 'area', unitSystem)));
      await registerOrMigrate({
        email,
        password: registerPassword || undefined,
        householdName,
        country,
        stateRegion,
        members: Math.max(1, members),
        homeType,
        sizeM2,
        unitSystem,
        currency,
        migrateGuestData,
      });
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = async () => {
    setAuthError(null);
    playUiSound('click');
    await logout();
    setAuthMessage('You have been logged out. Session switched to Guest Mode.');
    setMode('login');
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (otpInput.trim() !== simulatedOtpCode) {
      setAuthError(`Invalid 6-digit code. Expected simulated OTP: ${simulatedOtpCode}`);
      return;
    }
    playUiSound('ding');
    if (mode === 'forgot-password') {
      navigate('/reset-password');
      setAuthMessage('OTP verified! Please set your new household password below.');
      return;
    }
    setAuthMessage('Verification complete! Your household identity is verified.');
    setTimeout(() => navigate('/dashboard'), 900);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResetPassword.trim().length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    playUiSound('ding');
    setLoginPassword(newResetPassword);
    setAuthMessage('Password updated! You can now sign in with your new credentials.');
    navigate('/login');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Active Authenticated Session Status & Logout Card */}
      {!profile.isGuest && (
        <div className="v22-dark-card rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#eef1ec] text-[#132a26] flex items-center justify-center font-bold text-sm shrink-0">
              {profile.householdName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">{profile.householdName}</span>
                <span className="inline-flex items-center gap-1 text-[#fcd34d] text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Signed In ({profile.authProvider || 'Account'})
                </span>
              </div>
              <div className="text-xs text-white/75 font-mono mt-0.5">
                {profile.email} · {profile.members} Occupants · {profile.homeType}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eef1ec] text-[#132a26] text-xs font-bold hover:bg-white transition-colors whitespace-nowrap shrink-0"
            >
              <LayoutGrid className="w-4 h-4" />
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-300/30 text-rose-100 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Split-Screen Login & Registration Layout: Left Visual Aurora Panel + Right Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Panel: Animated Emerald Gradient + Floating Carbon Molecule SVG + Quote */}
        <div className="lg:col-span-5 aurora-mesh rounded-[28px] p-7 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-2xl">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#fcd34d]">
              <span>EcoTrack</span>
              <span aria-hidden="true">·</span>
              <span>Household Carbon Ledger</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance">
              Sign in to track and reduce your household carbon footprint.
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              Monitor 8 distinct household emission streams in real time, benchmark against the
              167 kg CO₂e/person Paris Agreement target, and sync your monthly audits across
              devices.
            </p>

            {/* Animated Floating Carbon Molecule SVG */}
            <div className="py-4 flex justify-center">
              <svg
                viewBox="0 0 260 150"
                className="w-full max-w-[250px] h-auto drop-shadow-xl"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="emeraldOrb" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
                  </radialGradient>
                </defs>
                <line
                  x1="65"
                  y1="75"
                  x2="130"
                  y2="75"
                  stroke="#a7f3d0"
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                <line
                  x1="130"
                  y1="75"
                  x2="195"
                  y2="75"
                  stroke="#a7f3d0"
                  strokeWidth="3"
                  strokeDasharray="4 3"
                />
                <circle
                  cx="130"
                  cy="75"
                  r="48"
                  fill="none"
                  stroke="#34d399"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                />
                <g>
                  <circle cx="65" cy="75" r="20" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                  <text
                    x="65"
                    y="79"
                    textAnchor="middle"
                    fill="#ecfdf5"
                    fontSize="12"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    O
                  </text>
                </g>
                <g>
                  <circle cx="130" cy="75" r="26" fill="url(#emeraldOrb)" />
                  <text
                    x="130"
                    y="80"
                    textAnchor="middle"
                    fill="#0b1f1c"
                    fontSize="14"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    C
                  </text>
                </g>
                <g>
                  <circle cx="195" cy="75" r="20" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                  <text
                    x="195"
                    y="79"
                    textAnchor="middle"
                    fill="#ecfdf5"
                    fontSize="12"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    O
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Live Household Snapshot + Quote */}
          <div className="relative z-10 space-y-4 pt-4 border-t border-white/15">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
                <div className="text-[11px] font-mono text-emerald-200/75">
                  Audits Logged
                </div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-[#fcd34d] mt-0.5">
                  <AnimatedCounter value={records.length} decimals={0} suffix=" months" />
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
                <div className="text-[11px] font-mono text-emerald-200/75">
                  Latest Per-Capita
                </div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-300 mt-0.5">
                  <AnimatedCounter
                    value={latestRecord?.result.perCapitaKgCO2e || 0}
                    decimals={1}
                    suffix=" kg"
                  />
                </div>
              </div>
            </div>

            <blockquote className="text-xs italic text-emerald-100/80 flex items-start gap-2">
              <Leaf className="w-4 h-4 text-[#fcd34d] shrink-0 mt-0.5" />
              <span>
                “What gets measured in the household gets decarbonized in the grid.”
              </span>
            </blockquote>
          </div>
        </div>

        {/* Right Panel: Dedicated Login, Registration & Verification Form */}
        <div className="lg:col-span-7 v22-card rounded-[28px] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#132a26]/10">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-1">
                  <span>Household Account Portal</span>
                  <span aria-hidden="true">·</span>
                  <span>Cloud & Local Sync</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#132a26]">
                  {mode === 'login' && 'Sign In to Your Account'}
                  {mode === 'register' && 'Create Household Account'}
                  {mode === 'verify-email' && 'Verify Email Address'}
                  {mode === 'verify-phone' && 'Verify Mobile Number (OTP)'}
                  {mode === 'forgot-password' && 'Reset Your Password'}
                  {mode === 'reset-password' && 'Set New Password'}
                </h1>
              </div>

              <div className="flex items-center gap-1 v22-subcard p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setMode('login');
                    navigate('/login');
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    mode === 'login'
                      ? 'bg-[#132a26] text-[#fcd34d] shadow-xs'
                      : 'text-[#132a26]/70 hover:text-[#132a26]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setMode('register');
                    navigate('/register');
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    mode === 'register'
                      ? 'bg-[#132a26] text-[#fcd34d] shadow-xs'
                      : 'text-[#132a26]/70 hover:text-[#132a26]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            {authMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{authMessage}</span>
              </div>
            )}

            {mode === 'login' && (
              <div className="space-y-6">
                {/* Email & Password Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-email-input"
                        className="block text-xs font-bold text-[#132a26]"
                      >
                        Email Address
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('demo@carbontracker.org');
                          setLoginPassword('Demo@12345');
                          setAuthMessage('Demo credentials filled. Click Sign In below.');
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
                      >
                        Fill Demo Credentials
                      </button>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#132a26]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@household.org"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password-input"
                        className="block text-xs font-bold text-[#132a26]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          generateNewOtp();
                          navigate('/forgot-password');
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#132a26]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#132a26]/60 hover:text-[#132a26]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#132a26]"
                      />
                      <span className="font-medium text-[#132a26]/80">
                        Keep me signed in on this device
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        generateNewOtp();
                        navigate('/verify-email');
                      }}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
                    >
                      Verify via OTP Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-[#fcd34d] bg-[#132a26] hover:bg-[#1b3b35] rounded-xl transition-colors shadow-md whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Household Ledger
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#132a26]/10" />
                  <span className="flex-shrink mx-3 text-[11px] font-medium text-[#132a26]/55">
                    Or sign in instantly with
                  </span>
                  <div className="flex-grow border-t border-[#132a26]/10" />
                </div>

                {/* Google Cloud Sign-In + 1-Click Demo Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGoogleSignIn}
                    className="p-3.5 rounded-2xl v22-subcard hover:bg-white border border-[#132a26]/15 flex items-center justify-between gap-3 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#132a26] text-[#fcd34d] flex items-center justify-center font-bold text-sm shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#132a26] truncate">
                          Continue with Google
                        </div>
                        <div className="text-[11px] opacity-65 truncate">
                          Firebase Cloud Auth
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#132a26]/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playUiSound('click');
                      loginDemo();
                      navigate('/dashboard');
                    }}
                    className="p-3.5 rounded-2xl bg-[#132a26] text-white hover:bg-[#1b3b35] flex items-center justify-between gap-3 transition-all text-left group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-300/15 text-[#fcd34d] flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#eef1ec] truncate">
                          1-Click Demo Login
                        </div>
                        <div className="text-[11px] text-[#fcd34d] truncate">
                          6-Month Pre-Seeded Home
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#fcd34d] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="p-3.5 rounded-2xl v22-subcard flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-[#132a26]">Want 1-click cloud registration?</span>{' '}
                    <span className="opacity-75">
                      Link your Google account to sync your household profile to Firestore.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#132a26] text-[#fcd34d] text-xs font-bold hover:bg-[#1b3b35] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Register with Google
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Household Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      placeholder="e.g., Sharma Residence / Oakwood Home"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="household@domain.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Create Password (for Email Login)
                    </label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Create a password (min 6 chars)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Country / Regional Electricity Grid
                    </label>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    >
                      {REGION_GRID_PRESETS.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          {reg.name} ({reg.factorKgPerKwh} kg CO₂e/kWh)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      State / Province / Grid Sub-Region
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g., Maharashtra / Delhi / Karnataka"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Household Members (Per-Capita Benchmark)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      required
                      value={members}
                      onChange={(e) => setMembers(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Dwelling / Home Type
                    </label>
                    <select
                      value={homeType}
                      onChange={(e) => setHomeType(e.target.value as HomeType)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    >
                      {HOME_TYPES.map((ht) => (
                        <option key={ht} value={ht}>
                          {ht}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Floor Area ({unitSystem === 'metric' ? 'm²' : 'sqft'})
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      required
                      value={sizeDisplay}
                      onChange={(e) => setSizeDisplay(Math.max(10, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                    />
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                        Preferred Unit System
                      </label>
                      <select
                        value={unitSystem}
                        onChange={(e) => handleUnitChange(e.target.value as UnitSystem)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                      >
                        <option value="metric">Metric (kg, kWh, km)</option>
                        <option value="imperial">Imperial (lbs, gal, mi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#132a26]/20 rounded-xl focus:outline-2 focus:outline-[#132a26]"
                      >
                        {Object.values(CURRENCIES).map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} ({c.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Guest-to-Account Migration Option */}
                <div className="p-4 rounded-2xl v22-subcard flex items-start gap-3">
                  <input
                    id="migrate-guest-checkbox"
                    type="checkbox"
                    checked={migrateGuestData}
                    onChange={(e) => setMigrateGuestData(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#132a26] rounded"
                  />
                  <label htmlFor="migrate-guest-checkbox" className="text-xs">
                    <span className="font-bold text-[#132a26]">
                      Migrate Guest Calculator & Audit Data ({records.length} monthly records)
                    </span>
                    <p className="opacity-70 mt-0.5">
                      Preserves all existing monthly records and recalculates per-capita benchmarks
                      using your registered household size and regional electricity grid factor.
                    </p>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      navigate('/login');
                    }}
                    className="text-xs font-bold text-emerald-800 hover:underline"
                  >
                    Already have an account? Sign in →
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#fcd34d] bg-[#132a26] hover:bg-[#1b3b35] rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {profile.isGuest
                      ? 'Create Account & Open Dashboard'
                      : 'Save Account Profile & Sync'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {(mode === 'verify-email' || mode === 'verify-phone' || mode === 'forgot-password') && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {mode === 'verify-phone' ? (
                      <Phone className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <MailCheck className="w-5 h-5 text-emerald-700" />
                    )}
                    <div className="text-xs">
                      <div className="font-bold text-[#132a26]">
                        Simulated 6-Digit Verification Code Active
                      </div>
                      <div className="font-mono text-emerald-800 mt-0.5">
                        Code: <strong>{simulatedOtpCode}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={generateNewOtp}
                    className="px-3 py-1.5 rounded-xl bg-[#132a26] text-[#fcd34d] text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    Resend Code
                  </button>
                </div>

                {mode === 'verify-phone' && (
                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Household Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#132a26]/20 rounded-xl"
                    />
                  </div>
                )}

                {mode === 'forgot-password' && (
                  <div>
                    <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                      Account Email for Recovery
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                    Enter 6-Digit Verification OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder={simulatedOtpCode}
                    className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center bg-white border border-[#132a26]/20 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-xs font-bold text-emerald-800 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#fcd34d] bg-[#132a26] rounded-xl"
                  >
                    Verify 6-Digit Code
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {mode === 'reset-password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#132a26] mb-1.5">
                    New Household Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#132a26]/20 rounded-xl"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#fcd34d] bg-[#132a26] rounded-xl"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Save New Password
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Bar inside Login Card: Guest Access & Security Flows */}
          <div className="pt-5 mt-6 border-t border-[#132a26]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-[#132a26]/70">
              <button
                type="button"
                onClick={() => {
                  generateNewOtp();
                  navigate('/verify-email');
                }}
                className="hover:text-[#132a26] hover:underline whitespace-nowrap"
              >
                Verify Email
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  generateNewOtp();
                  navigate('/verify-phone');
                }}
                className="hover:text-[#132a26] hover:underline whitespace-nowrap"
              >
                Verify Phone
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  generateNewOtp();
                  navigate('/forgot-password');
                }}
                className="hover:text-[#132a26] hover:underline whitespace-nowrap"
              >
                Password Recovery
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Continue as Guest to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
