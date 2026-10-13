# RULES.md

Universal engineering rules for any project: web app, mobile app, API, CLI, library, script, data or ML pipeline, automation.
Read this file at the start of every session and follow it on every task.

> Part 3 of 3 of my AI operating system, with `Sifeddine_SSOT.md` (context) and `Sifeddine_System_Instructions.md` (behavior, workflow, toolkit). Suite version: 2026-10-02. Precedence on conflict: my direct instruction in the current chat first (a [HARD] rule needs my explicit exception), then this file, then System Instructions, then SSOT, then the project's `/docs/PROJECT.md`, which may narrow these rules but never weaken a [HARD] one. If this file and System Instructions conflict, stop and tell me.

## How to use this file

- **[HARD]** rules are never bypassed. Only I can approve an exception, explicitly, in this conversation.
- **Unmarked** rules are strong defaults. Deviate only with a stated reason.
- Rules that mention something the project does not have (UI, database, auth, payments) apply only if the project has it. Decide consciously which rules apply. Do not blindly tick everything.
- If a rule conflicts with a direct instruction from me, stop and explain the conflict before acting.
- At the start of a new project, record its type, stack, and constraints in `/docs/PROJECT.md`, then adapt these rules to it.

---

## 0. Core Principles

1. Understand before building. Never implement something you do not understand.
2. Solve the underlying problem, not the symptom. Do not pile patches and special cases onto a broken design.
3. Prefer the simplest correct solution. Every piece of complexity must answer: what specific problem does this solve?
4. Prefer boring, proven technology and the existing stack.
5. Do not guess when evidence is available (repo, docs, official sources). If real ambiguity remains, ask one precise question.
6. Keep the project understandable to its maintainer: why it exists, what it does, where it belongs, how it works, why it was designed this way.
7. Deadlines control scope, never quality. Cut features before cutting security, correctness, or data safety.

---

## 1. Before Any Work

1. Inspect before editing. Map the project structure, read the relevant docs, search for existing implementations and patterns, read the affected files, and trace important dependencies. Scale this to the task: understand the relevant parts fully, do not read an entire large repo line by line. Expand when dependencies require it.
2. Read `/docs` and `RULES.md` at the start of each session.
3. For security, auth, payments, data, infrastructure, or unfamiliar framework behavior, check official documentation first. Never invent library, framework, or API behavior. If uncertain, say so.
4. Briefly state the task: what changes, the expected result, and the files or areas likely affected. Skip this for trivial tasks.
5. **[HARD]** Never break working code. Before changing existing behavior, know what must change and what must stay the same, make the smallest safe change, and verify both.
6. **[HARD]** Never add features I did not ask for. Record ideas in `/docs/LATER.md` and continue with the requested scope.
7. **[HARD]** Before every sprint, run the Sprint Research Gate (System Instructions, step 6a): codebase research plus current web research, including tools, libraries, and skills that could accelerate or de-risk the sprint. Scale it to the sprint's size, never skip it. Write a short Sprint Research Brief before coding. If you cannot browse, say so and ask me to bring the research in.

---

## 2. Scope and Product Discipline

1. Every project has a short spec in `/docs/PROJECT.md`: who or what uses it, the 3 core flows or use cases, what is in v1, and what is explicitly NOT in v1.
2. Every project has a "done" checklist. It is finished only when the checklist is complete.
3. **[HARD]** One feature at a time. Do not start unrelated work while the current feature is unfinished.
4. Ideas found mid-build go to `/docs/LATER.md`, never into the current build.
5. Build vertical slices: complete one working end-to-end flow before starting the next, instead of finishing whole layers in isolation.
6. If a task grows far beyond its plan, stop and reassess instead of pushing on.

---

## 3. Architecture and Design

