# Staff Scheduler

A web application for planning weekly staff coverage across multiple timezones.

**URL:** https://staff.gpxstream.com

## What is Staff Scheduler?

Staff Scheduler helps teams coordinate who is working when. It handles the complexity of scheduling across different timezones, automatically adjusting for daylight saving time changes.

**Key capabilities:**
- Schedule staff across a 7-day week with hourly granularity
- View the schedule in any timezone
- Assign multiple roles to staff (e.g., "Support Tier 1" + "Dev On-Call")
- Track coverage hours and see gaps at a glance
- Export schedules to PDF for printing or sharing
- Collaborate with automatic conflict detection when multiple admins edit

---

## Getting Started

### Logging In

1. Go to https://staff.gpxstream.com
2. Enter your username and password
3. Click **Sign In**

Your session lasts until you close the browser. To stay logged in, keep the tab open.

### First-Time Setup

When you first log in, the app automatically detects your timezone. You can change this anytime using the timezone dropdown.

---

## Viewing the Schedule

### The Schedule Grid

The main view shows a week-long grid:
- **Columns:** Days of the week (Monday through Sunday)
- **Rows:** Hours of the day (midnight to 11 PM)
- **Cells:** Show who is scheduled with colored badges

**Visual indicators:**
| Element | Meaning |
|---------|---------|
| Blue-tinted cells | Required coverage hours |
| Red horizontal line | Current time |
| Red dot | Current hour on today's column |
| Colored badges | Staff members scheduled for that hour |

### Changing the Timezone

The schedule grid displays times in your selected timezone:

1. Click the timezone dropdown (shows current timezone like "Eastern (ET)")
2. Select your preferred timezone
3. The grid updates to show hours in that timezone

**Note:** The data is the same - only the display changes. A shift from 9-5 Eastern will show as 6-2 Pacific.

### Mobile View

On phones and tablets, the schedule displays as collapsible day sections:
- Tap a day header to expand/collapse
- Swipe to scroll through hours
- All features work the same as desktop

---

## Coverage Summary Panel

The right sidebar (bottom on mobile) shows schedule statistics.

### Opening the Panel

- **Desktop:** Click the arrow button on the right edge
- **Mobile:** Tap the arrow button at the bottom

### Roles Section

Shows total hours scheduled per role:
```
▼ Support              5 days, 8 h/day
    Tier 1             3 days, 8 h/day
    Tier 2             2 days, 4 h/day
  Dev On-Call          7 days, 2 h/day
```

- Parent roles (like "Support") show combined totals
- Click the arrow to expand/collapse child roles
- Hours are calculated as "days with coverage" and "average hours per day"

### Staff Section

Shows hours per staff member:
```
Jeff (ET)              40 h
  Tier 1: 24 h
  Tier 2: 16 h
Andy (PT)              32 h
  Dev: 32 h
```

- Staff name includes their timezone abbreviation
- Multi-role staff show expandable breakdowns

### Filtering the View

Click any item to hide it from the calendar:
- **Hide a role:** Click the role name → that role disappears from all cells
- **Hide a staff member:** Click their name → their shifts become invisible
- **Hide a specific role for one staff member:** Expand their breakdown, click the role

Hidden items appear grayed out with strikethrough. Click again to show them.

When items are hidden, a **"Show all (X hidden)"** button appears. Click it to restore everything.

**Note:** Filtering is view-only. It doesn't delete data, just hides it from your view.

---

## Exporting to PDF

1. Click **Export PDF** in the header
2. A PDF downloads automatically
3. Open it for printing or sharing

The PDF includes:
- The full week schedule
- Staff color legend
- Only visible staff/roles (respects your filter settings)

---

## Dark Mode

Toggle between light and dark themes:
- Click the **sun/moon icon** in the header
- Your preference is saved for next time

---

## For Administrators

Admins can edit the schedule and manage settings. If you don't see the Edit button, you have viewer-only access.

### Enabling Edit Mode

1. Click **Edit** in the header
2. The left panel appears with editing controls
3. The grid becomes interactive

### Adding Shifts

1. **Select a staff member** from the dropdown
2. **Select a role** to assign (or use their default)
3. **Click a cell** to add a single shift
4. **Click and drag** across cells to add multiple hours at once

The cells highlight in the staff member's color as you drag.

### Removing Shifts

