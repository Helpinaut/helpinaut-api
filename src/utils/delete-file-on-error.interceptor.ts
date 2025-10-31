import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { unlink } from 'fs/promises';

@Injectable()
export class DeleteFileOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError((err) => {
        const files = request.files || (request.file ? [request.file] : []);
        if (files.length) {
          for (const f of files) {
            if (f?.path) {
              unlink(f.path);
            }
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
