import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getRoleShortLabel, getRoleColorHex } from '../constants/roles';
import { getTimezoneLabel } from '../utils';
import { normalizeBlockValue } from '../utils/blockUtils';

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
  const [collapsedParentRoles, setCollapsedParentRoles] = useState(new Set());

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
  // Calculate hours by role for a staff member (proportional based on visible roles only)
  // Returns { [roleId]: { hours, isHidden } } for all roles
  const getStaffHoursByRole = (staffId, defaultRole, staffHiddenRoles = new Set()) => {
    const hoursByRole = {};

    Object.entries(blocks).forEach(([key, value]) => {
      if (key.startsWith(`${staffId}-`)) {
        const allRoles = normalizeBlockValue(value, defaultRole || 'tier1');
        // Filter to only visible roles for this block
        const visibleRoles = allRoles.filter(role => !staffHiddenRoles.has(`${staffId}-${role}`));

        // Calculate hours for visible roles (divided by visible count)
        if (visibleRoles.length > 0) {
          const hoursPerRole = 1 / visibleRoles.length;
          visibleRoles.forEach(role => {
            if (!hoursByRole[role]) hoursByRole[role] = { hours: 0, isHidden: false };
            hoursByRole[role].hours += hoursPerRole;
          });
        }

        // Track hidden roles (with 0 hours since they're excluded from calculation)
        allRoles.forEach(role => {
          if (staffHiddenRoles.has(`${staffId}-${role}`)) {
            if (!hoursByRole[role]) hoursByRole[role] = { hours: 0, isHidden: true };
            hoursByRole[role].isHidden = true;
          }
        });
      }
    });

    return hoursByRole;
  };

  // Get total clock hours for a staff member (actual blocks, not proportional)
  const getClockHours = (staffId) => {
    return Object.keys(blocks).filter(k => k.startsWith(`${staffId}-`)).length;
  };

  // Calculate aggregate hours and days by role across all staff (unique coverage hours)
  const aggregateByRole = useMemo(() => {
    const result = {};

    staff.forEach(member => {
      Object.entries(blocks).forEach(([key, value]) => {
        if (key.startsWith(`${member.id}-`)) {
          const staffRoles = normalizeBlockValue(value, member.defaultRole || 'tier1');
          const utcHour = parseInt(key.split('-')[1], 10);
          const dayIndex = Math.floor(utcHour / 24);

          staffRoles.forEach(role => {
            if (!result[role]) {
              result[role] = { coveredHours: new Set(), days: new Set() };
            }
            // Track unique hour slots per role (not per person)
            result[role].coveredHours.add(utcHour);
            result[role].days.add(dayIndex);
          });
        }
      });
    });

    // Convert Sets to counts
    Object.keys(result).forEach(role => {
      result[role].hours = result[role].coveredHours.size;
      delete result[role].coveredHours;
    });

    return result;
  }, [staff, blocks]);

  // Group roles into hierarchy (parents with children, standalone roles)
  const roleHierarchy = useMemo(() => {
    const parentRoles = roles.filter(r => r.isParent);
    const childRoles = roles.filter(r => r.parentId);
    const standaloneRoles = roles.filter(r => !r.isParent && !r.parentId);

    // Build hierarchy with parent -> children mapping
    const hierarchy = [];

    // Add parent roles with their children
    parentRoles.forEach(parent => {
      const children = childRoles.filter(r => r.parentId === parent.id);
      hierarchy.push({ ...parent, children });
    });

    // Add standalone roles (no parent, not a parent)
    standaloneRoles.forEach(role => {
      hierarchy.push({ ...role, children: [] });
    });

    return hierarchy;
  }, [roles]);

  // Calculate aggregate data for parent roles (unique coverage hours across all children)
  const parentAggregateByRole = useMemo(() => {
    const result = {};

    roleHierarchy.forEach(item => {
      if (item.isParent && item.children.length > 0) {
        // Collect all unique hours covered by any child role
        const coveredHours = new Set();
        const days = new Set();

        item.children.forEach(child => {
          const childData = aggregateByRole[child.id];
          if (childData) {
            // We need to recalculate using raw data to get unique hours
            staff.forEach(member => {
              Object.entries(blocks).forEach(([key, value]) => {
                if (key.startsWith(`${member.id}-`)) {
                  const staffRoles = normalizeBlockValue(value, member.defaultRole || 'tier1');
                  if (staffRoles.includes(child.id)) {
                    const utcHour = parseInt(key.split('-')[1], 10);
                    const dayIndex = Math.floor(utcHour / 24);
                    coveredHours.add(utcHour);
                    days.add(dayIndex);
                  }
                }
              });
            });
          }
        });

        result[item.id] = {
          hours: coveredHours.size,
          days
        };
      }
    });

    return result;
  }, [roleHierarchy, aggregateByRole, staff, blocks]);

  // Toggle parent role expansion (defaults to expanded, tracks collapsed)
  const toggleParentExpanded = (parentId) => {
    setCollapsedParentRoles(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  // Check if all children of a parent are hidden
  const areAllChildrenHidden = (parent) => {
    return parent.children.every(child => hiddenGlobalRoles.has(child.id));
  };

  // Toggle visibility for parent (toggles all children)
  const toggleParentVisibility = (parent) => {
    const allHidden = areAllChildrenHidden(parent);
    parent.children.forEach(child => {
      if (allHidden) {
        // Show all children
        if (hiddenGlobalRoles.has(child.id)) {
          onToggleGlobalRoleVisibility(child.id);
        }
      } else {
        // Hide all children
        if (!hiddenGlobalRoles.has(child.id)) {
          onToggleGlobalRoleVisibility(child.id);
        }
      }
    });
  };

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
        className={`bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
          isLargeScreen
            ? `rounded-tr-xl rounded-br-xl rounded-bl-xl ${isOpen ? 'min-w-[200px] max-w-[320px] w-auto opacity-100 mr-4 md:mr-6 max-h-[calc(100vh-180px)]' : 'w-0 opacity-0 border-0'}`
            : `rounded-xl w-full ${isOpen ? 'max-h-[50vh] opacity-100 mb-4 md:mb-6' : 'max-h-0 opacity-0 border-0'}`
        }`}
      >
        <div className="flex-shrink-0 px-4 pt-4 pb-2 whitespace-nowrap">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Coverage Summary</h3>
          <p className="text-xs text-slate-400">Click to show/hide</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <div className="space-y-4 whitespace-nowrap">
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
                {roleHierarchy.map(item => {
                  const isParent = item.isParent && item.children.length > 0;
                  const isExpanded = !collapsedParentRoles.has(item.id);

                  if (isParent) {
                    // Parent role with children
                    const parentData = parentAggregateByRole[item.id];
                    const totalHours = parentData?.hours || 0;
                    const daysCount = parentData?.days?.size || 0;
                    const avgPerDay = daysCount > 0 ? totalHours / daysCount : 0;
                    const allChildrenHidden = areAllChildrenHidden(item);
                    const colorHex = getRoleColorHex(roles, item.id);

                    return (
                      <div key={item.id}>
                        {/* Parent role row */}
                        <div
                          className={`group py-1.5 px-2 rounded cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            allChildrenHidden ? 'opacity-40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => toggleParentVisibility(item)}
                              className="flex items-center gap-1.5 flex-1 min-w-0"
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${allChildrenHidden ? 'opacity-50' : ''}`}
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className={`text-sm font-medium ${allChildrenHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                {item.label}
                              </span>
                            </div>
                            <span className={`text-sm text-right flex-shrink-0 ${allChildrenHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
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
                            {/* Expand/collapse toggle - slides in from right on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleParentExpanded(item.id);
                              }}
                              className="w-0 overflow-hidden opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Child roles (when expanded) */}
                        {isExpanded && (
                          <div className="ml-4 space-y-0.5">
                            {item.children.map(child => {
                              const childData = aggregateByRole[child.id];
                              const childHours = childData?.hours || 0;
                              const childDays = childData?.days?.size || 0;
                              const childAvg = childDays > 0 ? childHours / childDays : 0;
                              const isHidden = hiddenGlobalRoles.has(child.id);
                              const childColorHex = getRoleColorHex(roles, child.id);

                              return (
                                <div
                                  key={child.id}
                                  onClick={() => onToggleGlobalRoleVisibility(child.id)}
                                  className={`py-1 px-2 rounded cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                                    isHidden ? 'opacity-40' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isHidden ? 'opacity-50' : ''}`}
                                      style={{ backgroundColor: childColorHex }}
                                    />
                                    <span className={`text-xs font-medium flex-1  ${isHidden ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                      {child.label}
                                    </span>
                                    <span className={`text-xs text-right flex-shrink-0 ${isHidden ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {childDays > 0 ? (
                                        <>
                                          <span className="font-semibold">{childDays}</span>
                                          <span className="font-normal text-slate-400 dark:text-slate-500"> d, </span>
                                          <span className="font-semibold">{childAvg.toFixed(1)}</span>
                                          <span className="font-normal text-slate-400 dark:text-slate-500"> h/d</span>
                                        </>
                                      ) : (
                                        <span className="font-normal text-slate-400 dark:text-slate-500">—</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Standalone role (no parent, no children)
                    const roleData = aggregateByRole[item.id];
                    const totalHours = roleData?.hours || 0;
                    const daysCount = roleData?.days?.size || 0;
                    const avgPerDay = daysCount > 0 ? totalHours / daysCount : 0;
                    const isHidden = hiddenGlobalRoles.has(item.id);
                    const colorHex = getRoleColorHex(roles, item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => onToggleGlobalRoleVisibility(item.id)}
                        className={`py-1.5 px-2 rounded cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700 ${
                          isHidden ? 'opacity-40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHidden ? 'opacity-50' : ''}`}
                            style={{ backgroundColor: colorHex }}
                          />
                          <span className={`text-sm font-medium flex-1  ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.label}
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
                  }
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
                  const hoursByRole = getStaffHoursByRole(member.id, member.defaultRole, hiddenRoles);
                  // Sort roles by hours (highest to lowest), visible roles first
                  const roleEntries = Object.entries(hoursByRole)
                    .sort((a, b) => {
                      // Visible roles first, then by hours descending
                      if (a[1].isHidden !== b[1].isHidden) return a[1].isHidden ? 1 : -1;
                      return b[1].hours - a[1].hours;
                    });
                  const clockHours = getClockHours(member.id); // Actual hours on the clock
                  const isHidden = hiddenStaff.has(member.id);
                  const tzLabel = getTimezoneLabel(member.timezone, timezones);

                  // Calculate visible total (sum only visible roles)
                  const visibleTotal = roleEntries
                    .filter(([, data]) => !data.isHidden)
                    .reduce((sum, [, data]) => sum + data.hours, 0);

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
                        <span className={`text-sm font-medium flex-1  ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                          {member.name}
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500"> {tzLabel}</span>
                        </span>
                        {roleEntries.length <= 1 && (
                          <span className={`text-sm font-semibold w-10 text-right flex-shrink-0 ${isHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {clockHours}<span className="text-xs font-normal text-slate-400 dark:text-slate-500"> h</span>
                          </span>
                        )}
                      </div>

                      {/* Role breakdown rows */}
                      {roleEntries.length > 1 ? (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {roleEntries.map(([roleId, data]) => {
                            const isRoleHidden = data.isHidden;
                            const hours = data.hours;
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
                                  {isRoleHidden ? '—' : (Number.isInteger(hours) ? hours : hours.toFixed(1))}<span className="font-normal text-slate-400 dark:text-slate-500">{isRoleHidden ? '' : ' h'}</span>
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-4 text-xs border-t border-slate-100 dark:border-slate-600 pt-0.5 mt-0.5">
                            <span className={`flex-1 font-medium ${isHidden ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              Total
                            </span>
                            <span className={`font-semibold ${isHidden ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                              {Number.isInteger(visibleTotal) ? visibleTotal : visibleTotal.toFixed(1)}<span className="font-normal text-slate-400 dark:text-slate-500"> h</span>
                            </span>
                          </div>
                        </div>
                      ) : roleEntries.length === 1 ? (
                        (() => {
                          const roleId = roleEntries[0][0];
                          const isRoleHidden = roleEntries[0][1].isHidden;
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
