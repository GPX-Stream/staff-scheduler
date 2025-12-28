import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DAYS, HOURS } from '../constants';
import { formatHour } from '../utils';
import { displayToUTC, getTimezoneLabel } from '../utils';
import { ScheduleCell } from './ScheduleCell';
import { normalizeBlockValue } from '../utils/blockUtils';

// Get current time in the display timezone
const getCurrentTimeInTimezone = (timezoneId) => {
  const now = new Date();
  const options = { timeZone: timezoneId, hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'long' };
  const formatted = new Intl.DateTimeFormat('en-US', options).formatToParts(now);

  const hour = parseInt(formatted.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(formatted.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = formatted.find(p => p.type === 'weekday')?.value || 'Monday';

  // Convert weekday name to dayIndex (Monday=0, Sunday=6)
  const dayMap = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
  const dayIndex = dayMap[weekday] ?? 0;

  return { dayIndex, hour, minute };
};

const MOBILE_BREAKPOINT = 734;

export const ScheduleGrid = ({
  staff,
  blocks,
  displayTimezone,
  hiddenStaff,
  hiddenRoles,
  hiddenGlobalRoles,
  selectedStaff,
  isEditMode,
  dragHandlers,
  coverage,
  timezones,
  roles,
}) => {
  const { handleMouseDown, handleMouseUp, handleMouseEnter, isInDragSelection } = dragHandlers;

  // Track current time for the red line
  const [currentTime, setCurrentTime] = useState(() => getCurrentTimeInTimezone(displayTimezone));

  // Track container width for responsive layout
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Track collapsed days for mobile view (start with all expanded)
  const [collapsedDays, setCollapsedDays] = useState(new Set());

  const toggleDayCollapse = (dayIndex) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  };

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(getCurrentTimeInTimezone(displayTimezone));
    updateTime(); // Update immediately when timezone changes
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [displayTimezone]);

  // Track container resize for responsive layout
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(entry.contentRect.width < MOBILE_BREAKPOINT);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Check if an hour is within coverage time
  const isCoverageHour = (hour) => hour >= coverage.start && hour < coverage.end;

  // Get role sort order (default to 999 if not found)
  const getRoleSort = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.sort ?? 999;
  };

  // Get all staff members who have a shift at this display position (excluding hidden staff/roles)
  // Returns multiple entries per staff when they have multiple roles assigned
  const getCellContent = (dayIndex, hour) => {
    const utcHour = displayToUTC(dayIndex, hour, displayTimezone);
    const results = [];

    staff.forEach(s => {
      const blockValue = blocks[`${s.id}-${utcHour}`];
      if (!blockValue || hiddenStaff.has(s.id)) return;

      const staffRoles = normalizeBlockValue(blockValue, s.defaultRole || 'tier1');

      staffRoles.forEach(role => {
        if (hiddenRoles.has(`${s.id}-${role}`)) return;
        if (hiddenGlobalRoles.has(role)) return;
        results.push({ ...s, role });
      });
    });

    return results.sort((a, b) => getRoleSort(a.role) - getRoleSort(b.role));
  };

  // Calculate time line position as percentage through the hour
  const timeLinePosition = (currentTime.minute / 60) * 100;

  // Wrapper div for ResizeObserver
  return (
    <div ref={containerRef} className="h-full">
      {/* Print header - only visible when printing */}
      <div className="print-header hidden print:block text-center">
        <h1 className="text-xl font-bold text-slate-800">Staff Schedule</h1>
        <p className="text-sm text-slate-600">Timezone: {getTimezoneLabel(displayTimezone, timezones)}</p>
      </div>

      {isMobile ? (
        // Mobile layout: each day as a separate section
        <div className="schedule-grid-mobile h-full overflow-auto">
        {/* Each day as a collapsible section */}
        {DAYS.map((day, dayIndex) => {
          const isToday = dayIndex === currentTime.dayIndex;
          const isCollapsed = collapsedDays.has(dayIndex);

          return (
            <div key={day} className="schedule-mobile-day border-b border-slate-200 dark:border-slate-700">
              {/* Day header - tappable to collapse/expand */}
              <div
                onClick={() => toggleDayCollapse(dayIndex)}
                className={`sticky top-0 z-10 px-4 py-3 text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer select-none ${
                  isToday
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
                }`}
              >
                <span>
                  {day}
                  {isToday && <span className="ml-2 text-xs font-normal">(Today)</span>}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>

              {/* Hours for this day - hidden when collapsed */}
              {!isCollapsed && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {HOURS.map(hour => {
                  const inCoverage = isCoverageHour(hour);
                  const isCurrentHour = hour === currentTime.hour;
                  const cellStaff = getCellContent(dayIndex, hour);
                  const inSelection = isInDragSelection(dayIndex, hour);

                  return (
                    <div
                      key={hour}
                      className={`schedule-mobile-hour flex min-h-[3rem] ${
                        inCoverage ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'
                      } ${isCurrentHour && isToday ? 'ring-2 ring-inset ring-red-400' : ''}`}
                    >
                      {/* Hour label */}
                      <div
                        className={`w-16 flex-shrink-0 px-3 text-xs font-medium flex items-center justify-center border-r border-slate-100 dark:border-slate-700 ${
                          inCoverage ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {formatHour(hour)}
                      </div>

                      {/* Cell content */}
                      <ScheduleCell
                        dayIndex={dayIndex}
                        hour={hour}
                        cellStaff={cellStaff}
                        isEditMode={isEditMode}
                        inSelection={inSelection}
                        selectedStaff={selectedStaff}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseEnter={handleMouseEnter}
                        isCurrentHour={isCurrentHour}
                        currentMinute={currentTime.minute}
                        isCurrentDay={isToday}
                        showTimeLine={false}
                        timeLinePosition={0}
                        isAlternateDay={false}
                        roles={roles}
                        inCoverage={inCoverage}
                      />
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          );
        })}
        </div>
      ) : (
        // Desktop layout: full week grid
        <div className="schedule-grid h-full overflow-auto flex flex-col min-w-[700px]">
      {/* Header row */}
      <div className="schedule-header-row flex sticky top-0 z-10">
        <div className="schedule-header-corner w-20 flex-shrink-0 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-700">
          {getTimezoneLabel(displayTimezone, timezones)}
        </div>
        {DAYS.map((day, dayIndex) => {
          const isToday = dayIndex === currentTime.dayIndex;
          return (
            <div
              key={day}
              className={`schedule-header-day flex-1 px-2 py-2 text-left text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 flex items-center ${
                dayIndex % 2 === 1 ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-800'
              } ${isToday ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-600 dark:text-slate-400'}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      {HOURS.map(hour => {
        const inCoverage = isCoverageHour(hour);
        const isCurrentHour = hour === currentTime.hour;

        return (
          <div key={hour} className="schedule-hour-row flex min-h-[2.5rem] flex-grow flex-shrink-0">
            {/* Time column */}
            <div
              className={`schedule-hour-label w-20 flex-shrink-0 px-3 text-xs border-r border-b border-slate-200 dark:border-slate-700 font-medium flex items-center ${
                inCoverage ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {formatHour(hour)}
            </div>

            {/* Day cells */}
            {DAYS.map((day, dayIndex) => {
              const cellStaff = getCellContent(dayIndex, hour);
              const inSelection = isInDragSelection(dayIndex, hour);

              return (
                <ScheduleCell
                  key={`${day}-${hour}`}
                  dayIndex={dayIndex}
                  hour={hour}
                  cellStaff={cellStaff}
                  isEditMode={isEditMode}
                  inSelection={inSelection}
                  selectedStaff={selectedStaff}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseEnter={handleMouseEnter}
                  isCurrentHour={isCurrentHour}
                  currentMinute={currentTime.minute}
                  isCurrentDay={dayIndex === currentTime.dayIndex}
                  showTimeLine={dayIndex === 0 && isCurrentHour}
                  timeLinePosition={timeLinePosition}
                  isAlternateDay={dayIndex % 2 === 1}
                  roles={roles}
                  inCoverage={inCoverage}
                />
              );
            })}
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
};
