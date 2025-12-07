import { expect } from 'chai';
import { AuthorizedDriverRepository } from '../../../src/repositories/AuthorizedDriverRepository';

describe('AuthorizedDriverRepository', () => {
  let repository: AuthorizedDriverRepository;

  beforeEach(() => {
    repository = new AuthorizedDriverRepository();
  });

  describe('findByVehicle', () => {
    it('should return an array of authorized drivers', async () => {
      const vehicleId = 'non-existent-vehicle-id';

      const result = await repository.findByVehicle(vehicleId);

      expect(result).to.be.an('array');
    });
  });

  describe('removeDriver', () => {
    it('should remove an authorized driver', async () => {
      const vehicleId = 'vehicle-123';
      const userId = 'user-456';

      const result = await repository.removeDriver(vehicleId, userId);

      expect(result).to.have.property('count');
    });
  });
});
