import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError, from } from 'rxjs';
import { unlink } from 'fs/promises';

@Injectable()
export class DeleteFileOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError((err) => {
        const file = request.file;

        if (file?.path) {
          from(unlink(file.path));
        }

        return throwError(() => err);
      }),
    );
  }
}
