import {
  ArgumentsHost,
  Catch,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { ApiErrorsConfig } from 'src/config/api.errors.config';

/**
 * Global filter that converts Prisma error into HTTP exceptions.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violations
        const target = (exception.meta?.target ?? []) as string[];
        const field = target[0] ?? 'Field';

        super.catch(
          new ConflictException({
            ...ApiErrorsConfig.UNIQUE_FIELD_CONFLICT,
            field,
          }),
          host,
        );
      }
      case 'P2003': {
        // Foreign key constraint violation
        super.catch(
          new UnprocessableEntityException(
            ApiErrorsConfig.RELATED_ENTITY_NOT_FOUND,
          ),
          host,
        );
      }
      case 'P2025': {
        // Non-existing object
        super.catch(
          new NotFoundException(ApiErrorsConfig.RESOURCE_NOT_FOUND),
          host,
        );
      }
      default:
        console.error('Unhandled Prisma error:', exception);

        super.catch(
          new InternalServerErrorException(
            ApiErrorsConfig.INTERNAL_SERVER_ERROR,
          ),
          host,
        );
    }
  }
}
