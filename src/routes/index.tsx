import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { SetupCheck } from "@/components/setup-check";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="container-page relative flex min-h-dvh flex-col items-center justify-center gap-6 py-24 text-center">
      <ThemeToggle className="absolute top-5 end-5" />

      <span className="inline-flex h-12 items-center rounded-full bg-primary-glow-sm px-4 text-sm font-medium text-primary">
        OpenStore DZ
      </span>

      <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
        متجر إلكتروني مجاني للأعمال الجزائرية
      </h1>

      <p className="max-w-xl text-on-surface-muted">
        Arabic-first, cash on delivery, and installed by pasting one prompt into your AI agent.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <a href="https://github.com/Meykiio/openstore-dz#readme">Setup guide</a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="https://github.com/Meykiio/openstore-dz">Source code</a>
        </Button>
      </div>

      <SetupCheck className="mt-8" />
    </main>
  );
}
