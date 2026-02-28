import { BadRequestException } from '@nestjs/common';
import { ImageValidationPipe } from './image-validation.pipe';
import { UploadConfig } from 'src/config/upload.config';

const createFileMock = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1000,
    ...overrides,
  }) as Express.Multer.File;

describe('ImageValidationPipe', () => {
  let pipe: ImageValidationPipe;

  beforeEach(() => {
    pipe = new ImageValidationPipe();
  });

  it('should return files when all validations pass', () => {
    const files = [
      createFileMock({ originalname: 'image1.jpg' }),
      createFileMock({ originalname: 'image2.png', mimetype: 'image/png' }),
    ];

    const result = pipe.transform(files);

    expect(result).toEqual(files);
  });

  it('should return empty array when no files are provided', () => {
    const result = pipe.transform([]);

    expect(result).toEqual([]);
  });

  it('should return empty array when files is undefined', () => {
    const result = pipe.transform(undefined as any);

    expect(result).toEqual([]);
  });

  it('should throw when files extension is invalid', () => {
    const files = [createFileMock({ originalname: 'file.exe' })];

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
  });

  it('should throw when file size exceeds limit', () => {
    const maxSize = UploadConfig.MAX_SIZE * 1024 * 1024;
    const files = [createFileMock({ size: maxSize + 1 })];

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
  });

  it('should throw when mimetype is not an image', () => {
    const files = [createFileMock({ mimetype: 'application/pdf' })];

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
  });
});
