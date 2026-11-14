import type { arAccount } from "./ar.account";

/** My account: change or reset your own password (0.4.0). */
export const enAccount: Record<keyof typeof arAccount, string> = {
  "admin.nav.account": "My account",
  "account.title": "My account",
  "account.signedInAs": "Signed in as {email}",
  "account.passwordTitle": "Change password",
  "account.passwordHelp": "Enter your current password, then the new one twice.",
  "account.current": "Current password",
  "account.new": "New password",
  "account.newHint": "At least {min} characters.",
  "account.save": "Change password",
  "account.changed": "Password changed.",
  "account.tooShort": "Too short: at least {min} characters.",
  "account.samePassword": "That is already your password. Choose a different one.",
  "account.weakPassword": "Too weak. Add letters and numbers, or make it longer.",
  "account.wrongCurrent": "The current password is wrong.",
  "account.signInAgain": "For your safety: sign out, sign in again, then retry.",
  "account.tooMany": "Too many attempts. Wait a little, then try again.",
  "account.demo": "Changing the password is not available on the demo shop.",
  "account.forgotLink": "Forgot your password?",
  "account.forgotTitle": "Forgot your password",
  "account.forgotHelp": "Enter your email and we will send a link to choose a new password.",
  "account.send": "Send the link",
  "account.sent":
    "If this address has an account, the link is on its way. Check your email (and spam). The link expires soon.",
  "account.backToLogin": "Back to sign in",
  "account.resetTitle": "Choose a new password",
  "account.resetHelp": "Type the new password twice.",
  "account.linkExpired": "This link has expired or was already used.",
  "account.askAgain": "Ask for a new link",
};
