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
      'there are files that are not valid images (jpg, jpeg, png or webp)'
    );
  }
}
