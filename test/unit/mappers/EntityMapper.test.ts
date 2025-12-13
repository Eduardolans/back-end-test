import { expect } from 'chai';
import { EntityMapper } from '../../../src/mappers/EntityMapper';
import { LicenseType, VehicleType } from '../../../src/models/dataModels';

describe('EntityMapper', () => {
  describe('toUserBusiness', () => {
    it('should map User to UserBusiness', () => {
      const user = {
        id: 'user-123',
        nombre: 'John Doe',
        email: 'john@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = EntityMapper.toUserBusiness(user);

      expect(result.id).to.equal('user-123');
      expect(result.nombre).to.equal('John Doe');
      expect(result.email).to.equal('john@example.com');
      expect(result.tipoPermiso).to.equal(LicenseType.B);
      expect(result.permisoValidoHasta).to.deep.equal(new Date('2026-01-01'));
      expect(result).to.not.have.property('createdAt');
      expect(result).to.not.have.property('updatedAt');
    });
  });

  describe('toVehicleBusiness', () => {
    it('should map Vehicle with owner to VehicleBusiness', () => {
      const owner = {
        id: 'user-123',
        nombre: 'John Doe',
        email: 'john@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const vehicle = {
        id: 'vehicle-456',
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: '1234ABC',
        tipo: VehicleType.coche,
        propietarioId: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = EntityMapper.toVehicleBusiness(vehicle, owner);

      expect(result.id).to.equal('vehicle-456');
      expect(result.marca).to.equal('Toyota');
      expect(result.modelo).to.equal('Corolla');
      expect(result.matricula).to.equal('1234ABC');
      expect(result.tipo).to.equal(VehicleType.coche);
      expect(result).to.not.have.property('propietarioId');
      expect(result).to.not.have.property('createdAt');
      expect(result).to.not.have.property('updatedAt');
      expect(result.propietario).to.exist;
      expect(result.propietario.id).to.equal('user-123');
      expect(result.propietario.nombre).to.equal('John Doe');
    });
  });

  describe('toAuthorizedDriverBusiness', () => {
    it('should map AuthorizedDriver with user to AuthorizedDriverBusiness', () => {
      const driver = {
        id: 'user-789',
        nombre: 'Jane Smith',
        email: 'jane@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const authorizedDriver = {
        id: 'auth-111',
        vehicleId: 'vehicle-456',
        userId: 'user-789',
        createdAt: new Date('2024-01-01'),
      };

      const result = EntityMapper.toAuthorizedDriverBusiness(
        authorizedDriver,
        driver
      );

      expect(result.id).to.equal('auth-111');
      expect(result.vehicleId).to.equal('vehicle-456');
      expect(result).to.not.have.property('userId');
      expect(result).to.not.have.property('createdAt');
      expect(result.driver).to.exist;
      expect(result.driver.id).to.equal('user-789');
      expect(result.driver.nombre).to.equal('Jane Smith');
    });
  });

  describe('toOwnershipHistoryBusiness', () => {
    it('should map OwnershipHistory with owner to OwnershipHistoryBusiness', () => {
      const owner = {
        id: 'user-123',
        nombre: 'John Doe',
        email: 'john@example.com',
        tipoPermiso: LicenseType.B,
        permisoValidoHasta: new Date('2026-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const ownershipHistory = {
        id: 'history-222',
        vehicleId: 'vehicle-456',
        userId: 'user-123',
        fechaInicio: new Date('2024-01-01'),
        fechaFin: null,
        createdAt: new Date('2024-01-01'),
      };

      const result = EntityMapper.toOwnershipHistoryBusiness(
        ownershipHistory,
        owner
      );

      expect(result.id).to.equal('history-222');
      expect(result.vehicleId).to.equal('vehicle-456');
      expect(result.fechaInicio).to.deep.equal(new Date('2024-01-01'));
      expect(result.fechaFin).to.be.null;
      expect(result).to.not.have.property('userId');
      expect(result).to.not.have.property('createdAt');
      expect(result.owner).to.exist;
      expect(result.owner.id).to.equal('user-123');
      expect(result.owner.nombre).to.equal('John Doe');
    });
  });
});
