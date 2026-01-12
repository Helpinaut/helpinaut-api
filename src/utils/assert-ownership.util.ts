import { UnauthorizedException } from '@nestjs/common';

/**
 * Ensures that the given resource belongs to the specified user.
 * Throws an UnauthorizedException if the user is not the owner.
 * @template T - Resource type that must contain an `ownerId` property.
 * @param resource - The resource object to check ownership of.
 * @param userId - The ID of the user attempting the action
 * @throws UnauthorizedException if the user is not the owner of the resource.
 */
export function assertOwnership<T extends { ownerId: string }>(
  resource: T,
  userId: string,
): void {
  if (resource['ownerId'] !== userId) {
    throw new UnauthorizedException(
      'You are not authorized to modify this resource',
    );
  }
}
