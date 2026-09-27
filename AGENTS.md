# AGENTS.md — Connect Directory Bot

Rules for any AI agent (Antigravity, or otherwise) working in this repo.
Read `prd.md`, `architecture.md`, and `phases.md` first — they're the source
of truth for *what* to build. This file is about *how* to build it.

## Build order

Follow `phases.md` in order. Don't jump ahead to Phase 4 logic before Phase
1–3 are working and confirmed. If a phase's exit criterion isn't met, stay
on that phase.

## Non-negotiable behaviors (from the PRD — do not "improve" these)

- No-match reply text is **exact**: `"Data not found. Please put the same
  query in the WhatsApp group."` Don't rephrase it.
- Never DM a matched member for confirmation before sharing their contact —
  FR-4 says reply directly, always.
- Never accept new directory registrations through the bot itself — FR-6,
  Form-only.
- Never exclude a category/tag match just because location differs — FR-10,
  always include with the appropriate note instead.
- Directory data always comes from the Sheet — never fabricate, guess, or
  pull from any other source, even if the Sheet has no match.

## Code conventions

- Language: JavaScript (Node.js), not TypeScript, unless asked to convert.
- Keep the six modules (Telegram Listener, Query Handler, LLM Parser,
  Directory Search, Reply Formatter, Report Link Builder) as separate files/
  functions — don't collapse everything into one giant handler. Makes it
  testable phase by phase.
- Secrets always via `process.env.*`, loaded through `dotenv`. Never
  hardcode a token, API key, or service account key in source.
- Add a `.env.example` (no real values) so it's obvious what variables are
  needed, but never commit the real `.env`.
- Prefer small, working increments over one large commit — one module per
  phase, testable in isolation before moving on.

## Things to ask the human about, don't assume

- Exact wording for the FR-10 location-mismatch note (a placeholder exists
  in `prd.md` — confirm before finalizing).
- The exact LLM extraction prompt wording — iterate with the human using
  real sample queries (Phase 3).
- Anything that would change a locked-in FR, NFR, or tech-stack choice.

## Testing expectations

- Before marking a phase "done," manually exercise its exit criterion (see
  `phases.md`) — don't just assume the code compiles and runs.
- Phase 6 requires deliberately testing edge cases (empty input, gibberish,
  category-only queries) — don't skip straight to "looks fine."

## Out of scope — do not build these unless explicitly asked

- In-bot registration flow
- Payments, ratings, or reviews
- Multi-admin permissions
- Periodic re-verification pings (deferred, possible v2)
