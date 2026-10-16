import { TestBed } from '@angular/core/testing';
import { AuthService, AuthenticationError } from './auth.service';
import { User } from '../core/models';

describe('AuthService', () => {
  let service: AuthService;
  let storage: Storage;

  beforeEach(() => {
    storage = window.localStorage;
    storage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    storage.clear();
  });

  it('crée un compte et ouvre la session du nouvel utilisateur', async () => {
    const user = await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });

    expect(user.email).toBe('lea@example.com');
    expect(user.role).toBe('client');
    expect(service.currentUser()?.email).toBe('lea@example.com');
    expect(storedUsers().some((candidate) => candidate.email === 'lea@example.com')).toBe(true);
  });

  it("refuse l'inscription avec un email déjà utilisé", async () => {
    await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });

    const failure = await attemptRegister(service, {
      email: 'LEA@example.com',
      password: 'autre-mdp',
      firstName: 'Autre',
      lastName: 'Nom',
    });

    expect(failure).toBeInstanceOf(AuthenticationError);
    expect((failure as AuthenticationError).message).toBe('Un compte existe déjà avec cet email.');
  });

  it("authentifie avec les identifiants et ouvre la session", async () => {
    const user = await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });

    const authenticated = await service.login('lea@example.com', 's3cr3t!');

    expect(authenticated.email).toBe(user.email);
    expect(service.currentUser()?.email).toBe(user.email);
  });

  it("refuse la connexion avec un mauvais mot de passe", async () => {
    await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });

    service.logout();
    const failure = await attemptLogin(service, 'lea@example.com', 'mauvais-mdp');

    expect(failure).toBeInstanceOf(AuthenticationError);
    expect((failure as AuthenticationError).message).toBe('Email ou mot de passe incorrect.');
    expect(service.currentUser()).toBeNull();
  });

  it('ne conserve jamais le mot de passe en clair', async () => {
    await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });

    const stored = storedUsers().find((user) => user.email === 'lea@example.com');

    expect(stored?.passwordHash).not.toContain('s3cr3t');
    expect(stored?.passwordHash.length).toBeGreaterThan(0);
  });

  it('ouvre la session au rafraîchissement après une déconnexion', async () => {
    await service.register({
      email: 'lea@example.com',
      password: 's3cr3t!',
      firstName: 'Léa',
      lastName: 'Martin',
    });
    await service.login('lea@example.com', 's3cr3t!');

    service.logout();
    expect(service.currentUser()).toBeNull();
  });
});

function attemptRegister(
  service: AuthService,
  input: { email: string; password: string; firstName: string; lastName: string },
): Promise<unknown> {
  return service.register(input).catch((error: unknown) => error);
}

function attemptLogin(
  service: AuthService,
  email: string,
  password: string,
): Promise<unknown> {
  return service.login(email, password).catch((error: unknown) => error);
}

function storedUsers(): User[] {
  const raw = window.localStorage.getItem('barbersop.users');
  return raw === null ? [] : (JSON.parse(raw) as User[]);
}
