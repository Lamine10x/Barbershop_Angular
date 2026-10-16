import { TestBed } from '@angular/core/testing';
import { RolesService } from './roles.service';
import { User } from '../core/models';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolesService);
  });

  it('définit les droits pour un administrateur', () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@barbersop.fr',
      passwordHash: 'hash',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'administrator',
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };

    expect(service.rightsOf(adminUser)).toContain('manage:roles');
    expect(service.hasRight(adminUser, 'manage:roles')).toBe(true);
  });

  it('refuse les droits sensibles à un profil client', () => {
    const clientUser: User = {
      id: 'client-1',
      email: 'client@barbersop.fr',
      passwordHash: 'hash',
      firstName: 'Paul',
      lastName: 'Durand',
      role: 'client',
      loyaltyPoints: 10,
      createdAt: new Date().toISOString(),
    };

    expect(service.rightsOf(clientUser)).toEqual([]);
    expect(service.hasRight(clientUser, 'manage:roles')).toBe(false);
  });
});
