import { useState, useEffect, useCallback } from 'react';
import { X, Users, Clock, Globe, Palette, Tags } from 'lucide-react';
import { UsersTab } from './admin/UsersTab';
import { CoverageTab } from './admin/CoverageTab';
import { TimezonesTab } from './admin/TimezonesTab';
import { ColorsTab } from './admin/ColorsTab';
import { RolesTab } from './admin/RolesTab';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'coverage', label: 'Coverage', icon: Clock },
  { id: 'timezones', label: 'Timezones', icon: Globe },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'roles', label: 'Roles', icon: Tags },
];

export const AdminPanel = ({
  isOpen,
  onClose,
  config,
  saveConfig,
  onRefreshData,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [pendingConfig, setPendingConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Initialize pending config when opened
  useEffect(() => {
    if (isOpen && config) {
      setPendingConfig(JSON.parse(JSON.stringify(config)));
      setIsDirty(false);
      setError(null);
    }
  }, [isOpen, config]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDirty]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfigChange = useCallback((section, value) => {
    setPendingConfig(prev => ({
      ...prev,
      [section]: value,
    }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveConfig(pendingConfig);
      if (result.success) {
        setIsDirty(false);
        // Refresh data to pick up any config changes
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderTabContent = () => {
    if (!pendingConfig) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500 dark:text-slate-400">Loading configuration...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'users':
        return (
          <UsersTab
            config={pendingConfig}
            onRefreshData={onRefreshData}
            currentUser={currentUser}
          />
        );
      case 'coverage':
        return (
          <CoverageTab
            coverage={pendingConfig.coverage}
            onChange={(value) => handleConfigChange('coverage', value)}
          />
        );
      case 'timezones':
        return (
          <TimezonesTab
            timezones={pendingConfig.timezones}
            onChange={(value) => handleConfigChange('timezones', value)}
          />
        );
      case 'colors':
        return (
          <ColorsTab
            colors={pendingConfig.colors}
            onChange={(value) => handleConfigChange('colors', value)}
          />
        );
      case 'roles':
        return (
          <RolesTab
            roles={pendingConfig.roles}
            colors={pendingConfig.colors}
            onChange={(value) => handleConfigChange('roles', value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-6xl md:rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Admin Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-6 h-6 md:w-4 md:h-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            )}
            {isDirty && !error && (
              <span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
