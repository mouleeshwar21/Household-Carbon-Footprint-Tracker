import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs/promises';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// --- Security Question & Household Recovery Store (salted scrypt hashes, never plaintext) ---
interface RecoveryRecord {
  uid: string;
  emailLower: string;
  householdName?: string;
  passwordSalt?: string;
  passwordHash?: string;
  question: string;
  salt: string;
  answerHash: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(__dirname, '.data');
const RECOVERY_FILE = path.join(DATA_DIR, 'recovery-store.json');
const recoveryCache = new Map<string, RecoveryRecord>();
const attemptTracker = new Map<string, { count: number; lockedUntil: number }>();
const resetTokens = new Map<string, { emailLower: string; expiresAt: number }>();
let recoveryLoaded = false;

async function ensureRecoveryLoaded(): Promise<void> {
  if (recoveryLoaded) return;
  recoveryLoaded = true;
  try {
    const raw = await fs.readFile(RECOVERY_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, RecoveryRecord>;
    Object.entries(parsed).forEach(([k, v]) => {
      if (v && typeof v.emailLower === 'string' && typeof v.answerHash === 'string') {
        recoveryCache.set(k, v);
      }
    });
  } catch {
    // Store does not exist yet
  }
}

async function persistRecoveryStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const obj = Object.fromEntries(recoveryCache.entries());
  await fs.writeFile(RECOVERY_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeAnswer(answer: string): string {
  return String(answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function makeUidForEmail(emailLower: string): string {
  return 'hh_' + crypto.createHash('sha256').update(emailLower).digest('hex').slice(0, 16);
}

app.post('/api/auth/recovery/register', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email, question, answer, uid, householdName } = (req.body || {}) as {
      email?: string;
      question?: string;
      answer?: string;
      uid?: string;
      householdName?: string;
    };

    const emailLower = normalizeEmail(email || '');
    const cleanQuestion = String(question || '').trim().slice(0, 160);
    const normalizedAns = normalizeAnswer(answer || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (cleanQuestion.length < 5) {
      return res.status(400).json({ error: 'Security question must be at least 5 characters.' });
    }
    if (normalizedAns.length < 2) {
      return res.status(400).json({ error: 'Security answer must be at least 2 characters.' });
    }

    const existing = recoveryCache.get(emailLower);
    const salt = crypto.randomBytes(16).toString('hex');
    const answerHash = crypto.scryptSync(normalizedAns, salt, 64).toString('hex');

    recoveryCache.set(emailLower, {
      ...existing,
      uid: uid || existing?.uid || makeUidForEmail(emailLower),
      emailLower,
      householdName: householdName?.trim().slice(0, 80) || existing?.householdName,
      question: cleanQuestion,
      salt,
      answerHash,
      updatedAt: new Date().toISOString(),
    });
    await persistRecoveryStore();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Error registering security recovery:', error);
    return res.status(500).json({ error: 'Unable to save security question.' });
  }
});

app.post('/api/auth/household/register', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email, password, householdName, question, answer } = (req.body || {}) as {
      email?: string;
      password?: string;
      householdName?: string;
      question?: string;
      answer?: string;
    };

    const emailLower = normalizeEmail(email || '');
    const cleanQuestion = String(question || '').trim().slice(0, 160);
    const normalizedAns = normalizeAnswer(answer || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (cleanQuestion.length < 5 || normalizedAns.length < 2) {
      return res.status(400).json({
        error: 'Security question and answer (min 2 characters) are required.',
      });
    }

    if (recoveryCache.has(emailLower)) {
      return res.status(409).json({
        code: 'EMAIL_EXISTS',
        error: 'This account already exists. Please sign in instead.',
      });
    }

    const uid = makeUidForEmail(emailLower);
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const answerHash = crypto.scryptSync(normalizedAns, salt, 64).toString('hex');
    const cleanHousehold =
      householdName?.trim().slice(0, 80) || `${emailLower.split('@')[0]}'s Eco Residence`;

    recoveryCache.set(emailLower, {
      uid,
      emailLower,
      householdName: cleanHousehold,
      passwordSalt,
      passwordHash,
      question: cleanQuestion,
      salt,
      answerHash,
      updatedAt: new Date().toISOString(),
    });
    await persistRecoveryStore();

    return res.json({
      ok: true,
      uid,
      email: emailLower,
      householdName: cleanHousehold,
      question: cleanQuestion,
    });
  } catch (error) {
    console.error('Error registering household account:', error);
    return res.status(500).json({ error: 'Unable to register household account.' });
  }
});

app.post('/api/auth/household/login', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    const emailLower = normalizeEmail(email || '');

    if (!emailLower || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const record = recoveryCache.get(emailLower);
    if (!record || !record.passwordHash || !record.passwordSalt) {
      return res.status(404).json({
        code: 'ACCOUNT_NOT_FOUND',
        error: 'Account does not exist. Please sign up first.',
      });
    }

    const derived = crypto.scryptSync(password, record.passwordSalt, 64);
    const stored = Buffer.from(record.passwordHash, 'hex');
    const matches = derived.length === stored.length && crypto.timingSafeEqual(derived, stored);

    if (!matches) {
      return res.status(401).json({
        code: 'WRONG_PASSWORD',
        error: 'Incorrect password. Please try again or use Forgot password? to reset it.',
      });
    }

    return res.json({
      ok: true,
      uid: record.uid || makeUidForEmail(emailLower),
      email: emailLower,
      householdName: record.householdName || 'Verdant Canopy Residence',
      question: record.question,
    });
  } catch (error) {
    console.error('Error signing in household account:', error);
    return res.status(500).json({ error: 'Unable to sign in.' });
  }
});