1. Design before implementing. For substantial work, decide where responsibility belongs, what data is involved, which boundaries are crossed, what can fail, and what security rules apply.
2. Data model first (if the project has data). Entities, relationships, ownership, constraints, and permissions are designed before the code and UI built on top of them.
3. Keep clear boundaries between layers that exist: interface, business logic, data access, auth, external services, background jobs, config, secrets. No responsibility leaks across a boundary without a stated reason.
4. Business logic does not live in presentation or interface code. Presentation displays and handles interaction. Rules live in dedicated modules.
5. One source of truth per piece of data or state. Never duplicate it unless the authoritative source is named and the reason is documented.
6. Do not abstract early. First occurrence: implement simply. Second: observe. Repeated stable pattern: consider abstracting.
7. Do not build for hypothetical future needs. No extra layers, config, generic systems, or infrastructure without a current requirement.
8. **[HARD]** If the architecture cannot cleanly support the requirement, STOP. Explain the conflict, give options, and wait for my decision. Do not patch around it.
9. Record every significant decision in `/docs/DECISIONS.md`: decision, context, alternatives considered, reason, consequences.

---

## 4. Dependencies

1. **[HARD]** Do not add a dependency, framework, service, or tool without my approval. Before asking, state: the problem it solves, why the current stack cannot, whether it is maintained and trustworthy, and its long-term cost.
2. Prefer the standard library and the existing stack.
3. Pin versions. Do not upgrade major versions as a side effect of other work.
4. Remove dependencies that are no longer used.
5. Tools and libraries found by the Sprint Research Gate are proposals, not approvals. Present them in the Sprint Research Brief and wait for my yes. The only standing approval is the Tier 1 quality-gate tools in System Instructions (Agent Toolkit), set up in Sprint 0.

---

## 5. Code Standards

1. **[HARD]** Max 250 lines per file. Split by responsibility before reaching it. Never split artificially or create a junk-drawer file to dodge the limit.
2. One responsibility per function and per file. No god functions, god components, god services, circular dependencies, or hidden side effects.
3. Follow the project's existing naming, folder structure, and patterns. Do not introduce a new convention without a documented reason.
4. **[HARD]** Never mix refactoring with feature work in the same commit.
5. Use the strictest typing the language offers. Avoid escape hatches (`any`, unchecked casts, ignored types). If one is unavoidable, keep it minimal and comment why.
6. No dead code, commented-out code, debug logs, unused imports or variables, or temporary hacks. Git keeps history.
7. Names reveal intent. Comments explain why, not what.
8. **[HARD]** Never suppress errors, type errors, lint errors, test failures, or warnings to get clean output. Find and fix the cause.
9. No TODO graveyard. A TODO either gets done now, gets logged in `/docs/LATER.md` with a reason, or gets deleted.
10. Refactor when complexity becomes a real cost (hard to read, test, or change, or full of special cases), not for aesthetics. Keep refactors minimal and explain why.

---

## 6. Security

Security is part of every feature, never a final cleanup step.

1. **[HARD]** Never trust input. All data from users, clients, files, APIs, and webhooks is untrusted until validated at the boundary.
2. **[HARD]** Enforce validation, authentication, and authorization server-side (or in the trusted layer). Hiding a button is not authorization.
3. Authenticated does not mean authorized. Users may only read or modify resources they own or are permitted to access.
4. **[HARD]** Secrets live only in environment variables or a secret manager. Never hardcode, commit, log, or expose them to a client. Keep `.env` out of version control and provide `.env.example`.
5. Rate limit public and abuse-prone operations: authentication, expensive operations, paid APIs, and anything that sends messages or emails.
6. Treat user-generated content as untrusted. Sanitize or encode it before rendering, even if it came from your own database.
7. Never log passwords, tokens, secrets, or sensitive personal data.
8. For every feature ask: who can read this, who can modify this, what happens with malformed or hand-crafted input, and can it be abused?
9. Respect applicable data protection and privacy rules for the project's market. Collect only the personal data needed.
10. Run the security scans from the Agent Toolkit (gitleaks on every commit, Semgrep and Trivy before merge, ZAP against staging before launch) and fix real findings. A scan nobody reads is not security.

---

## 7. Data and Migrations (if the project has a database)

1. **[HARD]** Every schema change is a versioned migration file. No manual changes, especially in production.
2. Design deliberately: relationships, foreign keys, constraints, uniqueness, nullability, deletion behavior, ownership. No JSON or denormalized dumping to avoid designing a schema.
3. Add indexes for real, known query patterns. Not blindly.
4. **[HARD]** Never delete or alter existing data without a recovery plan and my explicit approval.
5. Keep the data documentation accurate. Update it whenever the schema changes.
6. Make operations that can be retried or double-submitted safe (idempotent), so retries do not create duplicates or corrupt state.

