import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import {
  EntityNotFoundError,
  ConflictError,
  ForbiddenError,
  BusinessValidationError,
} from '../exceptions';

import { AllExceptionsFilter } from './all-exceptions.filter';

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status, json };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('should pass through NestJS HttpException unchanged', () => {
    const { host, status, json } = createMockHost();
    const exception = new HttpException(
      { statusCode: 422, message: 'Validation failed', error: 'Unprocessable Entity' },
      422,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validation failed',
      error: 'Unprocessable Entity',
    });
  });

  it('should map EntityNotFoundError to 404', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new EntityNotFoundError('Travel', '123'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'ENTITY_NOT_FOUND',
      message: 'Travel with id 123 not found',
    });
  });

  it('should map ConflictError to 409', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new ConflictError('Already exists'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Already exists',
    });
  });

  it('should map ForbiddenError to 403', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new ForbiddenError('Not the owner'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Not the owner',
    });
  });

  it('should map BusinessValidationError to 400', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new BusinessValidationError('Invalid date range'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid date range',
    });
  });

  it('should return 500 for unknown errors', () => {
    const { host, status, json } = createMockHost();
    filter.catch(new Error('something broke'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
});
