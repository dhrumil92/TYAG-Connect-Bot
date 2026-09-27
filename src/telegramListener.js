"use strict";
/**
 * Module: Telegram Listener
 *
 * Responsibility: receive incoming Telegram messages (via Telegraf long-polling)
 * and pass raw text to the Query Handler.
 *
 * Phase 1: echo bot — reflects every text message back to the sender.
 * Phase 2+: replace the echo handler with a call to queryHandler(ctx).
 */

const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { readDirectory } = require("./directorySearch");
const https = require("https");
const { queryHandler } = require("./queryHandler");

// Force IPv4 for all Telegraf API calls (fixes wsarecv drops on Windows)
const ipv4Agent = new https.Agent({ family: 4 });

/**
 * Creates and configures the Telegraf bot instance.
 * @returns {import("telegraf").Telegraf}
 */
function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Copy .env.example → .env and fill it in."
    );
  }

  const bot = new Telegraf(token, {
    telegram: {
      // Force IPv4 for all API calls to avoid wsarecv drops on Windows IPv6
      agent: ipv4Agent,
    },
  });

  // ── /start command ──────────────────────────────────────────────────────
  bot.start((ctx) => {
    ctx.reply(
      "👋 Welcome to the TYAG Connect Directory Bot!\n\n" +
        "Send me a requirement (e.g. *Need a knee surgeon in Ahmedabad*) " +
        "and I'll search the alumni directory for you.",
      { parse_mode: "Markdown" }
    );
  });

  // ── /help command ───────────────────────────────────────────────────────
  bot.help((ctx) => {
    ctx.reply(
      "*How to use this bot:*\n\n" +
        "Just type your requirement in plain text, for example:\n" +
        "• Need a CA in Surat\n" +
        "• Looking for event management in Ahmedabad\n" +
        "• Knee surgeon — any location okay\n\n" +
        "The bot will search the TYAG alumni directory and reply with " +
        "matching contacts.",
      { parse_mode: "Markdown" }
    );
  });

  // ── /testsheet command (Phase 2 verification — remove or restrict in prod) ─
  bot.command("testsheet", async (ctx) => {
    await ctx.reply("🔄 Reading Directory Sheet...");
    try {
      const entries = await readDirectory();
      if (entries.length === 0) {
        return ctx.reply("⚠️ Sheet is empty or has no Active entries.");
      }
      // Log full data to console for inspection
      console.log("[testsheet] Full directory data:");
      entries.forEach((e, i) =>
        console.log(`  [${i + 1}] ${JSON.stringify(e)}`)
      );
      // Reply with a compact summary
      const summary = entries
        .map(
          (e, i) =>
            `${i + 1}. *${e["Name"]}* — ${e["Category"]} — ${e["Location"]}`
        )
        .join("\n");
      await ctx.reply(
        `✅ Found *${entries.length}* Active entries:\n\n${summary}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      console.error("[testsheet] Error:", err.message);
      await ctx.reply(`❌ Error reading sheet:\n\`${err.message}\``, {
        parse_mode: "Markdown",
      });
    }
  });

  // ── Text message handler ────────────────────────────────────────────────
  bot.on(message("text"), async (ctx) => {
    const rawText = ctx.message.text;
    console.log(
      `[${new Date().toISOString()}] Message from ${ctx.from.id} (@${
        ctx.from.username ?? "no-username"
      }): ${rawText}`
    );

    // Send a typing indicator while processing
    await ctx.sendChatAction("typing");
    
    // Pass to Query Handler (Phase 4)
    await queryHandler(ctx);
  });

  // ── Catch-all for non-text updates ─────────────────────────────────────
  bot.on("message", (ctx) => {
    ctx.reply(
      "Sorry, I can only handle text messages. " +
        "Please type your requirement as plain text."
    );
  });

  return bot;
}

module.exports = { createBot };
