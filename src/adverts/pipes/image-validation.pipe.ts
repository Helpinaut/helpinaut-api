import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';
import { UploadConfig } from 'src/config/upload.config';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Extension file validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        `Invalid file type, only ${allowedExtensions.join(', ')} images are allowed`,
      );
    }

    // File size validation
    const maxSize = UploadConfig.MAX_SIZE * 2024 * 2024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1024 / 1024} MB limit`,
      );
    }

    // Mimetype validation
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Invalid file format, must be an image');
    }

    return file;
  }
}
