# Staff Scheduler - Developer Guide

Technical documentation for developing and maintaining the Staff Scheduler application.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Icons | lucide-react |
| Print | CSS @media print (browser native) |
| Backend | Vercel Serverless Functions |
| Database | Upstash Redis |
| Auth | bcryptjs (password hashing) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Upstash Redis database
- Vercel CLI (`npm i -g vercel`)

### Environment Variables

```env
# Upstash Redis
KV_REST_API_URL=https://your-instance.upstash.io
KV_REST_API_TOKEN=your-token

# Initial setup key (one-time use)
ADMIN_SETUP_KEY=your-secret-key
```

### Development

```bash
npm install

# With Redis backend (recommended)
npx vercel dev

# Frontend only (no persistence)
npm run dev
```

### Production

```bash
npm run build    # Build for production
npm run preview  # Preview build locally
```

---

## Project Structure

```
staff-scheduler/
├── api/                          # Vercel serverless functions
│   ├── _lib/
│   │   ├── redis.js              # Redis client, key constants, defaults
│   │   └── auth.js               # Password hashing, token management
│   ├── auth/
│   │   ├── login.js              # POST: authenticate → token
│   │   ├── logout.js             # POST: invalidate token
│   │   ├── verify.js             # GET: validate token → user
│   │   └── setup.js              # POST: seed initial users
│   ├── config/
│   │   ├── get.js                # GET: fetch app config
│   │   ├── save.js               # POST: update config (admin)
│   │   └── setup.js              # POST: seed config
│   ├── schedule/
│   │   ├── get.js                # GET: fetch schedule data
│   │   ├── save.js               # POST: save with optimistic lock
│   │   └── version.js            # GET: version only (polling)
│   └── users/
│       ├── list.js               # GET: all users with staff data
│       ├── create.js             # POST: create user + staff
│       ├── update.js             # POST: update user + staff
│       └── delete.js             # POST: cascade delete
│
├── src/
│   ├── components/
│   │   ├── Header.jsx            # Top nav, responsive menu
│   │   ├── LoginScreen.jsx       # Auth form
│   │   ├── TimezoneSelector.jsx  # Timezone dropdown + modal
│   │   ├── StaffList.jsx         # Staff/role selection (edit mode)
│   │   ├── ScheduleGrid.jsx      # Main grid container
│   │   ├── ScheduleCell.jsx      # Individual hour cell
│   │   ├── CoverageSummary.jsx   # Stats panel with visibility toggles
│   │   ├── AdminPanel.jsx        # Settings modal container
│   │   ├── SyncStatus.jsx        # Sync state indicator
│   │   └── admin/                # Admin panel tab components
│   │
│   ├── hooks/
│   │   ├── useAuth.js            # Auth state, login/logout
│   │   ├── useConfig.js          # App config fetch/save
│   │   ├── useScheduleBlocks.js  # Block CRUD operations
│   │   ├── useScheduleSync.js    # Server sync, polling, conflicts
│   │   ├── useStaffManager.js    # Staff state, visibility filters
│   │   └── useDragSelection.js   # Drag-to-select interaction
│   │
│   ├── services/
│   │   └── api.js                # Schedule API client
│   │
│   ├── utils/
│   │   ├── timezone.js           # DST-aware timezone conversion
│   │   ├── blockUtils.js         # Multi-role block normalization
│   │   └── formatters.js         # Display formatting helpers
│   │
│   ├── constants/index.js        # DAYS, HOURS, WEEK_HOURS
│   ├── App.jsx                   # Auth wrapper
│   ├── StaffScheduler.jsx        # Main app container
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind imports
│
└── upstash_data/                 # Seed data for manual Redis setup
    ├── users.json
    ├── config.json
    └── schedule_blocks.json
```

---

## Core Architecture

### Data Model

All schedule data is stored in **UTC hour indices** (0-167 representing each hour of a week):

```
UTC Hour Index = dayIndex * 24 + hour

Monday 00:00 UTC = 0
Monday 12:00 UTC = 12
Tuesday 00:00 UTC = 24
Sunday 23:00 UTC = 167
```

