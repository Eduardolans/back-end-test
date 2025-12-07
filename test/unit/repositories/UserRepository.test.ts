import { expect } from 'chai';
import { UserRepository } from '../../../src/repositories/UserRepository';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  describe('findById', () => {
    it('should return null when user does not exist', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).to.be.null;
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await repository.findAll();

      expect(result).to.be.an('array');
    });
  });
});
