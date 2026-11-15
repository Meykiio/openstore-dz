import type { TranslationKey } from "./i18n";
import { getSupabase } from "./supabase/client";

/**
 * Changing and resetting an admin's own password (0.4.0).
 *
 * Supabase Auth does the work (`auth.updateUser`). This file only checks the
 * form before anything is sent, and turns Supabase's error codes into words the
 * owner can act on.
 */

/** Same floor as the setup screen. Supabase may be set to ask for more. */
export const MIN_PASSWORD = 8;

/** What is wrong with the new password as typed, or null when it can be sent. */
export function passwordProblem(next: string, confirm: string): TranslationKey | null {
  if (next.length < MIN_PASSWORD) return "account.tooShort";
  if (next !== confirm) return "setup.passMismatch";
  return null;
}

type AuthFailure = { code?: string; message: string };

/** A Supabase Auth error, as a translation key when we know it. */
export function explainPasswordError(error: AuthFailure): TranslationKey | null {
  switch (error.code) {
    case "same_password":
      return "account.samePassword";
    case "weak_password":
      return "account.weakPassword";
    case "invalid_credentials":
      return "account.wrongCurrent";
    case "reauthentication_needed":
    case "reauthentication_not_valid":
    case "session_expired":
    case "session_not_found":
      return "account.signInAgain";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "account.tooMany";
    default:
      // Older Auth servers say it in words only.
      return /current password/i.test(error.message) ? "account.wrongCurrent" : null;
  }
}

/**
 * Set a new password. `current` is required when signed in normally, so a
 * session left open on someone's phone cannot be used to lock the owner out.
 * A password-reset link signs in for this one purpose and has no current one.
 */
export async function setPassword(next: string, current?: string): Promise<AuthFailure | null> {
  const { error } = await getSupabase().auth.updateUser(
    current === undefined ? { password: next } : { password: next, current_password: current },
  );
  return error ? { code: error.code, message: error.message } : null;
}

/**
 * Email a password-reset link. The link signs the admin in and lands on
 * /reset-password, which must be listed in Supabase > Authentication > URL
 * Configuration > Redirect URLs. Supabase never says whether the address has
 * an account (no user enumeration), so neither does the page.
 */
export async function sendResetLink(email: string): Promise<AuthFailure | null> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return error ? { code: error.code, message: error.message } : null;
}

/** An expired or used link comes back as `#error=...&error_code=otp_expired`. */
export function linkError(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("error_code") ?? params.get("error");
}

/**
 * Whether this signed-in admin may set a new password here. On the public demo
 * the shared staff account's password is published, so only the owner may; on
 * a real shop everyone may. Every page that sets a password asks this, so a
 * direct visit to /reset-password cannot get round My account's rule.
 */
export function mayChangePassword(demo: boolean, role: string | null): boolean {
  return !demo || role === "owner";
}
