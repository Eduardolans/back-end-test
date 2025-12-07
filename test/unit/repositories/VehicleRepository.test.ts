import { expect } from 'chai';
import { VehicleRepository } from '../../../src/repositories/VehicleRepository';

describe('VehicleRepository', () => {
  let repository: VehicleRepository;

  beforeEach(() => {
    repository = new VehicleRepository();
  });

  describe('findAll', () => {
    it('should return an array of vehicles', async () => {
      const result = await repository.findAll();

      expect(result).to.be.an('array');
    });
  });
});
