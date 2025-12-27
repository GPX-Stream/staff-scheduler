# Claude Code Local Settings

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React-based staff scheduling application that enables planning weekly staff coverage across multiple timezones. The app stores all schedules internally in UTC and converts to/from local timezones for display and editing.

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build locally
```

## Technology Stack

- Vite for build tooling
- React 18 (functional components with hooks)
- Tailwind CSS for styling
- lucide-react for icons
- jsPDF for PDF export (dynamically imported)
- bcryptjs for password hashing (server-side)
- Upstash Redis for persistence (@upstash/redis)

## Project Structure

```
src/
├── constants/          # DAYS, HOURS, TIMEZONES, COLORS
├── utils/              # timezone conversions, formatters
├── data/               # DEFAULT_STAFF, generateDefaultBlocks
├── hooks/              # useScheduleBlocks, useDragSelection, useStaffManager, useAuth
├── services/           # pdfExport, storage, api
├── components/         # Header, TimezoneSelector, StaffList, ScheduleGrid, ScheduleCell, CoverageSummary, LoginScreen
├── StaffScheduler.jsx  # Main container
├── App.jsx             # Auth wrapper
├── main.jsx            # App entry point
└── index.css           # Tailwind imports

api/
├── _lib/               # Shared utilities (redis.js, auth.js)
├── auth/               # Authentication endpoints (login, logout, verify, setup)
└── schedule/           # Schedule endpoints (get, save, version)
```

## Architecture

The application uses a modular architecture with custom hooks for state management. Key concepts:

### Timezone Handling
- All shift data is stored as UTC hour indices (0-167 representing hours in a week)
- `localToUTC()` and `utcToLocal()` handle conversions between staff local time and UTC
- `displayOffset` controls what timezone the grid displays in
- Each staff member has their own `timezoneOffset`

### Data Model
- `staff[]`: Array of staff members with id, name, color, and timezoneOffset
- `blocks{}`: Object with keys like `{staffId}-{utcHourIndex}` mapping to `true` for scheduled hours
- Schedule grid is 7 days x 24 hours, displayed in the selected timezone

### Key State
- `selectedStaff`: Currently selected staff member for editing
- `displayOffset`: Timezone offset for grid display
- `isEditMode`: Toggle between edit and view-only modes
- `hiddenStaff`: Set of staff IDs hidden from the calendar view

### Drag Selection
The grid supports click-and-drag to add/remove shifts. Managed by `useDragSelection` hook. The action (add vs remove) is determined by whether the starting cell already has the selected staff scheduled.

### Authentication & Authorization
- **Per-user login**: Each user has username + password (stored hashed in Redis)
- **Roles**: `admin` (can edit) and `viewer` (read-only)
- **Admins**: Jeff, Andy, Alexx - can toggle edit mode and save changes
- **Viewers**: Other staff - no edit toggle visible, view-only access
- **Session tokens**: Stored in Redis with 7-day expiry, sessionStorage on client
- **Login flow**: `App.jsx` → `useAuth` hook → `LoginScreen` → `/api/auth/login`
- **API endpoints**:
  - `POST /api/auth/login` - authenticate user
  - `POST /api/auth/logout` - invalidate session
  - `GET /api/auth/verify` - check session validity
  - `POST /api/auth/setup` - seed initial users (one-time, requires ADMIN_SETUP_KEY)
- **Save protection**: `/api/schedule/save` requires valid admin session

### Initial Page State
- Auto-detects user timezone via `getInitialTimezoneOffset()` and matches to closest from 20 predefined zones
- Defaults to view-only mode (`isEditMode: false`) - user must toggle to edit

### Data Persistence
- **Upstash Redis**: Server-side persistence via Vercel serverless functions
  - Schedule data: `schedule:staff`, `schedule:blocks`, `schedule:version`
  - Users: `users:{username}` (with bcrypt-hashed passwords)
  - Sessions: `sessions:{token}` (7-day TTL)
- **localStorage**: Fallback/offline storage (keys: `staff-scheduler-staff`, `staff-scheduler-blocks`)
- **sessionStorage**: Stores auth token (key: `staff-scheduler-token`)
- **Manual Save**: User must click Save button to sync to server (no auto-save)
- **JSON export**: Downloads schedule as dated `.json` file for backup
- **JSON import**: Restores schedule from `.json` file
- **Reset**: Returns to default staff and schedules

### Redis Sync Architecture
- `useScheduleSync` hook manages state and server synchronization
- Optimistic locking via version numbers prevents concurrent edit conflicts
- 5-minute polling for changes from other users
- `api/schedule/` contains Vercel serverless functions (get, save, version)

## Learnings & Adjustments

- Use PowerShell consistently for Windows operations (not bash or cmd)
- Prefer Write/Read tools over shell commands for file operations on Windows
- User manages their own dev servers - don't start servers, run `npm run build` to test
- For data refactors, verify counts/values match before and after changes
- DST is not currently handled - timezone offsets are static (consider for future enhancement)
- Use `npx vercel dev` for local development with Redis (not `npm run dev`)
- When useEffect causes unexpected re-runs, trace callback dependencies and use refs for values that shouldn't trigger recreation
