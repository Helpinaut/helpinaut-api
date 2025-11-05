import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes and validates a string to match a given enum.
 * @param value String value to normalize
 * @param enumType Enum object (e.g., Category, Status)
 * @returns Normalized enum value
 */
export function normalizeEnum<T extends Record<string, string>>(
  value: string,
  enumType: T,
): T[keyof T] {
  const normalizedValue = value
    .toUpperCase()
    .replace(/\s+/g, '_') as keyof typeof enumType;

  if (!(normalizedValue in enumType)) {
    throw new BadRequestException(
      `${enumType.toString().toLowerCase()} value must be one of: ${Object.keys(enumType).join(', ')} `,
    );
  }

  return enumType[normalizedValue as keyof T];
}
