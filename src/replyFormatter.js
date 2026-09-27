"use strict";
/**
 * Module: Reply Formatter
 *
 * Responsibility: build the outgoing Telegram message string from matched
 * directory entries. Each entry gets full contact details (FR-4) plus a
 * pre-filled report-issue link (FR-7). No-match case uses the exact FR-5 text.
 *
 * Status: STUB — implemented in Phase 5.
 */

const { buildReportLink } = require("./reportLinkBuilder");

/** Exact no-match reply text required by FR-5 — do not rephrase. */
const NO_MATCH_REPLY =
  "Data not found. Please put the same query in the WhatsApp group.";

/**
 * Format a reply message from matched directory entries.
 * @param {{ fullMatches: Object[], noteMatches: Object[] }} searchResults
 * @param {{ category: string, tags: string[], location: string }} parsedQuery
 * @returns {string} Telegram-formatted message (HTML).
 */
function formatReply(searchResults, parsedQuery) {
  const total = searchResults.fullMatches.length + searchResults.noteMatches.length;
  
  if (total === 0) {
    return NO_MATCH_REPLY;
  }

  let text = `Found <b>${total}</b> matching contacts for your query:\n\n`;

  const formatEntry = (entry, icon) => {
    let block = `${icon} <b>${entry["Name"]}</b>`;
    if (entry["Business Name"]) {
      block += ` (${entry["Business Name"]})`;
    }
    block += `\n`;
    
    let rawPhone = entry["Phone Number"] || "";
    // Remove all spaces and dashes for display
    let displayPhone = rawPhone.replace(/[\s-]/g, "");
    
    // If it's a 10 digit number without +91, add it so Telegram recognizes it as a phone number
    if (displayPhone.length === 10 && !displayPhone.startsWith("+")) {
      displayPhone = "+91" + displayPhone;
    }
    
    block += `📞 Phone: ${displayPhone || "Not provided"}\n`;
    
    const address = entry["Address"] || "Not provided";
    const mapLink = entry["Google Maps Link"] || "";
    
    if (mapLink.startsWith("http")) {
      block += `📍 Address: <a href="${mapLink}">${address}</a>\n`;
    } else {
      block += `📍 Address: ${address}\n`;
    }
    
    if (entry.fr10Note) {
      block += `<i>Note: ${entry.fr10Note}</i>\n`;
    }
    
    // Add report link if available
    const reportLink = buildReportLink(entry);
    if (reportLink) {
      block += `<a href="${reportLink}">📝 Report outdated info</a>\n`;
    }
    
    return block + `\n`;
  };

  for (const match of searchResults.fullMatches) {
    text += formatEntry(match, "✅");
  }

  for (const match of searchResults.noteMatches) {
    text += formatEntry(match, "⚠️");
  }

  return text.trim();
}

module.exports = { formatReply, NO_MATCH_REPLY };
