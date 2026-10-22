/**
 * Turns a label into a filesystem and URL safe slug.
 *
 * Its own module because both the image processor and the seed generator need it,
 * and the processor does work when it runs. Importing it for one small function
 * would have re-run the whole image pipeline as a side effect, which it did.
 */
export function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
