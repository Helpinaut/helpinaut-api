import { BadRequestException } from '@nestjs/common';

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