app.post('/api/auth/household/reset-password', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email, resetToken, newPassword } = (req.body || {}) as {
      email?: string;
      resetToken?: string;
      newPassword?: string;
    };
    const emailLower = normalizeEmail(email || '');
    const entry = resetToken ? resetTokens.get(resetToken) : undefined;

    if (!entry || entry.emailLower !== emailLower || entry.expiresAt < Date.now()) {
      return res.status(403).json({
        ok: false,
        error: 'You must verify your security question answer before changing the password.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
    }

    const record = recoveryCache.get(emailLower);
    if (!record) {
      return res.status(404).json({ ok: false, error: 'Account does not exist.' });
    }

    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(newPassword, passwordSalt, 64).toString('hex');

    recoveryCache.set(emailLower, {
      ...record,
      passwordSalt,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    await persistRecoveryStore();
    resetTokens.delete(resetToken!);

    return res.json({
      ok: true,
      message: 'Password changed successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Error resetting household password:', error);
    return res.status(500).json({ ok: false, error: 'Failed to update password.' });
  }
});

app.post('/api/auth/recovery/question', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email } = (req.body || {}) as { email?: string };
    const emailLower = normalizeEmail(email || '');
    if (!emailLower) {
      return res.status(400).json({ found: false, error: 'Email address is required.' });
    }
    const record = recoveryCache.get(emailLower);
    if (!record) {
      return res.json({ found: false });
    }
    return res.json({
      found: true,
      question: record.question,
      hasLocalPassword: Boolean(record.passwordHash),
    });
  } catch (error) {
    console.error('Error fetching security question:', error);
    return res.status(500).json({ found: false, error: 'Unable to look up security question.' });
  }
});

