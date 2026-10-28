import {
  SESSION_REMEMBER_MS,
  SESSION_TTL_MS,
} from "@/lib/security/constants";

export type Session = {
  username: string;
  name: string;
  keepSignedIn: boolean;
  signedInAt: number;
};

export const SESSION_EVENT = "svp-session";
const SESSION_KEY = "svp_session";

function canUseStore() {
  return typeof window !== "undefined";
}

function ttlFor(session: Session) {
  return session.keepSignedIn ? SESSION_REMEMBER_MS : SESSION_TTL_MS;
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.username) return null;
    if (Date.now() - parsed.signedInAt > ttlFor(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function migrateLegacySession(): Session | null {
  if (!canUseStore()) return null;

  const loggedIn =
    window.sessionStorage.getItem("demoLoggedIn") === "true" ||
    window.localStorage.getItem("demoLoggedIn") === "true";

  if (!loggedIn) return null;

  const username = (
    window.sessionStorage.getItem("demoUsername") ||
    window.localStorage.getItem("demoUsername") ||
    ""
  ).trim();

  if (!username) return null;

  const keepSignedIn = window.localStorage.getItem("demoLoggedIn") === "true";
  const session: Session = {
    username,
    name: window.localStorage.getItem("demoRegisteredName") || username,
    keepSignedIn,
    signedInAt: Date.now(),
  };

  writeSession(session);
  return session;
}

function writeSession(session: Session) {
  const raw = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, raw);
  window.sessionStorage.setItem(SESSION_KEY, raw);
}

function clearStores() {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem("demoLoggedIn");
  window.sessionStorage.removeItem("demoUsername");
  window.localStorage.removeItem("demoLoggedIn");
  window.localStorage.removeItem("demoUsername");
}

export function getSession(): Session | null {
  if (!canUseStore()) return null;

  const current =
    parseSession(window.localStorage.getItem(SESSION_KEY)) ||
    parseSession(window.sessionStorage.getItem(SESSION_KEY));

  if (current) return current;

  const legacy = migrateLegacySession();
  if (!legacy) {
    clearStores();
  }
  return legacy;
}

export function isSignedIn() {
  return Boolean(getSession());
}

export function signIn(input: {
  username: string;
  name?: string;
  keepSignedIn?: boolean;
}) {
  const username = input.username.trim().toLowerCase();
  const existing = getSession();
  const session: Session = {
    username,
    name:
      input.name?.trim() ||
      existing?.name ||
      window.localStorage.getItem("demoRegisteredName") ||
      username,
    keepSignedIn: input.keepSignedIn ?? existing?.keepSignedIn ?? true,
    signedInAt: Date.now(),
  };

  writeSession(session);
  window.sessionStorage.removeItem("demoLoggedIn");
  window.localStorage.removeItem("demoLoggedIn");
  window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export function touchSession() {
  const session = getSession();
  if (!session) return null;
  const next = { ...session, signedInAt: Date.now() };
  writeSession(next);
  return next;
}

export function signOut() {
  if (!canUseStore()) return;
  clearStores();
  void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function rememberReturnPath(path: string) {
  if (!canUseStore()) return;
  window.sessionStorage.setItem("returnAfterLogin", path);
}

export function takeReturnPath() {
  if (!canUseStore()) return null;
  const returnTo = window.sessionStorage.getItem("returnAfterLogin");
  window.sessionStorage.removeItem("returnAfterLogin");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return null;
}
