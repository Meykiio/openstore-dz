import type { arAccount } from "./ar.account";

/** Mon compte : changer ou réinitialiser son mot de passe (0.4.0). */
export const frAccount: Record<keyof typeof arAccount, string> = {
  "admin.nav.account": "Mon compte",
  "account.title": "Mon compte",
  "account.signedInAs": "Connecté en tant que {email}",
  "account.passwordTitle": "Changer le mot de passe",
  "account.passwordHelp": "Saisissez le mot de passe actuel, puis le nouveau deux fois.",
  "account.current": "Mot de passe actuel",
  "account.new": "Nouveau mot de passe",
  "account.newHint": "Au moins {min} caractères.",
  "account.save": "Changer le mot de passe",
  "account.changed": "Mot de passe changé.",
  "account.tooShort": "Mot de passe trop court : au moins {min} caractères.",
  "account.samePassword": "C'est déjà votre mot de passe actuel. Choisissez-en un autre.",
  "account.weakPassword":
    "Mot de passe trop faible. Ajoutez des lettres et des chiffres, ou allongez-le.",
  "account.wrongCurrent": "Le mot de passe actuel est incorrect.",
  "account.signInAgain": "Par sécurité : déconnectez-vous, reconnectez-vous, puis réessayez.",
  "account.tooMany": "Trop de tentatives. Patientez un peu, puis réessayez.",
  "account.demo":
    "Le changement de mot de passe n'est pas disponible sur la boutique de démonstration.",
};
