# Google Sheets Content Management

This project uses Google Sheets to manage all text content in the application. This makes it easy for non-technical team members to update copy without touching code.

## How It Works

All user-facing text is stored in a Google Sheet with three columns:
- `key`: The message identifier (e.g., `home_hero_headline`)
- `en`: English text
- `es`: Spanish text (optional)

When you run the sync command, it fetches the latest content from Google Sheets and updates the local message files.

## Setup

### 1. Initial Export (One-time)

Export your existing messages to populate the Google Sheet:

```bash
npm run export-messages
```

This creates `messages-export.csv` with all current content.

### 2. Populate Google Sheet

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1jIyytsvBSSVCNC1m29N17F8S8HQqoq2j4Oqb0II4Xlc/edit
2. Open the generated `messages-export.csv` file
3. Copy all content
4. Paste it into the Google Sheet (starting at cell A1)
5. Make sure the sheet is set to "Anyone with the link can view"

### 3. Sheet Structure

Your sheet should have this structure:

| key | en | es |
|-----|----|----|
| home_hero_headline | Missouri traffic stop data | Datos de paradas de tráfico en Missouri |
| home_hero_subheadline | Vehicle stops from every agency in Missouri | Paradas de vehículos de cada agencia en Missouri |

## Usage

### Updating Content

1. Edit text directly in the Google Sheet
2. Run the sync command when you want to pull updates:

```bash
npm run sync-messages
```

3. The command will:
   - Fetch the latest data from Google Sheets
   - Update `messages/en.json` and `messages/es.json`
   - Paraglide will automatically compile these into the app

4. Test your changes locally with `npm run dev`
5. Commit and push the updated message files

### Important Notes

- **Manual sync only**: Content does NOT update automatically. You must run `npm run sync-messages` to pull changes.
- **Sheet must be public**: The sheet needs to be set to "Anyone with the link can view" for the sync to work.
- **Commit the changes**: After syncing, commit the updated JSON files to git.

## Custom Sheet ID

To use a different Google Sheet, set the `GOOGLE_SHEET_ID` environment variable:

```bash
GOOGLE_SHEET_ID=your-sheet-id npm run sync-messages
```

## Troubleshooting

**Error: "Failed to fetch sheet"**
- Make sure the Google Sheet is set to "Anyone with the link can view"
- Check that the sheet ID is correct

**Error: "Sheet must have 'key' and 'en' columns"**
- Verify the first row has column headers: `key`, `en`, and optionally `es`
- Column headers are case-insensitive

**Content not updating in the app**
- Run `npm run dev` to restart the dev server after syncing
- Make sure paraglide compiled the messages (it runs automatically)
