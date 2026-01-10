import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1jIyytsvBSSVCNC1m29N17F8S8HQqoq2j4Oqb0II4Xlc";

async function syncMessages() {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

    console.log(`Fetching sheet from ${csvUrl}...`);
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}. Make sure the sheet is publicly viewable.`);
    }

    const csvText = await response.text();
    const rows = csvText.split("\n").map((row) => {
      const cols = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cols.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current);
      return cols.map((c) => c.trim());
    }).filter((row) => row.some((cell) => cell));

    if (rows.length === 0) {
      console.log("No data found in sheet.");
      return;
    }

    const headers = rows[0];
    const keyIndex = headers.findIndex((h) => h.toLowerCase() === "key");
    const enIndex = headers.findIndex((h) => h.toLowerCase() === "en" || h.toLowerCase() === "english");
    const esIndex = headers.findIndex((h) => h.toLowerCase() === "es" || h.toLowerCase() === "spanish");

    if (keyIndex === -1 || enIndex === -1) {
      console.error("Sheet must have 'key' and 'en' (or 'english') columns");
      process.exit(1);
    }

    const enMessages = { "$schema": "https://inlang.com/schema/inlang-message-format" };
    const esMessages = { "$schema": "https://inlang.com/schema/inlang-message-format" };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const key = row[keyIndex];
      const enValue = row[enIndex];
      const esValue = esIndex !== -1 ? row[esIndex] : undefined;

      if (key && enValue) {
        enMessages[key] = enValue;
        if (esValue) {
          esMessages[key] = esValue;
        }
      }
    }

    const messagesDir = join(__dirname, "..", "messages");
    writeFileSync(join(messagesDir, "en.json"), JSON.stringify(enMessages, null, 2));
    console.log(`✓ Updated messages/en.json with ${Object.keys(enMessages).length - 1} messages`);

    if (esIndex !== -1 && Object.keys(esMessages).length > 1) {
      writeFileSync(join(messagesDir, "es.json"), JSON.stringify(esMessages, null, 2));
      console.log(`✓ Updated messages/es.json with ${Object.keys(esMessages).length - 1} messages`);
    }

  } catch (error) {
    console.error("Error syncing messages:", error.message);
    process.exit(1);
  }
}

syncMessages();
