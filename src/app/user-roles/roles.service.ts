import { Injectable } from '@angular/core';
import { User, UserRole } from '../core/models';

/** Droits dont un profil a besoin pour effectuer une action sensible. */
export type Permission = 'manage:roles';

export interface RoleDefinition {
  id: UserRole;
  label: string;
  description: string;
}

export const ROLES: readonly RoleDefinition[] = [
  {
    id: 'administrator',
    label: 'Administrateur',
    description: 'Accès complet au salon : gestion des rôles compris.',
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Accès aux fonctionnalités du client.',
  },
];

@Injectable({ providedIn: 'root' })
export class RolesService {
  /** Droits accordés au profil de l'utilisateur, triés de manière stable. */
  rightsOf(user: User): Permission[] {
    if (user.role === 'administrator') {
      return ['manage:roles'];
    }
    return [];
  }

  /** Indique si le profil de l'utilisateur dispose du droit demandé. */
  hasRight(user: User, permission: Permission): boolean {
    return this.rightsOf(user).includes(permission);
  }
}
