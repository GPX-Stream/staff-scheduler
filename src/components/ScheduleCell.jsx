import { memo } from 'react';
import { getRoleShortLabel, getRoleColorHex } from '../constants/roles';

export const ScheduleCell = memo(({
  dayIndex,
  hour,
  cellStaff,
  isEditMode,
  inSelection,
  selectedStaff,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  isCurrentHour,
  currentMinute,
  isCurrentDay,
  showTimeLine,
  timeLinePosition,
  isAlternateDay,
  inCoverage,
  roles,
}) => {
  // Determine background based on coverage and alternate day
  const getBgClass = () => {
    if (inSelection) return `${selectedStaff?.color.light} ${selectedStaff?.color.border} border-2`;
    if (inCoverage && isAlternateDay) return 'bg-blue-200/70 dark:bg-blue-800/40';
    if (inCoverage) return 'bg-blue-100 dark:bg-blue-900/30';
    if (isAlternateDay) return 'bg-slate-100/50 dark:bg-slate-700/50';
    return 'bg-white dark:bg-slate-800';
  };

  return (
    <div
      className={`schedule-cell flex-grow basis-0 px-1 py-0.5 border-b border-slate-100 dark:border-slate-700 transition-colors select-none relative overflow-visible flex flex-wrap gap-1 items-start content-start ${
        isEditMode ? 'cursor-pointer' : ''
      } ${getBgClass()} ${
        !inSelection && isEditMode ? 'hover:bg-slate-200/50 dark:hover:bg-slate-600/50' : ''
      }`}
      onMouseDown={() => onMouseDown(dayIndex, hour)}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(dayIndex, hour)}
    >
      {/* Current time line - rendered from first cell, spans all 7 days */}
      {showTimeLine && (
        <div
          className="absolute left-0 z-10 pointer-events-none"
          style={{
            top: `${timeLinePosition}%`,
            width: '700%', // Span all 7 day columns
          }}
        >
          <div className="h-0.5 bg-red-500 w-full" />
        </div>
      )}
      {/* Red dot marker on current day */}
      {isCurrentHour && isCurrentDay && (
        <div
          className="absolute right-2 z-20 pointer-events-none"
          style={{ top: `${timeLinePosition}%` }}
        >
          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow" />
        </div>
      )}
      {cellStaff.map(s => {
        const roleColorHex = getRoleColorHex(roles, s.role);
        return (
          <div
            key={`${s.id}-${s.role}`}
            className="staff-pill text-[11px] leading-tight px-1.5 py-0.5 rounded font-medium flex items-center gap-1 min-w-[75px] max-w-[50%]"
            style={{
              backgroundColor: `${roleColorHex}80`, // 50% opacity
            }}
            title={`${s.name} - ${getRoleShortLabel(roles, s.role)}`}
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-slate-900 dark:text-slate-100 font-semibold">{s.name.split(' ')[0]}</span>
              <span className="text-[9px] text-slate-700 dark:text-slate-300 truncate">{getRoleShortLabel(roles, s.role)}</span>
            </div>
            {/* <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color.hex }} /> */}
          </div>
        );
      })}
    </div>
  );
});

ScheduleCell.displayName = 'ScheduleCell';