app.post('/api/auth/recovery/verify', async (req, res) => {
  try {
    await ensureRecoveryLoaded();
    const { email, answer } = (req.body || {}) as { email?: string; answer?: string };
    const emailLower = normalizeEmail(email || '');
    const normalizedAns = normalizeAnswer(answer || '');

    if (!emailLower || !normalizedAns) {
      return res.status(400).json({ verified: false, error: 'Email and security answer are required.' });
    }

    const tracker = attemptTracker.get(emailLower);
    if (tracker && tracker.lockedUntil > Date.now()) {
      const waitSecs = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({
        verified: false,
        error: `Too many incorrect attempts. Please wait ${waitSecs} seconds before retrying.`,
      });
    }

    const record = recoveryCache.get(emailLower);
    if (!record) {
      return res.status(404).json({
        verified: false,
        error: 'Account does not exist. Please sign up first.',
      });
    }

    const derived = crypto.scryptSync(normalizedAns, record.salt, 64);
    const stored = Buffer.from(record.answerHash, 'hex');
    const matches = derived.length === stored.length && crypto.timingSafeEqual(derived, stored);

    if (!matches) {
      const nextCount = (tracker?.count || 0) + 1;
      const lockedUntil = nextCount >= 5 ? Date.now() + 5 * 60 * 1000 : 0;
      attemptTracker.set(emailLower, { count: nextCount >= 5 ? 0 : nextCount, lockedUntil });
      return res.status(403).json({
        verified: false,
        error: 'Incorrect security answer. Password change remains locked until the correct answer is entered.',
      });
    }

    attemptTracker.delete(emailLower);
    const resetToken = crypto.randomBytes(24).toString('hex');
    resetTokens.set(resetToken, {
      emailLower,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return res.json({
      verified: true,
      resetToken,
      hasLocalPassword: Boolean(record.passwordHash),
    });
  } catch (error) {
    console.error('Error verifying security answer:', error);
    return res.status(500).json({ verified: false, error: 'Failed to verify security answer.' });
  }
});

app.post('/api/auth/recovery/consume', (req, res) => {
  const { email, resetToken } = (req.body || {}) as { email?: string; resetToken?: string };
  const emailLower = normalizeEmail(email || '');
  const entry = resetToken ? resetTokens.get(resetToken) : undefined;
  if (!entry || entry.emailLower !== emailLower || entry.expiresAt < Date.now()) {
    return res.status(403).json({
      authorized: false,
      error: 'Security question verification expired or invalid. Please answer your security question again.',
    });
  }
  resetTokens.delete(resetToken!);
  return res.json({ authorized: true });
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface LocalEcoHubRequest {
  category?: 'ev_charging' | 'recycling_compost' | 'solar_installers' | 'public_transit';
  locationQuery?: string;
  lat?: number;
  lng?: number;
}

const CATEGORY_PROMPTS: Record<string, string> = {
  ev_charging:
    'Find the top-rated public EV charging stations and fast-charging hubs nearby. Include station names, charger network/connector details if known, and why they are convenient for household EV commuting.',
  recycling_compost:
    'Find municipal recycling centers, e-waste drop-off facilities, and community composting hubs nearby. Summarize accepted materials and hours when available.',
  solar_installers:
    'Find reputable residential rooftop solar installers and clean energy service providers in this area. Highlight residential rooftop solar and net-metering support.',
  public_transit:
    'Find major public transit hubs, metro/rail stations, and bus interchanges nearby that help replace daily private car commutes.',
};

app.post('/api/local-eco-hubs', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
      });
    }

    const { category = 'ev_charging', locationQuery, lat, lng } = (req.body || {}) as LocalEcoHubRequest;
    const basePrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.ev_charging;
    const areaContext = locationQuery?.trim()
      ? `Area focus: ${locationQuery.trim()}.`
      : typeof lat === 'number' && typeof lng === 'number'
      ? `Use the user's current coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}).`
      : 'Area focus: Bengaluru, India.';

    const config: Record<string, unknown> = {
      tools: [{ googleMaps: {} }],
    };

    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${basePrompt} ${areaContext} Keep the summary concise, structured, and practical for a household reducing its carbon footprint.`,
      config,
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const rawChunks = groundingMetadata?.groundingChunks || [];

    const mapPlaces = rawChunks
      .filter((chunk: any) => chunk?.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title || 'Verified Eco Location',
        uri: chunk.maps.uri || '',
        placeId: chunk.maps.placeId || '',
        reviewSnippets: Array.isArray(chunk.maps.placeAnswerSources?.reviewSnippets)
          ? chunk.maps.placeAnswerSources.reviewSnippets.map((r: any) => ({
              author: r.authorAttribution?.displayName || '',
              text: r.text || '',
              uri: r.googleMapsUri || '',
            }))
          : [],
      }))
      .filter((p: any) => Boolean(p.uri));

    return res.json({
      text: response.text || 'No local recommendations were returned for this query.',
      places: mapPlaces,
    });
  } catch (error: any) {
    console.error('Error querying Google Maps grounding:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to fetch local eco-hub recommendations.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
