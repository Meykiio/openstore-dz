# Updating your OpenStore shop

> **العربية**: [اقرأ هذا الدليل بالعربية](UPDATING.ar.md) · **Français**: [Lisez ce guide en français](UPDATING.fr.md)

An update has two parts: the **code** (on GitHub, published by Vercel) and the
**database** (on Supabase). Your products, orders, settings and keys are not touched.
About five minutes, no computer setup.

## Which case is yours?

- **A. You installed with the "Deploy with Vercel" button.** Most shops. Follow A.
- **B. You forked the repository on GitHub** (your repository says "forked from
  Meykiio/openstore-dz" under its name). Follow B.
- **C. You or someone else changed the code.** Follow C, or you will lose those changes.

## A. Installed with the Vercel button

**The first time only, add the update button to your repository:**

1. Open your shop's repository on github.com.
2. Click **Add file**, then **Create new file**.
3. In the name box, type exactly: `.github/workflows/update-openstore.yml`
4. Open [this file](https://raw.githubusercontent.com/Meykiio/openstore-dz/main/.github/workflows/update-openstore.yml),
   select everything (Ctrl+A), copy, and paste it into the big box.
5. Click **Commit changes**, then **Commit changes** again.

**Every update:**

1. In your repository, open the **Actions** tab. If GitHub asks, click **I understand my
   workflows, go ahead and enable them**.
2. Click **Update OpenStore** on the left, then **Run workflow**, then the green
   **Run workflow** button.
3. Wait for the green tick (about a minute). Vercel then publishes the new version in
   one or two minutes.
4. Go to step **D** for the database.

Your previous code is kept on a branch named `backup/before-update-...`. If Vercel does
not start a new deployment by itself, open your project on vercel.com, then
**Deployments**, **Create Deployment**, type `main`, and confirm. (Not **Redeploy**: that
rebuilds the old version.)

## B. Forked on GitHub

1. Open your repository on github.com.
2. Click **Sync fork**, then **Update branch**. Vercel publishes the new version.
3. Go to step **D**.

## C. You changed the code

The button above replaces the code, so your changes would only survive on the backup
branch. Ask an AI assistant (Claude Code, Cursor, and others) to merge the update for
you instead. Paste this prompt:

```text
My shop runs on OpenStore DZ (https://github.com/Meykiio/openstore-dz) and I changed
its code. Update my repository to the latest OpenStore release while keeping my changes:
add the original as a remote named upstream, fetch its latest release tag, merge it
into a new branch, resolve every conflict by keeping both my change and the new
behaviour where possible, run `npm run check` until it passes, and show me what changed
before you push. Do not touch my .env or my Supabase keys. Then tell me to update my
database by running supabase/schema.sql in the Supabase SQL Editor.
```

## D. Update the database

1. Open your shop's dashboard (`/admin`). If it says **Your database needs an update**,
   click **Copy the update script**, then **Open your Supabase SQL Editor**.
   (No message? Copy [`supabase/schema.sql`](supabase/schema.sql) from this page instead.)
2. Paste into the SQL Editor and click **Run**.
3. If a window says **Potential issues detected**, click **Run without RLS**. The script
   turns security on for every table itself; the warning is about a variable inside a
   function, not a table.
4. Wait for **Success. No rows returned**, then refresh your dashboard. The message is gone.

The script is safe to run again. It keeps your products, orders, customers and
settings. It re-applies the shop's rules (functions, security policies, the photo
storage limits) and adds what is new, such as delivery prices for the 2026 wilayas.
Demo products are only created in a shop that nobody has claimed yet.

## What is new

See the [changelog](docs/CHANGELOG.md). Your dashboard tells you when a new version is out.
