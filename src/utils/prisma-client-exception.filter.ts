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
        throw new ConflictException(`${field} is already in use`);
      }
      case 'P2003': {
        // Foreign key constraint violation
        throw new UnprocessableEntityException('Related entity does not exist');
      }
      case 'P2025': {
        // Non-existing object
        throw new NotFoundException('Resource not found');
      }
      default:
        console.error('Unhandled Prisma error:', exception);
        throw new InternalServerErrorException('Internal server error');
    }
  }
}
