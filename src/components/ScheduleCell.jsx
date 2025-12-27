import { memo } from 'react';
import { getTimezoneLabel } from '../utils';

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
}) => {
  return (
    <td
      className={`px-1 py-0.5 border-b border-slate-100 transition-colors select-none ${
        isEditMode ? 'cursor-pointer' : ''
      } ${
        inSelection
          ? `${selectedStaff?.color.light} ${selectedStaff?.color.border} border-2`
          : isEditMode ? 'hover:bg-slate-100' : ''
      }`}
      onMouseDown={() => onMouseDown(dayIndex, hour)}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(dayIndex, hour)}
    >
      <div className="min-h-[24px] flex flex-wrap gap-0.5">
        {cellStaff.map(s => (
          <div
            key={s.id}
            className={`${s.color.bg} text-white text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-full`}
            title={`${s.name} (${getTimezoneLabel(s.timezoneOffset)})`}
          >
            {s.name.split(' ')[0]}
          </div>
        ))}
      </div>
    </td>
  );
});

ScheduleCell.displayName = 'ScheduleCell';
