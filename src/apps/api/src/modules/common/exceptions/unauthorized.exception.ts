import { DomainException } from './domain.exception';

export class UnauthorizedError extends DomainException {
  readonly code = 'UNAUTHORIZED';

  constructor(message: string) {
    super(message);
  }
}
