import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';

// Common IANA timezones for the dropdown
const COMMON_TIMEZONES = [
  { id: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { id: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { id: 'Asia/Dubai', label: 'Dubai (GST)' },
  { id: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { id: 'Europe/Athens', label: 'Athens (EET)' },
  { id: 'Europe/Paris', label: 'Paris (CET)' },
  { id: 'Europe/London', label: 'London (GMT)' },
  { id: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { id: 'America/New_York', label: 'New York (ET)' },
  { id: 'America/Chicago', label: 'Chicago (CT)' },
  { id: 'America/Denver', label: 'Denver (MT)' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { id: 'Pacific/Honolulu', label: 'Honolulu (HST)' },
];

export const TimezonesTab = ({ timezones = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTimezone, setNewTimezone] = useState({ id: '', label: '' });
  const [editLabel, setEditLabel] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleAdd = () => {
    if (!newTimezone.id || !newTimezone.label) return;

    // Check for duplicates
    if (timezones.some(tz => tz.id === newTimezone.id)) {
      alert('This timezone already exists');
      return;
    }

    onChange([...timezones, { id: newTimezone.id, label: newTimezone.label }]);
    setNewTimezone({ id: '', label: '' });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    if (!window.confirm('Remove this timezone from the list?')) return;
    onChange(timezones.filter((_, i) => i !== index));
  };

  const handleEditStart = (index) => {
    setEditingIndex(index);
    setEditLabel(timezones[index].label);
  };

  const handleEditSave = (index) => {
    if (!editLabel.trim()) return;
    const updated = [...timezones];
    updated[index] = { ...updated[index], label: editLabel };
    onChange(updated);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditLabel('');
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...timezones];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTimezoneSelect = (id) => {
    const preset = COMMON_TIMEZONES.find(tz => tz.id === id);
    setNewTimezone({
      id,
      label: preset?.label || id.split('/').pop().replace(/_/g, ' '),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Timezones</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure available timezones for the schedule display
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
            Add Timezone
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <select
                value={newTimezone.id}
                onChange={(e) => handleTimezoneSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a timezone...</option>
                {COMMON_TIMEZONES.filter(tz => !timezones.some(t => t.id === tz.id)).map((tz) => (
                  <option key={tz.id} value={tz.id}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Label
              </label>
              <input
                type="text"
                value={newTimezone.label}
                onChange={(e) => setNewTimezone(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Florida (ET)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setNewTimezone({ id: '', label: '' }); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTimezone.id || !newTimezone.label}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Timezone List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {timezones.map((tz, index) => (
            <div
              key={tz.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />

              <div className="flex-1 min-w-0">
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(index);
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                  />
                ) : (
                  <>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {tz.label}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {tz.id}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                {editingIndex === index ? (
                  <>
                    <button
                      onClick={() => handleEditSave(index)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditStart(index)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {timezones.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No timezones configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
