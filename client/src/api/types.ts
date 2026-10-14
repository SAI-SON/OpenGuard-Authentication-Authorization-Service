export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Decision = "ALLOW" | "DENY";
export type Effect = "allow" | "deny";

export interface MatchedPermission {
  action: string;
  resource: string;
  effect: Effect;
}

export interface AuthorizationRequest {
  access_token: string;
  method: HttpMethod;
  path: string;
}

export interface AuthorizationResponse {
  decision: Decision;
  user_id?: string;
  reason?: string;
  matched_permissions?: MatchedPermission[];
  error?: string;
  durationMs?: number;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service?: string;
  timestamp?: string;
  uptime?: number;
}

export interface PermissionRule {
  id: string;
  user_id: string;
  action: "read" | "write" | "delete" | "*";
  resource: string;
  effect: Effect;
  created_at?: string;
  is_demo?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  method: HttpMethod;
  resource: string;
  decision: Decision;
  reason: string;
  ip?: string;
  is_live?: boolean;
}

export interface UserSummary {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  type: "machine" | "user" | "admin";
  permission_count: number;
  status: "active" | "suspended";
  last_active?: string;
}

export interface ParsedRule {
  user_id: string;
  action: "read" | "write" | "delete";
  resource: string;
  effect: "allow" | "deny";
  explanation: string;
}

export interface AmbiguityIssue {
  field: "user_id" | "action" | "resource" | "effect";
  message: string;
  suggestions?: string[];
}

export interface PolicyParseResult {
  statement: string;
  success: boolean;
  rules: ParsedRule[];
  ambiguities: AmbiguityIssue[];
  confidence: number;
}

