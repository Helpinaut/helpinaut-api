import { FileValidator } from '@nestjs/common';

export interface MaxFileSizeValidatorOptions {
  maxSize: number;
  message?: string;
}

export class MaxFileSizeValidator extends FileValidator<MaxFileSizeValidatorOptions> {
  constructor(options: MaxFileSizeValidatorOptions) {
    super(options);
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return true;
    return file.size <= this.validationOptions.maxSize;
  }

  buildErrorMessage(): string {
    return (
      this.validationOptions?.message ||
      `there are images exceeding ${this.validationOptions.maxSize / 1024 / 1024} MB size limit`
    );
  }
}
