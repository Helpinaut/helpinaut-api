import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  RequestUser,
} from '../interfaces/request-user.interface';

/**
 * Extracts the authenticated user (or a specific field of it) from the request.
 * @example
 * @GetUser() user: RequestUser
 * @GetUser('id'): userId: string
 * @param data - Optional key og the RequestUser object to extract.
 * @param ctx - Execution context provided by NestJS.
 */
export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new Error(
        'GetUser decorator used without an authenticated user in the request',
      );
    }

    return data ? user[data] : user;
  },
);
