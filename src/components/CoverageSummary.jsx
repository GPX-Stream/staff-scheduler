export const CoverageSummary = ({
  staff,
  hiddenStaff,
  getStaffHours,
  onToggleVisibility,
  onShowAll,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 sticky top-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Coverage Summary</h3>
      <p className="text-xs text-slate-400 mb-3">Click to show/hide on calendar</p>
      <div className="space-y-2">
        {staff.map(member => {
          const hours = getStaffHours(member.id);
          const isHidden = hiddenStaff.has(member.id);
          return (
            <div
              key={member.id}
              onClick={() => onToggleVisibility(member.id)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                isHidden ? 'opacity-40' : ''
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${member.color.bg} ${isHidden ? 'opacity-50' : ''}`} />
              <div className="flex-1">
                <span className={`text-sm ${isHidden ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                  {member.name}
                </span>
              </div>
              <span className={`text-sm font-semibold ${isHidden ? 'text-slate-400' : 'text-slate-800'}`}>
                {hours}h
              </span>
            </div>
          );
        })}
        {staff.length === 0 && (
          <p className="text-slate-400 text-sm">Add staff to see coverage</p>
        )}
      </div>
      {hiddenStaff.size > 0 && (
        <button
          onClick={onShowAll}
          className="mt-3 w-full text-xs text-blue-500 hover:text-blue-600 transition-colors"
        >
          Show all ({hiddenStaff.size} hidden)
        </button>
      )}
    </div>
  );
};
