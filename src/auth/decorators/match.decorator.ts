import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that the decorated property matches another property of the class.
 * @param prop - The name of the property to compare against.
 * @param options - Optional validation options.
 */
export function Match(
  prop: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target: any, propName: string | symbol) => {
    registerDecorator({
      name: 'Match',
      target: target.constructor,
      propertyName: propName.toString(),
      constraints: [prop],
      options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedProp] = args.constraints;
          const relatedValue = (args.object as any)[relatedProp];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedProp] = args.constraints;
          return `${String(args.property)} must must match ${relatedProp}`;
        },
      },
    });
  };
}
