import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Shield, CheckCircle, AlertTriangle, XCircle, 
  Eye, FileText, ChevronRight, Grid, List, Briefcase, PlusCircle, Settings, Trash2
} from 'lucide-react';
import { moduleFieldConfigs, getDefaultEntity, getEntityDisplayFields } from '../utils/entityFields';

export default function AdminDashboard({ entities = [], users = [], fieldConfigs, activeDocTypes = [], documentCategories = [], activeModule = 'employee', moduleLabel = 'Entity', onUpdateFieldConfigs, onAddEntity, onEditEntity, onDeleteEntity, onSelectEntity, onAddUser, onEditUser, onDeleteUser, onUpdateDocCategories }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedEntityId, setSelectedEntityId] = useState(entities[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeCategoryManager, setActiveCategoryManager] = useState(null);
  const [categoryFields, setCategoryFields] = useState({});
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const allDocTypes = activeDocTypes;
  const actionLabels = [
    { key: 'view', label: 'View Documents' },
    { key: 'add', label: 'Add / Upload' },
    { key: 'edit', label: 'Edit Fields' },
    { key: 'save', label: 'Save & Approve' },
    { key: 'delete', label: 'Delete' }
  ];

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: 'password123', sysRole: 'contributor',
    permissions: { view: true, add: true, edit: true, save: true, delete: false },
    assignedEmployees: [], assignAll: true, accessRights: allDocTypes
  });

  const [editUser, setEditUser] = useState({
    name: '', email: '', password: '', sysRole: 'contributor',
    permissions: { view: true, add: false, edit: false, save: false, delete: false },
    assignedEmployees: [], assignAll: true, accessRights: []
  });

  useEffect(() => {
    if (activeCategoryManager) {
      const existing = fieldConfigs?.[activeCategoryManager] || {};
      const standardFields = ['docNumber', 'fullName', 'startDate', 'expiryDate'];
      const loadedFields = {};
      standardFields.forEach(f => {
        loadedFields[f] = existing[f] || { isCustom: false, mandatory: false, regex: '', errorMsg: '' };
      });
      Object.keys(existing).forEach(key => {
        if (!standardFields.includes(key)) loadedFields[key] = existing[key];
      });
      setCategoryFields(loadedFields);
    }
  }, [activeCategoryManager, fieldConfigs]);

  // Form states for add/edit entity - dynamic per module
  const [newEntity, setNewEntity] = useState(() => getDefaultEntity(activeModule));
  const [editEntity, setEditEntity] = useState(() => getDefaultEntity(activeModule));

  let totalDocsCount = 0, validDocsCount = 0, expiringDocsCount = 0, expiredDocsCount = 0;
  entities.forEach(ent => {
    Object.values(ent.documents || {}).forEach(doc => {
      totalDocsCount++;
      if (doc.status === 'valid') validDocsCount++;
      else if (doc.status === 'expiring') expiringDocsCount++;
      else if (doc.status === 'expired') expiredDocsCount++;
    });
  });

  const filteredEntities = entities.filter(ent => {
    const name = ent.name || '';
    const email = ent.email || '';
    const role = ent.role || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          role.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    const docStatuses = Object.values(ent.documents || {}).map(d => d.status);
    if (statusFilter === 'expired') return matchesSearch && docStatuses.includes('expired');
    if (statusFilter === 'expiring') return matchesSearch && docStatuses.includes('expiring');
    if (statusFilter === 'missing') return matchesSearch && docStatuses.includes('missing');
    return matchesSearch;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEntity.name) return;
    onAddEntity({ ...newEntity });
    setNewEntity(getDefaultEntity(activeModule));
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editEntity.name) return;
    onEditEntity(selectedEntityId, { ...editEntity });
    setIsEditModalOpen(false);
  };

  const openEditModal = () => {
    const ent = entities.find(e => e.id === selectedEntityId) || entities[0];
    if (ent) {
      const defaults = getDefaultEntity(activeModule);
      const filled = { ...defaults };
      Object.keys(defaults).forEach(key => {
        if (ent[key] !== undefined) filled[key] = ent[key];
      });
      setEditEntity(filled);
    }
    setIsEditModalOpen(true);
  };

  const renderPermissions = (userState, setUserState) => (
    <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Action Permissions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
        {actionLabels.map(a => (
          <label key={a.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={userState.permissions?.[a.key] || false}
              onChange={(e) => setUserState({ ...userState, permissions: { ...userState.permissions, [a.key]: e.target.checked } })} />
            {a.label}
          </label>
        ))}
      </div>
    </div>
  );

  const renderEmployeeAssignment = (userState, setUserState) => (
    <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Entity Assignment</h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '10px' }}>
        <input type="checkbox" checked={userState.assignAll || false}
          onChange={(e) => setUserState({ ...userState, assignAll: e.target.checked, assignedEmployees: e.target.checked ? [] : (userState.assignedEmployees || []) })} />
        All {moduleLabel}s
      </label>
      {!userState.assignAll && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
          {entities.map(ent => (
            <label key={ent.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
              <input type="checkbox" checked={(userState.assignedEmployees || []).includes(ent.id)}
                onChange={(e) => {
                  if (e.target.checked) setUserState({ ...userState, assignedEmployees: [...(userState.assignedEmployees || []), ent.id] });
                  else setUserState({ ...userState, assignedEmployees: (userState.assignedEmployees || []).filter(id => id !== ent.id) });
                }} />
              {ent.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'valid': return <span className="status-badge valid">Valid</span>;
      case 'expiring': return <span className="status-badge expiring">Expiring</span>;
      case 'expired': return <span className="status-badge expired">Expired</span>;
      case 'pending': return <span className="status-badge pending">Pending</span>;
      default: return <span className="status-badge missing">Missing</span>;
    }
  };

  const getStatusIconCell = (status) => {
    switch (status) {
      case 'valid': return <div className="tab-status-dot valid" title="Valid"></div>;
      case 'expiring': return <div className="tab-status-dot expiring" title="Expiring Soon"></div>;
      case 'expired': return <div className="tab-status-dot expired" title="Expired"></div>;
      default: return <div className="tab-status-dot missing" title="Missing"></div>;
    }
  };

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="dashboard-stats-grid">
        <div className="glass-card stat-card all"><div className="stat-info"><h3>Total {moduleLabel}s</h3><p>{entities.length}</p></div><div className="stat-icon-wrapper"><PlusCircle size={24} /></div></div>
        <div className="glass-card stat-card valid"><div className="stat-info"><h3>Compliant</h3><p>{validDocsCount}</p></div><div className="stat-icon-wrapper"><CheckCircle size={24} /></div></div>
        <div className="glass-card stat-card expiring"><div className="stat-info"><h3>Expiring</h3><p>{expiringDocsCount}</p></div><div className="stat-icon-wrapper"><AlertTriangle size={24} /></div></div>
        <div className="glass-card stat-card expired"><div className="stat-info"><h3>Expired</h3><p>{expiredDocsCount}</p></div><div className="stat-icon-wrapper"><XCircle size={24} /></div></div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button className={`btn ${showCategoryManager ? 'btn-glow' : 'btn-secondary'}`}
          onClick={() => { setShowCategoryManager(!showCategoryManager); setShowUserManager(false); }}>
          <Settings size={14} /> Categories
        </button>
        <button className={`btn ${showUserManager ? 'btn-glow' : 'btn-secondary'}`}
          onClick={() => { setShowUserManager(!showUserManager); setShowCategoryManager(false); }}>
          <Shield size={14} /> Users
        </button>
      </div>

      {/* ============ CATEGORY MANAGEMENT ============ */}
      {showCategoryManager && (
        <div className="glass-card">
          <div className="admin-header-row" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} className="text-primary-light" /> Document Categories <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 400 }}>({moduleLabel} Module)</span></h3>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Category Name</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
              </thead>
              <tbody>
                {documentCategories.map((cat, idx) => (
                  <tr key={cat.name}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td><span className={`status-badge ${cat.enabled ? 'valid' : 'expired'}`} style={{ fontSize: '0.7rem' }}>{cat.enabled ? 'Active' : 'Disabled'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => {
                            setEditingCategoryIndex(idx);
                            setEditCategoryName(cat.name);
                          }}>
                          Edit
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => onUpdateDocCategories(documentCategories.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c))}>
                          {cat.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--status-expired)', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={() => {
                            if (window.confirm(`Delete category "${cat.name}" from ${moduleLabel} module?`)) {
                              onUpdateDocCategories(documentCategories.filter((_, i) => i !== idx));
                            }
                          }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Add New Category</h4>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <input className="form-input" placeholder="e.g. Work Permit" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => {
                const name = newCategoryName.trim();
                if (!name) return alert('Enter a name.');
                if (documentCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) return alert('Already exists.');
                onUpdateDocCategories([...documentCategories, { name, enabled: true }]);
                setNewCategoryName('');
              }}><Plus size={16} /> Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ RENAME CATEGORY MODAL ============ */}
      {editingCategoryIndex !== null && (
        <div className="modal-overlay" onClick={() => setEditingCategoryIndex(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} className="text-primary-light" /> Rename Category</h3>
              <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => setEditingCategoryIndex(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group">
                <label>Category Name</label>
                <input className="form-input" autoFocus value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const name = editCategoryName.trim();
                      if (!name) return alert('Name cannot be empty.');
                      if (documentCategories.find((c, i) => c.name.toLowerCase() === name.toLowerCase() && i !== editingCategoryIndex)) return alert('Already exists.');
                      onUpdateDocCategories(documentCategories.map((c, i) => i === editingCategoryIndex ? { ...c, name } : c));
                      setEditingCategoryIndex(null);
                      setEditCategoryName('');
                    }
                  }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingCategoryIndex(null)}>Cancel</button>
              <button type="button" className="btn btn-glow" onClick={() => {
                const name = editCategoryName.trim();
                if (!name) return alert('Name cannot be empty.');
                if (documentCategories.find((c, i) => c.name.toLowerCase() === name.toLowerCase() && i !== editingCategoryIndex)) return alert('Already exists.');
                onUpdateDocCategories(documentCategories.map((c, i) => i === editingCategoryIndex ? { ...c, name } : c));
                setEditingCategoryIndex(null);
                setEditCategoryName('');
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ USER MANAGEMENT ============ */}
      {showUserManager && (
        <div className="glass-card">
          <div className="admin-header-row" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-primary-light" /> System Users</h3>
            <button className="btn btn-primary" onClick={() => {
              setNewUser({ name: '', email: '', password: 'password123', sysRole: 'contributor',
                permissions: { view: true, add: true, edit: true, save: true, delete: false },
                assignedEmployees: [], assignAll: true, accessRights: allDocTypes });
              setIsAddUserModalOpen(true);
            }}><Plus size={16} /> Add User</button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th><th>Entities</th><th>Edit</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td><span className={`status-badge ${user.sysRole === 'admin' ? 'valid' : 'pending'}`} style={{ fontSize: '0.7rem' }}>{user.sysRole === 'admin' ? 'Admin' : 'Contributor'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {(user.permissions ? Object.entries(user.permissions).filter(([_, v]) => v).map(([k]) => k) : []).map(p => (
                          <span key={p} style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(34,197,94,0.1)', color: 'var(--status-valid)', textTransform: 'capitalize' }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {user.sysRole === 'admin' ? 'All' : (user.assignedEmployees === 'all' || (user.assignedEmployees || []).length >= entities.length ? 'All' : `${(user.assignedEmployees || []).length}`)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setEditUser({
                            name: user.name, email: user.email, password: user.password || '', sysRole: user.sysRole || 'contributor',
                            permissions: user.permissions || { view: true, add: false, edit: false, save: false, delete: false },
                            assignedEmployees: user.assignedEmployees === 'all' ? entities.map(e => e.id) : (user.assignedEmployees || []),
                            assignAll: user.assignedEmployees === 'all' || user.sysRole === 'admin',
                            accessRights: user.accessRights || allDocTypes
                          });
                          setIsEditUserModalOpen(true);
                        }}>Edit</button>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--status-expired)', borderColor: 'rgba(239,68,68,0.3)' }}
                        onClick={() => setUserToDelete(user)}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ ENTITY MANAGEMENT ============ */}
      {!showUserManager && !showCategoryManager && (
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div className="admin-header-row">
            <div className="search-bar" style={{ maxWidth: '350px' }}>
              <Search size={16} className="search-icon" />
              <input className="search-input" placeholder={`Search ${moduleLabel}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {['all', 'expired', 'expiring', 'missing'].map(f => (
                  <button key={f} className={`role-btn ${statusFilter === f ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setStatusFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <button className={`role-btn ${viewMode === 'list' ? 'active' : ''}`} style={{ padding: '4px 8px' }} onClick={() => setViewMode('list')} title="List"><List size={14} /></button>
                <button className={`role-btn ${viewMode === 'matrix' ? 'active' : ''}`} style={{ padding: '4px 8px' }} onClick={() => setViewMode('matrix')} title="Grid"><Grid size={14} /></button>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}><Plus size={16} /> Add {moduleLabel}</button>
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="dashboard-layout">
              <div className="sidebar-panel">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{moduleLabel}s ({filteredEntities.length})</h3>
                {filteredEntities.length > 0 ? (
                  <ul className="sidebar-list">
                    {filteredEntities.map(ent => {
                      const expiredCount = Object.values(ent.documents || {}).filter(d => d.status === 'expired').length;
                      const expiringCount = Object.values(ent.documents || {}).filter(d => d.status === 'expiring').length;
                      return (
                        <li key={ent.id}>
                          <button className={`sidebar-item-btn ${selectedEntityId === ent.id ? 'active' : ''}`} onClick={() => setSelectedEntityId(ent.id)}>
                            <div className="emp-info">
                              <div className="avatar-circle">{ent.avatar || ent.name.charAt(0)}</div>
                              <div className="emp-name-title"><span className="emp-name">{ent.name}</span><span className="emp-dept">{ent.role || ''}</span></div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {expiredCount > 0 && <span className="status-badge expired" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{expiredCount}</span>}
                              {expiringCount > 0 && <span className="status-badge expiring" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{expiringCount}</span>}
                              <ChevronRight size={14} />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    No {moduleLabel}s yet. Add one to get started.
                  </div>
                )}
              </div>
              <div>
                {selectedEntity ? (
                  <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedEntity.name}</h2>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {getEntityDisplayFields(selectedEntity, activeModule).map((f, i) => (
                            <span key={f.label}>{i > 0 && ' \u2022 '}{f.label}: <strong>{f.value}</strong></span>
                          ))}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={openEditModal}><Briefcase size={14} /> Edit</button>
                        <button className="btn btn-secondary" style={{ color: 'var(--status-expired)', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={() => setEntityToDelete(selectedEntity)}><Trash2 size={14} /> Delete</button>
                        <button className="btn btn-glow" onClick={() => onSelectEntity(selectedEntity.id, allDocTypes[0] || '')}>
                          <Eye size={14} /> Manage Docs</button>
                      </div>
                    </div>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr><th>Category</th><th>ID</th><th>Issue</th><th>Expiry</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {allDocTypes.map(docName => {
                            const doc = selectedEntity.documents?.[docName] || { status: 'missing' };
                            return (
                              <tr key={docName}>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {docName}
                                    <button className="btn btn-secondary" style={{ padding: '2px 4px', background: 'transparent', borderColor: 'transparent', color: 'var(--text-secondary)' }}
                                      title={`Manage ${docName} Fields`} onClick={() => setActiveCategoryManager(docName)}>
                                      <Settings size={14} /></button>
                                  </div>
                                </td>
                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8125rem' }}>{doc.docNumber || '\u2014'}</td>
                                <td>{doc.startDate || '\u2014'}</td>
                                <td style={{ color: doc.status === 'expired' ? 'var(--status-expired)' : doc.status === 'expiring' ? 'var(--status-expiring)' : 'inherit' }}>{doc.expiryDate || '\u2014'}</td>
                                <td>{getStatusBadge(doc.status)}</td>
                                <td>
                                  <button className={`btn ${doc.status !== 'missing' ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    onClick={() => onSelectEntity(selectedEntity.id, docName)}>
                                    {doc.status !== 'missing' ? 'Edit' : 'Upload'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FileText className="empty-state-icon" size={48} />
                    <div className="empty-state-title">No {moduleLabel} Selected</div>
                    <div className="empty-state-desc">Select an entity to review documents.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'matrix' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Compliance Matrix</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{moduleLabel}</th>
                      {allDocTypes.map(type => (<th key={type} style={{ fontSize: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{type}</th>))}
                      <th>Compliance</th>
                      <th style={{ textAlign: 'center' }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntities.map(ent => {
                      const docsList = Object.values(ent.documents || {});
                      const validCount = docsList.filter(d => d.status === 'valid').length;
                      const totalTracked = docsList.filter(d => d.status !== 'missing').length;
                      const rate = totalTracked > 0 ? Math.round((validCount / totalTracked) * 100) : 0;
                      return (
                        <tr key={ent.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>{ent.avatar || ent.name.charAt(0)}</div>
                              <div><span style={{ fontWeight: 600 }}>{ent.name}</span><span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>{ent.role || ''}</span></div>
                            </div>
                          </td>
                          {allDocTypes.map(docType => {
                            const doc = ent.documents?.[docType] || { status: 'missing' };
                            return (
                              <td key={docType} style={{ textAlign: 'center' }}>
                                <button onClick={() => onSelectEntity(ent.id, docType)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                  title={`Manage ${docType}`}>{getStatusIconCell(doc.status)}</button>
                              </td>
                            );
                          })}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${rate}%`, background: rate === 100 ? 'var(--status-valid)' : rate >= 50 ? 'var(--status-expiring)' : 'var(--status-expired)' }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{rate}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px', color: 'var(--status-expired)', borderColor: 'transparent', background: 'transparent' }}
                              title={`Delete ${ent.name}`} onClick={(e) => { e.stopPropagation(); setEntityToDelete(ent); }}>
                              <Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ ADD ENTITY MODAL ============ */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add {moduleLabel}</h3>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="fields-form">
                {(moduleFieldConfigs[activeModule] || moduleFieldConfigs.employee).map(field => (
                  field.type === 'select' ? (
                    <div className="form-group" key={field.key}>
                      <label>{field.label}</label>
                      <select className="form-input" value={newEntity[field.key] || ''} onChange={(e) => setNewEntity({ ...newEntity, [field.key]: e.target.value })}>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group" key={field.key}>
                      <label>{field.label}</label>
                      <input type={field.type} className="form-input" required={field.required} placeholder={field.placeholder} value={newEntity[field.key] || ''} onChange={(e) => setNewEntity({ ...newEntity, [field.key]: e.target.value })} />
                    </div>
                  )
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-glow">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ EDIT ENTITY MODAL ============ */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={20} className="text-primary-light" /> Edit {moduleLabel}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => setIsEditModalOpen(false)}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(moduleFieldConfigs[activeModule] || moduleFieldConfigs.employee).map(field => (
                  field.type === 'select' ? (
                    <div className="form-group" key={field.key}>
                      <label>{field.label}</label>
                      <select className="form-input" value={editEntity[field.key] || ''} onChange={(e) => setEditEntity({ ...editEntity, [field.key]: e.target.value })}>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group" key={field.key}>
                      <label>{field.label}</label>
                      <input type={field.type} className="form-input" required={field.required} placeholder={field.placeholder} value={editEntity[field.key] || ''} onChange={(e) => setEditEntity({ ...editEntity, [field.key]: e.target.value })} />
                    </div>
                  )
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-glow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRM ============ */}
      {entityToDelete && (
        <div className="modal-overlay" onClick={() => setEntityToDelete(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem', color: 'var(--status-expired)' }}><AlertTriangle size={48} style={{ margin: '0 auto' }} /></div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Delete {moduleLabel}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Permanently delete <strong>{entityToDelete.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEntityToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--status-expired)', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => { onDeleteEntity(entityToDelete.id); if (selectedEntityId === entityToDelete.id) { const n = entities.find(e => e.id !== entityToDelete.id); setSelectedEntityId(n ? n.id : null); } setEntityToDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CATEGORY FIELD MANAGER ============ */}
      {activeCategoryManager && (
        <div className="modal-overlay" onClick={() => setActiveCategoryManager(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={20} className="text-primary-light" /> Fields: {activeCategoryManager}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => setActiveCategoryManager(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {Object.entries(categoryFields).map(([fieldKey, config]) => (
                <div key={fieldKey} style={{ background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{config.label || fieldKey} {config.isCustom && <span className="status-badge" style={{ fontSize: '0.65rem' }}>Custom</span>}</h4>
                    </div>
                    {config.isCustom && (
                      <button className="btn btn-secondary" style={{ padding: '4px', color: 'var(--status-expired)', borderColor: 'transparent' }}
                        onClick={() => { if (window.confirm(`Delete "${fieldKey}"?`)) { const nf = { ...categoryFields }; delete nf[fieldKey]; setCategoryFields(nf); }}}><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="form-row" style={{ gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={config.mandatory || false}
                        onChange={(e) => setCategoryFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], mandatory: e.target.checked } }))} /> Mandatory</label>
                    <div style={{ flex: 1 }}>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: '0.85rem' }} placeholder="Regex"
                        value={config.regex || ''} onChange={(e) => setCategoryFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], regex: e.target.value } }))} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Add Custom Field</h4>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}><input id="newFieldLabel" className="form-input" placeholder="Label" /></div>
                  <div className="form-group" style={{ flex: 1 }}><input id="newFieldKey" className="form-input" placeholder="Key" /></div>
                  <button type="button" className="btn btn-primary" onClick={() => {
                    const label = document.getElementById('newFieldLabel').value.trim();
                    const key = document.getElementById('newFieldKey').value.trim();
                    if (!label || !key) return alert('Both required.');
                    if (categoryFields[key]) return alert('Key exists.');
                    setCategoryFields(prev => ({ ...prev, [key]: { isCustom: true, mandatory: false, regex: '', errorMsg: '', label } }));
                    document.getElementById('newFieldLabel').value = '';
                    document.getElementById('newFieldKey').value = '';
                  }}><Plus size={16} /> Add</button>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveCategoryManager(null)}>Cancel</button>
              <button type="button" className="btn btn-glow"
                onClick={() => { onUpdateFieldConfigs({ ...fieldConfigs, [activeCategoryManager]: categoryFields }); setActiveCategoryManager(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ USER MODALS ============ */}
      {isAddUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header"><h3 className="modal-title">Create User</h3><button className="modal-close-btn" onClick={() => setIsAddUserModalOpen(false)}>&times;</button></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newUser.name || !newUser.email) return;
              onAddUser({ name: newUser.name, email: newUser.email, password: newUser.password, sysRole: newUser.sysRole, permissions: newUser.permissions, assignedEmployees: newUser.assignAll ? 'all' : newUser.assignedEmployees, accessRights: newUser.accessRights });
              setIsAddUserModalOpen(false);
            }}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="fields-form">
                  <div className="form-group"><label>Name</label><input className="form-input" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input type="email" className="form-input" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Password</label><input type="password" className="form-input" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    <div className="form-group"><label>Role</label><select className="form-input" value={newUser.sysRole} onChange={(e) => setNewUser({ ...newUser, sysRole: e.target.value })}><option value="contributor">Contributor</option><option value="admin">Admin</option></select></div>
                  </div>
                  {renderPermissions(newUser, setNewUser)}
                  {renderEmployeeAssignment(newUser, setNewUser)}
                  <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document Access</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                      {allDocTypes.map(docType => (
                        <label key={docType} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                          <input type="checkbox" checked={newUser.accessRights?.includes(docType)} onChange={(e) => { if (e.target.checked) setNewUser({ ...newUser, accessRights: [...(newUser.accessRights || []), docType] }); else setNewUser({ ...newUser, accessRights: (newUser.accessRights || []).filter(d => d !== docType) }); }} />
                          {docType}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-glow">Create</button></div>
            </form>
          </div>
        </div>
      )}

      {isEditUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header"><h3 className="modal-title">Edit User</h3><button className="modal-close-btn" onClick={() => setIsEditUserModalOpen(false)}>&times;</button></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editUser.name || !editUser.email) return;
              onEditUser(selectedUserId, { name: editUser.name, email: editUser.email, password: editUser.password, sysRole: editUser.sysRole, permissions: editUser.permissions, assignedEmployees: editUser.assignAll ? 'all' : editUser.assignedEmployees, accessRights: editUser.accessRights });
              setIsEditUserModalOpen(false);
            }}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="fields-form">
                  <div className="form-group"><label>Name</label><input className="form-input" required value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input type="email" className="form-input" required value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Password</label><input type="password" className="form-input" placeholder="Leave blank" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} /></div>
                    <div className="form-group"><label>Role</label><select className="form-input" value={editUser.sysRole} onChange={(e) => setEditUser({ ...editUser, sysRole: e.target.value })}><option value="contributor">Contributor</option><option value="admin">Admin</option></select></div>
                  </div>
                  {renderPermissions(editUser, setEditUser)}
                  {renderEmployeeAssignment(editUser, setEditUser)}
                  <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document Access</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                      {allDocTypes.map(docType => (
                        <label key={docType} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                          <input type="checkbox" checked={editUser.accessRights?.includes(docType)} onChange={(e) => { if (e.target.checked) setEditUser({ ...editUser, accessRights: [...(editUser.accessRights || []), docType] }); else setEditUser({ ...editUser, accessRights: (editUser.accessRights || []).filter(d => d !== docType) }); }} />
                          {docType}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-glow">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="modal-overlay" onClick={() => setUserToDelete(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem', color: 'var(--status-expired)' }}><AlertTriangle size={48} style={{ margin: '0 auto' }} /></div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Delete User</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Remove <strong>{userToDelete.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setUserToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--status-expired)', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => { onDeleteUser(userToDelete.id); setUserToDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}