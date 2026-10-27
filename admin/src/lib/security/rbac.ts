import { hasPermission, type AdminRole } from "@/lib/models";

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
  }
}

export function assertRole(
  role: AdminRole | undefined,
  permission: Parameters<typeof hasPermission>[1]
) {
  if (!role || !hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
}

export function isWriteMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}
