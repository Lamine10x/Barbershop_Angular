import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

interface Session {
  userId: string;
  startedAt: string;
}

/** Message d'erreur retourné lorsqu'une connexion échoue. */
export class AuthenticationError extends Error {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  /** Crée un compte et le connecte automatiquement. */
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<User> {
    const users = this.loadUsers();
    if (users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AuthenticationError('Un compte existe déjà avec cet email.');
    }
    const user: User = {
      id: this.nextId(),
      email: input.email,
      passwordHash: await this.hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role || ('client' as UserRole),
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this.saveUsers(users);
    this.connect(user);
    return user;
  }

  /** Authentifie un utilisateur et ouvre sa session. */
  async login(email: string, password: string): Promise<User> {
    const user = this.loadUsers().find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );
    if (user === undefined || !(await this.verifyPassword(user.passwordHash, password))) {
      throw new AuthenticationError('Email ou mot de passe incorrect.');
    }
    this.connect(user);
    return user;
  }

  /** Ferme la session en cours. */
  logout(): void {
    saveJson(SESSION_KEY, null);
    this.currentUser.set(null);
  }

  /**
   * Page d'accueil vers laquelle rediriger selon le rôle.
   * Les administrateurs accèdent au tableau de bord, les clients au catalogue.
   */
  landingRoute(user: User | null = this.currentUser()): string {
    return user?.role === 'administrator' ? '/roles' : '/catalogue';
  }

  /** Retourne la liste de tous les utilisateurs enregistrés (réservé admin). */
  getUsers(): User[] {
    return this.loadUsers();
  }

  /**
   * Indique si l'email correspond à un compte administrateur.
   * Sert à interdire qu'un administrateur soit enregistré comme client.
   */
  isAdministratorEmail(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return this.loadUsers().some(
      (user) => user.role === 'administrator' && user.email.toLowerCase() === normalized,
    );
  }

  /** Met à jour le rôle d'un utilisateur (réservé admin). */
  updateUserRole(userId: string, newRole: UserRole): void {
    const users = this.loadUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.role = newRole;
      this.saveUsers(users);
      if (this.currentUser()?.id === userId) {
        this.currentUser.set({ ...user });
      }
    }
  }

  private connect(user: User): void {
    this.currentUser.set(user);
    saveJson(SESSION_KEY, { userId: user.id, startedAt: new Date().toISOString() });
  }

  private restoreSession(): void {
    const session = loadJson<Session | null>(SESSION_KEY, null);
    if (session === null) {
      return;
    }
    const user = this.loadUsers().find((candidate) => candidate.id === session.userId);
    if (user !== undefined) {
      this.currentUser.set(user);
    }
  }

  private loadUsers(): User[] {
    const users = loadJson<User[]>(USERS_KEY, []);
    if (!users.some((u) => u.email === 'admin@barbersop.fr')) {
      const defaultAdmin: User = {
        id: 'admin-default',
        email: 'admin@barbersop.fr',
        // SHA-256 de 'admin123'
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        firstName: 'Alexandre (Gérant)',
        lastName: 'Barbersop',
        role: 'administrator',
        loyaltyPoints: 100,
        createdAt: new Date().toISOString(),
      };
      users.push(defaultAdmin);
      saveJson(USERS_KEY, users);
    }
    return users;
  }

  private saveUsers(users: User[]): void {
    saveJson(USERS_KEY, users);
  }

  private async hashPassword(password: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return this.toHex(digest);
  }

  private async verifyPassword(storedHash: string, password: string): Promise<boolean> {
    const hash = await this.hashPassword(password);
    return hash === storedHash;
  }

  private toHex(bytes: ArrayBuffer): string {
    return Array.from(new Uint8Array(bytes))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private nextId(): string {
    return `user-${Date.now().toString(36)}`;
  }
}
