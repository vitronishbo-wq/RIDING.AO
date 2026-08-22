/**
 * ACCESS CONFIGURATION (Bootstrap Vault contract)
 *
 * No access code, PIN or break-glass fragment is committed to the repository.
 * Every value is injected at build time from the environment (.env / Google Cloud
 * Secret Manager), per the constitutional rule "Zero Segredos no Código".
 *
 * NOTE: values exposed through `import.meta.env.VITE_*` are embedded in the client
 * bundle and are therefore only suitable for demo/discovery triggers. Real
 * authorization MUST be enforced server-side (Firebase Auth custom claims +
 * Firestore Security Rules); the checks below are UI gating only.
 */

const readEnv = (key: string): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === 'string' ? value.trim() : '';
};

const readList = (key: string): string[] =>
  readEnv(key)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/** Discovery trigger that opens the Master authentication challenge. */
export const MASTER_TRIGGER_CODE = readEnv('VITE_MASTER_TRIGGER_CODE');

/** Discovery trigger(s) that open the driver authentication modal. */
export const DRIVER_TRIGGER_CODES = readList('VITE_DRIVER_TRIGGER_CODES');

/** Challenge response required before Master/Founder privileges are granted. */
export const FOUNDER_CHALLENGE_CODE = readEnv('VITE_FOUNDER_CHALLENGE_CODE');

/** Valid Shamir share fragments (at least 2 distinct ones unlock break-glass). */
export const BREAKGLASS_SHARE_FRAGMENTS = readList('VITE_BREAKGLASS_SHARE_FRAGMENTS');

/**
 * Demo PINs for the seeded managed credentials, formatted as `id:pin,id:pin`.
 * Unset in production: credentials then carry no PIN and cannot authenticate.
 */
export const DEMO_CREDENTIAL_PINS: Record<string, string> = readList('VITE_DEMO_CREDENTIAL_PINS').reduce<
  Record<string, string>
>((acc, entry) => {
  const separatorIndex = entry.indexOf(':');
  if (separatorIndex > 0) {
    acc[entry.slice(0, separatorIndex).trim()] = entry.slice(separatorIndex + 1).trim();
  }
  return acc;
}, {});

/**
 * Dev-only privilege escalation surfaces (debug sequence, ephemeral vault token,
 * biometric shortcut). Never enabled in a production build.
 */
export const DEV_ESCALATION_ENABLED = import.meta.env.DEV && readEnv('VITE_ENABLE_DEV_ESCALATION') === 'true';

/** Expected debug sequence / dev token when dev escalation is enabled. */
export const DEV_DEBUG_SEQUENCE = readEnv('VITE_DEV_DEBUG_SEQUENCE');
export const DEV_VAULT_TOKEN = readEnv('VITE_DEV_VAULT_TOKEN');

/** Length-independent comparison to avoid leaking match length through timing. */
export const secretsMatch = (candidate: string, expected: string): boolean => {
  if (!expected) return false;
  const a = candidate.trim();
  if (a.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
};

export const matchesAny = (candidate: string, expected: string[]): boolean =>
  expected.some((value) => secretsMatch(candidate, value));

/** Failed-attempt throttling for PIN/code entry surfaces. */
export const MAX_AUTH_ATTEMPTS = 5;
export const AUTH_LOCKOUT_MS = 60_000;
