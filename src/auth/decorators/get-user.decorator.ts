import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  RequestUser,
} from '../interfaces/request-user.interface';

export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
