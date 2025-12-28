import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';

export const RolesTab = ({ roles = [], colors = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newRole, setNewRole] = useState({ id: '', label: '', color: '', isParent: false, parentId: '' });
  const [editRole, setEditRole] = useState({ id: '', label: '', color: '', isParent: false, parentId: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const parentRoles = roles.filter(r => r.isParent);

  const handleAdd = () => {
    if (!newRole.id || !newRole.label) return;

    // Check for duplicate IDs
    if (roles.some(r => r.id.toLowerCase() === newRole.id.toLowerCase())) {
      alert('A role with this ID already exists');
      return;
    }

    const nextSort = Math.max(...roles.map(r => r.sort || 0), 0) + 1;
    const roleToAdd = {
      id: newRole.id.toLowerCase().replace(/\s+/g, '-'),
      label: newRole.label,
      color: newRole.color || colors[0]?.name || 'blue',
      sort: nextSort,
      ...(newRole.isParent ? { isParent: true } : {}),
      ...(newRole.parentId && !newRole.isParent ? { parentId: newRole.parentId } : {}),
    };

    onChange([...roles, roleToAdd]);
    setNewRole({ id: '', label: '', color: '', isParent: false, parentId: '' });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    const role = roles[index];

    // Check if any other roles reference this as parent
    if (role.isParent && roles.some(r => r.parentId === role.id)) {
      alert('Cannot delete this role. Other roles are using it as a parent.');
      return;
    }

    if (!window.confirm(`Delete role "${role.label}"? Staff with this role will need to be reassigned.`)) return;
    onChange(roles.filter((_, i) => i !== index));
  };

  const handleEditStart = (index) => {
    const role = roles[index];
    setEditingIndex(index);
    setEditRole({
      id: role.id,
      label: role.label,
      color: role.color,
      isParent: role.isParent || false,
      parentId: role.parentId || '',
    });
  };

  const handleEditSave = (index) => {
    if (!editRole.label.trim()) return;

    const updated = [...roles];
    updated[index] = {
      ...updated[index],
      label: editRole.label,
      color: editRole.color,
      ...(editRole.isParent ? { isParent: true } : { isParent: undefined }),
      ...(editRole.parentId && !editRole.isParent ? { parentId: editRole.parentId } : { parentId: undefined }),
    };
    onChange(updated);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditRole({ id: '', label: '', color: '', isParent: false, parentId: '' });
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...roles];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);

    // Update sort orders
    updated.forEach((role, i) => {
      role.sort = i + 1;
    });

    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getColorHex = (colorName) => {
    const color = colors.find(c => c.name === colorName);
    return color?.hex || '#6b7280';
  };

  // Sort roles: parents first, then by sort order
  const sortedRoles = [...roles].sort((a, b) => {
    if (a.isParent && !b.isParent) return -1;
    if (!a.isParent && b.isParent) return 1;
    return (a.sort || 0) - (b.sort || 0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Schedule Roles</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure roles for scheduling and coverage tracking
          </p>
        </div>
        {!isAdding && (
          <div className="flex gap-2">
            <button
              onClick={() => { setNewRole({ id: '', label: '', color: '', isParent: false, parentId: '' }); setIsAdding(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              <span>Add Role</span>
            </button>
            <button
              onClick={() => { setNewRole({ id: '', label: '', color: '', isParent: true, parentId: '' }); setIsAdding(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 dark:active:bg-slate-500 transition-colors"
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              <span>Add Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-100">
            {newRole.isParent ? 'Add New Group' : 'Add New Role'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {newRole.isParent ? 'Group ID' : 'Role ID'}
              </label>
              <input
                type="text"
                value={newRole.id}
                onChange={(e) => setNewRole(prev => ({ ...prev, id: e.target.value }))}
                placeholder={newRole.isParent ? 'e.g., tech-support' : 'e.g., tier1'}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Label
              </label>
              <input
                type="text"
                value={newRole.label}
                onChange={(e) => setNewRole(prev => ({ ...prev, label: e.target.value }))}
                placeholder={newRole.isParent ? 'e.g., Technical Support' : 'e.g., Tier 1'}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <select
                value={newRole.color}
                onChange={(e) => setNewRole(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a color...</option>
                {colors.map((color) => (
                  <option key={color.name} value={color.name}>{color.name}</option>
                ))}
              </select>
            </div>
            {!newRole.isParent && parentRoles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Parent Group (optional)
                </label>
                <select
                  value={newRole.parentId}
                  onChange={(e) => setNewRole(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent</option>
                  {parentRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setNewRole({ id: '', label: '', color: '', isParent: false, parentId: '' }); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newRole.id || !newRole.label}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {newRole.isParent ? 'Add Group' : 'Add Role'}
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {sortedRoles.map((role, sortedIndex) => {
            const originalIndex = roles.findIndex(r => r.id === role.id);
            const isEditing = editingIndex === originalIndex;

            return (
              <div
                key={role.id}
                draggable
                onDragStart={() => handleDragStart(originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                  draggedIndex === originalIndex ? 'opacity-50' : ''
                } ${role.parentId ? 'pl-10' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-slate-400 cursor-grab flex-shrink-0" />

                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editRole.label}
                      onChange={(e) => setEditRole(prev => ({ ...prev, label: e.target.value }))}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <select
                      value={editRole.color}
                      onChange={(e) => setEditRole(prev => ({ ...prev, color: e.target.value }))}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {colors.map((color) => (
                        <option key={color.name} value={color.name}>{color.name}</option>
                      ))}
                    </select>
                    {!editRole.isParent && parentRoles.length > 0 && (
                      <select
                        value={editRole.parentId}
                        onChange={(e) => setEditRole(prev => ({ ...prev, parentId: e.target.value }))}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No parent</option>
                        {parentRoles.filter(p => p.id !== role.id).map((parent) => (
                          <option key={parent.id} value={parent.id}>{parent.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColorHex(role.color) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {role.label}
                        </span>
                        {role.isParent && (
                          <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                            Group
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {role.id}
                        {role.parentId && (
                          <span className="ml-2">
                            → {roles.find(r => r.id === role.parentId)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleEditSave(originalIndex)}
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
                        onClick={() => handleEditStart(originalIndex)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(originalIndex)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {roles.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No roles configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
