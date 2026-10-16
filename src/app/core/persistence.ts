/**
 * Persistance locale du navigateur.
 * Les données sont stockées dans le localStorage du navigateur ; en cas
 * d'indisponibilité du stockage, l'application continue sans persistance.
 */

const PREFIX = 'barbersop.';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage indisponible : persistance perdue, l'application continue
  }
}
