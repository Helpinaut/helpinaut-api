import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { RequestUser } from '../interfaces/request-user.interface';

/**
 * JWT authentication strategy used by Passport.
 * It extracts the JWT from the Authorization header and validates its payload.
 * The returned object becomes `request.user` in authenticated routes.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  /**
   * Validates the decoded JWT payload.
   * @param payload - Decoded JWT payload.
   * @throws UnauthorizedException if the payload is malformed.
   * @returns `request.user` payload.
   */
  async validate(payload: RequestUser): Promise<RequestUser> {
    if (!payload?.id || !payload?.email || !payload.username) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
    };
  }
}
