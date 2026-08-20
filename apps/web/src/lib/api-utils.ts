import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { TransitionError } from "./jobs/transitions";
import { serialize } from "./serialize";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(serialize(data), { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type ZodLike = { name?: string; issues?: Array<{ path: (string | number)[]; message: string }> };

function isZodError(e: unknown): e is ZodLike {
  // Duck-type: monorepo can load two copies of zod, so `instanceof ZodError` often fails.
  if (!e || typeof e !== "object") return false;
  const z = e as ZodLike;
  return z.name === "ZodError" || Array.isArray(z.issues);
}

function formatZodError(e: ZodLike) {
  const first = e.issues?.[0];
  if (!first) return "Invalid request";
  const path = first.path.length ? first.path.join(".") : "input";
  const friendly: Record<string, string> = {
    title: "Title must be at least 3 characters",
    description: "Description must be at least 10 characters",
    amountMinor: "Enter a valid USDC amount greater than 0",
    checklist: "Add at least one acceptance criterion",
    deadlineAt: "Deadline is invalid — use a positive number of days",
  };
  const key = String(first.path[0] ?? "");
  return friendly[key] ?? `${path}: ${first.message}`;
}

export function handleRouteError(e: unknown) {
  if (e instanceof AuthError) return jsonError(e.message, e.status);
  if (e instanceof TransitionError) return jsonError(e.message, e.status);
  if (e instanceof ZodError || isZodError(e)) return jsonError(formatZodError(e as ZodLike), 400);
  // Prisma connection / query failures — surface a usable message instead of a blank 500.
  if (e && typeof e === "object" && "name" in e) {
    const name = String((e as { name?: string }).name ?? "");
    const msg = e instanceof Error ? e.message : "";
    if (name.includes("Prisma") || msg.includes("Can't reach database") || msg.includes("P1001")) {
      console.error(e);
      return jsonError(
        "Database unavailable. Check DATABASE_URL and that Postgres is running.",
        503,
      );
    }
  }
  console.error(e);
  return jsonError(e instanceof Error ? e.message : "Internal server error", 500);
}
