import express from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { verifyAccessToken } from "./lib/auth.js";
import { initializeDatabase } from "./config/database.js";
import { PermissionRepository } from "./repositories/permission.repository.js";
import { AuthorizationService } from "./services/authorization.service.js";
import type { HttpMethod } from "./types/authorization.js";

const app = express();

// Enable CORS for frontend web application
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// Health check endpoint
app.get(["/health", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "OpenGuard Authentication & Authorization Service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

const port = Number(process.env.PORT) || 8080;

const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_API_AUDIENCE;
const issuer = process.env.AUTH0_ISSUER;
const dbPath = process.env.DATABASE_PATH || "./data/permissions.db";

if (!domain || !audience || !issuer) {
  throw new Error("Missing Auth0 environment variables");
}

import { PolicyParserService } from "./services/policy-parser.service.js";

// Initialize SQLite database & authorization services
const db = initializeDatabase(dbPath);
const permissionRepo = new PermissionRepository(db);
const authorizationService = new AuthorizationService(permissionRepo);
const policyParserService = new PolicyParserService();

const jwtCheck = auth({
  audience,
  issuerBaseURL: issuer,
  tokenSigningAlg: "RS256",
});

app.get("/authorized", jwtCheck, (_req, res) => {
  res.send("Secured Resource");
});

// Natural Language Smart Policy Parser
app.post(["/policies/parse", "/api/policies/parse"], (req, res) => {
  try {
    const { statement, default_user_id } = req.body || {};
    if (typeof statement !== "string") {
      return res.status(400).json({ error: "Missing or invalid statement parameter" });
    }
    const result = policyParserService.parse(statement, default_user_id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// List all permissions from SQLite
app.get(["/permissions", "/api/permissions"], (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const permissions = userId
      ? permissionRepo.findAllByUser(userId)
      : permissionRepo.findAll();
    return res.json({ permissions, total: permissions.length });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Insert one or multiple permissions into SQLite
app.post(["/permissions", "/api/permissions"], (req, res) => {
  try {
    const body = req.body;
    const rulesToInsert = Array.isArray(body?.rules)
      ? body.rules
      : body?.user_id
      ? [body]
      : [];

    if (rulesToInsert.length === 0) {
      return res.status(400).json({ error: "No valid permission rules provided" });
    }

    const inserted: number[] = [];
    for (const rule of rulesToInsert) {
      const { user_id, action, resource, effect } = rule || {};
      if (!user_id || !action || !resource || !effect) {
        return res.status(400).json({ error: "Missing required fields: user_id, action, resource, effect" });
      }
      if (!["read", "write", "delete"].includes(action)) {
        return res.status(400).json({ error: `Invalid action: ${action}` });
      }
      if (!["allow", "deny"].includes(effect)) {
        return res.status(400).json({ error: `Invalid effect: ${effect}` });
      }

      const id = permissionRepo.insert(user_id, action, resource, effect);
      inserted.push(id);
    }

    return res.status(201).json({
      success: true,
      count: inserted.length,
      inserted_ids: inserted,
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a permission by ID from SQLite
app.delete(["/permissions/:id", "/api/permissions/:id"], (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid permission ID" });
    }
    const deleted = permissionRepo.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: "Permission not found" });
    }
    return res.json({ success: true, deleted_id: id });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post(["/authorize", "/api/authorize"], async (req, res) => {
  try {
    const { access_token, method, path } = req.body || {};

    if (
      typeof access_token !== "string" ||
      typeof method !== "string" ||
      typeof path !== "string"
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const upperMethod = method.toUpperCase();
    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    if (!validMethods.includes(upperMethod)) {
      return res.status(400).json({ error: `Unsupported HTTP method: ${method}` });
    }

    // 1. Verify token & extract user identity from sub claim
    const { userId } = await verifyAccessToken(access_token);

    // 2. Perform SQLite permission evaluation (Default is DENY)
    const result = authorizationService.authorize(
      userId,
      upperMethod as HttpMethod,
      path
    );

    return res.json({
      decision: result.decision,
      user_id: userId,
      reason: result.reason,
      matched_permissions: result.matched_permissions,
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
});

app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
