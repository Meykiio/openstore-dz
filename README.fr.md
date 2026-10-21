# OpenStore DZ

**E-commerce libre et auto-hébergé pour les petites entreprises et les indépendants algériens.**

[English](README.md) · [العربية](README.ar.md)

> **La démo est une vitrine, pas une boutique.** Les commandes passées sur
> [openstore-dz.vercel.app](https://openstore-dz.vercel.app) ne sont jamais expédiées.
> OpenStore n’est pas un service hébergé : chaque commerçant installe sa propre copie,
> avec sa base de données, son domaine et ses commandes. Personne d’autre ne voit ses
> commandes ni ses clients.

---

## Ce que c'est

Une boutique en ligne complète, qui vous appartient. Vous ne payez rien : pas
d'abonnement, pas de frais d'installation.

En Algérie, un commerçant n'a que trois options : payer une solution SaaS à partir de
999 DA par mois plus 35 000 à 65 000 DA d'installation, construire lui-même son site, ou
continuer à vendre par messages directs sur Instagram et Facebook. Cette dernière option
n'est pas un petit marché : **47,4 % des achats en ligne algériens se font via les
réseaux sociaux**, contre 31,8 % via les sites marchands. Et Jumia, la seule marketplace
financée par des investisseurs, **a quitté l'Algérie en mars 2026**.

OpenStore répond à ça : une vraie boutique, en arabe, qui s'installe en une étape.

---

## État actuel

**Version 0.1.0 — pas encore une boutique utilisable.** Le socle est construit et
vérifié : le projet démarre, le contrôle qualité passe, le design system est en place. Le
catalogue, le paiement, le tableau de bord et la livraison sont construits et vérifiés. Ce
qui reste est regroupé en phases dans `docs/ROADMAP.md`.

| Sprint | Ce qu'il apporte                                             | État                            |
| ------ | ------------------------------------------------------------ | ------------------------------- |
| 0      | Socle du projet, contrôle qualité, design system             | **Terminé**                     |
| 1      | Bibliothèque de compétences, référence design, documentation | **Terminé**                     |
| 2      | Base de données, RLS, jeu de données de démonstration        | Terminé, vérifié en base réelle |
| 3      | Connexion admin et profil de la boutique                     | **Terminé**                     |
| 4      | Produits, packs, guide des tailles                           | **Terminé**                     |
| 5      | Commandes et file d'appel de confirmation                    | **Terminé**                     |
| 6      | Boutique en ligne et pages produit                           | **Terminé**                     |
| 7      | Panier et paiement à la livraison                            | **Terminé**                     |
| 8      | Livraison Guepex et suivi                                    | **Terminé**                     |
| 9      | Accessibilité                                                | **Terminé**                     |
| 10     | Mise en production                                           | Partiel                         |

> **Les sprints 0 à 9 sont implémentés.** Le sprint 10 est partiel : la performance n'a pas
> encore été mesurée sur la version construite, et rien n'est déployé.
>
> L'accessibilité n'est pas un audit ponctuel : axe-core vérifie les règles WCAG 2.1 A et
> AA sur chaque page, à chaque exécution. La mise en page est mesurée de la même façon — pas
> de débordement horizontal entre 320 et 1280, avec une taille minimale des zones tactiles —
> et toujours sur la version construite, jamais sur le serveur de développement.
>
> **Deux étapes humaines avant une vraie boutique.** Le webhook Guepex répond `503` tant que
> `GUEPEX_WEBHOOK_SECRET` n'est pas défini, et les images de démonstration sont des
> placeholders externes à remplacer.

`docs/CHANGELOG.md` ne décrit que ce qui a été vérifié. Ce qui n'y figure pas n'existe
pas encore.

---

## Pourquoi ce projet

**Parce que tout est payant.** Les solutions locales débutent à 999 DA/mois, souvent
35 000 à 65 000 DA de mise en place.

**Parce que l'arabe est ignoré.** Sur dix sites algériens analysés, neuf déclarent
`lang="fr"` sans jamais indiquer le sens de lecture, et la plupart chargent une police
latine seulement : l'arab s'affiche dans une police choisie au hasard par le système.
Ce n'est pas un détail esthétique, c'est une opportunity commerciale perdue.

**Parce que le paiement à la livraison n'est pas une option.** Environ 90 % des
transactions en ligne algériennes se règlent à la livraison. C'est pourquoi la plateforme
ne détient **jamais** l'argent du commerçant.

---

## Ce que la boutique fera

- Vitrine **en arabe, de droite à gauche**, pensée pour le mobile
- Produits et packs, avec tailles, couleurs et galeries d'images
- **Guide des tailles**, qui fait passer les retours en textile de 35–50 % à 8–15 %
- Paiement à la livraison, avec les frais de port affichés **avant** la commande
- **File d'appel de confirmation**, la fonction que les commerçants algériens réclament,
  car un appel avant expédition réduit fortement les livraisons refusées
- Livraison Guepex (anciennement Yalidine) avec suivi en direct
- Avis clients, aujourd'hui absents de presque toutes les boutiques algériennes

---

## Installation

| Outil            | Pourquoi                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| **Git**          | pour cloner le dépôt                                                      |
| **Node.js 20+**  | pour lancer le projet                                                     |
| **npm**          | fourni avec Node.js                                                       |
| **Docker**       | pour faire tourner Supabase en local, ou utilisez un projet cloud gratuit |
| **Supabase CLI** | vérifiez avec `npx supabase --version`                                    |

```bash
git clone https://github.com/Meykiio/openstore-dz.git
cd openstore-dz
npm install
npx supabase start
cp .env.example .env     # renseignez l'URL et la clé publique
npm run dev              # http://localhost:8080
```

---

## Installation en un clic

Copiez le bloc ci-dessous et collez-le dans Claude Code, Claude Desktop, Cursor,
opencode, Gemini CLI ou Windsurf. L'assistant installe tout, crée la base, applique le
schéma, remplit le fichier d'environnement et vérifie chaque étape.

```text
You are setting up OpenStore DZ, a free self-hosted e-commerce platform for Algerian
small businesses, for a non-technical shop owner who reads French. Work autonomously,
verify every step, and explain each step in one plain French sentence. Never skip a
failed verification: diagnose the root cause, fix it, and re-run before continuing.

IMPORTANT: Write every explanation and the final report to the user in clear French.
Keep technical identifiers (file names, commands, variable names) in English, but
surround them with French explanation.

FIRST, ASK ONE QUESTION before installing anything, in French:
"Voulez-vous une base de données sur votre ordinateur (Docker, gratuite et privée) ou
un projet Supabase gratuit en ligne ?"
Wait for the answer, then follow PATH A or PATH B.

0. DETECT THE PLATFORM FIRST. Determine the OS (Windows, macOS, Linux) and the CPU
   architecture. Report it. On Windows, also state whether you are in PowerShell, cmd,
   or Git Bash, and use the correct syntax for each.

1. VERIFY PREREQUISITES. Check each; install anything missing using the
   OS-appropriate method. Report exactly what you installed, in French.
   - Git: `git --version`
       Windows: winget install Git.Git  |  macOS: brew install git  |  Linux: apt install git
   - Node.js 20+: `node -v`
       Windows: winget install OpenJS.NodeJS.LTS  |  macOS: brew install node  |  Linux: apt install nodejs npm
   - npm: `npm -v`
   - Docker (must be RUNNING, not just installed): `docker version`
       Windows/macOS: Docker Desktop, winget install Docker.DockerDesktop (needs a
       restart and WSL2) | brew install --cask docker
       Linux: Docker Engine, then `sudo systemctl enable --now docker`
   - Supabase CLI: `npx supabase --version`

2. CLONE. If the current folder is not already the project:
   git clone https://github.com/Meykiio/openstore-dz.git
   cd openstore-dz

3. INSTALL DEPENDENCIES. Run `npm install`. If it fails, diagnose and fix the root
   cause before continuing.

--- PATH A: LOCAL DATABASE (Docker) ---

A1. START SUPABASE LOCALLY. Run `npx supabase start`. Wait for the API URL, anon key,
   Studio URL and DB URL. A "not linked" message is expected and is not an error here.

A2. APPLY THE DATABASE SCHEMA. From bash (Git Bash on Windows), run:
   docker exec -i supabase_db_openstore-dz psql -U postgres -v ON_ERROR_STOP=1 < supabase/schema.sql
   Do NOT use `npx supabase db reset`: its seed loader cannot run a file that
   creates tables. Alternative: Studio (http://127.0.0.1:54323) -> SQL Editor,
   paste the whole file, Run.
   Verify: `select count(*) from public.store_settings;` should return 1.

A3. ENVIRONMENT. Create `.env` in the project root. Never commit it.
   VITE_SUPABASE_URL=<API URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
   VITE_SUPABASE_PROJECT_ID=local

A4. Email confirmation is off locally, so sign-up works immediately.

--- PATH B: SUPABASE CLOUD (no Docker) ---

B1. Ask the user, in French, for TWO values from their free Supabase project
   (supabase.com -> the project -> Project Settings -> API):
     - Project URL
     - the publishable/anon key. Tell them clearly: this key can safely go in .env.
       The service_role key must NEVER be used or shared.
   If they have no project, walk them through creating one on the free plan.

B2. Tell the user, in French, to DISABLE EMAIL CONFIRMATION and explain why:
   Authentication -> Sign In / Providers -> Email -> turn OFF "Confirm email".
   A new cloud project has it ON, which blocks account creation completely.
   Tell them plainly that they should turn it back ON later.

B3. APPLY THE SCHEMA ONCE. Dashboard -> SQL Editor -> New query. Paste the FULL contents
   of `supabase/schema.sql` and Run.
   Verify: `select count(*) from public.store_settings;` should return 1.

B4. ENVIRONMENT. Create `.env` (never commit it):
   VITE_SUPABASE_URL=<Project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
   VITE_SUPABASE_PROJECT_ID=<project ref>

--- FINISH (both paths) ---

4. START THE APP. Run `npm run dev` in the background. Confirm http://localhost:8080 loads
   and that the on-page check says the database is connected. If it does not, STOP and
   fix it. Do not report success while that check is failing.

5. RUN THE QUALITY GATE. Run `npm run check`. Report the result honestly in French.
   If any step fails, fix the cause and re-run.

6. FINAL REPORT, in clear French:
   - Ce qui fonctionne, et où
   - Les commandes du quotidien, et comment tout arrêter
   - Ce qui reste à faire à la main par le commerçant
   - Tout problème restant, avec le texte exact de l'erreur

HARD RULES:
- Never commit secrets or .env files. Never run `git commit`.
- Never modify the database except through `supabase/schema.sql`.
- The service_role key must never appear in the app, in `.env`, or in your reply.
- Do not add dependencies.
- If a step cannot be completed, STOP and explain exactly what is missing, in French,
  rather than improvising or guessing a value.
```

---

## Identifiants de livraison (Guepex)

Aucun assistant IA ne peut les générer : ils n'existent que dans votre compte Guepex.
Placez-les directement dans `.env`, jamais dans une conversation :

```
GUEPEX_API_ID=
GUEPEX_API_TOKEN=
GUEPEX_BASE_URL=https://api.guepex.app/v1/
GUEPEX_WEBHOOK_SECRET=
```

Détail dans `docs/skills/yalidine-integration/references/human-only-steps.md`.

---

## Documentation

| Fichier                | Contenu                                      |
| ---------------------- | -------------------------------------------- |
| `docs/PROJECT.md`      | État actuel et périmètre                     |
| `docs/ARCHITECTURE.md` | Architecture du système                      |
| `docs/DATABASE.md`     | Schéma, RLS, obligations légales algériennes |
| `docs/FEATURES.md`     | Fonctionnalités vérifiées uniquement         |
| `docs/DEPLOY.md`       | Mise en ligne                                |
| `docs/DECISIONS.md`    | Décisions prises et pourquoi                 |
| `docs/CHANGELOG.md`    | Ce qui a réellement changé                   |
| `AGENTS.md`            | Règles de travail dans le dépôt              |

## Contrôle qualité

```bash
npm run check
```

Doit passer avant chaque commit.

## Contribuer

Voir `CONTRIBUTING.md`. La contribution la plus utile n'est pas du code : installez le
projet, utilisez-le une semaine comme commerçant, et dites ce qui était flou.

## Licence

[AGPL-3.0-only](LICENSE). Gratuit et le restera.

---

**© 2026 Sifeddine Mebarki** — construit pour la communauté algérienne, avec des
ambitions mondiales.
