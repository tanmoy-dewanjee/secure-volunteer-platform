import {
  generateRecoveryCode,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/totp";

export type MfaRecord = {
  username: string;
  secret: string;
  recoveryCode: string;
  enabled: boolean;
  enrolledAt: number;
};

const PREFIX = "svp_mfa_";

function storageKey(username: string) {
  return `${PREFIX}${username.trim().toLowerCase()}`;
}

function canUseStore() {
  return typeof window !== "undefined";
}

export function getMfaRecord(username: string): MfaRecord | null {
  if (!canUseStore() || !username.trim()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MfaRecord;
    if (!parsed?.secret) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isMfaEnabled(username: string) {
  return Boolean(getMfaRecord(username)?.enabled);
}

export function startMfaEnrollment(username: string): MfaRecord {
  const existing = getMfaRecord(username);
  if (existing && !existing.enabled) return existing;

  const record: MfaRecord = {
    username: username.trim().toLowerCase(),
    secret: generateTotpSecret(),
    recoveryCode: generateRecoveryCode(),
    enabled: false,
    enrolledAt: Date.now(),
  };
  window.localStorage.setItem(storageKey(username), JSON.stringify(record));
  return record;
}

export async function confirmMfaEnrollment(
  username: string,
  code: string
): Promise<{ ok: boolean; record?: MfaRecord; error?: string }> {
  const record = getMfaRecord(username);
  if (!record) {
    return { ok: false, error: "Start authenticator setup first." };
  }

  const validCode = await verifyTotp(record.secret, code);
  const validRecovery =
    code.replace(/\s/g, "").toUpperCase() === record.recoveryCode;

  if (!validCode && !validRecovery) {
    return { ok: false, error: "That code is not valid. Try the latest 6-digit code." };
  }

  const next = { ...record, enabled: true, enrolledAt: Date.now() };
  window.localStorage.setItem(storageKey(username), JSON.stringify(next));
  return { ok: true, record: next };
}

export async function verifyMfaChallenge(
  username: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const record = getMfaRecord(username);
  if (!record?.enabled) {
    return { ok: false, error: "Two-factor authentication is not set up yet." };
  }

  const validCode = await verifyTotp(record.secret, code);
  const validRecovery =
    code.replace(/\s/g, "").toUpperCase() === record.recoveryCode;

  if (!validCode && !validRecovery) {
    return { ok: false, error: "That authentication code is not valid." };
  }

  return { ok: true };
}

export function disableMfa(username: string) {
  if (!canUseStore()) return;
  window.localStorage.removeItem(storageKey(username));
}
