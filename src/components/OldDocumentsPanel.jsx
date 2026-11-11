import React, { useState } from 'react';
import { Archive, Calendar, ChevronDown, ChevronRight, FileText, RefreshCw } from 'lucide-react';

const labelize = (key) =>
  String(key).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

const formatRange = (item) => {
  if (item.startDate && item.expiryDate) return `${item.startDate} \u2192 ${item.expiryDate}`;
  if (item.expiryDate) return `Expired ${item.expiryDate}`;
  if (item.startDate) return `Issued ${item.startDate}`;
  return 'No dates recorded';
};

/**
 * Read-only list of archived (expired or manually archived) document versions.
 * Used inside the document view and inside the admin "Old Docs" modal.
 */
export default function OldDocumentsPanel({
  items = [],
  canRenew = false,
  onRenew,
  onClose,
  showHeader = true,
  initialDocType = null
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState(initialDocType);

  const sortedAll = [...items].sort((a, b) =>
    String(b.archivedAt || '').localeCompare(String(a.archivedAt || ''))
  );
  const docTypes = [...new Set(sortedAll.map(item => item.docType).filter(Boolean))];
  const sorted = typeFilter ? sortedAll.filter(item => item.docType === typeFilter) : sortedAll;

  return (
    <div className="old-docs-panel">
      {showHeader && (
        <div className="old-docs-panel-header">
          <div>
            <h3 className="old-docs-title">
              <Archive size={18} /> Old Documents
              <span className="old-docs-count">{sorted.length}</span>
            </h3>
            <p className="old-docs-subtitle">
              Expired versions are stored here automatically. Upload the renewed document to update the record &mdash;
              the expired copy stays in this list.
            </p>
          </div>
          {onClose && (
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={onClose}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Current documents
            </button>
          )}
        </div>
      )}

      {docTypes.length > 1 && sortedAll.length > 0 && (
        <div className="old-docs-filters">
          <button type="button" className={`old-chip ${typeFilter === null ? 'active' : ''}`}
            onClick={() => setTypeFilter(null)}>All ({sortedAll.length})</button>
          {docTypes.map(type => (
            <button key={type} type="button" className={`old-chip ${typeFilter === type ? 'active' : ''}`}
              onClick={() => setTypeFilter(type)}>
              {type} ({sortedAll.filter(item => item.docType === type).length})
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="old-docs-empty">
          <Archive size={32} />
          <div className="old-docs-empty-title">No archived documents yet</div>
          <div className="old-docs-empty-desc">
            When a document passes its expiry date it is saved here automatically, so you can upload the renewed version.
          </div>
        </div>
      ) : (
        <ul className="old-docs-list">
          {sorted.map((item) => {
            const isOpen = expandedId === item.id;
            const fields = Object.entries(item.extractedFields || {}).filter(
              ([, value]) => value !== '' && value !== null && value !== undefined
            );
            return (
              <li key={item.id} className={`old-doc-row ${isOpen ? 'open' : ''}`}>
                <div className="old-doc-main">
                  <button
                    type="button"
                    className="old-doc-toggle"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedId(isOpen ? null : item.id)}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="old-doc-type"><FileText size={14} /> {item.docType}</span>
                  </button>
                  <span className="old-doc-number">{item.docNumber || 'No number recorded'}</span>
                  <span className="old-doc-meta"><Calendar size={12} /> {formatRange(item)}</span>
                  <span className="old-doc-archived">Archived {item.archivedAt}</span>
                  {canRenew && onRenew && (
                    <button className="btn btn-glow old-doc-renew" onClick={() => onRenew(item)}>
                      <RefreshCw size={13} /> Update with new document
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="old-doc-details">
                    <div><span>Archived on</span><strong>{item.archivedAt || '\u2014'}</strong></div>
                    <div><span>Reason</span><strong>{item.reason === 'expired' ? 'Expired' : 'Archived'}</strong></div>
                    <div><span>File</span><strong>{item.fileName || '\u2014'}</strong></div>
                    <div><span>Last updated</span><strong>{item.lastUpdated || '\u2014'}</strong></div>
                    {fields.map(([key, value]) => (
                      <div key={key}><span>{labelize(key)}</span><strong>{String(value)}</strong></div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
