import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { DomainException } from '../exceptions';
import { EntityNotFoundError } from '../exceptions/not-found.exception';
import { ConflictError } from '../exceptions/conflict.exception';
import { ForbiddenError } from '../exceptions/forbidden.exception';
import { BusinessValidationError } from '../exceptions/validation.exception';
import { UnauthorizedError } from '../exceptions/unauthorized.exception';

const DOMAIN_STATUS_MAP = new Map<
  new (...args: never[]) => DomainException,
  number
>([
  [EntityNotFoundError, HttpStatus.NOT_FOUND],
  [ConflictError, HttpStatus.CONFLICT],
  [ForbiddenError, HttpStatus.FORBIDDEN],
  [BusinessValidationError, HttpStatus.BAD_REQUEST],
  [UnauthorizedError, HttpStatus.UNAUTHORIZED],
]);

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        response.status(status).json(exceptionResponse);
      } else {
        response.status(status).json({
          statusCode: status,
          message: exceptionResponse,
        });
      }
      return;
    }

    if (exception instanceof DomainException) {
      const statusCode = this.getDomainExceptionStatus(exception);
      response.status(statusCode).json({
        statusCode,
        code: exception.code,
        message: exception.message,
      });
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }

  private getDomainExceptionStatus(exception: DomainException): number {
    for (const [ExceptionClass, status] of DOMAIN_STATUS_MAP) {
      if (exception instanceof ExceptionClass) {
        return status;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
