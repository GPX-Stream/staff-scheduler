import { Trash2, UserX } from 'lucide-react';

export const StaffList = ({
  staff,
  selectedStaff,
  onSelectStaff,
  onClearAll,
  onClearStaff,
  roles = [],
  selectedRole,
  onSelectRole,
}) => {
  // Get inline styles for selected staff color
  const getSelectedStyles = () => {
    if (!selectedStaff?.color?.hex) return {};
    return {
      backgroundColor: `${selectedStaff.color.hex}20`,
      borderColor: selectedStaff.color.hex,
    };
  };

  return (
    <>
      <div
        className={`rounded-xl p-4 border-2 ${selectedStaff ? '' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
        style={selectedStaff ? getSelectedStyles() : {}}
      >
        <span className="block font-medium text-slate-700 dark:text-slate-200 text-sm text-center">Scheduling</span>
        <div className="flex flex-col gap-1 text-sm mt-2">
          <select
            value={selectedStaff?.id ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              const member = staff.find(s => String(s.id) === id);
              onSelectStaff(member || null);
            }}
            className={`w-full px-2 py-1 border rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedStaff
                ? ''
                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
            }`}
            style={selectedStaff ? {
              backgroundColor: `${selectedStaff.color.hex}20`,
              borderColor: selectedStaff.color.hex,
              color: selectedStaff.color.hex,
            } : {}}
          >
            {staff.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-slate-400 text-center">as</span>
          <select
            value={selectedRole}
            onChange={(e) => onSelectRole(e.target.value)}
            disabled={!selectedStaff}
            className="w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {[...roles].sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999)).map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Click and drag to add/remove shifts</p>
      </div>

      <button
        onClick={() => {
          if (selectedStaff && window.confirm(`Clear all shifts for ${selectedStaff.name}?`)) {
            onClearStaff(selectedStaff.id);
          }
        }}
        disabled={!selectedStaff}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserX className="w-4 h-4" />
        Clear {selectedStaff?.name || 'Staff'}
      </button>

      <button
        onClick={() => {
          if (window.confirm('Clear ALL shifts for ALL staff? This cannot be undone.')) {
            onClearAll();
          }
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Clear All Shifts
      </button>
    </>
  );
};
