import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function exportToCSV() {
  const messagesDir = join(__dirname, "..", "messages");
  const enMessages = JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf-8"));
  const esMessages = JSON.parse(readFileSync(join(messagesDir, "es.json"), "utf-8"));

  const csv = ["key,en,es"];

  for (const [key, value] of Object.entries(enMessages)) {
    if (key === "$schema") continue;

    const enValue = value.replace(/"/g, '""');
    const esValue = (esMessages[key] || "").replace(/"/g, '""');

    csv.push(`${key},"${enValue}","${esValue}"`);
  }

  const outputPath = join(__dirname, "..", "messages-export.csv");
  writeFileSync(outputPath, csv.join("\n"));

  console.log(`✓ Exported ${csv.length - 1} messages to messages-export.csv`);
  console.log(`\nYou can now:`);
  console.log(`1. Open the CSV file at: ${outputPath}`);
  console.log(`2. Copy all the content`);
  console.log(`3. Paste it into your Google Sheet`);
}

exportToCSV();
