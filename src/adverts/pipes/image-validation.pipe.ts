import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';
import { UploadConfig } from 'src/config/upload.config';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return [];
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const maxSize = UploadConfig.MAX_SIZE * 1024 * 1024;

    for (const file of files) {
      const fileExt = extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        throw new BadRequestException(
          `Invalid file type, only ${allowedExtensions.join(', ')} images are allowed`,
        );
      }

      if (file.size > maxSize) {
        throw new BadRequestException(
          `File size exceeds ${maxSize / 1024 / 1024} MB limit`,
        );
      }

      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Invalid file format, must be an image');
      }
    }

    return files;
  }
}
