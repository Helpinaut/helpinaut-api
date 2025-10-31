import { FileValidator } from '@nestjs/common';

export interface IsImageValidatorOptions {
  mime?: string[];
  message?: string;
}

export class IsImageValidator extends FileValidator<IsImageValidatorOptions> {
  constructor(options?: IsImageValidatorOptions) {
    super(options || {});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return true;
    }

    const allowedMimeTypes = this.validationOptions?.mime ?? [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];

    return allowedMimeTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return (
      this.validationOptions?.message ||
      'file must be a valid image (jpg, jpeg, png or webp)'
    );
  }
}
