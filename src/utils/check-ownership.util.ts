import { UnauthorizedException } from '@nestjs/common';

export function checkOwnership<T extends Record<string, any>>(
  resource: T,
  userId: string,
): void {
  if (resource['ownerId'] !== userId) {
    throw new UnauthorizedException('unauthorized to modify this advert');
  }
}
