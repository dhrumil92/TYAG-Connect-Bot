"use strict";
const Groq = require("groq-sdk");

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Module: LLM Parser
 *
 * Responsibility: send raw query text to the LLM API with a fixed extraction
 * prompt and return a structured object: { category, tags, location }.
 */

const SYSTEM_PROMPT = `You are a helpful assistant that extracts information from a user's search query for a business directory.
Your goal is to extract the 'category', 'tags', and 'location' from the query.

Rules:
1. category: The general industry or field (e.g., "Medical & Healthcare", "CA/Finance & Accounting", "Real Estate", "Event Management"). If the query is just a greeting (like "hii", "hello") or gibberish, return null.
2. tags: An array of specific keywords, sub-categories, or items mentioned (e.g., ["Orthopedic", "Knee Surgery"], ["GST Filing"], ["Printer", "Canon"]).
3. location: The specific city or area mentioned (e.g., "Ahmedabad", "Surat", "Bhuj"). If no location is mentioned, return null.

You MUST respond with ONLY a valid JSON object in the following format:
{
  "category": "string or null",
  "tags": ["string1", "string2"],
  "location": "string or null"
}
Do not include markdown blocks, explanations, or any other text.`;

/**
 * Parse a free-text requirement into structured fields using the LLM API.
 * @param {string} rawText - The raw text message from the Telegram user.
 * @returns {Promise<{ category: string|null, tags: string[], location: string|null }>}
 */
async function parseQuery(rawText) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText },
      ],
      model: process.env.LLM_MODEL || "qwen/qwen3.8-27b",
      temperature: 0, // 0 for consistent extraction
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      category: parsed.category || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      location: parsed.location || null,
    };
  } catch (error) {
    console.error("[llmParser] Error calling LLM API:", error.message);
    // Fallback if LLM fails: return nulls so the bot can handle gracefully
    return { category: null, tags: [], location: null };
  }
}

module.exports = { parseQuery };
