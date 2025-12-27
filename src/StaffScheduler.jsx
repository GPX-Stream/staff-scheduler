import { useState, useEffect } from 'react';
import { Plus, X, Clock, Users, Trash2, Download, Edit3, Eye } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_HOURS = 168; // 7 days * 24 hours

const TIMEZONES = [
  { label: 'California (PT)', offset: -8 },
  { label: 'Dallas (CT)', offset: -6 },
  { label: 'Florida (ET)', offset: -5 },
  { label: 'UK (GMT)', offset: 0 },
  { label: 'France (CET)', offset: 1 },
  { label: 'Cambodia (ICT)', offset: 7 },
];

const COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', hex: '#3b82f6' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', hex: '#10b981' },
  { bg: 'bg-violet-500', light: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-700', hex: '#8b5cf6' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', hex: '#f59e0b' },
  { bg: 'bg-rose-500', light: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-700', hex: '#f43f5e' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', hex: '#06b6d4' },
  { bg: 'bg-orange-500', light: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', hex: '#f97316' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', hex: '#6366f1' },
];

const formatHour = (hour) => {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

// Convert local day/hour to UTC hour index (0-167)
// dayIndex: 0=Monday, 6=Sunday
// hour: 0-23
// timezoneOffset: hours from UTC (e.g., -5 for ET, +7 for Cambodia)
const localToUTC = (dayIndex, hour, timezoneOffset) => {
  const utcHour = dayIndex * 24 + hour - timezoneOffset;
  return ((utcHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
};

// Convert UTC hour index (0-167) to local day/hour
const utcToLocal = (utcHourIndex, timezoneOffset) => {
  const localHour = utcHourIndex + timezoneOffset;
  const wrapped = ((localHour % WEEK_HOURS) + WEEK_HOURS) % WEEK_HOURS;
  const dayIndex = Math.floor(wrapped / 24);
  const hour = wrapped % 24;
  return { dayIndex, hour, day: DAYS[dayIndex] };
};

// Convert display grid position to UTC hour
const displayToUTC = (dayIndex, hour, displayOffset) => {
  return localToUTC(dayIndex, hour, displayOffset);
};

const DEFAULT_STAFF = [
  { id: 1, name: 'Jin N.', color: COLORS[0], timezoneOffset: 7 },      // Cambodia
  { id: 2, name: 'Dane B.', color: COLORS[1], timezoneOffset: 0 },     // UK
  { id: 3, name: 'Jaxon B.', color: COLORS[2], timezoneOffset: -5 },   // ET
  { id: 4, name: 'Greg C.', color: COLORS[3], timezoneOffset: 1 },     // France
  { id: 5, name: 'Andy I.', color: COLORS[4], timezoneOffset: -6 },    // Dallas
  { id: 6, name: 'Alexx B.', color: COLORS[5], timezoneOffset: -5 },   // ET
  { id: 7, name: 'Jeff S.', color: COLORS[6], timezoneOffset: -5 },    // ET
];

// Generate default shift blocks - input in local time, stored as UTC
const generateDefaultBlocks = () => {
  const blocks = {};

  // Add shift in staff's local timezone, store as UTC
  const addShift = (staffId, staffOffset, days, startHour, endHour) => {
    days.forEach(day => {
      const dayIndex = DAYS.indexOf(day);
      for (let h = startHour; h < endHour; h++) {
        const utcHour = localToUTC(dayIndex, h, staffOffset);
        blocks[`${staffId}-${utcHour}`] = true;
      }
    });
  };

  const allDays = DAYS;
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const noSunday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const jaxonDays = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const gregDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Jin: 7 days, 12PM-2PM Cambodia (offset +7)
  addShift(1, 7, allDays, 12, 14);

  // Dane: 6 days (no Sunday), 10AM-5PM UK (offset 0)
  addShift(2, 0, noSunday, 10, 17);

  // Jaxon: T,W,TH,F,SA, 12PM-3PM ET (offset -5)
  addShift(3, -5, jaxonDays, 12, 15);

  // Greg: SU,M,T,W,TH,F, 3PM-7PM France (offset +1)
  addShift(4, 1, gregDays, 15, 19);

  // Andy: 7 days, 10AM-6PM CT (offset -6)
  addShift(5, -6, allDays, 10, 18);

  // Alexx: Weekdays only, 9AM-5PM ET (offset -5)
  addShift(6, -5, weekdays, 9, 17);

  // Jeff: Weekdays only, 9AM-5PM ET (offset -5)
  addShift(7, -5, weekdays, 9, 17);

  return blocks;
};

const DEFAULT_BLOCKS = generateDefaultBlocks();

const getTimezoneLabel = (offset) => {
  const tz = TIMEZONES.find(t => t.offset === offset);
  return tz ? tz.label : `UTC${offset >= 0 ? '+' : ''}${offset}`;
};

export default function StaffScheduler() {
  const [staff, setStaff] = useState(DEFAULT_STAFF);
  const [newStaffName, setNewStaffName] = useState('');
  const [displayOffset, setDisplayOffset] = useState(-5); // Default to ET
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(DEFAULT_STAFF[0]);
  const [isEditMode, setIsEditMode] = useState(true);
  const [hiddenStaff, setHiddenStaff] = useState(new Set());

  const handleMouseUpComplete = () => {
    if (!isDragging || !dragStart || !dragEnd || !selectedStaff) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startDayIdx = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const endDayIdx = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);

    const newBlocks = { ...blocks };

    // Check if we're removing (if start cell already has this staff)
    const startUTC = displayToUTC(dragStart.dayIndex, dragStart.hour, displayOffset);
    const startKey = `${selectedStaff.id}-${startUTC}`;
    const isRemoving = newBlocks[startKey];

    for (let dayIdx = startDayIdx; dayIdx <= endDayIdx; dayIdx++) {
      for (let h = startHour; h <= endHour; h++) {
        const utcHour = displayToUTC(dayIdx, h, displayOffset);
        const key = `${selectedStaff.id}-${utcHour}`;
        if (isRemoving) {
          delete newBlocks[key];
        } else {
          newBlocks[key] = true;
        }
      }
    }
    setBlocks(newBlocks);

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUpComplete();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  });

  const selectStaffMember = (member) => {
    setSelectedStaff(member);
    setDisplayOffset(member.timezoneOffset);
  };

  const addStaff = () => {
    if (newStaffName.trim()) {
      const newMember = {
        id: Date.now(),
        name: newStaffName.trim(),
        color: COLORS[staff.length % COLORS.length],
        timezoneOffset: displayOffset,
      };
      setStaff([...staff, newMember]);
      setNewStaffName('');
      if (!selectedStaff) selectStaffMember(newMember);
    }
  };

  const removeStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
    const newBlocks = { ...blocks };
    Object.keys(newBlocks).forEach(key => {
      if (key.startsWith(`${id}-`)) delete newBlocks[key];
    });
    setBlocks(newBlocks);
    if (selectedStaff?.id === id) {
      const remaining = staff.find(s => s.id !== id);
      if (remaining) {
        selectStaffMember(remaining);
      } else {
        setSelectedStaff(null);
      }
    }
  };

  const handleMouseDown = (dayIndex, hour) => {
    if (!selectedStaff || !isEditMode) return;
    setIsDragging(true);
    setDragStart({ dayIndex, hour });
    setDragEnd({ dayIndex, hour });
  };

  const handleMouseUp = () => {
    handleMouseUpComplete();
  };

  const handleMouseEnter = (dayIndex, hour) => {
    if (!isDragging) return;
    setDragEnd({ dayIndex, hour });
  };

  const isInDragSelection = (dayIndex, hour) => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const startDayIdx = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const endDayIdx = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);

    return dayIndex >= startDayIdx && dayIndex <= endDayIdx && hour >= startHour && hour <= endHour;
  };

  // Get all staff members who have a shift at this display position (excluding hidden)
  const getCellContent = (dayIndex, hour) => {
    const utcHour = displayToUTC(dayIndex, hour, displayOffset);
    return staff.filter(s => blocks[`${s.id}-${utcHour}`] && !hiddenStaff.has(s.id));
  };

  const toggleStaffVisibility = (staffId) => {
    setHiddenStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const clearAll = () => {
    setBlocks({});
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Staff Schedule', margin, margin + 5);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Timezone: ${getTimezoneLabel(displayOffset)}`, margin, margin + 12);

    // Calculate grid dimensions
    const gridStartY = margin + 20;
    const gridStartX = margin + 15;
    const colWidth = (pageWidth - gridStartX - margin) / 7;
    const rowHeight = 4;
    const headerHeight = 8;

    // Draw header row (days)
    pdf.setFillColor(248, 250, 252);
    pdf.rect(gridStartX, gridStartY, colWidth * 7, headerHeight, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    DAYS.forEach((day, i) => {
      pdf.text(day.substring(0, 3), gridStartX + i * colWidth + colWidth / 2, gridStartY + 5, { align: 'center' });
    });

    // Draw time labels and grid
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);

    for (let hour = 0; hour < 24; hour++) {
      const y = gridStartY + headerHeight + hour * rowHeight;

      // Time label
      pdf.text(formatHour(hour), margin, y + 3);

      // Draw cells
      DAYS.forEach((day, dayIdx) => {
        const x = gridStartX + dayIdx * colWidth;
        const cellStaff = getCellContent(dayIdx, hour);

        // Draw cell border
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(x, y, colWidth, rowHeight);

        // Fill with staff colors
        if (cellStaff.length > 0) {
          const staffWidth = colWidth / cellStaff.length;
          cellStaff.forEach((s, idx) => {
            const hex = s.color.hex;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            pdf.setFillColor(r, g, b);
            pdf.rect(x + idx * staffWidth, y, staffWidth, rowHeight, 'F');
          });
        }
      });
    }

    // Legend
    const legendY = gridStartY + headerHeight + 24 * rowHeight + 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Staff:', margin, legendY);

    pdf.setFont('helvetica', 'normal');
    let legendX = margin + 12;
    staff.forEach((s) => {
      const hours = Object.keys(blocks).filter(k => k.startsWith(`${s.id}-`)).length;
      if (hours > 0) {
        const hex = s.color.hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        pdf.setFillColor(r, g, b);
        pdf.rect(legendX, legendY - 3, 4, 4, 'F');
        pdf.text(`${s.name} (${hours}h)`, legendX + 6, legendY);
        legendX += pdf.getTextWidth(`${s.name} (${hours}h)`) + 12;
      }
    });

    pdf.save('staff-schedule.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Staff Schedule Planner</h1>
            <p className="text-slate-500 text-sm">Plan your weekly staff coverage across time zones</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isEditMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isEditMode ? 'Editing' : 'View Only'}
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {isEditMode && (
            <div className="lg:col-span-3 space-y-4 order-1">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-700 text-sm">Display Timezone</h2>
                </div>
                <select
                  value={displayOffset}
                  onChange={(e) => setDisplayOffset(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.label} value={tz.offset}>{tz.label}</option>
                  ))}
                </select>
              </div>

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
                    onKeyDown={(e) => e.key === 'Enter' && addStaff()}
                    placeholder="Add staff name..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addStaff}
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
                      onClick={() => selectStaffMember(member)}
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
                          const newOffset = Number(e.target.value);
                          const updated = staff.map(s =>
                            s.id === member.id ? { ...s, timezoneOffset: newOffset } : s
                          );
                          setStaff(updated);
                          if (selectedStaff?.id === member.id) {
                            setSelectedStaff({ ...member, timezoneOffset: newOffset });
                            setDisplayOffset(newOffset);
                          }
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
                          removeStaff(member.id);
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
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Shifts
              </button>
            </div>
          )}

          <div className={`${isEditMode ? 'lg:col-span-6' : 'lg:col-span-9'} bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden order-2`}>
            {!isEditMode && (
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">Viewing in:</span>
                  <select
                    value={displayOffset}
                    onChange={(e) => setDisplayOffset(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.label} value={tz.offset}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
                          <td
                            key={`${day}-${hour}`}
                            className={`px-1 py-0.5 border-b border-slate-100 transition-colors select-none ${
                              isEditMode ? 'cursor-pointer' : ''
                            } ${
                              inSelection
                                ? `${selectedStaff?.color.light} ${selectedStaff?.color.border} border-2`
                                : isEditMode ? 'hover:bg-slate-100' : ''
                            }`}
                            onMouseDown={() => handleMouseDown(dayIndex, hour)}
                            onMouseUp={handleMouseUp}
                            onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
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
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar - Coverage Summary */}
          <div className="lg:col-span-3 order-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 sticky top-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Coverage Summary</h3>
              <p className="text-xs text-slate-400 mb-3">Click to show/hide on calendar</p>
              <div className="space-y-2">
                {staff.map(member => {
                  const hours = Object.keys(blocks).filter(k => k.startsWith(`${member.id}-`)).length;
                  const isHidden = hiddenStaff.has(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleStaffVisibility(member.id)}
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
                  onClick={() => setHiddenStaff(new Set())}
                  className="mt-3 w-full text-xs text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Show all ({hiddenStaff.size} hidden)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
