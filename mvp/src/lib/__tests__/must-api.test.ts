import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { createSessionToken } from "@/lib/auth/session";
import {
  getUserByEmail,
  listAudit,
  recommendationsFor,
  resetStore,
} from "@/lib/db/store";
import { hashPassword, verifyPassword } from "@/lib/db/password";
import { validateEventWrite, validateRegister } from "@/lib/validation/events";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { GET as listEvents, POST as createEventRoute } from "@/app/api/events/route";
import {
  DELETE as deleteEvent,
  PATCH as patchEvent,
} from "@/app/api/events/[id]/route";
import { GET as recommendations } from "@/app/api/events/[id]/recommendations/route";
import { GET as auditGet } from "@/app/api/admin/audit/route";

function withCookie(request: NextRequest, token: string) {
  request.cookies.set("svp_session", token);
  return request;
}

async function authedRequest(
  url: string,
  user: { id: string; email: string; displayName: string; role: "admin" | "student" },
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  const token = await createSessionToken(user);
  const request = new NextRequest(url, init);
  return withCookie(request, token);
}

describe("U-01 register and login", () => {
  beforeEach(() => resetStore());

  it("registers a student and ignores role: admin in the body", async () => {
    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "unique@demo.local",
        password: "TwelveChars!!",
        displayName: "Unique Student",
        role: "admin",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await register(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.role).toBe("student");
    expect(body.email).toBe("unique@demo.local");
  });

  it("logs in with valid credentials and rejects a bad password", async () => {
    const ok = await login(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "student@demo.local",
          password: "StudentPass1234",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(ok.status).toBe(200);

    const bad = await login(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "student@demo.local",
          password: "wrong-password!!",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(bad.status).toBe(401);
  });
});

describe("U-02 event validation", () => {
  it("rejects empty title, overlong title, and ends before starts", () => {
    expect(validateEventWrite({ title: "" })).toBe("title is required");
    expect(
      validateEventWrite({
        title: "x".repeat(121),
        description: "ok",
        location: "Adelaide City",
        department: "Student Life",
        startsAt: "2026-10-01T09:00:00.000Z",
        endsAt: "2026-10-01T10:00:00.000Z",
      })
    ).toBe("title must be at most 120 characters");
    expect(
      validateEventWrite({
        title: "Valid",
        description: "ok",
        location: "Adelaide City",
        department: "Student Life",
        startsAt: "2026-10-01T11:00:00.000Z",
        endsAt: "2026-10-01T10:00:00.000Z",
      })
    ).toBe("endsAt must be after startsAt");
    expect(
      validateEventWrite({
        title: "Valid",
        description: "ok",
        location: "Adelaide City",
        department: "Student Life",
        startsAt: "2026-10-01T09:00:00.000Z",
        endsAt: "2026-10-01T10:00:00.000Z",
        createdBy: "spoof",
      })
    ).toBe("createdBy cannot be set by the client");
  });
});

describe("U-03 recommendations", () => {
  beforeEach(() => resetStore());

  it("excludes the opened event from all rails", () => {
    const openedId = "33333333-3333-4333-8333-333333333301";
    const set = recommendationsFor(openedId);
    expect(set).not.toBeNull();
    const ids = [
      ...set!.byLocation,
      ...set!.byDepartment,
      ...set!.bySimilarity,
    ].map((event) => event.id);
    expect(ids).not.toContain(openedId);
    expect(set!.byLocation.length).toBeGreaterThan(0);
  });
});

describe("U-04 audit", () => {
  beforeEach(() => resetStore());

  it("writes an audit row on admin update and not on forbidden student patch", async () => {
    const admin = getUserByEmail("admin@demo.local")!;
    const student = getUserByEmail("student@demo.local")!;
    const eventId = "33333333-3333-4333-8333-333333333301";

    const adminReq = await authedRequest(
      `http://localhost/api/events/${eventId}`,
      {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
      },
      {
        method: "PATCH",
        body: JSON.stringify({
          title: "Open Day wayfinding updated",
          description: "Updated description for audit test.",
          location: "Adelaide City",
          department: "Student Life",
          startsAt: "2026-10-12T09:00:00.000Z",
          endsAt: "2026-10-12T15:00:00.000Z",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const adminRes = await patchEvent(adminReq, {
      params: Promise.resolve({ id: eventId }),
    });
    expect(adminRes.status).toBe(200);
    expect(listAudit(eventId).some((row) => row.action === "event.update")).toBe(
      true
    );

    const before = listAudit(eventId).length;
    const studentReq = await authedRequest(
      `http://localhost/api/events/${eventId}`,
      {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: "student",
      },
      {
        method: "PATCH",
        body: JSON.stringify({
          title: "Hacked",
          description: "Should not write",
          location: "Adelaide City",
          department: "Student Life",
          startsAt: "2026-10-12T09:00:00.000Z",
          endsAt: "2026-10-12T15:00:00.000Z",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const studentRes = await patchEvent(studentReq, {
      params: Promise.resolve({ id: eventId }),
    });
    expect(studentRes.status).toBe(403);
    expect(listAudit(eventId).length).toBe(before);
  });
});

describe("RBAC matrix", () => {
  beforeEach(() => resetStore());

  it("enforces cookie / student / admin outcomes on Must routes", async () => {
    const admin = getUserByEmail("admin@demo.local")!;
    const student = getUserByEmail("student@demo.local")!;

    expect(
      (await listEvents(new NextRequest("http://localhost/api/events"))).status
    ).toBe(401);

    const studentList = await listEvents(
      await authedRequest("http://localhost/api/events", {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: "student",
      })
    );
    expect(studentList.status).toBe(200);

    const studentCreate = await createEventRoute(
      await authedRequest("http://localhost/api/events", {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: "student",
      }, {
        method: "POST",
        body: JSON.stringify({
          title: "Should fail",
          description: "Student cannot create",
          location: "Adelaide City",
          department: "Student Life",
          startsAt: "2026-11-01T09:00:00.000Z",
          endsAt: "2026-11-01T10:00:00.000Z",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(studentCreate.status).toBe(403);

    const adminCreate = await createEventRoute(
      await authedRequest("http://localhost/api/events", {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
      }, {
        method: "POST",
        body: JSON.stringify({
          title: "Admin created",
          description: "Allowed for admin",
          location: "Waite",
          department: "Medicine",
          startsAt: "2026-11-01T09:00:00.000Z",
          endsAt: "2026-11-01T10:00:00.000Z",
        }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(adminCreate.status).toBe(201);

    const studentAudit = await auditGet(
      await authedRequest("http://localhost/api/admin/audit", {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: "student",
      })
    );
    expect(studentAudit.status).toBe(403);

    const adminAudit = await auditGet(
      await authedRequest("http://localhost/api/admin/audit", {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
      })
    );
    expect(adminAudit.status).toBe(200);

    const session = await sessionGet(
      await authedRequest("http://localhost/api/auth/session", {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
      })
    );
    expect(session.status).toBe(200);

    const eventId = "33333333-3333-4333-8333-333333333302";
    const studentDelete = await deleteEvent(
      await authedRequest(`http://localhost/api/events/${eventId}`, {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: "student",
      }, { method: "DELETE" }),
      { params: Promise.resolve({ id: eventId }) }
    );
    expect(studentDelete.status).toBe(403);

    const adminDelete = await deleteEvent(
      await authedRequest(`http://localhost/api/events/${eventId}`, {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: "admin",
      }, { method: "DELETE" }),
      { params: Promise.resolve({ id: eventId }) }
    );
    expect(adminDelete.status).toBe(204);

    const recs = await recommendations(
      await authedRequest(
        `http://localhost/api/events/33333333-3333-4333-8333-333333333301/recommendations`,
        {
          id: student.id,
          email: student.email,
          displayName: student.displayName,
          role: "student",
        }
      ),
      {
        params: Promise.resolve({
          id: "33333333-3333-4333-8333-333333333301",
        }),
      }
    );
    expect(recs.status).toBe(200);
  });
});

describe("password helpers", () => {
  it("hashes and verifies", () => {
    const hash = hashPassword("TwelveChars!!");
    expect(verifyPassword("TwelveChars!!", hash)).toBe(true);
    expect(verifyPassword("nope", hash)).toBe(false);
  });
});

describe("register validation", () => {
  it("requires a long enough password", () => {
    expect(
      validateRegister({
        email: "a@b.co",
        password: "short",
        displayName: "A",
      })
    ).toBe("password must be at least 12 characters");
  });
});
