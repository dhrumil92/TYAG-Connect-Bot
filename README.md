<div align="center">

# 🤖 TYAG Connect Directory Bot

### A production-grade Telegram bot that acts as an intelligent, searchable directory for alumni businesses and professionals.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.x-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegraf.js.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GCP](https://img.shields.io/badge/GCP-e2--micro-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Groq](https://img.shields.io/badge/LLM-Groq%20API-orange?style=for-the-badge)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**🚀 Live at: [t.me/TYAG_Connect_bot](https://t.me/TYAG_Connect_bot)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
- [Deployment](#-deployment-to-google-cloud)
- [How It Works](#-how-it-works)
- [Analytics](#-analytics)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🔍 Overview

**TYAG Connect Directory Bot** is a production-grade Telegram bot built for the **Tapovan Sanskarpith alumni community**. It replaces the traditional "post a requirement in a group and wait for replies" pattern with an **instant, intelligent directory** — searchable in natural language, including Gujarati/Hindi transliteration.

> *"Need a good surgeon in Ahmedabad"* → Bot instantly returns verified alumni doctors with their contact details, full address (clickable on Google Maps), and a link to report outdated info.

The core principle: **alumni get first preference for business.** The bot only returns contacts from the verified alumni directory — never from any external or public source.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **AI-Powered Query Parsing** | Uses Groq LLM to extract structured search intent from messy, real-world free-text queries — including spelling mistakes and Hindi/Gujarati transliteration |
| 🔍 **Smart Matching** | "Smart Length Rule" — strict word-boundary matching for short abbreviations (e.g. `CA`, `IT`), flexible substring matching for longer terms (e.g. `printer` matches `printers`) |
| 📍 **Clickable Maps** | If a Google Maps link is stored for an entry, the address in the reply becomes a one-tap link directly to the location |
| 📞 **Auto-Linked Phone Numbers** | Phone numbers are normalized to `+91XXXXXXXXXX` format so Telegram's native client auto-detects and links them for direct calling |
| 📝 **Pre-filled Report Links** | Every search result includes a one-click link to a pre-filled Google Form to report outdated information |
| 🌍 **FR-10 Location Logic** | Entries that are in a different city are still included with a clear note rather than silently excluded — Pan-India businesses get a positive note instead |
| 📊 **Admin Analytics** | Every query is silently logged to a Google Sheet Analytics tab — no additional infrastructure required |
| 🐳 **Dockerized** | Runs in a lightweight Alpine-based Docker container with `restart: unless-stopped` for zero-downtime operation |

---

## 🏛 System Architecture

```
Telegram User
    │  (free-text message)
    ▼
Telegram Bot API  (long-polling)
    │
    ▼
┌─────────────────────────────────────────────────┐
│           Node.js Bot Backend (GCP e2-micro)    │
│                                                 │
│  telegramListener.js                            │
│       │                                         │
│       ▼                                         │
│  queryHandler.js  ──────────────────────────┐  │
│       │                                     │  │
│       ▼                                     │  │
│  llmParser.js       directorySearch.js      │  │
│  (Groq API)         (Google Sheets API)     │  │
│       │                    │                │  │
│       └────────┬───────────┘                │  │
│                ▼                            │  │
│         replyFormatter.js                   │  │
│         reportLinkBuilder.js                │  │
│                │                            │  │
│                ▼                       analyticsLogger.js
│          ctx.reply()                        │  │
└─────────────────────────────────────────────┘  │
                                                  ▼
                                    Google Sheet (Directory + Analytics)
                                          ▲
                                 Registration Google Form
                                 (auto-appends new rows)
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| **Telegram Listener** | `telegramListener.js` | Receives incoming messages via long-polling, passes raw text to Query Handler |
| **Query Handler** | `queryHandler.js` | Orchestrator — coordinates all other modules end-to-end |
| **LLM Parser** | `llmParser.js` | Sends raw text to Groq API, returns structured `{category, tags, location}` |
| **Directory Search** | `directorySearch.js` | Reads the Google Sheet via Sheets API v4, applies Smart Matching and FR-10 logic |
| **Reply Formatter** | `replyFormatter.js` | Builds the outgoing Telegram HTML message with contact details and map link |
| **Report Link Builder** | `reportLinkBuilder.js` | Generates a pre-filled Google Form URL for each matched entry |
| **Analytics Logger** | `analyticsLogger.js` | Silently appends every query and result count to the Analytics tab in the Sheet |

---

## 🛠 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Runtime** | Node.js 20 (Alpine) | Lightweight, fast, excellent async I/O for bot workloads |
| **Telegram Framework** | Telegraf v4 | Best-in-class Node.js Telegram bot framework |
| **LLM / NLP** | Groq API (`qwen` model) | Free tier, extremely fast inference (~200ms), handles multi-language queries |
| **Data Source** | Google Sheets API v4 | No-code admin interface; sheet acts as a live database |
| **Authentication** | Google Application Default Credentials (ADC) | Keyless auth on GCP VM; JSON key fallback for local dev |
| **Containerization** | Docker + Docker Compose | Consistent environment, automatic restart on crash or VM reboot |
| **Hosting** | GCP Compute Engine e2-micro (us-west1) | Always Free tier; never deploy to a different region without checking eligibility |
| **Secrets Management** | `dotenv` + `.env` | Secrets never hardcoded, never committed to version control |

---

## 📁 Project Structure

```
TYAG_Connect_bot/
├── src/
│   ├── telegramListener.js    # Entry point: Telegram long-polling listener
│   ├── queryHandler.js        # Orchestrator: coordinates all modules
│   ├── llmParser.js           # Groq LLM integration for query parsing
│   ├── directorySearch.js     # Google Sheets read + smart matching logic
│   ├── replyFormatter.js      # HTML message builder for Telegram replies
│   ├── reportLinkBuilder.js   # Pre-filled Google Form URL generator
│   ├── analyticsLogger.js     # Google Sheets analytics writer
│   └── index.js               # App entry (loads env, starts listener)
├── Dockerfile                 # Lightweight Node.js Alpine container
├── docker-compose.yml         # Compose config with auto-restart & log rotation
├── .dockerignore              # Excludes secrets, node_modules from image
├── .env.example               # Template for required environment variables
├── .gitignore                 # Ensures secrets are never committed
├── package.json
├── prd.md                     # Product Requirements Document
├── architecture.md            # Technical architecture reference
└── phases.md                  # Build phases and exit criteria
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v10+
- **Docker** and **Docker Compose** (for production deployment)
- A **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
- A **Google Cloud Project** with Sheets API enabled
- A **Google Service Account** with Editor access to your Directory Sheet
- A **Groq API Key** from [console.groq.com](https://console.groq.com)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/TYAG_Connect_bot.git
cd TYAG_Connect_bot

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your actual credentials (see Environment Variables section below)

# 4. Authenticate with Google (for local dev using Application Default Credentials)
gcloud auth application-default login

# 5. Start the bot in development mode (with auto-restart on file changes)
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the following values:

```env
# ── Telegram ──────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=          # Your bot token from @BotFather
TELEGRAM_GROUP_ID=           # Numeric ID of your Telegram group

# ── Google Sheets ─────────────────────────────────────────
GOOGLE_SPREADSHEET_ID=       # The ID from your Sheet's URL
GOOGLE_SHEET_NAME=           # Tab name of the directory data (e.g. "Directory")
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=  # Path to key JSON (local dev only, optional)

# ── Groq LLM ──────────────────────────────────────────────
GROQ_API_KEY=                # Your Groq API key

# ── Google Form (Report Outdated Info) ────────────────────
REPORT_FORM_URL=             # Base URL of your pre-filled Google Form
REPORT_FORM_NAME_ENTRY=      # Entry ID for the "Name" field (e.g. entry.XXXXXXXXXX)
REPORT_FORM_BUSINESS_ENTRY=  # Entry ID for the "Business Name" field
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## ☁️ Deployment to Google Cloud

This bot is designed to run on a **GCP e2-micro VM** (Always Free tier) as a Docker container alongside other projects.

### One-time setup on the VM

```bash
# 1. SSH into your VM
gcloud compute ssh <your-vm-name> --zone=<your-zone>

# 2. Clone the repository
git clone https://github.com/<your-username>/TYAG_Connect_bot.git
cd TYAG_Connect_bot

# 3. Create the .env file with production secrets (never pulled from git)
nano .env
# Paste your production credentials and save

# 4. Build and start the container
docker compose up -d --build

# 5. Verify it is running
docker ps
docker logs tyag_connect_bot --tail 20
```

### Updating the bot after code changes

```bash
# On your laptop
git add .
git commit -m "feat: your change description"
git push

# On the VM
cd ~/TYAG_Connect_bot
git pull
docker compose up -d --build
```

### Useful Docker commands

```bash
# View live logs
docker logs tyag_connect_bot -f

# Stop the bot
docker compose down

# Restart the bot
docker compose restart

# Check resource usage
docker stats tyag_connect_bot
```

---

## ⚙️ How It Works

```
User: "surgon no contact joiye che" (Gujarati/English typo)
  │
  ▼
LLM Parser (Groq)
  Understands intent despite typos and mixed language
  Returns: { category: "Medical & Healthcare", tags: ["surgeon"], location: "" }
  │
  ▼
Directory Search
  Applies "Smart Length Rule" matching:
    - Short tags (≤3 chars): exact word-boundary match  → prevents "CA" matching "Medical"
    - Long tags (>3 chars): flexible substring match    → allows "print" to match "Printers"
  Applies FR-10 location logic for partial matches
  │
  ▼
Reply Formatter
  Builds clean HTML message:
    ✅ Dr. Nilesh Sanghvi (Sanghvi Ortho Clinic)
    📞 Phone: +919825011234
    📍 Address: [FF-13, Silver Star, Ahmedabad](https://maps.app.goo.gl/...)
    📝 Report outdated info
  │
  ▼
Analytics Logger (background, non-blocking)
  Silently writes to Google Sheet "Analytics" tab:
  [timestamp | @username | raw query | category | tags | location | matches]
```

---

## 📊 Analytics

Every query is logged to the **Analytics** tab in the Google Sheet with the following columns:

| Column | Description |
|---|---|
| Timestamp | Date and time of the query (IST) |
| Username | Telegram username of the requester |
| Raw Query | The exact original message |
| Category | LLM-extracted primary category |
| Tags | LLM-extracted secondary tags |
| Location | LLM-extracted location (if any) |
| Matches Found | Total number of matched contacts returned |

This gives the admin full visibility into what the community is searching for, which categories are most in demand, and which locations need more registrations.

---

## 🗺 Roadmap

- [x] Phase 1 — Telegram Bot Skeleton
- [x] Phase 2 — Google Sheets Integration
- [x] Phase 3 — LLM Query Parsing (Groq)
- [x] Phase 4 — Smart Matching Logic + FR-10 Location Handling
- [x] Phase 5 — Reply Formatting + Analytics + Report Links
- [x] Phase 6 — End-to-End Local Testing & Edge Cases
- [ ] Phase 7 — Production Deployment to GCP (Docker)
- [ ] Phase 8 — Soft Launch to the Community

**Possible v2 features:**
- Periodic re-verification pings to registrants
- Multi-language reply support
- Admin commands (view analytics without opening the sheet)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the Tapovan Sanskarpith alumni community.**

*If this bot has helped you find a trusted contact, share the bot with the community!*

</div>
