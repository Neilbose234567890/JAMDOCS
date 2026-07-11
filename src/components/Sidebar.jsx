import React from 'react';
import { Building2, Users, Car, Home, ChevronLeft, ChevronRight } from 'lucide-react';

const modules = [
  { id: 'employee', label: 'Employee Documents', icon: Users },
  { id: 'company', label: 'Company Documents', icon: Building2 },
  { id: 'vehicle', label: 'Vehicle Documents', icon: Car },
  { id: 'property', label: 'Property Documents', icon: Home },
];

export default function Sidebar({ activeModule, onModuleChange, userRole, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header" onClick={onToggle}>
        <div className="sidebar__toggle-icon">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </div>
        {!collapsed && <span className="sidebar__header-label">Modules</span>}
      </div>

      <nav className="sidebar__nav">
        {modules.map(mod => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              className={`sidebar__nav-btn ${isActive ? 'sidebar__nav-btn--active' : ''}`}
              onClick={() => onModuleChange(mod.id)}
              title={collapsed ? mod.label : ''}
            >
              <span className="sidebar__nav-icon">
                <Icon size={20} />
              </span>
              {!collapsed && <span className="sidebar__nav-label">{mod.label}</span>}
              {!collapsed && isActive && <span className="sidebar__nav-indicator" />}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar__footer">
          <span className="sidebar__footer-dot" />
          JAMDOCS v1.0
        </div>
      )}
    </aside>
  );
}
