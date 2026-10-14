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
