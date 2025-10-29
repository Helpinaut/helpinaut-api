import { Request } from 'express';

export interface RequestUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
