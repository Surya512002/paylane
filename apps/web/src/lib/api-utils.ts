import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { TransitionError } from "./jobs/transitions";
import { serialize } from "./serialize";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(serialize(data), { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(e: unknown) {
  if (e instanceof AuthError) return jsonError(e.message, e.status);
  if (e instanceof TransitionError) return jsonError(e.message, e.status);
  console.error(e);
  return jsonError("Internal server error", 500);
}
