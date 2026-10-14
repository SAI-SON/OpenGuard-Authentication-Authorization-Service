import express from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { verifyAccessToken } from "./lib/auth.js";
import { initializeDatabase } from "./config/database.js";
import { PermissionRepository } from "./repositories/permission.repository.js";
import { AuthorizationService } from "./services/authorization.service.js";
import type { HttpMethod } from "./types/authorization.js";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 8080;

const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_API_AUDIENCE;
const issuer = process.env.AUTH0_ISSUER;
const dbPath = process.env.DATABASE_PATH || "./data/permissions.db";

if (!domain || !audience || !issuer) {
  throw new Error("Missing Auth0 environment variables");
}

// Initialize SQLite database & authorization services
const db = initializeDatabase(dbPath);
const permissionRepo = new PermissionRepository(db);
const authorizationService = new AuthorizationService(permissionRepo);

const jwtCheck = auth({
  audience,
  issuerBaseURL: issuer,
  tokenSigningAlg: "RS256",
});

app.get("/authorized", jwtCheck, (_req, res) => {
  res.send("Secured Resource");
});

app.post("/authorize", async (req, res) => {
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
