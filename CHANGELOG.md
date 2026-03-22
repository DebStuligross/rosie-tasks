# Deb's Task Master — Revision History

## v1.10 — 2026-03-22

## v1.06 — 2026-02-23
- Overdue virtual status: tasks with past due dates automatically display as OVERDUE, sort above TODAY
- Overdue checkbox added to Show: filter (on by default)
- Rich text Notes editor: pop-up modal with bold, italic, underline, bullet/numbered lists, hyperlinks
- "Plan My Day" feature: overlay to promote Active/Next Up!/Waiting tasks to TODAY with one click; optional "Include Soon" toggle; overdue tasks included automatically
- "Show Archived" moved from sort bar to Show: filter group
- Default secondary sort changed to Due Date; Priority removed from sort dropdowns

## v1.05 — 2026-02-22
- Fixed: Priority column now fully hidden (CSS specificity fix — added !important)
- Default status filter changed to TODAY, Active, Next Up!, Waiting (removed Soon)
- Default secondary sort changed from Priority to Due Date
- "Show Archived" button moved from sort bar to Show: filter group
- Priority removed from sort dropdowns

## v1.04 — 2026-02-22
- "Next Up!" status added (sorts between Active and Waiting)
- Configurable Row Formatting: Admin panel section to define conditional formatting rules (field/value match → row background, text color, bold, italic, ALL CAPS); rules stored as JSON in Config tab; first-match-wins evaluation
- Google-style color picker: custom popup palette (80 colors, 10×8 grid), hex input, None option — replaces native color inputs in Row Formatting admin
- TODAY rows highlighted in pale yellow; Critical rows light blue; Overdue rows pink with red text (replaces old pink-for-critical approach)
- Priority hidden from UI: column, filter, and quick-add select all hidden; data still stored in sheet, new tasks default to Medium
- Admin panel widened to 90vw / max 900px, resizable
- Title column widened (1.05fr), Default/All buttons moved beside "Show:" label, sort asc/desc toggle buttons added
- "Show:" label replaces "Status" in toolbar filter

## v1.03 — 2026-02-20
- Sort bar redesigned: Primary + Secondary dropdowns replace pill presets; Default button resets to Status + Priority
- Archive feature: Archive button in task detail panel sets status to Archived, stores pre-archive status in notes; Restore button reverses it; "Show Archived" toggle in sort bar
- "Scheduled" status removed
- Tasks re-sort immediately after any inline edit (status, priority, domain, due date, waiting on)
- Title column narrowed (0.7fr), Waiting On column widened (260px)
- Quick-add strip auto-hides after task is added
- "All" button added to status filter (selects all statuses)
- Priority filter moved to right side of toolbar
- Search input widened to 360px
- Sort Presets section removed from Admin panel (no longer needed)
- Asana import: 11 tasks added from Deb's Upskilling and Deb's Idea Hub projects (tasks #69–79)

## v1.02 — 2026-02-19
- Status filter redesigned from dropdown to multi-select checkboxes with Default button (TODAY, Active, Waiting, Soon pre-checked)
- Task ID numbers added to task rows (visible to left of title)
- Task ID numbers styled — black, 12px, readable
- Due date picker added to quick-add task form (optional)

## v1.01 — 2026-02-19
- Crown favicon (gold with jewels, transparent background)
- Text search bar in toolbar (live filter, ✕ to clear, "X of Y tasks" count)

## v1.0 — 2026-02-19
### Initial release
- Google Sheet backend (Sheet1 for tasks, Config tab for field options + sort presets)
- 12-column task schema: ID, Title, Status, Priority, Domain, Subdomain, Due, Waiting On, Notes, Subtasks, Created, Updated
- Domains: Personal, Work, AI — with subdomains (Health, Joe, Mom, Kids, Misc, House / TTTR, CEIR, FAM, RRP, StrefaTECH, General, Nonprofit, Events, Networking, AI / General, Rosie, Learning, Projects)
- Status values: TODAY, Active, Soon, Waiting, Scheduled, Someday, Done
- Priority values: Critical, High, Medium, Low
- Critical tasks highlighted pink across entire row
- TODAY status — hot pink badge, sorts to top
- Multi-level sort with numbered indicators on column headers
- Config-backed sort preset pill buttons (4 presets seeded: Today+Priority, Priority+Due, Domain+Priority, Due+Priority)
- Admin panel — manage statuses, priorities, domains, subdomains, sort presets (all saved to Config tab)
- Quick-add task form
- Inline editing — click any cell to edit status, priority, domain, subdomain, due date, waiting on
- Expand/collapse task rows for notes and subtasks
- Mark Done button, Delete with confirmation
- Deb's photo + "Deb's Task Master / powered by Rosie" header branding
- Deployed to Netlify: https://deb-task-master.netlify.app