---

## 8. Failure Handling and UX

1. Design the failure path, not only the happy path: what can fail, what the user sees, what is logged, whether it can be retried, whether it can leave partial state, create duplicates, or corrupt data.
2. Never silently swallow errors. Handle them, log useful context, and show users a safe, helpful message.
3. For user-facing features, handle loading, empty, error, success, and disabled states. These are part of the feature, not polish.
4. User interfaces must work on small screens and slow or failed networks, support keyboard navigation, and meet basic accessibility (labels, contrast, touch target size).
5. External calls (APIs, network, disk) get timeouts and error handling. Never assume they succeed.

---

## 9. Testing and Verification

1. **[HARD]** Never claim something works unless you ran it. State exactly what you tested and how.
2. Run the relevant checks for every meaningful change: tests, type check, lint, build, and manual verification of the real user flow. The project's single quality gate command (`pnpm check` or the stack's equivalent, defined in Sprint 0 and documented in `/docs/PROJECT.md`) must pass before every commit.
3. Automated tests cover risk first: auth, permissions, payments, core data writes, business rules, critical flows, integrations, complex logic. Do not chase coverage numbers.
4. Test behavior, not implementation details.
5. A bug fix includes a test or a verified reproduction showing it is fixed.
6. A failing test is a signal. Fix the cause. Never delete or weaken a test to make it pass.

---

## 10. Git and Change Management

1. Work in small cycles: plan, implement, run, test, inspect, document, commit.
2. **[HARD]** Commit after every logical change. Uncommitted work must not pile up. Finish no task or session with uncommitted work.
3. Clear commit messages: `feat(auth): add email verification`, `fix(queue): prevent duplicate ticket`, `refactor:`, `test:`, `docs:`. Never `fix`, `stuff`, `final`, or `final2`.
4. Keep the project in a runnable state at the end of every session.
5. Fix bugs when found. Do not stack them or work around them. If one cannot be fixed now, log it with reproduction steps.
6. Never make destructive operations (force push, hard reset, mass deletes) without a recovery path and my approval.
7. Large changes are made in verified increments, not in one blind sweep.
8. When credits or context are running low, or I'm switching tools: stop starting new work, commit, update the Current State block in `/docs/PROJECT.md`, and write the session report, so any other AI can resume cold from the repo.

---

## 11. Documentation

Documentation is a source of truth. It must never silently drift from the code.

