import { useState } from 'react';
import { Plus, X, Users, Trash2 } from 'lucide-react';
import { TIMEZONES } from '../constants';
import { getTimezoneLabel } from '../utils';

export const StaffList = ({
  staff,
  selectedStaff,
  onSelectStaff,
  onAddStaff,
  onRemoveStaff,
  onUpdateTimezone,
  onClearAll,
}) => {
  const [newStaffName, setNewStaffName] = useState('');

  const handleAddStaff = () => {
    if (newStaffName.trim()) {
      onAddStaff(newStaffName);
      setNewStaffName('');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 text-sm">Staff Members</h2>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
            placeholder="Add staff name..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddStaff}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {staff.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">No staff added yet</p>
          )}
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => onSelectStaff(member)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                selectedStaff?.id === member.id
                  ? `${member.color.light} ${member.color.border} border-2`
                  : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${member.color.bg}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{member.name}</p>
                <p className="text-xs text-slate-400">{getTimezoneLabel(member.timezoneOffset)}</p>
              </div>
              <select
                value={member.timezoneOffset}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateTimezone(member.id, Number(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-1 py-0.5 bg-white border border-slate-200 rounded"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.label} value={tz.offset}>{tz.label}</option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveStaff(member.id);
                }}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedStaff && (
        <div className={`${selectedStaff.color.light} rounded-xl p-4 border-2 ${selectedStaff.color.border}`}>
          <p className="text-sm font-medium text-slate-700">
            Scheduling: <span className={selectedStaff.color.text}>{selectedStaff.name}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Click and drag across days/hours to add or remove shifts</p>
        </div>
      )}

      <button
        onClick={onClearAll}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Clear All Shifts
      </button>
    </>
  );
};
