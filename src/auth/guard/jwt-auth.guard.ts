import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard JWT authenticated guard.
 * This guard requires a valid JWT. If the token is missing, expired, or invalid,
 * the request will be rejected with 401 Unauthorized.
 * Used in routes where authentication is mandatory.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Optional JWT authentication guard.
 * This guard attempts to authenticate the user, but does NOT throw if the token
 * is missing or invalid. Instead, it returns `null`, allowing the route to behave
 * as a "public" endpoint with optional user context.
 * Used in routes where authentication is optional (e.g. `getAll()` adverts).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Overrides Passport's default behavior.
   * @param err - Error thrown during authentication (if any).
   * @param user - User extracted from the JWT (if valid).
   * @param info - Additional passport info (e.g. token expired).
   * @returns The authenticated user or `null` if authentication failed.
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || info) {
      return null;
    }

    return user ?? null;
  }
}
