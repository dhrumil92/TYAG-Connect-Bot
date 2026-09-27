# Phases — Connect Directory Bot

Build sequentially. Do not skip ahead — each phase has an exit criterion;
confirm it locally before starting the next. Phases 1–6 run and test on a
local machine (long-polling is fine for dev). Phase 7 moves the bot to the
GCP VM for 24/7 operation.

## Tech stack (locked in — do not substitute without asking)

- Runtime: Node.js
- Telegram: Telegraf
- Sheets: `googleapis` (Sheets API v4)
- LLM: Groq API or Google Gemini API (free tier)
- Process manager: pm2
- Hosting: GCP Compute Engine e2-micro, us-west1
- Secrets: `.env` via `dotenv` — never committed

## Phase 0 — Setup (manual, human does this — see "Your To-Do List")

Telegram bot token, Registration Form, Outdated-Info Form, Directory Sheet
(schema in `architecture.md`), Google service account, LLM API key, GCP VM
access all need to exist before Phase 2 onward can be tested for real.
Phase 1 can be built before all of these exist.

**Exit:** All credentials obtained; Sheet has correct columns; bot responds
to a basic BotFather test.

## Phase 1 — Telegram Bot Skeleton

Initialize Node.js project. Install Telegraf. Implement a listener that
echoes back whatever text it receives. This is the **Telegram Listener**
module.

**Exit:** Bot runs locally, echoes any message sent to it on Telegram.

## Phase 2 — Sheets Integration (read-only)

Install `googleapis`, authenticate with the service account. Implement a
function to read all rows from the Directory Sheet. This is the read side of
the **Directory Search** module.

**Exit:** On a test command, bot logs/prints all current directory rows
correctly.

## Phase 3 — LLM Query Parsing

Integrate the LLM API. Write and iterate the extraction prompt so free text
becomes `{category, tags, location}` JSON. This is the **LLM Parser** module.

**Exit:** For 8–10 varied sample queries, parser reliably returns correct
structured JSON.

## Phase 4 — Matching Logic + FR-10

Implement "Smart Length Rule" matching against Category/Tags (strict word boundary for short tags, flexible substring for long tags). Implement the Location/Service Area branching exactly as described in `prd.md`'s FR-10. This completes the **Directory Search** and **Query Handler** modules.

**Exit:** Against a small test dataset, correct entries returned for exact matches, wider-service-area matches, and true no-matches without accidentally matching subsets (like 'CA' inside 'Medical').

## Phase 5 — Reply Formatting + Analytics + Report Links

Format the outgoing Telegram message per FR-4 (full contact details + clickable Google Maps link) and FR-7 (pre-filled report-issue link per entry). Implement the **Analytics Logger** to append user queries to the Google Sheet. This completes the **Reply Formatter**, **Report Link Builder**, and **Analytics Logger** modules.

**Exit:** Bot sends a complete, correctly formatted reply for both match and
no-match cases, including working pre-filled report links.

## Phase 6 — End-to-End Local Testing

Populate the Sheet with a real or realistic test dataset. Run edge cases:
empty query, category-only query, gibberish input, exact-location match,
partial-location match, no match at all.

**Exit:** All of FR-1 through FR-10 verified manually against a checklist;
no crashes on malformed input.

## Phase 7 — Deployment to GCP

Set up Node.js on the e2-micro VM (us-west1). Deploy the project, configure
environment variables. Set up pm2 with a startup script so the bot survives
VM reboots.

**Exit:** Bot live 24/7 via Telegram, independent of any developer machine;
verified to survive a VM restart.

## Phase 8 — Soft Launch

Share the bot's Telegram username with the WhatsApp Connect Group. Monitor
logs for errors as real registrations and queries come in.

**Exit:** Bot publicly usable; first real registrations and queries flowing
in without critical errors.
