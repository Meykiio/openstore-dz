import { readdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { PRODUCTS } from "./products.mjs";

/**
 * Chooses which source photographs become product images, and in what order.
 *
 * The source folders are named by colour and hold a mix of flat lays and worn
 * shots. The single most important decision here is which one leads, because the
 * first image is the one on the catalogue card.
 *
 * In this photography the worn shots are portrait and the flat lays are landscape,
 * and that holds across every product. So candidates are ordered portrait first
 * and the flat lays only fill the remaining slots. Ordering by filename instead
 * put a crumpled garment on the floor at the top of almost every card, which is
 * what the first attempt did.
 *
 * The manifest records the dimensions so the decision is auditable rather than
 * implied.
 */
const SOURCE = "C:/Users/DELL/Desktop/Sifeddine/aura-wear/Products";
const OUT = new URL("./manifest.json", import.meta.url);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png"]);
const PER_COLOUR = 4;

/**
 * Directories to search for one colour, most preferred first.
 *
 * The layouts differ on disk, so this is a switch rather than a clever path guess.
 */
function dirsFor(product, colour) {
  switch (product.layout) {
    case "flat":
      return [colour];
    case "modelFirst":
      return [`${product.modelDir}/${colour}`, `${product.flatDir}/${colour}`];
    case "suffix":
      return [`${colour}${product.suffix}`];
    case "single":
      return product.dirs;
    default:
      throw new Error(`unknown layout ${product.layout} for ${product.slug}`);
  }
}

/** Numeric-aware so IMG_999 sorts before IMG_1000. */
function byFilename(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function probe(file) {
  return new Promise((resolve) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      file,
    ]);
    let out = "";
    child.stdout.on("data", (c) => {
      out += c.toString();
    });
    child.on("error", () => resolve({ width: 0, height: 0 }));
    child.on("close", () => {
      const [w, h] = out.trim().split(",").map(Number);
      resolve({ width: w || 0, height: h || 0 });
    });
  });
}

async function listImages(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter(
        (e) => e.isFile() && IMAGE_EXT.has(e.name.slice(e.name.lastIndexOf(".")).toLowerCase()),
      )
      .map((e) => e.name)
      .sort(byFilename);
  } catch {
    return [];
  }
}

/**
 * Fraction of the frame that is bare skin.
 *
 * This is how a worn shot is told apart from a garment lying on a floor, and it
 * matters because the worn shot has to lead the gallery. Orientation does not
 * work: every polo photograph is portrait, flat lays included. Filename order
 * does not work either, because the two orders differ per product.
 *
 * A person contains skin and a concrete floor does not, so the frame is reduced
 * to 64x80 and each pixel tested against the standard skin rule. The threshold is
 * low because the model is often a small part of a full-body shot.
 *
 * Garment colours that resemble skin, such as beige and salmon, are the risk. The
 * rule requires red to dominate both green and blue by a margin, which a neutral
 * beige fails.
 */
const SKIN_MIN = 0.015;
/**
 * Upper bound, and it is doing real work.
 *
 * A salmon or pink garment is itself skin coloured, so a flat lay of one fills
 * the frame with skin-like pixels and scores around 0.5, higher than the 0.4 a
 * photograph of a person scores. Without a ceiling those products lead with a
 * flat lay on the floor. A frame that is more than about 40 percent skin-like is
 * a garment, not a person.
 */
const SKIN_MAX = 0.42;

/**
 * The colour sets the skin rule gets wrong, pinned to an exact file.
 *
 * Three garments are close enough to skin tone that the rule cannot separate the
 * worn shot from the flat lay: maroon caramel and fuchsia score their floor flat
 * lay highest, and the salmon t-shirt has no front-on worn shot at all, only a
 * clean hanger shot and a back view. Those three are named here rather than
 * loosening the rule, because loosening it would break the colours it does get
 * right. Each entry was chosen by looking at the four candidates.
 */
const HERO_OVERRIDE = {
  "polo-demi-manches/Marron Caramel": "IMG_6424.png",
  "polo-demi-manches/Rose Fuchsia": "IMG_6719.png",
  "tshirt-regular/Saumon": "DSC02594.jpg",
};