To remove shifts, use the same click/drag action:
- If you click a cell that already has the selected role → it removes that role
- Drag across multiple cells to remove in bulk

**Tip:** The action (add vs remove) is determined by the first cell you click.

### Clearing Shifts

- **Clear one staff member:** Click **"Clear [Name]"** button
- **Clear everyone:** Click **"Clear All Shifts"** button

Both require confirmation.

### Saving Changes

Your edits are local until you save:

1. Make your changes
2. Click **Save** (green button)
3. Wait for "Saved" confirmation

**If someone else edited while you were working:**
- You'll see a "Conflict" warning
- Click **Cancel** to reload their changes
- Re-apply your edits and save again

### Canceling Changes

Click **Cancel** (red outline button) to discard all unsaved changes and reload from the server.

### Sync Status Indicator

The cloud icon shows your current state:

| Icon | Status | Meaning |
|------|--------|---------|
| Synced | Green | All changes saved |
| Unsaved | Amber | You have local changes |
| Saving | Blue | Save in progress |
| Conflict | Amber | Another user modified the schedule |
| Offline | Gray | No server connection |

---

## Admin Settings Panel

Click the **gear icon** to open Admin Settings.

### Users Tab

Manage who can access the app:

**Add a new user:**
1. Click **Add New User**
2. Fill in: username, display name, password
3. Select their role (Admin or Viewer)
4. Choose their timezone and default schedule role
5. Pick a color
6. Click **Create User**

This creates both the login account AND adds them as a schedulable staff member.

**Edit a user:**
- Click the **pencil icon** next to their row
- Change any fields (leave password blank to keep current)
- Click **Save**

**Delete a user:**
- Click the **trash icon**
- Confirm deletion
- This removes their login AND all their scheduled shifts

### Coverage Tab

Set the hours that require coverage:

1. Select **Start Time** (UTC) - e.g., 8:00 AM
2. Select **End Time** (UTC) - e.g., 6:00 PM
3. Click **Save**

These hours are highlighted blue on the schedule grid.

### Timezones Tab

Manage which timezones appear in dropdowns:

**Add a timezone:**
1. Click **Add Timezone**
2. Select from the preset list OR enter a custom IANA ID
3. Enter a display label (e.g., "New York (ET)")
4. Click **Add**

**Remove a timezone:**
- Click the **X** button next to it

**Reorder timezones:**
- Drag using the handle on the left

### Colors Tab

Define the color palette for staff members:

**Add a color:**
1. Click **Add Color**
2. Enter a name (e.g., "Ocean Blue")
3. Use the color picker to select the hex value
4. Click **Add**

**Edit a color:**
- Click the row to edit name or hex value

**Remove a color:**
- Click the **X** button (only if no staff member uses it)

### Roles Tab

Define roles that can be assigned to shifts:

**Add a role:**
1. Click **Add Role**
2. Enter a Role ID (lowercase, no spaces - e.g., "tier1")
3. Enter a Label (display name - e.g., "Support - Tier 1")
4. Select a color
5. Optionally set as a Parent role or assign to a Parent
6. Click **Add**

**Role hierarchy:**
- Parent roles group related child roles
- In Coverage Summary, parent roles show collapsed totals
- Parent roles cannot be directly assigned to shifts

**Reorder roles:**
- Drag to change the order in dropdowns

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Close modals and dropdowns |

---

## Troubleshooting

### "Invalid username or password"
- Check caps lock
- Usernames are case-insensitive
- Contact an admin to reset your password

### Schedule looks wrong / shifts missing
- Check your timezone setting - you might be viewing in a different timezone
- Check if staff/roles are hidden in the Coverage Summary
- Click "Show all" to reveal hidden items

### "Conflict" error when saving
- Another admin saved changes while you were editing
- Click Cancel to reload the latest version
- Re-apply your changes and save again

### PDF export is blank or missing staff
- Check your visibility filters in Coverage Summary
- Hidden staff/roles are excluded from the PDF
- Click "Show all" before exporting

### Mobile: Can't scroll the grid
- Use two fingers to scroll
- Tap a day header to expand/collapse

---

## Contact

For access requests or technical issues, contact your system administrator.

---

## For Developers

See [DEVELOPMENT.md](DEVELOPMENT.md) for technical documentation including:
- Architecture and data model
- API reference
- Custom hooks
- Development setup
