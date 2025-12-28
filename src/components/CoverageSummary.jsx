import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getRoleShortLabel, getRoleColorHex } from '../constants/roles';
import { getTimezoneLabel } from '../utils';

export const CoverageSummary = ({
  staff,
  blocks,
  hiddenStaff,
  hiddenRoles,
  hiddenGlobalRoles,
  onToggleVisibility,
  onToggleRoleVisibility,
  onToggleGlobalRoleVisibility,
  onShowAll,
  roles = [],
  timezones = [],
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [rolesExpanded, setRolesExpanded] = useState(true);
  const [staffExpanded, setStaffExpanded] = useState(true);

  // Detect screen size and auto-close when wrapped
  useEffect(() => {
    const checkScreenSize = () => {
      const large = window.innerWidth >= 1024; // lg breakpoint
      const wasLarge = isLargeScreen;
      setIsLargeScreen(large);
      // Auto-close when transitioning to small screen
      if (wasLarge && !large) {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    // Set initial open state based on screen size
    setIsOpen(window.innerWidth >= 1024);

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  // Calculate hours by role for a staff member
  const getStaffHoursByRole = (staffId, defaultRole) => {
    const hoursByRole = {};

    Object.entries(blocks).forEach(([key, value]) => {
      if (key.startsWith(`${staffId}-`)) {
        // value is either role string or true (for backwards compat/default role)
        const role = value === true ? (defaultRole || 'tier1') : value;
        hoursByRole[role] = (hoursByRole[role] || 0) + 1;
      }
    });

    return hoursByRole;
  };

  // Calculate aggregate hours and days by role across all staff
  const aggregateByRole = useMemo(() => {
    const result = {};

    staff.forEach(member => {
      Object.entries(blocks).forEach(([key, value]) => {
        if (key.startsWith(`${member.id}-`)) {
          const role = value === true ? (member.defaultRole || 'tier1') : value;
          const utcHour = parseInt(key.split('-')[1], 10);
          const dayIndex = Math.floor(utcHour / 24);

          if (!result[role]) {
            result[role] = { hours: 0, days: new Set() };
          }
          result[role].hours += 1;
          result[role].days.add(dayIndex);
        }
      });
    });

    return result;
  }, [staff, blocks]);

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Toggle button component
  const ToggleButton = () => (
    <button
      onClick={toggleDrawer}
      className="flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      style={{
        // Desktop: vertical pill on the left edge
        // Mobile: horizontal pill on the top edge
        ...(isLargeScreen
          ? { width: '24px', height: '48px', borderRadius: '8px 0 0 8px', borderRight: 'none' }
          : { width: '48px', height: '24px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }
        ),
      }}
    >
      {isLargeScreen ? (
        isOpen ? <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      ) : (
        isOpen ? <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="relative flex lg:flex-row flex-col items-center lg:items-start">
      {/* Toggle button */}
      <div className={`flex-shrink-0 ${isLargeScreen ? '' : 'self-center'}`}>
        <ToggleButton />
      </div>

      {/* Drawer content */}
      <div
        className={`bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ease-in-out ${
          isLargeScreen
            ? `rounded-tr-xl rounded-br-xl rounded-bl-xl ${isOpen ? 'w-72 opacity-100 mr-4 md:mr-6' : 'w-0 opacity-0 border-0'}`
            : `rounded-xl ${isOpen ? 'max-h-[50vh] opacity-100 mb-4 md:mb-6' : 'max-h-0 opacity-0 border-0'}`
        }`}
      >
        <div className="p-4 w-72">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Coverage Summary</h3>
          <p className="text-xs text-slate-400 mb-3">Click to show/hide</p>
          <div className="space-y-4 overflow-y-auto">
            {/* Roles Section */}
            <div>
              <button
                onClick={() => setRolesExpanded(prev => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <span>Roles</span>
                {rolesExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {rolesExpanded && <div className="space-y-1">
                {roles.map(role => {
                  const roleData = aggregateByRole[role.id];
                  const totalHours = roleData?.hours || 0;
                  const daysCount = roleData?.days?.size || 0;
                  const avgPerDay = daysCount > 0 ? totalHours / daysCount : 0;
                  const isHidden = hiddenGlobalRoles.has(role.id);
                  const colorHex = getRoleColorHex(roles, role.id);

                  return (
                    <div
                      key={role.id}
                      onClick={() => onToggleGlobalRoleVisibility(role.id)}
                      className={`py-1.5 px-2 rounded cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        isHidden ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHidden ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className={`text-sm font-medium flex-1 truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                          {getRoleShortLabel(roles, role.id)}
                        </span>
                        <span className={`text-sm text-right flex-shrink-0 ${isHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {daysCount > 0 ? (
                            <>
                              <span className="font-semibold">{daysCount}</span>
                              <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> days, </span>
                              <span className="font-semibold">{avgPerDay.toFixed(1)}</span>
                              <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> h/day</span>
                            </>
                          ) : (
                            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {roles.length === 0 && (
                  <p className="text-slate-400 text-xs px-2">No roles configured</p>
                )}
              </div>}
            </div>

            {/* Staff Section */}
            <div>
              <button
                onClick={() => setStaffExpanded(prev => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <span>Staff</span>
                {staffExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {staffExpanded && <div className="space-y-1">
                {staff.map(member => {
                  const hoursByRole = getStaffHoursByRole(member.id, member.defaultRole);
                  const roleEntries = Object.entries(hoursByRole);
                  const totalHours = roleEntries.reduce((sum, [, hours]) => sum + hours, 0);
                  const isHidden = hiddenStaff.has(member.id);
                  const tzLabel = getTimezoneLabel(member.timezone, timezones);

                  return (
                    <div
                      key={member.id}
                      onClick={() => onToggleVisibility(member.id)}
                      className={`py-1.5 px-2 rounded cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        isHidden ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Staff name row */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHidden ? 'opacity-50' : ''}`} style={{ backgroundColor: member.color.hex }} />
                        <span className={`text-sm font-medium flex-1 truncate ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                          {member.name}
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> {tzLabel}</span>
                        </span>
                        {roleEntries.length <= 1 && (
                          <span className={`text-sm font-semibold w-10 text-right flex-shrink-0 ${isHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {totalHours}<span className="text-xs font-normal text-slate-400 dark:text-slate-500"> h</span>
                          </span>
                        )}
                      </div>

                      {/* Role breakdown rows */}
                      {roleEntries.length > 1 ? (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {roleEntries.map(([roleId, hours]) => {
                            const isRoleHidden = hiddenRoles.has(`${member.id}-${roleId}`);
                            return (
                              <div
                                key={roleId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleRoleVisibility(member.id, roleId);
                                }}
                                className={`flex items-center gap-4 text-xs hover:bg-slate-100 dark:hover:bg-slate-600 rounded px-1 -mx-1 cursor-pointer ${isRoleHidden ? 'opacity-40' : ''}`}
                              >
                                <span className={`flex-1 ${isHidden || isRoleHidden ? 'text-slate-400 line-through' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {getRoleShortLabel(roles, roleId)}
                                </span>
                                <span className={`font-medium ${isHidden || isRoleHidden ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {hours}<span className="font-normal text-slate-400 dark:text-slate-500"> h</span>
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-4 text-xs border-t border-slate-100 dark:border-slate-600 pt-0.5 mt-0.5">
                            <span className={`flex-1 font-medium ${isHidden ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              Total
                            </span>
                            <span className={`font-semibold ${isHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                              {totalHours}<span className="font-normal text-slate-400 dark:text-slate-500"> h</span>
                            </span>
                          </div>
                        </div>
                      ) : roleEntries.length === 1 ? (
                        (() => {
                          const roleId = roleEntries[0][0];
                          const isRoleHidden = hiddenRoles.has(`${member.id}-${roleId}`);
                          return (
                            <p
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRoleVisibility(member.id, roleId);
                              }}
                              className={`text-xs ml-4 hover:bg-slate-100 dark:hover:bg-slate-600 rounded px-1 -mx-1 cursor-pointer ${isHidden || isRoleHidden ? 'text-slate-400 line-through opacity-40' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                              {getRoleShortLabel(roles, roleId)}
                            </p>
                          );
                        })()
                      ) : null}
                    </div>
                  );
                })}
                {staff.length === 0 && (
                  <p className="text-slate-400 text-xs px-2">Add staff to see coverage</p>
                )}
              </div>}
            </div>
          </div>
          {(hiddenStaff.size > 0 || hiddenRoles.size > 0 || hiddenGlobalRoles.size > 0) && (
            <button
              onClick={onShowAll}
              className="mt-3 w-full text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              Show all ({hiddenStaff.size + hiddenRoles.size + hiddenGlobalRoles.size} hidden)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
