import { DomainException } from './domain.exception';

export class ForbiddenError extends DomainException {
  readonly code = 'FORBIDDEN';

  constructor(message: string) {
    super(message);
  }
}
