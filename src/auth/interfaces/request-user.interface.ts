import { Request } from 'express';

/**
 * Shape of the object injected into the request by the JWT strategy.
 * This should match the payload returned in `JwtStrategy.validate()`.
 */
export interface RequestUser {
  id: string;
  email: string;
  username: string;
}

/**
 * Express request extended with the authenticated user.
 * The `user` property is optional at type level because Express does not define it, but in authenticated routes it will always be present.
 */
export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}
