export const SECURITY_QUESTIONS: string[] = [
  'What was the name of your first school?',
  'In what city or town were you born?',
  'What was your first pet’s name?',
  'What is the name of your childhood best friend?',
  'What street did you grow up on?',
  'What was the make of your first bicycle or car?',
];

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function hashSecurityAnswer(email: string, answer: string): Promise<string> {
  const input = `${email.trim().toLowerCase()}::${normalizeSecurityAnswer(answer)}`;
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function extractResetOobCode(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      return url.searchParams.get('oobCode') || '';
    }
  } catch {
    // Fall back to regex check below
  }
  const match = trimmed.match(/[?&]oobCode=([^&]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return trimmed;
}
