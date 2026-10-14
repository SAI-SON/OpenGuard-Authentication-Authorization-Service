/**
 * Authorization controller: handles POST /authorize HTTP request/response.
 *
 * Responsibilities:
 * 1. Parse and validate the request body.
 * 2. Verify the access token via TokenService.
 * 3. Extract the authenticated user identity from the verified sub claim.
 * 4. Delegate authorization decision to AuthorizationService.
 * 5. Return a structured JSON response.
 *
 * This controller does NOT perform authorization logic itself and does NOT
 * trust any user_id supplied in the request body.
 */
import type { Request, Response, NextFunction } from 'express';
import { validateAuthorizeRequest } from '../schemas/authorize.schema.js';
import type { TokenService } from '../services/token.service.js';
import type { AuthorizationService } from '../services/authorization.service.js';
import type { AuthorizationResponse } from '../types/authorization.js';

export class AuthorizeController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * POST /authorize
   * Bound method — call as: router.post('/authorize', controller.handle)
   */
  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Validate request body (throws ValidationError on failure)
      const { access_token, method, path: apiPath } = validateAuthorizeRequest(req.body);

      // Step 2: Verify the JWT (throws TokenValidationError on failure)
      const payload = await this.tokenService.verifyToken(access_token);

      // Step 3: Extract identity from verified payload — never from request body
      const userId = payload.sub;

      // Step 4: Perform authorization decision
      const result = this.authorizationService.authorize(userId, method, apiPath);

      // Step 5: Return structured response
      const response: AuthorizationResponse = {
        decision: result.decision,
        user_id: userId,
        reason: result.reason,
        matched_permissions: result.matched_permissions,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}
