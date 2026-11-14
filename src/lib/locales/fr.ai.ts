import type { arAi } from "./ar.ai";

/** AI assistant strings: Admin > Integrations and the photo upload link (0.3.0). */
export const frAi: Record<keyof typeof arAi, string> = {
  "admin.nav.integrations": "Intégrations",
  "ai.int.title": "Intégrations",
  "ai.int.intro":
    "Connectez Claude à votre boutique une fois, puis demandez-lui en mots : ajouter un produit, changer un texte, confirmer une commande. Il agit avec votre compte, et vous pouvez le couper ici à tout moment.",
  "ai.int.ownerOnly": "Cette page est réservée au propriétaire de la boutique.",
  "ai.int.dbMissing":
    "La base de données n'est pas encore à jour. Exécutez supabase/schema.sql dans Supabase, puis rouvrez la page.",
  "ai.int.url": "Adresse de connexion",
  "ai.int.urlHelp": "Copiez cette adresse et collez-la dans Claude en ajoutant le connecteur.",
  "ai.int.connected": "Assistants connectés",
  "ai.int.none": "Aucun assistant connecté. Suivez les étapes ci-dessous.",
  "ai.int.connectedOn": "Connecté le {date}",
  "ai.int.lastUsed": "Dernière utilisation {date}",
  "ai.int.neverUsed": "Jamais utilisé",
  "ai.int.enabled": "Autorisé à gérer la boutique",
  "ai.int.notAllowed": "Connecté mais pas encore autorisé. Autorisez-le pour qu'il fonctionne.",
  "ai.int.allow": "Autoriser",
  "ai.int.signedOut": "N'est plus connecté. Reconnectez-le depuis Claude ou supprimez-le.",
  "ai.int.revoke": "Déconnecter",
  "ai.int.revokeConfirm": "Appuyez encore pour confirmer",
  "ai.int.revoked": "Assistant déconnecté",
  "ai.int.saved": "Enregistré",
  "ai.int.activity": "Journal d'activité",
  "ai.int.activityHelp": "Les 100 dernières actions. Mis à jour toutes les 30 secondes.",
  "ai.int.activityEmpty": "Rien pour l'instant.",
  "ai.int.all": "Tous les assistants",
  "ai.int.kind.read": "Lecture",
  "ai.int.kind.write": "Modification",
  "ai.int.kind.propose": "Demande de confirmation",
  "ai.int.kind.destructive": "Suppression ou prix",
  "ai.int.refused": "Refusé",
  "ai.int.setup": "Comment connecter",
  "ai.int.claude.title": "Claude (web, ordinateur, téléphone)",
  "ai.int.claude.1":
    "Sur claude.ai ou l'application ordinateur : Customize, puis Connectors, puis Add, puis Add custom connector.",
  "ai.int.claude.2":
    "Nom : le nom de votre boutique. Adresse : collez l'adresse de connexion ci-dessus, puis Add.",
  "ai.int.claude.3":
    "Appuyez sur Connect. Une page de votre boutique s'ouvre : connectez-vous avec le compte du propriétaire et acceptez.",
  "ai.int.claude.4":
    "Revenez sur cette page et vérifiez que l'assistant est autorisé. Il marche ensuite aussi dans l'application mobile.",
  "ai.int.code.title": "Claude Code (développeurs)",
  "ai.int.code.1": "Lancez cette commande, puis /mcp pour vous connecter :",
  "ai.int.safety":
    "Sécurité : les suppressions et changements de prix demandent toujours votre accord. Les textes des clients (notes, noms, avis) peuvent contenir de faux ordres, et l'assistant est prévenu de les ignorer. N'activez pas de connecteur e-mail ou navigation web dans la même conversation.",
  "ai.upload.title": "Ajouter des photos",
  "ai.upload.for": "{product}, couleur {colour}",
  "ai.upload.keepHint":
    "Les photos sont recadrées au format 4:5 de la boutique et réduites, comme dans Produits.",
  "ai.upload.pick": "Choisir des photos",
  "ai.upload.drive": "Importer depuis Google Drive",
  "ai.upload.driveHelp": "Le fichier doit être partagé : Anyone with the link.",
  "ai.upload.driveFailed":
    "Impossible de récupérer le fichier Drive. Vérifiez le partage (Anyone with the link) et que c'est une image.",
  "ai.upload.working": "Envoi {done} sur {total}…",
  "ai.upload.done": "{count} photo(s) ajoutée(s). Revenez à Claude.",
  "ai.upload.expired": "Ce lien a expiré. Demandez-en un nouveau à Claude.",
  "ai.upload.used": "Ce lien a déjà servi. Demandez-en un nouveau à Claude.",
  "ai.upload.missing": "Ce lien n'est pas valide.",
  "ai.int.aiTitle": "Assistant IA (Claude)",
  "ai.consent.title": "Connecter un assistant IA",
  "ai.consent.body":
    "{name} veut gérer votre boutique : produits, réglages, textes et commandes. N'acceptez que si c'est vous qui avez demandé la connexion.",
  "ai.consent.returnsTo": "Retour vers : {host}",
  "ai.consent.approve": "Accepter et connecter",
  "ai.consent.deny": "Refuser",
  "ai.consent.unnamed": "Assistant sans nom",
  "ai.consent.signInFirst": "Connectez-vous avec le compte du propriétaire pour continuer.",
  "ai.consent.ownerOnly": "Seul le propriétaire de la boutique peut connecter un assistant IA.",
  "ai.consent.missing": "Le lien de connexion est incomplet. Revenez à l'assistant et recommencez.",
  "ai.consent.error": "La connexion n'a pas abouti. Revenez à l'assistant et réessayez.",
};
