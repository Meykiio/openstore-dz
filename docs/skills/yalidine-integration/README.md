# Yalidine (Guepex) Integration Skill

A ready-to-use **Agent Skill** that teaches any AI coding agent — Claude
(claude.ai, Claude Code, Claude Desktop), opencode, Codex, or any other
agent that reads `SKILL.md`-style instructions — exactly how to integrate
the [Yalidine](https://yalidine.com) delivery API (exposed under the brand
name **Guepex**) into a real codebase: parcel creation, tracking, delivery
fees, wilaya/commune/stop-desk lookups, and secure real-time webhooks.

Built from Yalidine's official API and webhook documentation, so the agent
isn't guessing at field names or auth flow — it has the real spec, the real
gotchas, and a clear line between what it can build for you and what only
you can do in your own dashboard.

## Why this exists

Yalidine's docs are complete but written for a human reading top to bottom,
not for an agent that needs to jump straight to "how do I create a
stop-desk parcel" mid-task. This skill restructures that same information
so an agent loads only what the current task needs, follows a sane build
order, and — critically — never has to invent a credential, a webhook URL,
or a workaround when it hits something it can't do itself.

## What's inside

```
.
├── SKILL.md                          # entry point — read by the agent first
├── references/
│   ├── api-reference.md              # every endpoint: parcels, wilayas, communes, centers, fees, histories
│   ├── webhooks-reference.md         # events, payloads, CRC validation, signature verification, retries
│   ├── human-only-steps.md           # dashboard actions only the account owner can do
│   └── troubleshooting.md            # common errors mapped to real causes and fixes
├── scripts/
│   ├── yalidine-client.ts            # typed, dependency-free API client (fetch-based)
│   └── webhook-handler.ts            # Supabase Edge Function webhook endpoint (CRC + HMAC verification)
├── assets/
│   └── .env.example                  # the exact env vars the integration needs
└── LICENSE
```

## Quick start

### Claude (claude.ai / Claude Desktop / Claude Code)

1. Download this repo as a `.zip`, or clone it.
2. In Claude, go to skill/capability settings and add a skill from a local
   folder or a packaged `.skill` file — pick this repo's root folder (the
   one containing `SKILL.md`).
3. Ask Claude to integrate Yalidine into your project — e.g. *"add Yalidine
   parcel creation to my checkout flow"* or *"set up a webhook to track
   delivery status."* Claude will read the skill automatically.

To package it as a single `.skill` file instead of pointing at the folder,
use Anthropic's [skill-creator packaging
script](https://github.com/anthropics/skills) or any standard zip tool —
a `.skill` file is just a zip of this folder.

### opencode / Codex / other agentic coding tools

Most agentic coding CLIs support pointing at a folder of instructions.
Point the tool at this repo (or copy `SKILL.md` + `references/` +
`scripts/` + `assets/` into your project, e.g. under `.agent-skills/` or
wherever your tool looks for custom instructions), then reference it in
your prompt, e.g.: *"Read SKILL.md in the yalidine-integration folder and
use it to add parcel tracking to this app."*

### Any other LLM / agent

`SKILL.md` and everything under `references/` are plain Markdown — paste
`SKILL.md` into your agent's system prompt or context, and let it pull in
the reference files as needed. No special tooling required.

## What you still have to do yourself

This skill is explicit about the line between "the agent can build this"
and "only you can do this in the Yalidine/Guepex dashboard" — see
[`references/human-only-steps.md`](references/human-only-steps.md) for the
full, ordered list. In short: generating your API ID/API TOKEN, creating
and enabling the webhook subscription, and copying the webhook secret key
all happen in your own dashboard. No skill, and no agent, can do that part
for you — and this one is written to say so rather than fake it.

## Security notes

- The API token is a **backend-only** secret. This skill's rules explicitly
  forbid putting it in any client-side/browser code path.
- Webhook payloads are verified with HMAC-SHA256 against the raw request
  body before being trusted — see `scripts/webhook-handler.ts`.
- No real credentials, tokens, secret keys, or account-specific URLs are
  included anywhere in this repo. Every example uses placeholder env var
  names. If you fork or extend this, keep it that way.

## Verified, not just written

Before publishing, the included scripts were compiled under TypeScript
strict mode and the webhook signature-verification logic was tested
against a reference HMAC-SHA256 implementation to confirm it matches what
Yalidine's servers compute. That said, this skill hasn't been run against
Yalidine's live API with real credentials — if you hit something that
doesn't match current behavior, please open an issue (see below).

## Disclaimer

This is an unofficial, community-maintained skill built from Yalidine's
public API and webhook documentation. It is not affiliated with, endorsed
by, or officially supported by Yalidine or Guepex. API behavior may change
over time — always cross-check against the [official
documentation](https://yalidine.com) if something seems off.

## Contributing

Found a field that's changed, an endpoint that behaves differently, or a
gap the skill doesn't cover? Issues and PRs are welcome — see
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE) — use it, fork it, adapt it for your own stack.

---

Built by [Meykiio](https://github.com/Meykiio).
