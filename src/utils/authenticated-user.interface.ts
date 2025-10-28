import { Request } from 'express';

export interface RequestUser {
  userId: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
