# Barbersop

Application web de gestion pour un salon de coiffure : catalogue de prestations, prise de
rendez-vous, programme de fidélité, caisse journalière, génération de reçus clients et espace
d'administration.

Développée avec **Angular 22** (composants standalone, signaux) et livrée en **rendu côté
serveur (SSR)**.

---

## Fonctionnalités

- **Authentification** — inscription et connexion, session persistante, mots de passe hachés
  (jamais stockés en clair).
- **Catalogue de prestations** — coupes, taille de barbe, rasage traditionnel, formule complète,
  avec description, durée, tarif et visuel.
- **Prise de rendez-vous** — choix du coiffeur, de la date et d'un créneau horaire, avec contrôle
  automatique des conflits.
- **Programme de fidélité** — cumul de points, paliers et récompenses par client.
- **Caisse journalière** — enregistrement des ventes et des paiements, total encaissé par jour.
- **Reçus** — génération par l'administrateur (client, prestation, prestataire, montant, mode de
  paiement), consultation par le client et export imprimable / PDF professionnel.
- **Espace administrateur** — tableau de bord réunissant clients, catalogue, équipe, planning et
  génération de reçus.

## Stack technique

| Élément | Technologie |
| --- | --- |
| Framework | Angular 22 (composants standalone, signaux, syntaxe `@if` / `@for`) |
| Rendu | Angular SSR + Express |
| Langage | TypeScript |
| Tests | Vitest |
| Formatage | Prettier |
| Persistance | `localStorage` du navigateur (pas de backend) |

## Démarrage

Prérequis : **Node.js** et **npm**.

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

Puis ouvrir <http://localhost:4200/>. L'application se recharge automatiquement à chaque
modification.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@barbersop.fr` | `admin123` |

Pour un compte **client**, utilisez le formulaire « Créer un compte » depuis l'écran de connexion.

Après connexion, un client est redirigé vers le **catalogue** et un administrateur vers le
**tableau de bord**.

## Scripts npm

| Commande | Description |
| --- | --- |
| `npm start` | Serveur de développement sur <http://localhost:4200/> |
| `npm run build` | Build de production dans `dist/` |
| `npm run watch` | Build en continu (configuration développement) |
| `npm test` | Exécution des tests unitaires (Vitest) |
| `npm run serve:ssr:Barbersop` | Sert le build SSR via Node |

## Structure du projet

```
src/
├── app/
│   ├── authentication/   Inscription, connexion, session et gardes de routes
│   ├── catalogue/        Catalogue et gestion des prestations
│   ├── rendez-vous/      Prise de rendez-vous, coiffeurs et planning
│   ├── fidelite/         Programme de fidélité (points et récompenses)
│   ├── caisse/           Caisse journalière (ventes et paiements)
│   ├── recus/            Génération, consultation et export des reçus
│   ├── user-roles/       Espace administrateur et gestion des rôles
│   ├── core/             Modèles de données partagés et persistance
│   ├── app.routes.ts     Définition des routes de l'application
│   └── app.config.ts     Configuration de l'application
├── styles.css            Feuille de styles globale
└── index.html            Page hôte
```

Chaque capacité suit la même organisation : `*.component.ts` / `.html` pour la présentation,
`*.service.ts` pour la logique métier et la persistance, `*.spec.ts` pour les tests.

## Persistance des données

L'application ne dépend d'**aucun backend** : les données sont conservées dans le
`localStorage` du navigateur, sous le préfixe `barbersop.` (utilisateurs, session, prestations,
rendez-vous, reçus, …). Elles restent donc disponibles après rechargement, mais sont propres à
chaque navigateur. Si le stockage est indisponible, l'application continue de fonctionner sans
persistance.

## Règles métier

- Un email déjà utilisé ne peut pas servir à créer un second compte.
- Un compte **administrateur** ne peut pas être enregistré comme **client** d'un rendez-vous.
- Un créneau déjà réservé pour un coiffeur ne peut pas être repris (aucun chevauchement).
- Le rôle est récupéré à la connexion et conditionne l'accès aux écrans d'administration.

## Tests

```bash
npm test
```

La suite couvre les services (authentification, catalogue, rendez-vous, fidélité, caisse, reçus,
rôles) et les composants principaux, y compris les règles métier ci-dessus.

## Ressources

- [Documentation Angular](https://angular.dev)
- [Angular CLI](https://angular.dev/tools/cli)
- [Vitest](https://vitest.dev)
