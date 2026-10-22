import { readFile, mkdir, rm, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { slugify } from "./slug.mjs";

/**
 * Turns the source photographs into web-ready product images.
 *
 * The source files are 6 to 15 MB phone photographs at 4032x3024. Shipping those
 * would be roughly 1.8 GB of storage and a miserable experience on Algerian mobile
 * data, so every image is cropped to the storefront's 4:5 portrait frame and
 * re-encoded as WebP.
 *
 * The crop is a centre crop, which is the correct default here because the source
 * photography is centred on the garment or the model. It is applied before the
 * scale so the scale is a clean downscale rather than a distortion.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, "manifest.json");
const STAGING = join(HERE, "staging");
const WIDTH = 1200;
const HEIGHT = 1500;
const QUALITY = 82;
const WORKERS = 4;

function runFfmpeg(input, output) {
  return new Promise((resolve, reject) => {
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      // Centre-crop to exactly 4:5, then downscale. See the file comment.
      "-vf",
      `crop='min(iw,ih*4/5)':'min(ih,iw*5/4)',scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      "-map_metadata",
      "-1",
      "-c:v",
      "libwebp",
      "-quality",
      String(QUALITY),
      "-compression_level",
      "5",
      output,
    ];
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code} for ${input}\n${stderr}`));
    });
  });
}

async function buildJobs() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const jobs = [];
  for (const product of manifest.products) {
    for (const entry of product.colours) {
      const folder = slugify(entry.colour ?? "single");
      entry.files.forEach((file, index) => {
        jobs.push({
          input: file.path,
          output: join(STAGING, product.slug, folder, `${String(index + 1).padStart(2, "0")}.webp`),
        });
      });
    }
  }
  return jobs;
}

async function worker(queue, state) {
  while (queue.length > 0) {
    const job = queue.shift();
    await mkdir(dirname(job.output), { recursive: true });
    await runFfmpeg(job.input, job.output);
    state.done += 1;
    if (state.done % 20 === 0 || state.done === state.total) {
      console.log(`  ${state.done}/${state.total}`);
    }
  }
}

async function main() {
  await rm(STAGING, { recursive: true, force: true });
  const jobs = await buildJobs();
  console.log(`  ${jobs.length} images to process with ${WORKERS} workers\n`);

  const state = { done: 0, total: jobs.length };
  const started = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, () => worker(jobs, state)));

  let bytes = 0;
  const walk = async (dir) => {
    const { readdir } = await import("node:fs/promises");
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else bytes += (await stat(full)).size;
    }
  };
  await walk(STAGING);

  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n  done in ${seconds}s`);
  console.log(
    `  staged ${(bytes / 1024 / 1024).toFixed(1)} MB total, avg ${(bytes / state.total / 1024).toFixed(0)} KB per image`,
  );
  console.log(`  staging: ${STAGING}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