### Redis Keys

```
users                 → { username: { passwordHash, role, sessionToken, ... } }
schedule:staff        → [ { id, name, color, timezone, defaultRole }, ... ]
schedule:blocks       → { "staffId-utcIndex": ["role1", "role2"], ... }
schedule:version      → number (optimistic lock version)
app:config            → { coverage, timezones, colors, roles }
```

### Block Value Formats

The `blocks` object supports three formats for backward compatibility:

```javascript
{
  "1-0":  ["tier2"],           // Current: array of role IDs
  "1-24": ["tier1", "dev"],    // Multi-role support
  "2-48": "tier1",             // Legacy: string (single role)
  "3-72": true                 // Legacy: boolean (uses defaultRole)
}
```

Always use `normalizeBlockValue()` to convert to array:

```javascript
import { normalizeBlockValue } from './utils/blockUtils';

const roles = normalizeBlockValue(blocks["1-0"], staff.defaultRole);
// Always returns: ["tier2"] or ["role1", "role2"] or []
```

---

## Timezone Handling

### DST-Aware Conversion

The app uses IANA timezone IDs (e.g., `America/New_York`) and computes offsets dynamically:

```javascript
// src/utils/timezone.js

// Get current offset (handles DST automatically)
getTimezoneOffset('America/New_York')  // → -5 (EST) or -4 (EDT)

// Convert display position to UTC storage key
localToUTC(dayIndex, hour, 'America/New_York')  // → utcHourIndex

// Convert UTC storage key to display position
utcToLocal(utcHourIndex, 'America/New_York')    // → { dayIndex, hour }

// Shorthand for grid interaction
displayToUTC(dayIndex, hour, displayTimezone)   // → utcHourIndex
```

### Auto-Detection

On first load, the app detects the user's timezone:

```javascript
getInitialTimezone(configuredTimezones)
// 1. Tries Intl.DateTimeFormat().resolvedOptions().timeZone
// 2. Falls back to closest match by current offset
```

---

## Authentication Flow

### Login

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { username, password }       │
  │  ─────────────────────────▶   │
  │                               │ bcrypt.compare(password, hash)
  │                               │ generateToken() → 64-char hex
  │                               │ Store token on user object
  │  ◀─────────────────────────   │
  │  { token, user }              │
  │                               │
  │  Store in localStorage        │
  │                               │
