"use strict";
/**
 * Module: Directory Search
 *
 * Responsibility: authenticate with the Google Sheets API, read all rows from
 * the Directory Sheet (Status = "Active"), and match rows against parsed query
 * fields (category, tags, location).
 *
 * Authentication strategy:
 *   1. Application Default Credentials (ADC) — preferred for local dev and VM.
 *      Local: run `gcloud auth application-default login` once.
 *      VM:    attach the service account to the VM instance (no key file).
 *   2. JSON key file fallback — only if GOOGLE_SERVICE_ACCOUNT_KEY_PATH is set
 *      in .env (requires org policy to allow key creation).
 *
 * Status: readDirectory() implemented (Phase 2). searchDirectory() stub (Phase 4).
 */

const { google } = require("googleapis");

/** Column headers expected in the Directory Sheet (order matters). */
const SHEET_COLUMNS = [
  "Timestamp",
  "Name",
  "Phone Number",
  "Category",
  "Sub-category / Tags",
  "Business Name",
  "Location",
  "Service Area",
  "Notes",
  "Consent",
  "Status",
  "Last Updated",
];

/**
 * Build a Google Auth client.
 * Uses ADC by default; falls back to a JSON key file if the env var is set.
 * @returns {Promise<import("googleapis").Auth.GoogleAuth>}
 */
async function getAuth() {
  // We need full access (not just readonly) so the Analytics Logger can append rows
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath) {
    // Method 2: JSON key file (only if org policy allows key creation)
    return new google.auth.GoogleAuth({ keyFile: keyPath, scopes });
  }

  // Method 1: Application Default Credentials (gcloud auth application-default login)
  return new google.auth.GoogleAuth({ scopes });
}

/**
 * Read all rows from the Directory Sheet and return them as an array of
 * objects keyed by column header.  Only returns rows where Status = "Active".
 *
 * @returns {Promise<Object[]>} Array of active directory entry objects.
 */
async function readDirectory() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set in .env");
  }

  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    // Fetch all 12 columns (A through L)
    range: `${sheetName}!A:L`,
  });

  const rows = response.data.values;

  if (!rows || rows.length < 2) {
    console.log("[directorySearch] Sheet is empty or has only a header row.");
    return [];
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Convert each row array to an object keyed by column header
  const entries = dataRows.map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (row[i] ?? "").trim();
    });
    return obj;
  });

  // --- TEMPORARILY DISABLED (Phase 2 feature) ---
  // This code restricts the bot to only return rows where Status is "Active".
  // It is commented out so that new Google Form submissions show up instantly
  // without waiting for the admin to manually approve them. 
  // Uncomment this if you start getting spam and need manual approval again.
  /*
  const active = entries.filter(
    (e) => e["Status"]?.toLowerCase() === "active"
  );
  */
  
  // Since we commented out the filter, all entries are considered "active"
  const active = entries;

  return active;
}

/**
 * Search the directory for entries matching the parsed query.
 * Applies FR-10 location/service-area logic.
 * @param {{ category: string, tags: string[], location: string }} parsedQuery
 * @returns {Promise<{ fullMatches: Object[], noteMatches: Object[] }>}
 */
async function searchDirectory(parsedQuery) {
  const activeEntries = await readDirectory();
  
  const fullMatches = [];
  const noteMatches = [];

  // If LLM failed to extract anything useful, return nothing.
  if (!parsedQuery.category && (!parsedQuery.tags || parsedQuery.tags.length === 0)) {
    return { fullMatches, noteMatches };
  }

  const queryCat = (parsedQuery.category || "").toLowerCase();
  const queryTags = (parsedQuery.tags || []).map(t => t.toLowerCase());
  const queryLoc = (parsedQuery.location || "").toLowerCase();

  for (const entry of activeEntries) {
    const entryCat = (entry["Category"] || "").toLowerCase();
    const entryTags = (entry["Sub-category / Tags"] || "").toLowerCase();
    
    // Helper function: Smart Length Rule matching
    const isSmartMatch = (qStr, sStr) => {
      if (!qStr || !sStr) return false;
      if (qStr.length <= 3) {
        // Exact standalone word match for short strings to prevent "ca" matching "medical"
        // Escape any regex special characters just to be safe
        const escapedQStr = qStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedQStr}\\b`, 'i');
        return regex.test(sStr);
      } else {
        // Flexible substring match for longer words to allow "printer" to match "printers"
        return sStr.includes(qStr) || qStr.includes(sStr);
      }
    };

    let isMatch = false;
    
    if (isSmartMatch(queryCat, entryCat)) isMatch = true;
    if (isSmartMatch(queryCat, entryTags)) isMatch = true;
    
    if (!isMatch && queryTags.length > 0) {
      for (const tag of queryTags) {
        if (isSmartMatch(tag, entryCat) || isSmartMatch(tag, entryTags)) {
          isMatch = true;
          break;
        }
      }
    }

    if (!isMatch) continue;

    // We have a category/tag match! Now apply FR-10 Location logic
    const entryLoc = (entry["Address"] || "").toLowerCase();
    const serviceArea = (entry["Service Area"] || "").toLowerCase();

    // If query didn't ask for a location, it's a full match
    if (!queryLoc) {
      fullMatches.push(entry);
      continue;
    }

    // If locations match (substring in either direction)
    if (entryLoc.includes(queryLoc) || queryLoc.includes(entryLoc)) {
      fullMatches.push(entry);
      continue;
    }

    // Location mismatch handling (FR-10)
    const clonedEntry = { ...entry }; // Don't mutate the original cached row
    
    if (serviceArea.includes("yes") || serviceArea.includes("pan-india")) {
      // Full match with a positive note
      clonedEntry.fr10Note = "🌍 Serves your area (Pan-India / Wide Service Area)";
      fullMatches.push(clonedEntry);
    } else {
      // Local only, mismatch -> Note match
      clonedEntry.fr10Note = `⚠️ Registered in ${entry["Address"] || "a different location"} — confirm before reaching out.`;
      noteMatches.push(clonedEntry);
    }
  }

  return { fullMatches, noteMatches };
}

module.exports = { readDirectory, searchDirectory, SHEET_COLUMNS, getAuth };
