import type { AuthorizationRequest, AuthorizationResponse, HealthResponse } from "./types.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: any,
    message?: string
  ) {
    super(message || data?.error || `HTTP Error ${status}`);
    this.name = "ApiError";
  }
}

/**
 * Send an authorization verification request to the OpenGuard backend.
 * Measures real latency using performance.now() without fabrication.
 */
export async function authorizeRequest(
  payload: AuthorizationRequest
): Promise<AuthorizationResponse> {
  const start = performance.now();

  try {
    const response = await fetch(`${API_BASE}/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const durationMs = Math.round(performance.now() - start);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        decision: "DENY",
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        user_id: data.user_id,
        reason: data.reason || data.error || "Authorization rejected or token invalid",
        matched_permissions: data.matched_permissions || [],
        durationMs,
      };
    }

    return {
      ...data,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    return {
      decision: "DENY",
      error: `Network Connection Error: ${err.message || "Failed to reach backend server on port 8080"}`,
      reason: "Could not establish connection to the authorization service. Ensure 'npm run dev' is running on port 8080.",
      matched_permissions: [],
      durationMs,
    };
  }
}

/**
 * Probe backend service health status.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { status: "degraded" };
    }
    const data = await res.json();
    return {
      status: "ok",
      ...data,
    };
  } catch {
    return { status: "error" };
  }
}

/**
 * Natural language policy parsing via backend parser engine.
 */
export async function parsePolicy(
  statement: string,
  defaultUserId?: string
): Promise<import("./types.js").PolicyParseResult> {
  const response = await fetch(`${API_BASE}/policies/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statement, default_user_id: defaultUserId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err, err.error || "Failed to parse policy");
  }

  return response.json();
}

/**
 * Fetch all permissions stored in SQLite.
 */
export async function fetchPermissions(
  userId?: string
): Promise<{ permissions: import("./types.js").PermissionRule[]; total: number }> {
  const url = userId
    ? `${API_BASE}/permissions?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/permissions`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err, err.error || "Failed to fetch permissions");
  }

  return response.json();
}

/**
 * Save one or multiple permission rules into SQLite.
 */
export async function createPermissions(
  rules: Array<{
    user_id: string;
    action: "read" | "write" | "delete";
    resource: string;
    effect: "allow" | "deny";
  }>
): Promise<{ success: boolean; count: number; inserted_ids: number[] }> {
  const response = await fetch(`${API_BASE}/permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err, err.error || "Failed to create permissions");
  }

  return response.json();
}

/**
 * Delete a permission rule from SQLite by ID.
 */
export async function deletePermission(
  id: number | string
): Promise<{ success: boolean; deleted_id: number }> {
  const response = await fetch(`${API_BASE}/permissions/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err, err.error || "Failed to delete permission");
  }

  return response.json();
}

