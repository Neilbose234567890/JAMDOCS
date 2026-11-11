import React, { useState, useEffect } from 'react';
import { initialEmployees } from './utils/mockData';
import { initialUsers } from './utils/usersData';
import { defaultDocCategories, migrateDocCategories } from './utils/docCategories';
import { applyLifecycle, archiveKey, createArchiveEntry, getDocStatus, isTrackedDoc } from './utils/docLifecycle';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import logoImg from './assets/logo.jpg';
import { Bell, LogOut } from 'lucide-react';
import { FALLBACK_MODULE, filterVisibleEntities, resolveUserEntity, firstAccessibleDocType } from './utils/accessControl';
import { STORAGE_KEYS, loadArray, loadJSON, loadString, saveJSON, saveString } from './utils/safeStorage';

function App() {
  // Document categories - now per-module (object keyed by module name)
  // All persisted reads go through safeStorage: a corrupt/blocked value must
  // never throw here, otherwise React unmounts the tree and shows a blank page.
  const [documentCategories, setDocumentCategories] = useState(() => {
    const saved = loadJSON(STORAGE_KEYS.categories, null, (value) => typeof value === 'object');
    return migrateDocCategories(saved);
  });

  const [activeModule, setActiveModule] = useState('employee');

  // Compute active doc types for the current module only
  const currentModuleCategories = documentCategories[activeModule] || [];
  const activeDocTypes = currentModuleCategories.filter(c => c.enabled).map(c => c.name);
  const allDocTypeNames = currentModuleCategories.map(c => c.name);

  // Module data stores - each module has its own entity list
  const [employees, setEmployees] = useState(() => loadArray(STORAGE_KEYS.employees, initialEmployees));

  // Company, Vehicle, Property - empty by default, start fresh
  const [companies, setCompanies] = useState(() => loadArray(STORAGE_KEYS.companies, []));

  const [vehicles, setVehicles] = useState(() => loadArray(STORAGE_KEYS.vehicles, []));

  const [properties, setProperties] = useState(() => loadArray(STORAGE_KEYS.properties, []));

  const [users, setUsers] = useState(() => {
    // loadJSON drops corrupt data (and clears the key) instead of throwing.
    const parsed = loadJSON(STORAGE_KEYS.users, null, (value) => Array.isArray(value) && value.length > 0);
    const list = Array.isArray(parsed) ? parsed : initialUsers;
    return list
      .filter((u) => u && typeof u === 'object')
      .map((u) => ({
        ...u,
        permissions: u.permissions || { view: true, add: false, edit: false, save: false, delete: false },
        assignedEmployees: u.assignedEmployees || "all",
        accessRights: u.accessRights || activeDocTypes,
        moduleAccess: u.moduleAccess || ['employee']
      }));
  });

  const [fieldConfigs, setFieldConfigs] = useState(() => loadJSON(
    STORAGE_KEYS.fieldConfigs,
    {},
    (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
  ));

  // Recompute document statuses and archive newly expired documents.
  // Runs on mount and whenever the active module changes; functional setters
  // keep the original reference when nothing changed to avoid render loops.
  useEffect(() => {
    const reconcile = (setter) => setter(prev => {
      const { entities, changed } = applyLifecycle(prev);
      return changed ? entities : prev;
    });
    reconcile(setEmployees);
    reconcile(setCompanies);
    reconcile(setVehicles);
    reconcile(setProperties);
  }, [activeModule]);

  const [loggedInUser, setLoggedInUser] = useState(null);
  // 'dashboard' is the shared landing page for every role; 'user' is the
  // document page you drill into from a record ("Manage Docs").
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [initialUserTab, setInitialUserTab] = useState('');
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => loadString(STORAGE_KEYS.theme, 'default'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist all data stores (saveJSON swallows quota / blocked-storage errors so
  // a failed write can never break the UI)
  useEffect(() => { saveJSON(STORAGE_KEYS.categories, documentCategories); }, [documentCategories]);
  useEffect(() => { saveJSON(STORAGE_KEYS.employees, employees); }, [employees]);
  useEffect(() => { saveJSON(STORAGE_KEYS.companies, companies); }, [companies]);
  useEffect(() => { saveJSON(STORAGE_KEYS.vehicles, vehicles); }, [vehicles]);
  useEffect(() => { saveJSON(STORAGE_KEYS.properties, properties); }, [properties]);
  useEffect(() => { saveJSON(STORAGE_KEYS.users, users); }, [users]);
  useEffect(() => { saveJSON(STORAGE_KEYS.fieldConfigs, fieldConfigs); }, [fieldConfigs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    saveString(STORAGE_KEYS.theme, currentTheme);
  }, [currentTheme]);

  // Get the entity list of a specific module (used when resolving landing pages)
  const getEntityListFor = (module) => {
    switch (module) {
      case 'employee': return employees;
      case 'company': return companies;
      case 'vehicle': return vehicles;
      case 'property': return properties;
      default: return employees;
    }
  };

  // Get the current entity list based on active module
  const getEntityList = () => getEntityListFor(activeModule);

  const setEntityList = (list) => {
    switch (activeModule) {
      case 'employee': setEmployees(list); break;
      case 'company': setCompanies(list); break;
      case 'vehicle': setVehicles(list); break;
      case 'property': setProperties(list); break;
    }
  };

  // Generic entity handler - works for any module
  const handleAddEntity = (details) => {
    const entities = getEntityList();
    const prefix = { employee: 'EMP', company: 'CMP', vehicle: 'VEH', property: 'PRP' }[activeModule] || 'ENT';
    const nextNum = entities.length > 0 ? Math.max(...entities.map(e => parseInt((e.id || '').replace(prefix, '')) || 0)) + 1 : 1;
    const newId = `${prefix}${String(nextNum).padStart(3, '0')}`;
    const initials = details.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const emptyDocs = {};
    allDocTypeNames.forEach(dt => { emptyDocs[dt] = { status: "missing" }; });
    const newEntity = { id: newId, ...details, avatar: initials, documents: emptyDocs };
    setEntityList([...entities, newEntity]);
    setSelectedEmpId(newId);
  };

  const handleEditEntity = (entityId, updatedDetails) => {
    setEntityList(getEntityList().map(e => {
      if (e.id === entityId) {
        const initials = updatedDetails.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        return { ...e, ...updatedDetails, avatar: initials };
      }
      return e;
    }));
  };

  const handleDeleteEntity = (entityId) => {
    setEntityList(getEntityList().filter(e => e.id !== entityId));
  };

  const handleUpdateDocuments = (entityId, tabName, docDetails) => {
    setEntityList(getEntityList().map(e => {
      if (e.id !== entityId) return e;
      const documents = { ...(e.documents || {}) };
      const previous = documents[tabName];
      let oldDocuments = Array.isArray(e.oldDocuments) ? [...e.oldDocuments] : [];

      // Keep the expired version in the archive before it is replaced by the
      // renewed document (also covers saves that happen before reconciliation).
      if (isTrackedDoc(previous) && previous.expiryDate && getDocStatus(previous.expiryDate) === 'expired') {
        const key = archiveKey(tabName, previous);
        if (!oldDocuments.some(entry => entry.id === key)) {
          oldDocuments.push(createArchiveEntry(tabName, previous));
        }
      }

      documents[tabName] = docDetails;
      return { ...e, documents, oldDocuments };
    }));
  };

  const handleAddUser = (newUserDetails) => {
    // Tolerate records with a missing/odd id instead of producing NaN ids.
    const nextIdNum = users.reduce((max, u) => {
      const num = parseInt(String(u?.id ?? '').replace('USR', ''), 10);
      return Math.max(max, Number.isFinite(num) ? num : 0);
    }, 0) + 1;
    const newId = `USR${String(nextIdNum).padStart(3, '0')}`;
    setUsers([...users, { id: newId, ...newUserDetails }]);
  };

  const handleEditUser = (userId, updatedDetails) => {
    setUsers(users.map(u => u.id === userId ? { ...u, ...updatedDetails } : u));
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const getComplianceAlerts = () => {
    const alerts = [];
    getEntityList().forEach(ent => {
      Object.entries(ent.documents || {}).forEach(([docName, doc]) => {
        if (doc.status === 'expired') {
          alerts.push({ id: `${ent.id}-${docName}`, empId: ent.id, empName: ent.name, docName, status: 'expired', text: `${ent.name}'s ${docName} expired (${doc.expiryDate})` });
        } else if (doc.status === 'expiring') {
          alerts.push({ id: `${ent.id}-${docName}`, empId: ent.id, empName: ent.name, docName, status: 'expiring', text: `${ent.name}'s ${docName} expires ${doc.expiryDate}` });
        }
      });
    });
    return alerts;
  };
  const complianceAlerts = getComplianceAlerts();

  // Both roles browse the same record set on the dashboard, so the record shown
  // on the document page is resolved against the full module list. The filtered
  // list still provides a sensible fallback when nothing has been picked yet.
  const moduleEntities = getEntityList();
  const visibleEntities = filterVisibleEntities(loggedInUser, moduleEntities);
  const currentEntity = moduleEntities.find(e => e.id === selectedEmpId)
    || visibleEntities[0]
    || moduleEntities[0];

  const moduleLabel = { employee: 'Employee', company: 'Company', vehicle: 'Vehicle', property: 'Property' }[activeModule] || 'Entity';

  // Enabled document categories of a given module
  const getDocTypesFor = (module) =>
    (documentCategories[module] || []).filter(c => c.enabled).map(c => c.name);

  // Signing in always lands on the shared dashboard - the exact same page for
  // admins and contributors. The document page is one click away ("Manage Docs").
  const handleLogin = (user) => {
    setLoggedInUser(user);
    setIsAlertPanelOpen(false);
    setCurrentView('dashboard');

    if (user.sysRole === 'admin') {
      setSelectedEmpId(null);
      setInitialUserTab('');
      return;
    }

    // Contributors still resolve their own record so the document page opens on
    // the right person if they jump straight into it.
    const userModules = Array.isArray(user.moduleAccess) && user.moduleAccess.length > 0
      ? user.moduleAccess
      : [FALLBACK_MODULE];
    const landingModule = userModules.includes(activeModule) ? activeModule : userModules[0];
    const landingEntities = filterVisibleEntities(user, getEntityListFor(landingModule));
    const target = resolveUserEntity(user, landingEntities);

    setActiveModule(landingModule);
    setSelectedEmpId(target ? target.id : null);
    setInitialUserTab(firstAccessibleDocType(user, getDocTypesFor(landingModule)));
  };

  // Clear the previous session so it can never leak into the next login.
  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentView('dashboard');
    setSelectedEmpId(null);
    setInitialUserTab('');
    setIsAlertPanelOpen(false);
    setActiveModule(FALLBACK_MODULE);
  };

  // Switching module always returns to the dashboard list for every role.
  const handleModuleChange = (mod) => {
    setActiveModule(mod);
    setCurrentView('dashboard');
    setSelectedEmpId(null);
    setInitialUserTab('');
  };

  // The dashboard is the landing page for everyone; 'user' is the document page.
  const showDashboard = currentView === 'dashboard';

  if (!loggedInUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '2rem' }}>
          <div className="logo-icon" style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', background: 'transparent' }}>
            <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <span className="logo-text">JAMDOCS</span>
            <span style={{ fontSize: '0.6rem', display: 'block', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>DOCUMENT HUB</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Module indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Module:</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-light)' }}>{moduleLabel} Documents</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select style={{ width: 'auto', padding: '4px 24px 4px 10px', fontSize: '0.75rem', minHeight: '28px', appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '10px 10px', borderRadius: '4px',
            backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
            value={currentTheme} onChange={(e) => setCurrentTheme(e.target.value)}>
            <option value="default" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Default Dark</option>
            <option value="one-dark" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>One Dark</option>
            <option value="dracula" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Dracula</option>
            <option value="monokai" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Monokai</option>
            <option value="github-light" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>GitHub Light</option>
          </select>

          {loggedInUser?.sysRole === 'admin' && (
            <div className="role-switcher" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button className={`role-btn ${currentView === 'dashboard' ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setCurrentView('dashboard')}>Dashboard</button>
              <button className={`role-btn ${currentView === 'user' ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setCurrentView('user')}>User View</button>
            </div>
          )}

          <div className="badge-holder" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsAlertPanelOpen(!isAlertPanelOpen)}>
            <Bell size={20} className={complianceAlerts.length > 0 ? "text-primary-light" : "text-muted"} />
            {complianceAlerts.length > 0 && <span className="badge-count">{complianceAlerts.length}</span>}
            {isAlertPanelOpen && (
              <div className="glass-card" style={{ position: 'absolute', right: 0, top: '30px', width: '300px', zIndex: 200, maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.85rem' }}>Alerts</div>
                {complianceAlerts.length > 0 ? complianceAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: '8px 12px', fontSize: '0.75rem', borderLeft: `3px solid ${alert.status === 'expired' ? 'var(--status-expired)' : 'var(--status-expiring)'}`, background: alert.status === 'expired' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)' }}>
                    {alert.text}
                    <button style={{ display: 'block', marginTop: '4px', background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.7rem', cursor: 'pointer' }}
                      onClick={() => { setSelectedEmpId(alert.empId); setCurrentView('user'); setIsAlertPanelOpen(false); }}>Resolve</button>
                  </div>
                )) : <div style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>All compliant.</div>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-main)' }}>{loggedInUser.name}</strong>
              <span style={{ fontSize: '0.65rem', marginLeft: '6px', color: 'var(--accent)', textTransform: 'uppercase' }}>({loggedInUser.sysRole})</span>
            </span>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', borderColor: 'transparent' }}
              onClick={handleLogout} title="Logout">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          userRole={loggedInUser?.sysRole}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <main className="app-main-scroll">
          {showDashboard ? (
            <AdminDashboard
              entities={moduleEntities}
              loggedInUser={loggedInUser}
              users={users}
              documentCategories={currentModuleCategories}
              allDocumentCategories={documentCategories}
              fieldConfigs={fieldConfigs}
              activeDocTypes={activeDocTypes}
              activeModule={activeModule}
              moduleLabel={moduleLabel}
              onUpdateFieldConfigs={setFieldConfigs}
              onAddEntity={handleAddEntity}
              onEditEntity={handleEditEntity}
              onDeleteEntity={handleDeleteEntity}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onUpdateDocCategories={(updatedCategories) => {
                setDocumentCategories(prev => ({
                  ...prev,
                  [activeModule]: updatedCategories
                }));
              }}
              onUpdateGlobalDocCategories={(module, updatedCategories) => {
                setDocumentCategories(prev => ({
                  ...prev,
                  [module]: updatedCategories
                }));
              }}
              onSelectEntity={(entityId, docType) => {
                setSelectedEmpId(entityId);
                setInitialUserTab(docType || activeDocTypes[0] || '');
                setCurrentView('user');
              }}
            />
          ) : (
            <UserDashboard
              entities={moduleEntities}
              entity={currentEntity}
              employee={currentEntity}
              loggedInUser={loggedInUser}
              fieldConfigs={fieldConfigs}
              documentCategories={currentModuleCategories}
              activeDocTypes={activeDocTypes}
              activeModule={activeModule}
              moduleLabel={moduleLabel}
              onUpdateDocuments={handleUpdateDocuments}
              initialTab={initialUserTab || activeDocTypes[0] || ''}
              onBack={() => setCurrentView('dashboard')}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
