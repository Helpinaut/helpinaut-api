import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { unlink } from 'fs/promises';

/**
 * Interceptor that deletes uploaded files if the request fails.
 * Prevents orphaned files when validation or service logic throws an error.
 */
@Injectable()
export class DeleteFileOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError(async (error) => {
        const files = Array.isArray(request.files)
          ? request.files
          : request.file
            ? [request.file]
            : [];

        for (const file of files) {
          if (file?.path) {
            try {
              await unlink(file.path);
            } catch (err) {
              console.log(`Failed to delete file: ${file.path}`, err);
            }
          }
        }

        throw error;
      }),
    );
  }
}
