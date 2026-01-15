import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { FilterAdvertDto } from 'src/adverts/dto/filter-advert.dto';

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

/**
 * Normalizes and validates a string value against a given enum type.
 * Converts the input to uppercase and replaces spaces with underscores before
 * validation.
 * @template T - Enum type to validate against.
 * @param value - The raw string value to normalize (e.g., "active", "Active", "ACTIVE").
 * @param enumType - The enum object (e.g., Category, Status).
 * @returns The normalized enum value if valid.
 * @throws BadRequestException if the value does not match any enum member.
 * @example
 * parseEnumValue("active", Status); // returns Status.ACTIVE
 * parseEnumValue("in progress", Category); // returns Category.IN_PROGRESS
 */
export function parseEnumValue<T extends Record<string, string>>(
  value: string,
  enumType: T,
): T[keyof T] {
  const normalizedValue = value
    .toUpperCase()
    .replace(/\s+/g, '_') as keyof typeof enumType;

  if (!(normalizedValue in enumType)) {
    throw new BadRequestException(
      `Invalid value "${value}", must be one of: ${Object.keys(enumType).join(', ')} `,
    );
  }

  return enumType[normalizedValue as keyof T];
}

/**
 * Calculates pagination parameters (limit and offset) from filter DTO.
 * @param filters - DTO containing filter pagination options
 * @returns Object with `limit` and `offset` values for SQL queries.
 */
export function getPagination(filters: FilterAdvertDto) {
  const { limit = 20, page = 1 } = filters;

  return { limit, offset: (page - 1) * limit };
}

/**
 * Resolves the geographic coordinates to be used for distance calculations.
 * Priority order:
 * 1. Logged user's location (if `useUserLocation` is `true`).
 * 2. Manual coordinates provided in filters.
 * 3. No coordinates (distance filtering disabled).
 * @param userId - ID of the authenticated user (nullable)
 * @param filters - Advert filter DTO
 * @throws UnauthorizedException if user location is requested but no user is logged in.
 * @throws BaqRequestException if user has no defined location.
 * @returns Coordinates object or `null` if no location should be used.
 */
export async function resolveCoordinates(
  userId: string | null,
  filters: FilterAdvertDto,
): Promise<{ latitude: number; longitude: number } | null> {
  if (filters.useUserLocation) {
    if (!userId) {
      throw new UnauthorizedException('Login required to use user location');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });

    if (user?.latitude == null || user?.longitude == null) {
      throw new BadRequestException('User has no location set');
    }

    return { latitude: user.latitude, longitude: user.longitude };
  }

  if (filters.latitude != null && filters.longitude != null) {
    return { latitude: filters.latitude, longitude: filters.longitude };
  }

  return null;
}
