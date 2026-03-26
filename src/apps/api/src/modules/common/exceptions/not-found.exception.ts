import { DomainException } from './domain.exception';

export class EntityNotFoundError extends DomainException {
  readonly code = 'ENTITY_NOT_FOUND';

  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`);
  }
}
