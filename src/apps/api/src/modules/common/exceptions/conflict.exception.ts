import { DomainException } from './domain.exception';

export class ConflictError extends DomainException {
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}
