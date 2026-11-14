import { createFileRoute } from "@tanstack/react-router";
import { handleTelegram } from "@/lib/server/telegram-route";

/** POST /api/telegram: connect the owner's Telegram bot (owner only). */
export const Route = createFileRoute("/api/telegram")({
  server: {
    handlers: {
      POST: ({ request }) => handleTelegram(request),
    },
  },
});
