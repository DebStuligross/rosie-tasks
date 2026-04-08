# Rosie Task Master — Project Context for Claude

## What This Is
A single-page personal task management app for Deb Stuligross. No framework — pure HTML/CSS/JS in one file, backed by Google Sheets as a database, served via Vercel with a serverless function handling all sheet reads/writes.

## Dev Setup
- **Start server:** `vercel dev` (from project root)
- **Local URL:** http://localhost:3000
- **Live app:** https://rosie-tasks.vercel.app

## Architecture

### Files
| File | Purpose |
|------|---------|
| `index.html` | Entire frontend — HTML, CSS, and JS in one file |
| `api/sheets.js` | Vercel serverless function — all Google Sheets API calls |
| `api/addTaskVoice.js` | Vercel serverless function — voice task entry endpoint |
| `vercel.json` | Vercel config |
| `favicon.svg` | App icon |

### Data Layer
- **Database:** Google Sheets (Sheet1 tab for tasks, Config tab for settings)
- **Spreadsheet ID:** `1wOo0wX5rNe2W29NGYe34Yckc9f4TFwfW3SZl30bJenI`
- **All reads/writes** go through `/api/sheets` (`api()` function in index.html)
- **Task IDs generated server-side** in `sheets.js` (reads existing IDs, uses max+1) — prevents duplicate IDs across devices

### Column Constants (COL object in index.html)
```
ID=0, TITLE=1, STATUS=2, PRIORITY=3, DOMAIN=4, SUBDOMAIN=5,
DUE=6, WAITING=7, NOTES=8, SUBTASKS=9, CREATED=10, UPDATED=11, RECURRENCE=12
```
Sheet rows are 1-indexed; `allTasks` array is 0-indexed. Row 1 is headers. Task at `allTasks[i]` is at sheet row `i + 2`.

## Status System (CRITICAL)

### Stored Statuses
The STATUS column stores one of: `New, TODAY, Active, Waiting, Next Up!, Soon, Someday, Done, Archived`

These are the only real statuses — there are **no virtual status overrides**. `getVirtualStatus(row)` simply returns `(row[COL.STATUS] || '').trim()`.

### Due Date Indicators (replaces old Overdue/Due! virtual statuses)
Urgency is shown via emoji next to the due date — the stored status is never overridden:

```js
const DUE_INDICATOR_EXEMPT = new Set(['Done', 'Archived']);
function getDueEmoji(row) {
  // Returns '🔴 ' (overdue), '🟡 ' (due today or tomorrow), or ''
  // Done/Archived tasks always return ''
}
```

Overdue tasks also get class `row-overdue` → `background: #FFD0A0 !important` (orange row highlight).

### Sort Order (statusOrder)
`New(-5) → Active(-4) → TODAY(-3) → Waiting(1) → Next Up!(3) → Soon(4) → Someday(5) → Done(6) → Archived(99)`

### DEFAULT_STATUSES (filter pills shown by default)
`['New', 'TODAY', 'Active', 'Next Up!', 'Waiting']`

## Config System
Loaded from the **Config sheet tab** on startup. Stored as key/value rows:
- `statuses` — comma-separated list
- `formatRules` — JSON array
- `domains`, `priorities`, `subdomains-[domain]`

Hardcoded defaults in `let config = {...}` are only used if Config sheet is unreachable or on first load. Always update **both** the hardcoded defaults AND the live sheet when changing config values.

### Current formatRules (hardcoded defaults match live Config sheet)
```js
{ field: 'due',    value: 'overdue',  rowBg: '#ea9999', textColor: '#C0392B', bold: true,  italic: false, allCaps: true  },
{ field: 'status', value: 'TODAY',    rowBg: '#FFF8E1', textColor: '',        bold: true,  italic: false, allCaps: false },
{ field: 'status', value: 'Next Up!', rowBg: '#cfe2f3', textColor: '',        bold: false, italic: false, allCaps: false },
{ field: 'status', value: 'Active',   rowBg: '#d9ead3', textColor: '',        bold: false, italic: false, allCaps: false },
{ field: 'status', value: 'Waiting',  rowBg: '',        textColor: '#999999', bold: false, italic: false, allCaps: false },
```

`buildFormatStyles()` injects these into `<style id="fmtStyles">` with `!important`. The `row-overdue` CSS (in the main stylesheet) overrides format rules for overdue rows.

## UI Patterns

### Toolbar Layout
Two-row toolbar:
1. **Header row** — app title + Plan My Day button + Add Task button
2. **Show row** — status filter pills (Default / All / Focus + individual) + search (right-aligned) + task count
3. **Sort row** — sort controls + domain/subdomain/priority filters

### Column Order (grid)
`# | Title | Status | Due Date | Domain | Subdomain | Waiting On | Actions`
Grid: `32px 1.05fr 110px 100px 100px 110px 260px 40px`

### Popover Pickers (Status, Domain, Subdomain)
All three fields use a shared custom popover pattern (NOT native `<select>`):
- `openStatusPicker(e, sheetRow)` / `selectStatus(sheetRow, val)`
- `openDomainPicker(e, sheetRow)` / `selectDomain(sheetRow, val)`
- `openSubdomainPicker(e, sheetRow)` / `selectSubdomain(sheetRow, val)`
- Shared positioning helper: `positionPopup(popup, e, width)` — flips above row when insufficient space below
- Click-outside closes all three via a single `document.addEventListener('click', ...)` block
- Escape key closes all pickers

### Plan My Day
Button in header. Candidate tasks use "either condition":
- Status is in `candidateStatuses` (`Active`, `Next Up!`, `Waiting`, optionally `Soon`)
- OR due date is within 1 day (overdue or due today/tomorrow)

Excluded: `Done`, `Archived`, `TODAY`, `Someday`, `New`

Selecting a task sets it to **TODAY**.

## Current Version
**v1.11**

## Workflow Context
Deb's daily workflow:
1. ☀️ Plan My Day — pick tasks from candidates (Active/Next Up!/Waiting/overdue/due-soon), mark them **TODAY**
2. Start working on one → move to **Active** (pins to very top)
3. Done → Mark Done or Archive

## Notes
- No build step — edit `index.html` directly, browser refresh to test
- `vercel dev` must be running for Sheets API calls to work (local dev only)
- The app is desktop-only by design
- Vercel deployment is automatic — pushing to main triggers a redeploy. Live at https://rosie-tasks.vercel.app

## GitHub Workflow
This project is managed in GitHub at https://github.com/DebStuligross/rosie-tasks

**Branch protection is on main** — changes require a PR. Workflow:
1. Create a feature branch: `git checkout -b my-branch`
2. Make changes and test locally
3. Commit and push: `git push origin my-branch`
4. Create PR on GitHub, merge via UI
5. Sync locally: `git checkout main && git pull origin main`

**Rollback:** If something breaks, use `git log` to find a good commit and `git revert` or `git checkout` to restore it.
