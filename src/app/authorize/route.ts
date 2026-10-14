import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import Database from "better-sqlite3";
import path from "node:path";

export const runtime = "nodejs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "permissions.db");
const db = new Database(dbPath);

const METHOD_TO_ACTION: Record<string, string> = {
  GET: "read",
  POST: "write",
  PUT: "write",
  PATCH: "write",
  DELETE: "delete",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { access_token?: unknown; method?: unknown; path?: unknown };

    if (
      typeof body.access_token !== "string" ||
      typeof body.method !== "string" ||
      typeof body.path !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId } = await verifyAccessToken(body.access_token);

    const upperMethod = body.method.toUpperCase();
    const action = METHOD_TO_ACTION[upperMethod];
    if (!action) {
      return NextResponse.json(
        { error: `Unsupported method: ${body.method}` },
        { status: 400 }
      );
    }

    // Canonical resource string (e.g. /api/reports -> reports)
    const resource = body.path.replace(/^\/+|\/+$/g, "").replace(/^api\//, "");

    // Query SQLite permissions for (user_id, action)
    const rows = db
      .prepare("SELECT * FROM user_permissions WHERE user_id = ? AND action = ?")
      .all(userId, action) as Array<{ resource: string; effect: string }>;

    // Match resource (exact match or wildcard *)
    const matched = rows.filter((r) => {
      if (r.resource === "*") return true;
      if (r.resource === resource) return true;
      if (r.resource.endsWith("/*")) {
        const prefix = r.resource.slice(0, -2);
        return resource.startsWith(prefix);
      }
      return false;
    });

    if (matched.length === 0) {
      return NextResponse.json({
        decision: "DENY",
        user_id: userId,
        reason: `No permissions found for user "${userId}" on "${resource}" with action "${action}".`,
        matched_permissions: [],
      });
    }

    // If any matched rule is deny, DENY wins (default deny principle)
    const hasDeny = matched.some((r) => r.effect === "deny");
    const hasAllow = matched.some((r) => r.effect === "allow");

    const decision = !hasDeny && hasAllow ? "PERMIT" : "DENY";

    return NextResponse.json({
      decision,
      user_id: userId,
      reason: decision === "PERMIT" ? "Allowed by matching policy" : "Denied by policy",
      matched_permissions: matched,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired access token" },
      { status: 401 }
    );
  }
}