```

### Session Verification

```javascript
// On app load
const token = localStorage.getItem('staff-scheduler-token');
if (token) {
  const { valid, user } = await fetch('/api/auth/verify', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

### Token Storage

- **Client:** `localStorage['staff-scheduler-token']` (persists across browser sessions)
- **Server:** `users[username].sessionToken` in Redis

---

## Optimistic Locking

Prevents concurrent edit conflicts:

```
Admin A                     Server                      Admin B
   │                          │                            │
   │  GET /schedule/get       │                            │
   │  ──────────────────────▶ │                            │
   │  { version: 42 }         │                            │
   │  ◀────────────────────── │                            │
   │                          │  GET /schedule/get         │
   │                          │ ◀──────────────────────────│
   │                          │  { version: 42 }           │
   │                          │ ──────────────────────────▶│
   │                          │                            │
   │  [Makes edits]           │                    [Makes edits]
   │                          │                            │
   │                          │  POST /schedule/save       │
   │                          │  { baseVersion: 42 }       │
   │                          │ ◀──────────────────────────│
   │                          │  ✓ Saves, version → 43     │
   │                          │ ──────────────────────────▶│
   │                          │                            │
   │  POST /schedule/save     │                            │
   │  { baseVersion: 42 }     │                            │
   │  ──────────────────────▶ │                            │
   │  409 Conflict            │                            │
   │  { currentVersion: 43 }  │                            │
   │  ◀────────────────────── │                            │
```

### Conflict Resolution

```javascript
// useScheduleSync.js
const save = async () => {
  try {
    await scheduleApi.save(staff, blocks, version);
  } catch (e) {
    if (e instanceof ConflictError) {
      setHasConflict(true);  // UI shows "Conflict - use Cancel to reload"
    }
  }
};
```

---

## Drag Selection System

### Hook: `useDragSelection`

Manages click-and-drag shift editing:

```javascript
const {
  isDragging,
  selectionRect,        // { startDay, startHour, endDay, endHour }
  handleMouseDown,      // (dayIndex, hour) => void
  handleMouseEnter,     // (dayIndex, hour) => void
  handleMouseUp,        // () => void
} = useDragSelection({
  isEditMode,
  selectedStaff,
  selectedRole,
  blocks,
  updateBlocks,
  displayTimezone,
});
```

### Add vs Remove Logic

The action is determined by the **starting cell**:

```javascript
// When drag starts
const startKey = `${selectedStaff.id}-${displayToUTC(day, hour, tz)}`;
const existingRoles = normalizeBlockValue(blocks[startKey], defaultRole);
const isRemoving = existingRoles.includes(selectedRole);

// On drag end, apply action to all cells in rectangle
updates.forEach(({ day, hour }) => {
  const key = `${staffId}-${displayToUTC(day, hour, tz)}`;
  if (isRemoving) {
    removeRoleFromBlock(blocks[key], role, defaultRole);
  } else {
    addRoleToBlock(blocks[key], role, defaultRole);
  }
});
```

---

## Multi-Role Block Operations

### Utility Functions

```javascript
// src/utils/blockUtils.js

// Normalize any format to array
normalizeBlockValue(value, defaultRole)
// true → [defaultRole]
// "role" → ["role"]
// ["a","b"] → ["a","b"]
// null → []

// Check if block has a role
blockHasRole(value, roleId, defaultRole)  // → boolean

// Add role (no duplicates)
addRoleToBlock(value, roleId, defaultRole)  // → ["existing", "new"]

// Remove role
removeRoleFromBlock(value, roleId, defaultRole)  // → ["remaining"] or null
```

### Block Update Flow

```javascript
// useScheduleBlocks.js
const updateBlocks = (updates, displayTimezone, isRemoving, role, staff) => {
  setBlocks(prev => {
    const next = { ...prev };
    updates.forEach(({ dayIndex, hour }) => {
      const utcIndex = displayToUTC(dayIndex, hour, displayTimezone);
      const key = `${staff.id}-${utcIndex}`;

      if (isRemoving) {
        const result = removeRoleFromBlock(prev[key], role, staff.defaultRole);
        if (result === null) {
          delete next[key];  // Block is empty, remove it
        } else {
          next[key] = result;
        }
      } else {
        next[key] = addRoleToBlock(prev[key], role, staff.defaultRole);
      }
    });
    return next;
  });
};
```

---

## Visibility System

Three levels of visibility filtering (all client-side, doesn't affect data):

### State

```javascript
// useStaffManager.js
const [hiddenStaff, setHiddenStaff] = useState(new Set());        // Staff IDs
const [hiddenRoles, setHiddenRoles] = useState(new Set());        // "staffId-roleId"
const [hiddenGlobalRoles, setHiddenGlobalRoles] = useState(new Set()); // Role IDs
```

### Toggle Functions

```javascript
toggleStaffVisibility(staffId)           // Hide/show entire staff member
toggleRoleVisibility(staffId, roleId)    // Hide/show role for specific staff
toggleGlobalRoleVisibility(roleId)       // Hide/show role across all staff
showAllStaff()                           // Reset all visibility
```

### Rendering Logic

```javascript
// ScheduleCell.jsx
const isVisible = (staffId, roleId) => {
  if (hiddenStaff.has(staffId)) return false;
  if (hiddenGlobalRoles.has(roleId)) return false;
  if (hiddenRoles.has(`${staffId}-${roleId}`)) return false;
  return true;
};
```

---

## API Reference

### Authentication

#### POST `/api/auth/login`
```javascript
// Request
{ username: "jeff", password: "secret" }

// Response 200
{
  success: true,
  token: "a1b2c3...",
  user: { username, displayName, role }
}

// Response 401
{ error: "Invalid username or password" }
```

#### GET `/api/auth/verify`
```javascript
// Headers
Authorization: Bearer <token>

// Response 200
{ valid: true, user: { username, displayName, role } }
// or
{ valid: false }
```

#### POST `/api/auth/logout`
```javascript
// Headers
Authorization: Bearer <token>

// Response 200
{ success: true }
```

### Schedule

#### GET `/api/schedule/get`
```javascript
// Response 200
{
  staff: [
    { id: 1, name: "Jeff S.", color: {...}, timezone: "America/New_York", defaultRole: "tier2" }
  ],
  blocks: {
    "1-0": ["tier2"],
    "1-24": ["tier1", "dev"]
  },
  version: 42
}
```

#### POST `/api/schedule/save`
```javascript
// Headers
Authorization: Bearer <admin-token>

// Request
{ staff: [...], blocks: {...}, baseVersion: 42 }

// Response 200
{ success: true, version: 43 }

// Response 409
{ error: "Version conflict", currentVersion: 44 }
```

#### GET `/api/schedule/version`
```javascript
// Response 200
{ version: 42 }
```

### Configuration

#### GET `/api/config/get`
```javascript
// Response 200
{
  config: {
    coverage: { start: 8, end: 18 },
    timezones: [{ id: "America/New_York", label: "Eastern (ET)" }],
    colors: [{ name: "blue", hex: "#3b82f6", bg: "bg-blue-500", ... }],
    roles: [{ id: "tier1", label: "Support - Tier 1", color: "green" }]
  }
}
```

#### POST `/api/config/save`
```javascript
// Headers
Authorization: Bearer <admin-token>

// Request
{ config: { coverage: {...}, timezones: [...], colors: [...], roles: [...] } }

// Response 200
{ success: true, config: {...} }
```

### Users (Admin)

#### GET `/api/users/list`
```javascript
// Headers
Authorization: Bearer <admin-token>

// Response 200
{
  users: [{
    username: "jeff",
    displayName: "Jeff Smith",
    authRole: "admin",
    staffId: 1,
    timezone: "America/New_York",
    defaultRole: "tier2",
    color: { name: "blue", hex: "#3b82f6" }
  }]
}
```

#### POST `/api/users/create`
```javascript
// Request
{
  username: "andy",
  displayName: "Andy Iancu",
  password: "secret",
  authRole: "admin",
  timezone: "America/Los_Angeles",
  defaultRole: "tier1",
  color: { name: "green", hex: "#22c55e" }
}

// Response 200
{ success: true, user: {...}, staff: {...} }
```

#### POST `/api/users/delete`
```javascript
// Request
{ username: "andy" }

// Response 200
{ success: true }

// Response 400
{ error: "Cannot delete yourself" }
{ error: "Cannot delete last admin" }
```

---

## Custom Hooks Reference

### `useAuth()`

```javascript
const {
  isAuthenticated,    // boolean
  user,               // { username, displayName, role } | null
  isAdmin,            // boolean
  loading,            // boolean (initial verification)
  error,              // string | null
  login,              // (username, password) => Promise
  logout,             // () => Promise
} = useAuth();
```

### `useConfig()`

```javascript
const {
  config,             // Full config object | null
  coverage,           // { start, end } | null
  timezones,          // Array | null
  colors,             // Array | null
  roles,              // Array | null
  isLoading,          // boolean
  error,              // string | null
  saveConfig,         // (config) => Promise
} = useConfig();
```

### `useScheduleSync()`

```javascript
const {
  staff,              // Staff array
  setStaff,           // Setter (marks unsaved)
  blocks,             // Blocks object
  setBlocks,          // Setter (marks unsaved)
  version,            // Current version number
  hasUnsavedChanges,  // boolean
  hasConflict,        // boolean
  isSaving,           // boolean
  syncError,          // string | null
  save,               // () => Promise
  refreshFromServer,  // () => Promise
} = useScheduleSync();
```

### `useStaffManager()`

```javascript
const {
  selectedStaff,              // Staff object | null
  displayTimezone,            // IANA ID string
  hiddenStaff,                // Set of staff IDs
  hiddenRoles,                // Set of "staffId-roleId"
  hiddenGlobalRoles,          // Set of role IDs
  selectStaffMember,          // (staff) => void
  setDisplayTimezone,         // (tz) => void
  toggleStaffVisibility,      // (staffId) => void
  toggleRoleVisibility,       // (staffId, roleId) => void
  toggleGlobalRoleVisibility, // (roleId) => void
  showAllStaff,               // () => void
} = useStaffManager({ staff, setStaff, removeStaffBlocks, colors, timezones });
```

### `useDragSelection()`

```javascript
const {
  isDragging,         // boolean
  selectionRect,      // { startDay, startHour, endDay, endHour } | null
  handleMouseDown,    // (day, hour) => void
  handleMouseEnter,   // (day, hour) => void
  handleMouseUp,      // () => void
} = useDragSelection({
  isEditMode,
  selectedStaff,
  selectedRole,
  blocks,
  updateBlocks,
  displayTimezone,
});
```

---

## Seeding the Database

### Option 1: API Setup Endpoints

```bash
# Create initial users
curl -X POST https://your-app.vercel.app/api/auth/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      { "username": "admin", "password": "secret", "displayName": "Admin", "role": "admin" }
    ]
  }'

# Seed configuration
curl -X POST https://your-app.vercel.app/api/config/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "config": { ... } }'
```

### Option 2: Upstash Dashboard

1. Go to your Upstash Redis dashboard
2. Use the CLI or Data Browser
3. Set keys directly with JSON values from `upstash_data/` files

---

## Responsive Breakpoints

```css
/* Tailwind breakpoints used */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
```

### Pattern: Mobile/Desktop Variants

```jsx
{/* Desktop only */}
<div className="hidden md:block">...</div>

{/* Mobile only */}
<div className="md:hidden">...</div>
```

### Mobile Touch Targets

```jsx
<button className="py-2.5 px-4">  {/* Larger touch area */}
<Icon className="w-5 h-5 sm:w-4 sm:h-4" />  {/* Larger on mobile */}
```

---

## Common Patterns

### Dynamic Colors from Database

Tailwind's JIT compiler won't generate classes for colors stored in the database. Use inline styles with hex values:

```jsx
// Won't work - Tailwind doesn't see this class
<div className={`bg-${color.name}-500`} />

// Works - inline style with hex
<div style={{ backgroundColor: color.hex }} />
```

### Error Handling

```javascript
try {
  await api.save(data);
} catch (e) {
  if (e instanceof AuthError) {
    // 401/403 - redirect to login
  } else if (e instanceof ConflictError) {
    // 409 - show conflict UI
  } else {
    // Generic error
    setError(e.message);
  }
}
```

---

## Security Notes

- Passwords: bcrypt with 10 salt rounds
- Tokens: 256-bit cryptographically random hex
- Token storage: `localStorage` (persists across browser sessions)
- Admin validation: Server-side on every protected endpoint
- Setup endpoints: Protected by separate `ADMIN_SETUP_KEY`
- Self-deletion: Prevented at API level
- Last admin: Cannot be deleted

---

## Troubleshooting

### "Cannot find module" in Vercel Functions

Ensure `api/_lib/` imports use relative paths:
```javascript
import { redis } from './_lib/redis.js';  // Correct
import { redis } from '@/api/_lib/redis'; // Won't work
```

### Redis connection issues

Check environment variables are set in Vercel dashboard, not just `.env.local`.

### Timezone offset is wrong

Ensure you're using IANA IDs, not abbreviations:
```javascript
'America/New_York'  // Correct
'EST'               // Won't work
```

### Tailwind classes not applying

Dynamic classes must exist in source code for JIT. Use inline styles for database-driven colors.
