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

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    switch (exception.code) {
      case 'P2002': {
        /**
         * Unique constraint violation
         */
        const target = (exception.meta?.target ?? []) as string[];
        throw new ConflictException(`this ${target} is already in use`);
      }
      case 'P2003': {
        /**
         * Foreign key constraint violation
         */
        throw new UnprocessableEntityException("entity doesn't exist");
      }
      case 'P2025': {
        /**
         * Non-existing object
         */
        throw new NotFoundException('resource not found');
      }
      default:
        throw new InternalServerErrorException('internal server error');
    }
  }
}
