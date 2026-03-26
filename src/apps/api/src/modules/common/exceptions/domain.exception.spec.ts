import {
  EntityNotFoundError,
  ConflictError,
  ForbiddenError,
  BusinessValidationError,
  DomainException,
} from './index';

describe('Domain Exceptions', () => {
  it('should all extend DomainException', () => {
    expect(new EntityNotFoundError('Travel')).toBeInstanceOf(DomainException);
    expect(new ConflictError('duplicate')).toBeInstanceOf(DomainException);
    expect(new ForbiddenError('denied')).toBeInstanceOf(DomainException);
    expect(new BusinessValidationError('invalid')).toBeInstanceOf(
      DomainException,
    );
  });

  describe('EntityNotFoundError', () => {
    it('should format message with entity and id', () => {
      const error = new EntityNotFoundError('Travel', '123');
      expect(error.message).toBe('Travel with id 123 not found');
      expect(error.code).toBe('ENTITY_NOT_FOUND');
      expect(error.name).toBe('EntityNotFoundError');
    });

    it('should format message with entity only', () => {
      const error = new EntityNotFoundError('User');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should carry the provided message', () => {
      const error = new ConflictError('Member already exists');
      expect(error.message).toBe('Member already exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('ForbiddenError', () => {
    it('should carry the provided message', () => {
      const error = new ForbiddenError('Not the owner');
      expect(error.message).toBe('Not the owner');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('BusinessValidationError', () => {
    it('should carry the provided message', () => {
      const error = new BusinessValidationError('Budget exceeded');
      expect(error.message).toBe('Budget exceeded');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('BusinessValidationError');
    });
  });
});
