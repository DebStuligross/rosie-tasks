# Rosie Task Master — Project Context for Claude

## What This Is
A single-page personal task management app for Deb Stuligross. No framework — pure HTML/CSS/JS in one file, backed by Google Sheets as a database, served via Netlify with a serverless function handling all sheet reads/writes.

## Dev Setup
- **Start server:** `netlify dev` (or double-click `C:\Users\dasad\start-taskmaster.bat`)
- **Local URL:** http://localhost:8888
- **Auto-starts at login** via Windows Task Scheduler (start-taskmaster-silent.vbs)

## Architecture

### Files
| File | Purpose |
|------|---------|
| `index.html` | Entire frontend — HTML, CSS, and JS in one file |
| `netlify/functions/sheets.js` | Serverless function — all Google Sheets API calls |
| `netlify.toml` | Netlify config |
| `favicon.svg` | App icon |

### Data Layer
- **Database:** Google Sheets (Sheet1 tab for tasks, Config tab for settings)
- **Spreadsheet ID:** `1wOo0wX5rNe2W29NGYe34Yckc9f4TFwfW3SZl30bJenI`
- **All reads/writes** go through `/.netlify/functions/sheets` (`api()` function in index.html)

### Column Constants (COL object in index.html)
```
ID=0, TITLE=1, STATUS=2, PRIORITY=3, DOMAIN=4, SUBDOMAIN=5,
DUE=6, WAITING=7, NOTES=8, SUBTASKS=9, CREATED=10, UPDATED=11, RECURRENCE=12
```
Sheet rows are 1-indexed; `allTasks` array is 0-indexed. Row 1 is headers. Task at `allTasks[i]` is at sheet row `i + 2`.

## Status System (CRITICAL)

### Stored vs Virtual Statuses
The STATUS column stores one of: `New, TODAY, Waiting, Active, Next Up!, Soon, Someday, Done, Archived`

Two **virtual** statuses are computed at render time and never written to the sheet:
- **`Overdue`** — task has a past due date AND status is not in `OVERDUE_EXEMPT`
- **`Due!`** — task is due today or tomorrow AND status is not in `DUE_SOON_EXEMPT`

```js
const OVERDUE_EXEMPT   = new Set(['Active', 'TODAY', 'New', 'Done', 'Archived', 'Someday']);
const DUE_SOON_EXEMPT  = new Set(['Active', 'TODAY', 'Done', 'Archived', 'Someday']);
```

`getVirtualStatus(row)` returns the display status. Always use this for display/sort/filter — never raw `row[COL.STATUS]` alone.

### Sort Order (statusOrder)
`Active(-5) → TODAY(-4) → New(-3) → Overdue(-2) → Due!(-1) → Waiting(1) → Next Up!(3) → Soon(4) → Someday(5) → Done(6) → Archived(99)`

Active and TODAY are intentionally pinned at top — they override Overdue/Due! virtual status.

### Due! Row Styling
Due! rows get class `vs-due` with `!important` CSS to override format rules:
```css
.task-row.vs-due { background: #FFD0A0 !important; }
```

## Config System
Loaded from the **Config sheet tab** on startup. Stored as key/value rows:
- `statuses` — comma-separated list
- `formatRules` — JSON array
- `domains`, `priorities`, `subdomains-[domain]`

Hardcoded defaults in `let config = {...}` are only used if Config sheet is unreachable or on first load. Always update **both** the hardcoded defaults AND the live sheet when changing config values.

## UI Patterns

### Popover Pickers (Status, Domain, Subdomain)
All three fields use a shared custom popover pattern (NOT native `<select>`):
- `openStatusPicker(e, sheetRow)` / `selectStatus(sheetRow, val)`
- `openDomainPicker(e, sheetRow)` / `selectDomain(sheetRow, val)`
- `openSubdomainPicker(e, sheetRow)` / `selectSubdomain(sheetRow, val)`
- Shared positioning helper: `positionPopup(popup, e, width)`
- Click-outside closes all three via a single `document.addEventListener('click', ...)` block

### Format Rules
User-configurable row formatting stored in `config.formatRules`. Applied via `buildFormatStyles()` which injects CSS into `<style id="fmtStyles">`. Rules use `!important`. The `vs-due` CSS (in the main stylesheet, which loads after fmtStyles) overrides format rules for Due! rows.

### Toolbar Layout
Two-row toolbar (flex-direction: column):
1. **Show row** — status filter pills + search + task count
2. **Sort row** — sort controls + domain/subdomain/priority filters + Plan My Day

## Current Version
**v1.10**

## Workflow Context
Deb's daily workflow:
1. ☀️ Plan My Day — pick tasks from Overdue/Due!/Next Up! candidates, mark them **TODAY**
2. Start working on one → move to **Active** (pins to very top)
3. Done → Mark Done or Archive

## Notes
- No build step — edit `index.html` directly, browser refresh to test
- `netlify dev` must be running for Sheets API calls to work (local dev only)
- The app is desktop-only by design

## GitHub Workflow
This project is managed in GitHub at https://github.com/DebStuligross/rosie-tasks

**Rules:**
- Never commit directly to `main`
- Always create a feature branch for every change, no matter how small
- Branch naming convention: `brief-description-of-change` (e.g. `fix-overdue-sort`, `add-recurrence-ui`)
- Push branch to GitHub and open a pull request
- Deb reviews the diff and merges the PR
- After merge: switch to main, pull, delete the feature branch locally

**Branch protection is active on main** — direct pushes will be rejected by GitHub.