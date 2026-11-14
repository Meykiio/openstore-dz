import { createFileRoute } from "@tanstack/react-router";
import { handleDriveImport } from "@/lib/server/drive-route";

/** POST /api/ai-drive: Drive import for the photo upload page (owner only). */
export const Route = createFileRoute("/api/ai-drive")({
  server: {
    handlers: {
      POST: ({ request }) => handleDriveImport(request),
    },
  },
});
