import { expect } from 'chai';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  DuplicityError,
} from '../../../src/errors/DomainErrors';

describe('DomainErrors', () => {
  describe('DomainError', () => {
    it('should create error with correct name', () => {
      const error = new DomainError('Test error');

      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('DomainError');
      expect(error.message).to.equal('Test error');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with resource name only', () => {
      const error = new NotFoundError('User');

      expect(error).to.be.instanceOf(DomainError);
      expect(error.name).to.equal('NotFoundError');
      expect(error.message).to.equal('User not found');
    });

    it('should create error with resource and identifier', () => {
      const error = new NotFoundError('Vehicle', 'abc-123');

      expect(error.name).to.equal('NotFoundError');
      expect(error.message).to.equal(
        "Vehicle with identifier 'abc-123' not found"
      );
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid license');

      expect(error).to.be.instanceOf(DomainError);
      expect(error.name).to.equal('ValidationError');
      expect(error.message).to.equal('Invalid license');
    });
  });

  describe('DuplicityError', () => {
    it('should create duplicity error with resource and field', () => {
      const error = new DuplicityError('Vehicle', 'matricula');

      expect(error).to.be.instanceOf(DomainError);
      expect(error.name).to.equal('DuplicityError');
      expect(error.message).to.equal('Vehicle with matricula already exists');
    });
  });
});
