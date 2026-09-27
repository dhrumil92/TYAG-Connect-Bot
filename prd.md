# PRD — Connect Directory Bot

A Telegram bot that lets anyone send a free-text requirement (e.g. "Need a knee
surgeon in Ahmedabad") and get back matching contact details from a directory
of verified Tapovan Sanskarpith alumni businesses/professionals.

Full formal spec: `SRS_Connect_Directory_Bot.docx` (source of truth if this
file and that ever disagree).

## Why

Replaces a WhatsApp group's manual "post a requirement, wait for replies"
pattern with a searchable, instant directory — while preserving the group's
core motive: **alumni get first preference for business**, not open-market
matching.

## Core rule (do not violate)

- Bot **query access is open** — any Telegram user, member or not, can ask.
- Bot **data is closed** — returned contacts only ever come from the
  registered alumni directory (Google Sheet). Never any external source.

## Functional Requirements

- **FR-1** Accept free-text query from any Telegram user, no auth.
- **FR-2** LLM extracts `{category, tags, location}` from the query.
- **FR-3** Search Directory Sheet using those fields.
- **FR-4** Match found → reply directly with full contact details (name,
  phone, business, full address with clickable Google Maps link). No confirmation step, no DM to the matched
  member first.
- **FR-5** No match → reply exactly:
  `"Data not found. Please put the same query in the WhatsApp group."`
- **FR-6** New directory entries come **only** from the Registration Google
  Form — the bot has no chat-based registration flow.
- **FR-7** Every matched entry includes a **pre-filled** Google Form link
  (via Forms' pre-filled URL feature) for reporting outdated info — pre-fill
  with the entry's Name/Business so the reporter doesn't retype it.
- **FR-8** No access restriction — bot answers anyone.
- **FR-9** Directory data source is always the Sheet — never general/external
  data, regardless of who's asking.
- **FR-10** Partial match handling (category matches, location doesn't):
  - Still include the entry (never silently exclude it).
  - If entry's `Service Area` = Pan-India / covers the query region → note
    that it serves that area (not phrased as a mismatch).
  - If `Service Area` = "No, local only" and location differs → note:
    `"⚠️ Registered in <Address> — confirm before reaching out."`
- **FR-11** Analytics Logging: Every user query, parsed tags, and matched results must be appended to an "Analytics" tab in the Google Sheet for admin monitoring.

## Non-functional

- Reply within a few seconds (volume is low: ~30–40 queries/day today).
- Free-tier only: Telegram Bot API, Google Sheets API, Groq/Gemini free tier,
  GCP e2-micro (Always Free, **us-west1** — confirmed, do not deploy to a
  different region without checking free-tier eligibility).
- Admin (Dhrumil) is the only moderator — no multi-admin workflow.

## Explicitly out of scope for v1

- In-bot registration (Form only).
- DM confirmation from matched member before sharing their contact.
- Any query-side auth/restriction.
- Payments, ratings, reviews.
- Periodic re-verification pings to registrants (deferred to a possible v2).
