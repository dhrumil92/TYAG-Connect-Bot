"use strict";
require("dotenv").config();

// ── IPv4 fix: force all HTTPS connections to use IPv4 sockets ──────────────
// Required on Windows where IPv6 routes to Telegram/Google APIs are unstable.
const https = require("https");
const http = require("http");
https.globalAgent = new https.Agent({ family: 4 });
http.globalAgent = new http.Agent({ family: 4 });
// Also set DNS preference as a belt-and-suspenders measure
require("dns").setDefaultResultOrder("ipv4first");
// ───────────────────────────────────────────────────────────────────────────

const { createBot } = require("./telegramListener");

console.log("[startup] Loading bot...");

const bot = createBot();

// Log non-fatal polling errors (stream drops, timeouts) without crashing
bot.catch((err) => {
  console.error(`[${new Date().toISOString()}] Bot error:`, err.message ?? err);
});

console.log("[startup] Launching (connecting to Telegram)...");

// bot.launch() is a long-running Promise that only resolves when the bot
// stops — do NOT await it or chain .then() for a "started" message.
// Instead, log before launch and handle errors via bot.catch + .catch().
bot.launch({
  dropPendingUpdates: true,
}).catch((err) => {
  console.error("❌ Failed to start bot:", err.message ?? err);
  console.error("   Check your TELEGRAM_BOT_TOKEN and network connectivity.");
  process.exit(1);
});

console.log("✅ Bot launched — now polling for messages.");
console.log(`   Send a message to your bot on Telegram to verify.`);

// Graceful shutdown on Ctrl-C or SIGTERM (pm2 stop)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
