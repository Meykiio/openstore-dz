import { readFile, readdir } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.mjs";

/**
 * Uploads the staged images to the `product-media` bucket.
 *
 * Runs with the service role, because the bucket only accepts writes from an
 * admin and this is a one-off seed rather than something a signed-in owner does.
 * That means the key never reaches the browser, which is the point.
 *
 * Paths are `catalogue/<slug>/<colour>/<nn>.webp`, and they are derived from the
 * staging tree so the upload and the seed cannot drift apart.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const STAGING = join(HERE, "staging");
const BUCKET = "product-media";
const PREFIX = "catalogue";
const WORKERS = 6;

async function listStaged() {
  const out = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".webp")) out.push(full);
    }
  };
  await walk(STAGING);
  return out.sort();
}

function objectPath(file) {
  return `${PREFIX}/${relative(STAGING, file).split("\\").join("/")}`;
}

async function uploadOne(supabase, file, state) {
  const path = objectPath(file);
  const body = await readFile(file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`${path}: ${error.message}`);
  state.done += 1;
  if (state.done % 25 === 0 || state.done === state.total) {
    console.log(`  ${state.done}/${state.total}`);
  }
}

async function worker(queue, supabase, state) {
  while (queue.length > 0) {
    const file = queue.shift();
    await uploadOne(supabase, file, state);
  }
}

async function main() {
  const env = await requireEnv(["VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const url = env.VITE_SUPABASE_URL.replace(/\/$/, "");
  const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const files = await listStaged();
  console.log(`  ${files.length} images to upload\n`);

  const state = { done: 0, total: files.length };
  const queue = [...files];
  await Promise.all(Array.from({ length: WORKERS }, () => worker(queue, supabase, state)));

  const sample = `${url}/storage/v1/object/public/${BUCKET}/${objectPath(files[0])}`;
  console.log(`\n  uploaded ${state.done} images`);
  console.log(`  sample url: ${sample}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
