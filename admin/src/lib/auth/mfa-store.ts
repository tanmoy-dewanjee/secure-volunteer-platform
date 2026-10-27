import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import {
  generateRecoveryCode,
  generateTotpSecret,
  otpauthUrl,
  verifyTotp,
} from "@/lib/totp";

export type AdminMfaRecord = {
  username: string;
  secret: string;
  recoveryCode: string;
  enabled: boolean;
  enrolledAt: number | null;
};

export type EnrollmentPayload = {
  secret: string;
  otpauthUrl: string;
  recoveryCode: string;
};

const FILE = path.join(process.cwd(), ".data", "admin-mfa.json");

function readAll(): Record<string, AdminMfaRecord> {
  try {
    if (!existsSync(FILE)) return {};
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Record<
      string,
      AdminMfaRecord
    >;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(records: Record<string, AdminMfaRecord>) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(records, null, 2), "utf8");
}

export function getAdminMfa(username: string) {
  const key = username.trim().toLowerCase();
  return readAll()[key] ?? null;
}

export function beginAdminEnrollment(
  username: string,
  account: string
): EnrollmentPayload {
  const key = username.trim().toLowerCase();
  const records = readAll();
  const existing = records[key];
  const record =
    existing && !existing.enabled
      ? existing
      : {
          username: key,
          secret: generateTotpSecret(),
          recoveryCode: generateRecoveryCode(),
          enabled: false,
          enrolledAt: null,
        };
  records[key] = record;
  writeAll(records);
  return {
    secret: record.secret,
    otpauthUrl: otpauthUrl(record.secret, account),
    recoveryCode: record.recoveryCode,
  };
}

export async function verifyAdminMfa(username: string, code: string) {
  const record = getAdminMfa(username);
  if (!record) {
    return { ok: false as const, error: "Authenticator setup has not started." };
  }

  const totpOk = await verifyTotp(record.secret, code);
  const recoveryOk =
    code.replace(/\s/g, "").toUpperCase() === record.recoveryCode;

  if (!totpOk && !recoveryOk) {
    return { ok: false as const, error: "That authenticator code is not valid." };
  }

  const records = readAll();
  const next: AdminMfaRecord = {
    ...record,
    enabled: true,
    enrolledAt: record.enrolledAt ?? Date.now(),
  };
  if (recoveryOk) {
    next.recoveryCode = generateRecoveryCode();
  }
  records[record.username] = next;
  writeAll(records);
  return { ok: true as const, usedRecovery: recoveryOk };
}
