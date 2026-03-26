import { DomainException } from './domain.exception';

export class BusinessValidationError extends DomainException {
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}
