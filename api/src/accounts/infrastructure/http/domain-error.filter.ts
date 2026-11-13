import { type ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/errors.js';

const STATUS_BY_TYPE: Record<string, number> = {
  INVALID_ACCOUNT_CODE: 400,
  INVALID_ACCOUNT_NAME: 400,
  INVALID_NATURE: 400,
  ACCOUNT_NOT_FOUND: 404,
  ACCOUNT_ALREADY_EXISTS: 409,
  ACCOUNT_HAS_CHILDREN: 409,
  PARENT_NOT_FOUND: 422,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_TYPE[error.type] ?? 400;
    response.status(status).json({
      statusCode: status,
      error: error.type,
      message: error.message,
      field: error.field ?? null,
    });
  }
}