/**
 * Authorization routes.
 *
 * Factory function receives pre-built service instances so that
 * the router is fully testable without Express app setup.
 */
import { Router } from 'express';
import type { TokenService } from '../services/token.service.js';
import type { AuthorizationService } from '../services/authorization.service.js';
import { AuthorizeController } from '../controllers/authorize.controller.js';

export function createAuthorizeRouter(
  tokenService: TokenService,
  authorizationService: AuthorizationService
): Router {
  const router = Router();
  const controller = new AuthorizeController(tokenService, authorizationService);

  router.post('/authorize', controller.handle);

  return router;
}
