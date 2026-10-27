import { NextResponse } from "next/server";

function blocked() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const GET = blocked;
export const POST = blocked;
export const PUT = blocked;
export const PATCH = blocked;
export const DELETE = blocked;
