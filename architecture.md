# Architecture — Connect Directory Bot

## Components

```
Telegram User
    ↕ (message / reply)
Telegram Bot API
    ↕ (webhook or long-polling)
Node.js Bot Backend  ← runs on GCP e2-micro VM (us-west1), under pm2
    ↕ raw text            ↕ search query
LLM API (Groq/Gemini)   Google Sheets API
    ↓ parsed JSON            ↕
                     Directory Google Sheet (Data Tab & Analytics Tab)
                          ↑                    ↑
              Registration Google Form   Admin manually updates
              (auto-appends new rows)    Status after reviewing
                                          Outdated-Info Form reports
```

## Modules (build these as separate, testable units)

| Module | Responsibility |
|---|---|
| **Telegram Listener** | Receive incoming messages (webhook/long-poll), pass raw text to Query Handler. |
| **Query Handler** | Orchestrator: calls LLM Parser → Directory Search → applies FR-10 logic → Reply Formatter. |
| **LLM Parser** | Sends raw text to LLM API with a fixed extraction prompt. Returns `{category, tags, location}`. |
| **Directory Search** | Reads Sheet via Sheets API, filters `Status = Active` (optional), smart-matches category/tags/location. |
| **Reply Formatter** | Builds the outgoing Telegram message: contact details + Google Maps link + per-entry report link. |
| **Report Link Builder** | Builds the pre-filled Google Form URL per matched entry (`?entry.XXXX=value` pattern). |
| **Analytics Logger** | Appends user queries and search results to the "Analytics" tab in the Google Sheet. |

## Directory Sheet schema

| Column | Source | Notes |
|---|---|---|
| Timestamp | Auto (Form) | |
| Name | Form Q1 | |
| Phone Number | Form Q2 | |
| Category | Form Q3 | Fixed dropdown — primary filter |
| Sub-category / Tags | Form Q4 | Freeform comma-separated — matching keywords |
| Business Name | Form Q5 | Optional |
| Address | Form Q6 | Full address of the business |
| Google Maps Link | Form Q6.5 | Valid https://maps.app.goo.gl link (makes address clickable) |
| Service Area | Form Q7 | `No, local only` / `Yes, nearby region` / `Yes, Pan-India` — drives FR-10 |
| Notes | Form Q8 | Optional |
| Consent | Form Q9 | Always "Yes" (required on Form) |
| **Status** | Admin-managed | `Active` / `Reported Outdated` |
| **Last Updated** | Admin-managed | Date admin last verified the row |

Registration Form category dropdown (Q3): Medical & Healthcare, Legal,
CA/Finance & Accounting, Education & Tutoring, Interior Design/Architecture,
Printing & Stationery, Event Management, Real Estate, Retail/Trading, Food &
Catering, Transport/Logistics, Home Services, IT/Technology, Other.

## Query handling flow

1. User sends free-text requirement.
2. LLM parses → `{category, tags, location}`.
3. Search Sheet, `Status = Active` only.
4. **No category/tag match at all** → reply fixed "Data not found..." message
   (FR-5). Stop.
5. **Match found** → for each matched row, check location:
   - Exact/region match, or `Service Area` covers it → include as full match.
   - `Service Area = local only` and location differs → include with the
     FR-10 warning note.
6. Reply with all included entries, each with a pre-filled report-issue link.

## Deployment

- Node.js process on the existing GCP Compute Engine **e2-micro** VM,
  **us-west1** (confirmed within Always Free tier — do not redeploy to a
  different region without re-checking eligibility).
- Process manager: **pm2**, configured to auto-restart on crash and on VM
  reboot (pm2 startup script).
- Secrets (Telegram bot token, LLM API key, Google service account
  credentials) go in a `.env` file — **never commit this to git**.
- Logs written locally on the VM (30GB storage is far more than enough).

## Why these choices (context, not requirements)

- Telegram instead of WhatsApp: no official WhatsApp bot API exists for
  personal/group use.
- Groq/Gemini instead of OpenAI: free tier fits this project's low volume
  (~30-40 queries/day); cost was the deciding factor, not model quality.
- VM instead of serverless (e.g. Cloud Run): admin already has free-tier VM
  access and is more familiar with a persistent-server model; serverless
  would need a webhook rewrite for marginal benefit at this volume.
