import { ParseFilePipe } from '@nestjs/common';
import { IsImageValidator } from '../validators/is-image.validator';
import { MaxFileSizeValidator } from '../validators/max-file-size.validator';

export interface ImageFilePipeOptions {
  maxSize?: number;
  fileIsRequired?: boolean;
}

export class ImageFilePipe extends ParseFilePipe {
  constructor(options?: ImageFilePipeOptions) {
    const {
      maxSize = Number(process.env.UPLOAD_MAX_SIZE ?? '5') * 1024 * 1024,
      fileIsRequired = false,
    } = options || {};
    super({
      fileIsRequired,
      validators: [
        new IsImageValidator(),
        new MaxFileSizeValidator({ maxSize }),
      ],
    });
  }
}
