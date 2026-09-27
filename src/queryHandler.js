"use strict";
/**
 * Module: Query Handler
 *
 * Responsibility: orchestrator — receives raw text from the Telegram Listener,
 * calls LLM Parser → Directory Search → applies FR-10 logic → Reply Formatter,
 * then sends the final reply via ctx.reply().
 *
 * Status: STUB — implemented in Phase 4.
 */

const { parseQuery } = require("./llmParser");
const { searchDirectory } = require("./directorySearch");
const { formatReply } = require("./replyFormatter");
const { logQuery } = require("./analyticsLogger");

/**
 * Handle an incoming text query end-to-end.
 * @param {import("telegraf").Context} ctx - Telegraf context object
 */
async function queryHandler(ctx) {
  const rawText = ctx.message.text;
  
  // 1. LLM Parsing
  const parsed = await parseQuery(rawText);
  
  // 2. Directory Search
  const results = await searchDirectory(parsed);
  
  // 3. Final Formatter (Phase 5)
  const replyText = formatReply(results, parsed);

  // Send formatted reply
  await ctx.reply(replyText, { 
    parse_mode: "HTML", 
    disable_web_page_preview: true 
  });
  
  // 4. Log Analytics
  const totalMatches = results.fullMatches.length + results.noteMatches.length;
  // We don't await this because we don't want to delay the Telegram response if Google Sheets is slow
  logQuery(ctx, parsed, totalMatches).catch(console.error);
}

module.exports = { queryHandler };