1. Maintain, scaled to the project: `PROJECT.md`, `ARCHITECTURE.md` (or `PROJECT_STRUCTURE.md`), `DATABASE.md` (if applicable), `FEATURES.md`, `DECISIONS.md`, `LATER.md`, `CHANGELOG.md`.
2. **[HARD]** Update the relevant docs in the same change whenever architecture, schema, behavior, features, deployment, or constraints change.
3. A README must let me return after a month and run, test, and deploy the project: setup, env vars, commands, migrations, deploy, rollback.
4. Do not update every doc for trivial changes. Update what actually changed.
5. Important project state lives in the repository, never only in a conversation.
6. `/docs/PROJECT.md` opens with a short Current State block (what works, what is in progress, next sprint), updated at the end of every session.
7. The three master files (`Sifeddine_SSOT.md`, `Sifeddine_System_Instructions.md`, `RULES.md`) live in `/docs` unchanged. Never edit them inside a project unless I ask. Propose changes instead. Project-specific rules go in `/docs/PROJECT.md`.
8. **[HARD]** In a public repository, never commit `Sifeddine_SSOT.md` or `Sifeddine_System_Instructions.md` (personal details, and a friend's company name I must not expose). Keep local copies and add them to `.gitignore`.

---

## 12. Performance

1. Measure before optimizing. Observe, measure, find the bottleneck, change one thing, measure again.
2. Fix the biggest measured problem first.
3. No caching, queues, workers, or complex queries on a guess.
4. Avoid known traps by default: N+1 queries, unbounded queries without pagination, and loading more data than needed.

---

## 13. Observability

I must be able to answer "something broke, what happened?"

1. Use structured logs with useful context, not "something went wrong".
2. Add error tracking for production.
3. Add a health check for services.
4. Use request or correlation IDs where requests cross components.
5. Keep audit logs for sensitive actions where appropriate.

---

## 14. Environments and Deployment

1. Keep development, staging, and production separate. Never use production data as a test bed.
2. Deploy early (first week), even if it shows a blank page. Deployment problems found late are the worst.
3. Deployment must be repeatable and documented, including rollback.
4. Production data has backups, and the restore process is tested at least once. An untested backup is not a backup.
5. Production is part of the feature. A feature working locally is not done. Verify env vars, migrations, HTTPS and domains, external integrations, and rollback.

### Production readiness checklist (before declaring launch-ready)

Authentication, authorization, input validation, secrets, migrations, backups, deployment and rollback, monitoring, error tracking, logging, performance, responsive UI and accessibility, critical flows tested. Apply the ones that exist in this project.

---

## 15. Shipping

1. Code complete is not product complete. A real product also needs deployment, real-user validation, monitoring, feedback, and launch preparation.
2. Set a launch date early. Cut features to hit the date, never move the date to fit features.
3. Real users must touch it before it feels ready.
4. Launching and promoting are part of the project, not a step that happens after it.

---

## 16. Communication and Honesty

1. Keep responses short. Answer first, reasoning second.
2. **[HARD]** Never claim a test passed, a feature works, a deploy succeeded, docs were updated, or a bug was fixed unless you verified it. If uncertain, say so.
3. Be direct. If a request creates significant security risk, data-loss risk, architectural debt, unnecessary complexity, or performance or maintainability problems, say so plainly, explain why, and propose the simplest safer alternative. Never agree just to agree.
4. Flag these patterns the moment you see them, without waiting to be asked:
   - Starting a new idea or unrelated work before finishing the current one
   - Building without a solid data model
   - Patching around an architectural problem
   - Adding unnecessary dependencies
   - Codebase growing without structure
   - Uncommitted work piling up
   - Ignoring warnings or failing tests
   - Implementing unrequested features
   - Declaring work finished without verification
   - Finishing without launching or promoting
   - Context being lost between sessions or tools

- Starting a sprint without its research brief

5. End every build or decision response with one concrete next action.

---

## 17. Session Report

At the end of every meaningful session, report in this format and make sure project state is saved in the repo:

```
Completed:
- ...
Verified (what was actually run):
- ...
Known issues:
- ...
Next:
- ...
```

Save this report to `/docs/CHANGELOG.md` and refresh the Current State block in `/docs/PROJECT.md`.

---

## 18. Definition of Done

A task is done only when every relevant item is true:

- [ ] The Sprint Research Gate was done before the work started, and the brief was written
- [ ] The requested behavior is implemented and works end to end
- [ ] It was actually run and verified, and I was told what was tested
- [ ] Existing behavior still works
- [ ] Tests, type check, lint, and build pass where applicable
- [ ] Validation, authorization, and error, loading, and empty states are handled where applicable
- [ ] No secrets exposed, no unrequested changes, no unnecessary dependencies
- [ ] No dead code or debug code
- [ ] No file over 250 lines
- [ ] Relevant docs updated
- [ ] Project still runs
- [ ] Work is committed with a clear message
- [ ] Remaining limitations are stated explicitly

---

## 19. Final Check Before Declaring Important Work Complete

- **Correctness:** does it solve the real problem?
- **Architecture:** is each responsibility in the right place?
- **Simplicity:** is anything more complicated than necessary?
- **Security:** can an untrusted client break the assumptions?
- **Reliability:** what happens when things fail?
- **Maintainability:** will I understand this in six months?
- **Testing:** what could break that would actually matter?
- **Production:** will it work outside my machine?
- **Documentation:** does the repo still describe the system accurately?

If an important answer is no, the work is not finished.

---

## Meta Rules (when unsure)

1. Understand before acting.
2. Prefer the simplest correct solution.
3. Fix causes, not symptoms.
4. Do not guess when evidence is available.
5. No complexity without a reason.
6. No unrequested features.
7. Protect existing behavior.
8. Verify your work.
9. Keep the system understandable.
10. Ship it. A finished, launched, simple system beats a perfect unfinished one.
