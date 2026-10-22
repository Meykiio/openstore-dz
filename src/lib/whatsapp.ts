/**
 * WhatsApp links.
 *
 * Algerian numbers are written locally with a leading zero: `0555 12 34 56`.
 * `wa.me` requires the full international form with no plus and no leading
 * zero: `213555123456`. Feeding it the local form produces a link that looks
 * correct, opens WhatsApp, and fails to resolve the contact, which is worse than
 * an obviously broken link because nobody notices until a buyer is lost.
 *
 * An owner will type their number the local way. Normalising here means the
 * storefront does not depend on them knowing this.
 */

/**
 * Convert a phone number to the digits `wa.me` expects, or null if it cannot be
 * a usable number.
 *
 * Handles the four forms an owner or a seed actually produces:
 * `0555123456`, `555123456`, `+213 555 12 34 56`, and `213555123456`.
 */
export function waNumber(input: string | null | undefined): string | null {
  if (!input) return null;

  const digits = input.replace(/\D/g, "");
  // Shorter than a subscriber number plus a trunk zero is not a number.
  if (digits.length < 8) return null;

  if (digits.startsWith("213")) return digits;

  // Local form with the trunk zero: 0555123456 becomes 213555123456.
  if (digits.startsWith("0")) {
    const withoutTrunk = digits.slice(1);
    return withoutTrunk.length >= 8 ? `213${withoutTrunk}` : null;
  }

  // A bare Algerian subscriber number is nine digits. Anything longer that did
  // not start with 213 already carries its own country code, so leave it alone
  // rather than guessing and corrupting it.
  return digits.length === 9 ? `213${digits}` : digits;
}

/**
 * Build a `wa.me` link, or null when there is no usable number.
 *
 * Returns null rather than a link with an empty number so a caller can omit the
 * button entirely instead of rendering one that goes nowhere.
 */
export function waLink(phone: string | null | undefined, text?: string): string | null {
  const number = waNumber(phone);
  if (!number) return null;
  const query = text && text.trim() ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}
