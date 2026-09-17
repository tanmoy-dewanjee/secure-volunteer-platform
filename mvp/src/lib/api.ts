"use client";

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "student";
};

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  department: string;
  startsAt: string;
  endsAt: string;
  createdBy: string;
};

export const SESSION_EVENT = "svp-session";

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function apiRegister(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<ApiUser & { message?: string; error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Registration failed");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
  return data as ApiUser;
}

export async function apiLogin(input: { email: string; password: string }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<ApiUser & { message?: string; error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Sign in failed");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
  return data as ApiUser;
}

export async function apiLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function apiSession() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Could not load session");
  return (await response.json()) as ApiUser;
}

export async function apiListEvents(filters?: {
  q?: string;
  location?: string;
  department?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.location) params.set("location", filters.location);
  if (filters?.department) params.set("department", filters.department);
  const query = params.toString();
  const response = await fetch(`/api/events${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await parseJson<{ message?: string; error?: string }>(response);
    throw new Error(data?.message || data?.error || "Could not load events");
  }
  const data = (await response.json()) as { events: ApiEvent[] };
  return data.events;
}

export async function apiGetEvent(id: string) {
  const response = await fetch(`/api/events/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load event");
  return (await response.json()) as ApiEvent;
}

export async function apiCreateEvent(
  input: Omit<ApiEvent, "id" | "createdBy">
) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<ApiEvent & { message?: string; error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Could not create event");
  }
  return data as ApiEvent;
}

export async function apiUpdateEvent(
  id: string,
  input: Omit<ApiEvent, "id" | "createdBy">
) {
  const response = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<ApiEvent & { message?: string; error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Could not update event");
  }
  return data as ApiEvent;
}

export async function apiDeleteEvent(id: string) {
  const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    const data = await parseJson<{ message?: string; error?: string }>(response);
    throw new Error(data?.message || data?.error || "Could not delete event");
  }
}

export async function apiRecommendations(id: string) {
  const response = await fetch(`/api/events/${id}/recommendations`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not load recommendations");
  return (await response.json()) as {
    eventId: string;
    byLocation: ApiEvent[];
    byDepartment: ApiEvent[];
    bySimilarity: ApiEvent[];
  };
}

export function rememberReturnPath(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("returnAfterLogin", path);
}

export function takeReturnPath() {
  if (typeof window === "undefined") return null;
  const returnTo = window.sessionStorage.getItem("returnAfterLogin");
  window.sessionStorage.removeItem("returnAfterLogin");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return null;
}