function skinFraction(file) {
  return new Promise((resolve) => {
    const child = spawn("ffmpeg", [
      "-v",
      "error",
      "-i",
      file,
      "-vf",
      "scale=64:80",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-",
    ]);
    const chunks = [];
    child.stdout.on("data", (c) => chunks.push(c));
    child.on("error", () => resolve(0));
    child.on("close", () => {
      const buf = Buffer.concat(chunks);
      let skin = 0;
      let total = 0;
      for (let i = 0; i + 2 < buf.length; i += 3) {
        const r = buf[i];
        const g = buf[i + 1];
        const b = buf[i + 2];
        total += 1;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (
          r > 95 &&
          g > 40 &&
          b > 20 &&
          max - min > 15 &&
          Math.abs(r - g) > 15 &&
          r > g &&
          r > b
        ) {
          skin += 1;
        }
      }
      resolve(total > 0 ? skin / total : 0);
    });
  });
}

async function pickFor(product, colour) {
  const picked = [];
  for (const rel of dirsFor(product, colour)) {
    if (!rel) continue;
    const dir = join(SOURCE, product.sourceDir, rel);
    const candidates = [];
    for (const name of await listImages(dir)) {
      const full = join(dir, name);
      const [dims, info, skin] = await Promise.all([probe(full), stat(full), skinFraction(full)]);
      candidates.push({ full, name, bytes: info.size, skin, ...dims });
    }
    // A plausible worn shot first, then the flat lays.
    const score = (c) => (c.skin >= SKIN_MIN && c.skin <= SKIN_MAX ? c.skin : -1);
    candidates.sort((a, b) => score(b) - score(a) || byFilename(a.name, b.name));
    for (const candidate of candidates) {
      if (picked.length >= PER_COLOUR) break;
      picked.push(candidate);
    }
    if (picked.length >= PER_COLOUR) break;
  }

  const pinned = HERO_OVERRIDE[`${product.slug}/${colour}`];
  if (pinned) {
    const at = picked.findIndex((f) => f.name === pinned);
    if (at > 0) picked.unshift(...picked.splice(at, 1));
    else if (at < 0) console.warn(`  !! hero override not among picks: ${pinned}`);
  }
  return picked;
}

async function main() {
  const manifest = { source: SOURCE, perColour: PER_COLOUR, products: [] };
  let totalFiles = 0;
  let totalBytes = 0;
  let wornHeroes = 0;
  let colourSets = 0;

  for (const product of PRODUCTS) {
    const entry = { slug: product.slug, colours: [] };
    for (const colour of product.colours) {
      const files = await pickFor(product, colour);
      if (files.length === 0) {
        console.warn(`  !! no images for ${product.slug} / ${colour ?? "single"}`);
      } else {
        colourSets += 1;
        if (files[0].skin >= SKIN_MIN && files[0].skin <= SKIN_MAX) wornHeroes += 1;
      }
      totalFiles += files.length;
      totalBytes += files.reduce((sum, f) => sum + f.bytes, 0);
      entry.colours.push({
        colour,
        files: files.map((f) => ({
          path: f.full,
          width: f.width,
          height: f.height,
          skin: Number(f.skin.toFixed(4)),
          worn: f.skin >= SKIN_MIN && f.skin <= SKIN_MAX,
        })),
      });
    }
    manifest.products.push(entry);
    const n = entry.colours.reduce((sum, c) => sum + c.files.length, 0);
    console.log(`  ${product.slug.padEnd(28)} ${entry.colours.length} colours, ${n} images`);
  }

  manifest.stats = { totalFiles, colourSets, wornHeroes };
  await writeFile(OUT, JSON.stringify(manifest, null, 2));

  console.log(
    `\n  total: ${totalFiles} images, ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB to read`,
  );
  console.log(`  hero image is a worn shot in ${wornHeroes} of ${colourSets} colour sets`);
  console.log(`  manifest: ${OUT.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
