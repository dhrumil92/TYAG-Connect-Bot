"use strict";
/**
 * Module: Analytics Logger
 *
 * Responsibility: Append user queries to a Google Sheet tab named "Analytics".
 */

const { google } = require("googleapis");
const { getAuth } = require("./directorySearch");

async function logQuery(ctx, parsedQuery, totalMatches) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) return;

    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Get current time in IST (Indian Standard Time) and format it cleanly
    const timestamp = new Date().toLocaleString("en-IN", { 
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name || "Unknown";
    const rawQuery = ctx.message.text || "";
    const category = parsedQuery.category || "";
    const tags = (parsedQuery.tags || []).join(", ");
    const location = parsedQuery.location || "";

    const row = [timestamp, username, rawQuery, category, tags, location, totalMatches];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Analytics!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    console.log(`[analyticsLogger] Successfully logged query to Analytics sheet.`);
  } catch (err) {
    console.error(`[analyticsLogger] Failed to log query:`, err.message);
  }
}

module.exports = { logQuery };
