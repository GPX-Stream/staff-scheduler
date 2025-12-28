import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';

// Generate Tailwind classes from hex color
const generateColorClasses = (hex, name) => {
  return {
    name,
    hex,
    bg: `bg-${name}-500`,
    light: `bg-${name}-100`,
    border: `border-${name}-500`,
    text: `text-${name}-700`,
  };
};

export const ColorsTab = ({ colors = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newColor, setNewColor] = useState({ name: '', hex: '#3b82f6' });
  const [editColor, setEditColor] = useState({ name: '', hex: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleAdd = () => {
    if (!newColor.name || !newColor.hex) return;

    // Check for duplicate names
    if (colors.some(c => c.name.toLowerCase() === newColor.name.toLowerCase())) {
      alert('A color with this name already exists');
      return;
    }

    const colorWithClasses = generateColorClasses(newColor.hex, newColor.name.toLowerCase());
    onChange([...colors, colorWithClasses]);
    setNewColor({ name: '', hex: '#3b82f6' });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    if (!window.confirm('Remove this color? Staff using this color will need to be reassigned.')) return;
    onChange(colors.filter((_, i) => i !== index));
  };

  const handleEditStart = (index) => {
    setEditingIndex(index);
    setEditColor({ name: colors[index].name, hex: colors[index].hex });
  };

  const handleEditSave = (index) => {
    if (!editColor.name.trim() || !editColor.hex) return;

    const updated = [...colors];
    updated[index] = generateColorClasses(editColor.hex, editColor.name.toLowerCase());
    onChange(updated);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditColor({ name: '', hex: '' });
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...colors];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Color Palette</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure colors available for staff members
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
            Add Color
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Color Name
              </label>
              <input
                type="text"
                value={newColor.name}
                onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., teal"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hex Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor(prev => ({ ...prev, hex: e.target.value }))}
                  className="w-12 h-10 rounded border border-slate-200 dark:border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={newColor.hex}
                  onChange={(e) => setNewColor(prev => ({ ...prev, hex: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Preview:</span>
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: newColor.hex }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setNewColor({ name: '', hex: '#3b82f6' }); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newColor.name || !newColor.hex}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Color Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700">
          {colors.map((color, index) => (
            <div
              key={color.name}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-800 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-slate-400 cursor-grab flex-shrink-0" />

              {editingIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor.hex}
                    onChange={(e) => setEditColor(prev => ({ ...prev, hex: e.target.value }))}
                    className="w-8 h-8 rounded border border-slate-200 dark:border-slate-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editColor.name}
                    onChange={(e) => setEditColor(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(index);
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                  />
                </div>
              ) : (
                <>
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                      {color.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {color.hex}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1 flex-shrink-0">
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
        {colors.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No colors configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
