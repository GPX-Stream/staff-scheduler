import { DAYS, HOURS } from '../constants';
import { formatHour, getTimezoneLabel } from '../utils';
import { displayToUTC } from '../utils';
import { ScheduleCell } from './ScheduleCell';

export const ScheduleGrid = ({
  staff,
  blocks,
  displayOffset,
  hiddenStaff,
  selectedStaff,
  isEditMode,
  dragHandlers,
}) => {
  const { handleMouseDown, handleMouseUp, handleMouseEnter, isInDragSelection } = dragHandlers;

  // Get all staff members who have a shift at this display position (excluding hidden)
  const getCellContent = (dayIndex, hour) => {
    const utcHour = displayToUTC(dayIndex, hour, displayOffset);
    return staff.filter(s => blocks[`${s.id}-${utcHour}`] && !hiddenStaff.has(s.id));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="sticky left-0 bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 w-20">
              {getTimezoneLabel(displayOffset)}
            </th>
            {DAYS.map(day => (
              <th key={day} className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour} className={hour % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="sticky left-0 bg-inherit px-3 py-1 text-xs text-slate-500 border-r border-slate-200 font-medium">
                {formatHour(hour)}
              </td>
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
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
