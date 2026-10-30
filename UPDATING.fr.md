# Mettre à jour votre boutique OpenStore

> **العربية**: [اقرأ هذا الدليل بالعربية](UPDATING.ar.md) · **English**: [Read this guide in English](UPDATING.md)

Une mise à jour a deux parties : le **code** (sur GitHub, publié par Vercel) et la
**base de données** (sur Supabase). Vos produits, commandes, réglages et clés ne
changent pas. Environ cinq minutes, rien à installer sur votre ordinateur.

## Quel est votre cas ?

- **A. Vous avez installé avec le bouton « Deploy with Vercel ».** La plupart des
  boutiques. Suivez A.
- **B. Vous avez fait un fork du dépôt sur GitHub** (votre dépôt affiche « forked from
  Meykiio/openstore-dz » sous son nom). Suivez B.
- **C. Vous ou quelqu'un d'autre avez modifié le code.** Suivez C, sinon ces
  modifications seront perdues.

## A. Installé avec le bouton Vercel

**La première fois seulement, ajoutez le bouton de mise à jour à votre dépôt :**

1. Ouvrez le dépôt de votre boutique sur github.com.
2. Cliquez sur **Add file**, puis **Create new file**.
3. Dans le champ du nom, tapez exactement : `.github/workflows/update-openstore.yml`
4. Ouvrez [ce fichier](https://raw.githubusercontent.com/Meykiio/openstore-dz/main/.github/workflows/update-openstore.yml),
   sélectionnez tout (Ctrl+A), copiez, et collez-le dans la grande zone.
5. Cliquez sur **Commit changes**, puis encore sur **Commit changes**.

**À chaque mise à jour :**

1. Dans votre dépôt, ouvrez l'onglet **Actions**. Si GitHub le demande, cliquez sur
   **I understand my workflows, go ahead and enable them**.
2. Cliquez sur **Update OpenStore** à gauche, puis **Run workflow**, puis le bouton vert
   **Run workflow**.
3. Attendez la coche verte (environ une minute). Vercel publie ensuite la nouvelle
   version en une ou deux minutes.
4. Passez à l'étape **D** pour la base de données.

Votre ancien code est conservé dans une branche nommée `backup/before-update-...`. Si
Vercel ne lance pas de déploiement tout seul, ouvrez votre projet sur vercel.com, puis
**Deployments**, le menu **...** du plus récent, et **Redeploy**.

## B. Fork sur GitHub

1. Ouvrez votre dépôt sur github.com.
2. Cliquez sur **Sync fork**, puis **Update branch**. Vercel publie la nouvelle version.
3. Passez à l'étape **D**.

## C. Vous avez modifié le code

Le bouton ci-dessus remplace le code : vos modifications ne resteraient que dans la
branche de sauvegarde. Demandez plutôt à un assistant IA (Claude Code, Cursor, etc.) de
fusionner la mise à jour. Collez ce message :

```text
My shop runs on OpenStore DZ (https://github.com/Meykiio/openstore-dz) and I changed
its code. Update my repository to the latest OpenStore release while keeping my changes:
add the original as a remote named upstream, fetch its latest release tag, merge it
into a new branch, resolve every conflict by keeping both my change and the new
behaviour where possible, run `npm run check` until it passes, and show me what changed
before you push. Do not touch my .env or my Supabase keys. Then tell me to update my
database by running supabase/schema.sql in the Supabase SQL Editor.
```

## D. Mettre à jour la base de données

1. Ouvrez le tableau de bord de votre boutique (`/admin`). S'il affiche **Votre base de
   données doit être mise à jour**, cliquez sur **Copier le script de mise à jour**, puis
   **Ouvrir l'éditeur SQL de Supabase**.
   (Pas de message ? Copiez [`supabase/schema.sql`](supabase/schema.sql) depuis cette page.)
2. Collez dans l'éditeur SQL et cliquez sur **Run**.
3. Si une fenêtre affiche **Potential issues detected**, cliquez sur **Run without RLS**.
   Le script active lui-même la sécurité sur chaque table ; l'avertissement concerne une
   variable dans une fonction, pas une table.
4. Attendez **Success. No rows returned**, puis actualisez le tableau de bord. Le
   message disparaît.

Relancer le script ne pose aucun problème : il n'ajoute que ce qui manque.

## Nouveautés

Voir le [journal des modifications](docs/CHANGELOG.md). Votre tableau de bord vous
prévient quand une nouvelle version sort.
