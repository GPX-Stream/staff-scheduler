# CLAUDE.md

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

## Project Structure

```
src/
  main.jsx          # App entry point
  index.css         # Tailwind imports
  StaffScheduler.jsx # Main application component
```

## Architecture

The entire application is a single React component (`StaffScheduler`) in `src/StaffScheduler.jsx`. Key concepts:

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
The grid supports click-and-drag to add/remove shifts. Drag state is managed via `dragStart`, `dragEnd`, and `isDragging`. The action (add vs remove) is determined by whether the starting cell already has the selected staff scheduled.
