"use strict";
/**
 * Module: Report Link Builder
 *
 * Responsibility: build a pre-filled Google Form URL for each matched directory
 * entry so users can report outdated info without re-typing the contact's name.
 * Uses the Forms pre-fill URL pattern: ?entry.XXXXXXX=value (FR-7).
 *
 * Status: STUB — implemented in Phase 5.
 */

/**
 * Build a pre-filled report-issue Form URL for a directory entry.
 * @param {{ Name: string, "Business Name": string }} entry - Directory row object.
 * @returns {string} Full pre-filled Google Form URL.
 */
function buildReportLink(entry) {
  const baseUrl = process.env.REPORT_FORM_URL;
  const nameEntryId = process.env.REPORT_FORM_ENTRY_NAME;
  const businessEntryId = process.env.REPORT_FORM_ENTRY_BUSINESS;

  // If the admin hasn't set up the form URL yet, return a placeholder or empty
  if (!baseUrl) {
    return "";
  }

  try {
    const url = new URL(baseUrl);
    
    // Add pre-filled parameters if the IDs exist
    if (nameEntryId && entry["Name"]) {
      url.searchParams.append(nameEntryId, entry["Name"]);
    }
    
    if (businessEntryId && entry["Business Name"]) {
      url.searchParams.append(businessEntryId, entry["Business Name"]);
    }
    
    return url.toString();
  } catch (err) {
    console.error("[reportLinkBuilder] Invalid REPORT_FORM_URL:", err.message);
    return baseUrl; // fallback to raw string if it's not a valid URL
  }
}

module.exports = { buildReportLink };
