import {
  Catch,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiErrorsConfig } from 'src/config/api.errors.config';

/**
 * Global filter that converts Prisma error into HTTP exceptions.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violations
        const target = (exception.meta?.target ?? []) as string[];
        const field = target[0] ?? 'Field';

        throw new ConflictException({
          ...ApiErrorsConfig.UNIQUE_FIELD_CONFLICT,
          field,
        });
      }
      case 'P2003': {
        // Foreign key constraint violation
        throw new UnprocessableEntityException(
          ApiErrorsConfig.RELATED_ENTITY_NOT_FOUND,
        );
      }
      case 'P2025': {
        // Non-existing object
        throw new NotFoundException(ApiErrorsConfig.RESOURCE_NOT_FOUND);
      }
      default:
        console.error('Unhandled Prisma error:', exception);
        throw new InternalServerErrorException(
          ApiErrorsConfig.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
