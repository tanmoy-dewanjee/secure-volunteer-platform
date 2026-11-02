import { NEW_ADMIN_PASSWORD_MIN } from "@/lib/security/constants";

export type PasswordCheck = {
  id: string;
  label: string;
  ok: boolean;
};

export type PasswordContext = {
  username?: string;
  email?: string;
  name?: string;
};

const NEW_PASSWORD_MAX = 200;

const COMMON = new Set(
  [
    "password",
    "password1",
    "password12",
    "password123",
    "password1234",
    "passw0rd1234",
    "123456789012",
    "1234567890123",
    "qwertyuiopas",
    "qwerty123456",
    "letmein12345",
    "welcome12345",
    "adminadmin12",
    "adelaide1234",
    "adelaideuni1",
    "volunteer123",
    "coordinator1",
    "coordinator12",
    "iloveyou1234",
    "changeme1234",
    "abcabcabc123",
  ].map((value) => value.toLowerCase())
);

export const PASSWORD_POLICY =
  "Use at least 12 characters, with upper and lower case letters, a number, and a symbol. Do not use a common or personal password.";

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function passwordChecks(
  password: string,
  context: PasswordContext = {}
): PasswordCheck[] {
  const lower = password.toLowerCase();
  const personal = [
    context.username,
    context.email?.split("@")[0],
    context.email,
    context.name,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const containsPersonal = personal.some(
    (value) => value.length >= 4 && lower.includes(value)
  );
  const common =
    COMMON.has(lower) || COMMON.has(compact(password)) || /(.)\1{3,}/.test(password);

  return [
    {
      id: "length",
      label: `At least ${NEW_ADMIN_PASSWORD_MIN} characters`,
      ok:
        password.length >= NEW_ADMIN_PASSWORD_MIN &&
        password.length <= NEW_PASSWORD_MAX,
    },
    {
      id: "lower",
      label: "A lowercase letter",
      ok: /[a-z]/.test(password),
    },
    {
      id: "upper",
      label: "An uppercase letter",
      ok: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "A number",
      ok: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "A symbol such as ! @ # %",
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "uncommon",
      label: "Not a common or repeated password",
      ok: password.length > 0 && !common,
    },
    {
      id: "personal",
      label: "Does not include your name, username or email",
      ok: password.length > 0 && !containsPersonal,
    },
  ];
}

export function isStrongPassword(password: string, context: PasswordContext = {}) {
  return passwordChecks(password, context).every((check) => check.ok);
}

export function passwordError(password: string, context: PasswordContext = {}) {
  const failed = passwordChecks(password, context).find((check) => !check.ok);
  if (!failed) return "";
  if (failed.id === "length") {
    return `Password must be ${NEW_ADMIN_PASSWORD_MIN}–${NEW_PASSWORD_MAX} characters.`;
  }
  return `Password must include: ${failed.label.toLowerCase()}.`;
}
