import React, { useState, useRef, useEffect } from "react";

import {
  Upload,
  FileText,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Play,
  Terminal,
} from "lucide-react";

import { performRealOCR, parseExtractedText, convertPdfToCanvas } from '../utils/ocrScanner';
import { demoTemplates } from '../utils/mockData';

function AutoResizeTextarea({ className, value, onChange, placeholder, required, disabled }) {
  const textareaRef = useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={1}
      style={{ resize: "none", overflow: "hidden", minHeight: "38px", maxHeight: "200px", display: "block", lineHeight: "1.4" }}
    />
  );
}

function ValidatedInput({ label, fieldKey, value, onChange, placeholder, activeTab, fieldConfigs, type = "text", disabled }) {
  let error = '';
  const config = fieldConfigs?.[activeTab]?.[fieldKey] || {};
  
  if (config.mandatory && (!value || value.trim() === '')) {
    error = 'This field is mandatory';
  } else if (value && config.regex) {
    try {
      const regex = new RegExp(config.regex);
      if (!regex.test(value)) error = config.errorMsg || 'Invalid format';
    } catch (e) {}
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <input 
        type={type}
        className={`form-input ${error ? 'error-border' : ''}`}
        required={config.mandatory || false}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        style={error ? { borderColor: 'var(--status-expired)' } : {}}
      />
      {error && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function ValidatedTextarea({ label, fieldKey, value, onChange, placeholder, activeTab, fieldConfigs, disabled }) {
  let error = '';
  const config = fieldConfigs?.[activeTab]?.[fieldKey] || {};
  
  if (config.mandatory && (!value || value.trim() === '')) {
    error = 'This field is mandatory';
  } else if (value && config.regex) {
    try {
      const regex = new RegExp(config.regex);
      if (!regex.test(value)) error = config.errorMsg || 'Invalid format';
    } catch (e) {}
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <AutoResizeTextarea
        className={`form-input ${error ? 'error-border' : ''}`}
        required={config.mandatory || false}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function VerifiedField({ value, rawOcrText, children }) {
  const verify = () => {
    if (!value || !rawOcrText) return null;
    const cleanVal = String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleanVal.length < 3) return null;
    const cleanRaw = rawOcrText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return cleanRaw.includes(cleanVal);
  };
  const status = verify();
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      {children}
      {status === true && <CheckCircle2 size={16} color="var(--status-valid)" style={{position: 'absolute', right: '10px', pointerEvents: 'none'}} title="Verified against OCR" />}
      {status === false && <AlertTriangle size={16} color="var(--status-expired)" style={{position: 'absolute', right: '10px', pointerEvents: 'none'}} title="Not found in OCR" />}
    </div>
  );
}

export default function UserDashboard({ employees = [], employee, entities, entity: propEntity, loggedInUser, fieldConfigs, documentCategories = [], activeDocTypes = [], onUpdateDocuments, initialTab = "", onBack }) {
  // Support both prop naming patterns (employees/entities and employee/entity)
  const entityList = entities || employees;
  const currentEntity = propEntity || employee;
  const [activeTab, setActiveTab] = useState(initialTab || activeDocTypes[0] || "");

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    else if (activeDocTypes.length > 0 && !activeTab) setActiveTab(activeDocTypes[0]);
  }, [initialTab, activeDocTypes]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawOcrText, setRawOcrText] = useState("");

  const [ocrForm, setOcrForm] = useState({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });

  const fileInputRef = useRef(null);
  const scanSessionIdRef = useRef(0);

  // Permission checks
  const perms = loggedInUser?.permissions || { view: true, add: false, edit: false, save: false, delete: false };
  const userAccessRights = loggedInUser?.accessRights || [];
  const isAdmin = loggedInUser?.sysRole === 'admin';

  // Use dynamic doc types from props, filtered by user access
  const documentTypes = activeDocTypes.filter(dt => {
    if (isAdmin) return true;
    return userAccessRights.includes(dt);
  });

  const getAllErrors = () => {
    let hasError = false;
    if (!ocrForm) return true;
    const configs = fieldConfigs?.[activeTab] || {};
    Object.keys(configs).forEach(fieldKey => {
      const config = configs[fieldKey];
      const val = config.isCustom ? ocrForm.customFields?.[fieldKey] : ocrForm[fieldKey];
      if (config.mandatory && (!val || val.trim() === '')) hasError = true;
      if (val && config.regex) {
        try { if (!new RegExp(config.regex).test(val)) hasError = true; } catch(e) {}
      }
    });
    return hasError;
  };
  const hasValidationErrors = getAllErrors();

  const currentDoc = employee?.documents?.[activeTab] || { status: 'missing' };

  const addLog = (text) => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs((prev) => [...prev, { timestamp, text }]);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "valid": return "valid";
      case "expiring": return "expiring";
      case "expired": return "expired";
      case "pending": return "pending";
      default: return "missing";
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setScanLogs([]);
    setOcrForm({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });

    if (files.length > 1) {
      setIsScanning(true);
      setScanProgress(5);
      addLog(`Selected ${files.length} images. Merging...`);
      try {
        const canvases = await Promise.all(files.map(file => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas);
          };
          img.src = URL.createObjectURL(file);
        })));
        const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
        const maxWidth = Math.max(...canvases.map(c => c.width));
        const combinedCanvas = document.createElement("canvas");
        combinedCanvas.width = maxWidth; combinedCanvas.height = totalHeight;
        const ctx = combinedCanvas.getContext("2d");
        let currentY = 0;
        for (const c of canvases) { ctx.drawImage(c, 0, currentY); currentY += c.height; }
        const dataUrl = combinedCanvas.toDataURL("image/png");
        setPreviewUrl(dataUrl);
        setSelectedFile(files[0]);
      } catch (err) {
        addLog(`Merge error: ${err.message || err}`);
        setIsScanning(false);
      }
      return;
    }

    const file = files[0];
    setSelectedFile(file);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      addLog(`Selected PDF: ${file.name}`);
      try {
        addLog("Converting PDF page 1...");
        const canvas = await convertPdfToCanvas(file, addLog);
        const dataUrl = canvas.toDataURL("image/png");
        setPreviewUrl(dataUrl);
      } catch (err) {
        addLog(`PDF error: ${err.message || err}`);
        setIsScanning(false);
      }
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      runOCRScan(file, false);
    }
  };

  const handleDemoSelect = (templateKey) => {
    const template = demoTemplates[templateKey];
    if (!template) return;
    setSelectedFile({ name: `${templateKey.toLowerCase().replace(/ /g, "_")}_sample.png`, type: "image/png" });
    setPreviewUrl("demo");
    setScanLogs([]);
    setOcrForm({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });
    runOCRScan(template, true);
  };

  const runOCRScan = async (source, isDemo = false) => {
    scanSessionIdRef.current += 1;
    const currentSession = scanSessionIdRef.current;
    const checkCancel = () => currentSession !== scanSessionIdRef.current;
    setIsScanning(true);
    setScanProgress(0);

    if (isDemo) {
      addLog("Initializing Tesseract OCR Engine...");
      await new Promise(r => setTimeout(r, 600));
      if (checkCancel()) return;
      setScanProgress(20);
      addLog("Loading Language Training Set...");
      await new Promise(r => setTimeout(r, 500));
      if (checkCancel()) return;
      setScanProgress(40);
      addLog("Pre-processing Image...");
      await new Promise(r => setTimeout(r, 700));
      if (checkCancel()) return;
      setScanProgress(60);
      addLog("Running layout analysis...");
      await new Promise(r => setTimeout(r, 500));
      if (checkCancel()) return;
      setScanProgress(85);
      addLog("Regex pattern matching...");
      await new Promise(r => setTimeout(r, 600));
      if (checkCancel()) return;
      setScanProgress(100);
      setOcrForm({
        docNumber: source.docNumber, startDate: source.startDate,
        expiryDate: source.expiryDate, fullName: source.extractedFields.fullName || (employee?.name || ''),
        customFields: { ...source.extractedFields }
      });
      addLog(`Scan Complete! Found: ${source.docNumber}`);
      setIsScanning(false);
    } else {
      try {
        addLog("Tesseract.js: Spawning worker...");
        const rawText = await performRealOCR(source, (msg) => addLog(msg), (val) => setScanProgress(val));
        const textSample = rawText.trim().replace(/\n/g, "  |  ");
        addLog(`OCR Output: "${textSample}"`);
        setRawOcrText(rawText);
        addLog("Analyzing extracted characters...");
        const parsed = parseExtractedText(rawText, activeTab);
        if (parsed.debugDates?.length > 0) addLog(`Dates found: ${parsed.debugDates.join(", ")}`);
        if (parsed.debugValidityDates) addLog(`Validity: ${parsed.debugValidityDates.join(", ")}`);
        setOcrForm({
          docNumber: parsed.docNumber || "NOT FOUND",
          startDate: parsed.startDate || "",
          expiryDate: parsed.expiryDate || "",
          fullName: parsed.extractedFields.fullName || (employee?.name || ''),
          customFields: parsed.extractedFields
        });
        addLog("Fields populated.");
      } catch (err) {
        addLog(`Scan error: ${err.message || err}`);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSaveDocument = (e) => {
    e.preventDefault();
    let status = "valid";
    if (ocrForm.expiryDate) {
      const today = new Date("2026-07-08");
      const expiry = new Date(ocrForm.expiryDate);
      if (expiry < today) status = "expired";
      else {
        const diffDays = Math.ceil(Math.abs(expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) status = "expiring";
      }
    }
    const updatedDoc = {
      status, docNumber: ocrForm.docNumber, startDate: ocrForm.startDate,
      expiryDate: ocrForm.expiryDate,
      extractedFields: { fullName: ocrForm.fullName, ...ocrForm.customFields },
      lastUpdated: new Date().toISOString().split("T")[0],
      fileName: selectedFile ? selectedFile.name : "scanned_doc.png"
    };
    onUpdateDocuments(employee?.id, activeTab, updatedDoc);
    setSelectedFile(null); setPreviewUrl(null);
    setOcrForm({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });
    setScanLogs([]);
  };

  const handleDeleteDoc = () => {
    if (window.confirm(`Delete saved ${activeTab}?`)) {
      onUpdateDocuments(employee?.id, activeTab, { status: "missing" });
    }
  };

  const renderSimulatedCard = () => {
    let cardTitle = activeTab;
    let primaryNumber = ocrForm.docNumber || "784-XXXX-XXXXXXX-X";
    let holderName = ocrForm.fullName || employee?.name || '';
    if (activeTab === "Emirates ID") cardTitle = "UNITED ARAB EMIRATES IDENTITY CARD";
    else if (activeTab === "Visa") { cardTitle = "UAE RESIDENCE VISA"; primaryNumber = ocrForm.docNumber || "201/YYYY/XXXXXXX"; }
    else if (activeTab === "Passport") cardTitle = "PASSPORT / PASSEPORT";

    return (
      <div className="mock-doc-visual-card">
        <div className="mock-card-logo-row"><span>{cardTitle}</span><ShieldCheck size={18} className="text-secondary" /></div>
        <div className="mock-card-chip"></div>
        <div className="mock-card-number">{primaryNumber}</div>
        <div className="mock-card-details">
          <div>
            <div className="mock-card-field-lbl">Holder Name</div>
            <div className="mock-card-field-val">{holderName}</div>
          </div>
          <div>
            <div className="mock-card-field-lbl">{activeTab === "Emirates ID" ? "Card Number" : "Nationality"}</div>
            <div className="mock-card-field-val">
              {activeTab === "Emirates ID" ? (ocrForm.customFields.cardNumber || "-") : (ocrForm.customFields.nationality || ocrForm.customFields.issuingPlace || "UAE")}
            </div>
          </div>
        </div>
        <div className="mock-card-dates">
          <div><div className="mock-card-field-lbl">Issue Date</div><div className="mock-card-field-val">{ocrForm.startDate || "YYYY-MM-DD"}</div></div>
          <div><div className="mock-card-field-lbl">Expiry Date</div><div className="mock-card-field-val">{ocrForm.expiryDate || "YYYY-MM-DD"}</div></div>
        </div>
      </div>
    );
  };

  if (!employee) {
    return (
      <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <FileText size={48} className="text-secondary" />
        <h3 style={{ marginTop: '1rem' }}>No Employee Assigned</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          You don't have any employees assigned to manage. Contact your admin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      <div className="glass-card" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack}
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} title="Back">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="avatar-circle" style={{ width: "56px", height: "56px", fontSize: "1.25rem" }}>{employee.avatar}</div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.5px" }}>{employee.name}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {employee.role} &bull; <strong style={{ color: "var(--primary-light)" }}>{employee.department}</strong>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {Object.entries(employee.documents || {}).some(([_, d]) => d.status === "expired") && (
            <div className="status-badge expired" style={{ padding: "8px 14px" }}><AlertTriangle size={14} /> Expired</div>
          )}
          {Object.entries(employee.documents || {}).some(([_, d]) => d.status === "expiring") && (
            <div className="status-badge expiring" style={{ padding: "8px 14px" }}><Calendar size={14} /> Expiring</div>
          )}
        </div>
      </div>

      <div className="tabs-container">
        {documentTypes.map((type) => {
          const doc = employee.documents?.[type] || { status: "missing" };
          return (
            <button key={type} className={`tab-btn ${activeTab === type ? "active" : ""}`}
              onClick={() => {
                setActiveTab(type); setSelectedFile(null); setPreviewUrl(null);
                setOcrForm({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });
                setScanLogs([]);
              }}>
              <span className={`tab-status-dot ${getStatusClass(doc.status)}`}></span>{type}
            </button>
          );
        })}
      </div>

      <div className="glass-card">
        {currentDoc.status !== "missing" && !previewUrl ? (
          <div className="doc-details-grid" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="document-visual">
              <div className="doc-info-bar">
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>File: <strong>{currentDoc.fileName}</strong></span>
                <span className={`status-badge ${getStatusClass(currentDoc.status)}`}>{currentDoc.status}</span>
              </div>
              <div style={{ height: "250px" }}>
                <div className="mock-doc-visual-card">
                  <div className="mock-card-logo-row"><span>{activeTab.toUpperCase()} DETAILS</span><CheckCircle2 size={18} style={{ color: "var(--status-valid)" }} /></div>
                  <div className="mock-card-chip"></div>
                  <div className="mock-card-number">{currentDoc.docNumber}</div>
                  <div className="mock-card-details">
                    <div><div className="mock-card-field-lbl">Name</div><div className="mock-card-field-val">{currentDoc.extractedFields?.fullName || employee.name}</div></div>
                    <div><div className="mock-card-field-lbl">{activeTab === "Emirates ID" ? "Card Number" : "Last Verified"}</div>
                      <div className="mock-card-field-val">{activeTab === "Emirates ID" ? (currentDoc.extractedFields?.cardNumber || "N/A") : currentDoc.lastUpdated}</div></div>
                  </div>
                  <div className="mock-card-dates">
                    <div><div className="mock-card-field-lbl">Issue Date</div><div className="mock-card-field-val">{currentDoc.startDate || "N/A"}</div></div>
                    <div><div className="mock-card-field-lbl">Expiry Date</div><div className="mock-card-field-val">{currentDoc.expiryDate || "N/A"}</div></div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
                {perms.add && (
                  <button className="btn btn-secondary" onClick={() => {
                    setSelectedFile({ name: currentDoc.fileName }); setPreviewUrl("demo");
                    setOcrForm({
                      docNumber: currentDoc.docNumber, startDate: currentDoc.startDate,
                      expiryDate: currentDoc.expiryDate, fullName: currentDoc.extractedFields?.fullName || employee.name,
                      customFields: currentDoc.extractedFields || {}
                    });
                  }}><RefreshCw size={14} /> Update Scan</button>
                )}
                {perms.delete && (
                  <button className="btn btn-danger" onClick={handleDeleteDoc}><Trash2 size={14} /> Remove</button>
                )}
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1.1rem", fontWeight: 600 }}>Extracted Parameters</h3>
              <div className="fields-form">
                {activeTab === "Emirates ID" ? (
                  <>
                    <div className="form-group"><label>ID Number</label>
                      <VerifiedField value={currentDoc.docNumber || "-"} rawOcrText={rawOcrText}>
                        <VerifiedField value={currentDoc.docNumber || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.docNumber || "-"} rawOcrText={rawOcrText}>
                            <AutoResizeTextarea className="form-input" disabled value={currentDoc.docNumber || "-"} />
                          </VerifiedField>
                        </VerifiedField>
                      </VerifiedField>
                    </div>
                    <div className="form-group"><label>Name</label>
                      <VerifiedField value={currentDoc.extractedFields?.fullName || "-"} rawOcrText={rawOcrText}>
                        <VerifiedField value={currentDoc.extractedFields?.fullName || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.fullName || "-"} rawOcrText={rawOcrText}>
                            <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.fullName || "-"} />
                          </VerifiedField>
                        </VerifiedField>
                      </VerifiedField>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Date Of Birth</label>
                        <VerifiedField value={currentDoc.extractedFields?.dob || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.dob || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.dob || "-"} rawOcrText={rawOcrText}>
                              <input className="form-input" disabled value={currentDoc.extractedFields?.dob || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Nationality</label>
                        <VerifiedField value={currentDoc.extractedFields?.nationality || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.nationality || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.nationality || "-"} rawOcrText={rawOcrText}>
                              <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.nationality || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Issuing Date</label>
                        <VerifiedField value={currentDoc.startDate || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.startDate || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.startDate || "-"} rawOcrText={rawOcrText}>
                              <input className="form-input" disabled value={currentDoc.startDate || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Expiry Date</label>
                        <VerifiedField value={currentDoc.expiryDate || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.expiryDate || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.expiryDate || "-"} rawOcrText={rawOcrText}>
                              <input className="form-input" disabled value={currentDoc.expiryDate || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Sex</label>
                        <VerifiedField value={currentDoc.extractedFields?.sex || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.sex || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.sex || "-"} rawOcrText={rawOcrText}>
                              <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.sex || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Card Number</label>
                        <VerifiedField value={currentDoc.extractedFields?.cardNumber || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.cardNumber || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.cardNumber || "-"} rawOcrText={rawOcrText}>
                              <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.cardNumber || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Occupation</label>
                        <VerifiedField value={currentDoc.extractedFields?.occupation || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.occupation || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.occupation || "-"} rawOcrText={rawOcrText}>
                              <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.occupation || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Employer</label>
                        <VerifiedField value={currentDoc.extractedFields?.employer || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.employer || "-"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.extractedFields?.employer || "-"} rawOcrText={rawOcrText}>
                              <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.employer || "-"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-group"><label>Issuing Place</label>
                      <VerifiedField value={currentDoc.extractedFields?.issuingPlace || "-"} rawOcrText={rawOcrText}>
                        <VerifiedField value={currentDoc.extractedFields?.issuingPlace || "-"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.issuingPlace || "-"} rawOcrText={rawOcrText}>
                            <AutoResizeTextarea className="form-input" disabled value={currentDoc.extractedFields?.issuingPlace || "-"} />
                          </VerifiedField>
                        </VerifiedField>
                      </VerifiedField>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group"><label>Document ID</label>
                      <VerifiedField value={currentDoc.docNumber} rawOcrText={rawOcrText}>
                        <VerifiedField value={currentDoc.docNumber} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.docNumber} rawOcrText={rawOcrText}>
                            <input className="form-input" disabled value={currentDoc.docNumber} />
                          </VerifiedField>
                        </VerifiedField>
                      </VerifiedField>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Issue Date</label>
                        <VerifiedField value={currentDoc.startDate || "N/A"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.startDate || "N/A"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.startDate || "N/A"} rawOcrText={rawOcrText}>
                              <input className="form-input" disabled value={currentDoc.startDate || "N/A"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Expiry Date</label>
                        <VerifiedField value={currentDoc.expiryDate || "N/A"} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.expiryDate || "N/A"} rawOcrText={rawOcrText}>
                            <VerifiedField value={currentDoc.expiryDate || "N/A"} rawOcrText={rawOcrText}>
                              <input className="form-input" disabled value={currentDoc.expiryDate || "N/A"} />
                            </VerifiedField>
                          </VerifiedField>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-group"><label>Full Name</label>
                      <VerifiedField value={currentDoc.extractedFields?.fullName || employee.name} rawOcrText={rawOcrText}>
                        <VerifiedField value={currentDoc.extractedFields?.fullName || employee.name} rawOcrText={rawOcrText}>
                          <VerifiedField value={currentDoc.extractedFields?.fullName || employee.name} rawOcrText={rawOcrText}>
                            <input className="form-input" disabled value={currentDoc.extractedFields?.fullName || employee.name} />
                          </VerifiedField>
                        </VerifiedField>
                      </VerifiedField>
                    </div>
                    {Object.entries(currentDoc.extractedFields || {}).map(([key, val]) => {
                      if (key === "fullName") return null;
                      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                      return (
                        <div className="form-group" key={key}><label>{label}</label>
                          <VerifiedField value={val} rawOcrText={rawOcrText}>
                            <VerifiedField value={val} rawOcrText={rawOcrText}>
                              <VerifiedField value={val} rawOcrText={rawOcrText}>
                                <input className="form-input" disabled value={val} />
                              </VerifiedField>
                            </VerifiedField>
                          </VerifiedField>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="doc-details-grid">
            <div className="document-visual">
              {previewUrl ? (
                <div className="image-preview-box has-image">
                  {isScanning && <div className="scan-line"></div>}
                  {previewUrl === "demo" ? renderSimulatedCard() : <img src={previewUrl} className="image-bg" alt="Document" />}
                  {isScanning && (
                    <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.8)", padding: "4px 10px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="tab-status-dot pending"></span>
                      <span style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono", color: "var(--text-primary)" }}>OCR Scanning... {scanProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="image-preview-box" onClick={() => perms.add && fileInputRef.current && fileInputRef.current.click()}
                  style={{ cursor: perms.add ? 'pointer' : 'default' }}>
                  <div className="upload-placeholder">
                    <Upload size={36} className="text-secondary" style={{ animation: perms.add ? "bounce 2s infinite" : "none", opacity: perms.add ? 1 : 0.4 }} />
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{perms.add ? "Upload scanned image or document" : "View Only - No Upload Permission"}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{perms.add ? "Supports JPG, PNG, PDF" : "Contact admin for upload rights"}</span>
                    {perms.add && <button className="btn btn-primary" style={{ marginTop: "0.5rem" }}>Browse Files</button>}
                  </div>
                  {perms.add && (
                    <input type="file" ref={fileInputRef} className="file-input" accept="image/*,application/pdf" multiple onChange={handleFileChange} />
                  )}
                </div>
              )}

              {(isScanning || scanLogs.length > 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600 }}>
                    <Terminal size={14} /><span>OCR ENGINE LOGS</span>
                  </div>
                  <div className="ocr-log-terminal">
                    {scanLogs.map((log, i) => (
                      <div className="ocr-log-line" key={i}><span className="ocr-log-time">[{log.timestamp}]</span><span className="ocr-log-text">{log.text}</span></div>
                    ))}
                    {isScanning && (
                      <div className="ocr-log-line">
                        <span className="ocr-log-time">&bull;</span>
                        <span className="ocr-log-text" style={{ color: "var(--primary-light)" }}>Processing...</span>
                      </div>
                    )}
                  </div>
                  <div className="ocr-log-progress-bar" style={{ width: `${scanProgress}%` }}></div>
                </div>
              )}

              {!previewUrl && perms.add && (
                <div className="demo-picker-container">
                  <span className="demo-picker-label">Test scanning instantly:</span>
                  <div className="demo-picker-grid">
                    {demoTemplates[activeTab] ? (
                      <div className="demo-template-option" onClick={() => handleDemoSelect(activeTab)}>
                        <div><div className="demo-template-title">{demoTemplates[activeTab].name}</div><div className="demo-template-desc">{demoTemplates[activeTab].description}</div></div>
                        <Play size={14} className="text-secondary" />
                      </div>
                    ) : (
                      <div className="demo-template-option" onClick={() => handleDemoSelect("Emirates ID")}>
                        <div><div className="demo-template-title">Use Emirates ID Mock</div><div className="demo-template-desc">Fills with mock data</div></div>
                        <Play size={14} className="text-secondary" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                  <FileText size={18} className="text-secondary" /> Verify Extracted Details
                </h3>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                {perms.edit ? "Fields below are auto-populated. Correct any errors before saving." : "View extracted document fields below."}
              </p>

              <form className="fields-form" onSubmit={handleSaveDocument}>
                {activeTab === "Emirates ID" ? (
                  <>
                    <ValidatedTextarea label="ID Number" fieldKey="docNumber" value={ocrForm.docNumber}
                      placeholder="e.g. 784-2000-3832428-9" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, docNumber: e.target.value })} />
                    <ValidatedInput label="Name" fieldKey="fullName" value={ocrForm.fullName}
                      placeholder="e.g. FULL NAME" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, fullName: e.target.value })} />
                    <div className="form-row">
                      <div className="form-group"><label>Date Of Birth</label>
                        <input type="date" className="form-input" required disabled={!perms.edit}
                          value={ocrForm.customFields.dob || ""}
                          onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, dob: e.target.value } })} />
                      </div>
                      <div className="form-group"><label>Nationality</label>
                        <VerifiedField value={ocrForm.customFields.nationality || ""} rawOcrText={rawOcrText}>
                          <AutoResizeTextarea className="form-input" required disabled={!perms.edit}
                            placeholder="e.g. INDIA" value={ocrForm.customFields.nationality || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, nationality: e.target.value } })} />
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-row">
                      <ValidatedInput label="Issuing Date" fieldKey="startDate" value={ocrForm.startDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, startDate: e.target.value })} />
                      <ValidatedInput label="Expiry Date" fieldKey="expiryDate" value={ocrForm.expiryDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, expiryDate: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Sex</label>
                        <VerifiedField value={ocrForm.customFields.sex || ""} rawOcrText={rawOcrText}>
                          <select className="form-input" required disabled={!perms.edit}
                            value={ocrForm.customFields.sex || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, sex: e.target.value } })}>
                            <option value="" disabled>Select Gender</option>
                            <option value="MALE">Male</option><option value="FEMALE">Female</option>
                          </select>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Card Number</label>
                        <VerifiedField value={ocrForm.customFields.cardNumber || ""} rawOcrText={rawOcrText}>
                          <AutoResizeTextarea className="form-input" required disabled={!perms.edit}
                            placeholder="e.g. 139439373" value={ocrForm.customFields.cardNumber || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, cardNumber: e.target.value } })} />
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Occupation</label>
                        <VerifiedField value={ocrForm.customFields.occupation || ""} rawOcrText={rawOcrText}>
                          <select className="form-input" required disabled={!perms.edit}
                            value={ocrForm.customFields.occupation || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, occupation: e.target.value } })}>
                            <option value="" disabled>Select Occupation</option>
                            <option value="Welder">Welder</option><option value="Fabricator">Fabricator</option>
                            <option value="Helper">Helper</option><option value="Draftsman">Draftsman</option>
                            <option value="Driver">Driver</option><option value="Laundry Man">Laundry Man</option>
                            <option value="Pressman">Pressman</option>
                          </select>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Employer</label>
                        <VerifiedField value={ocrForm.customFields.employer || ""} rawOcrText={rawOcrText}>
                          <select className="form-input" required disabled={!perms.edit}
                            value={ocrForm.customFields.employer || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, employer: e.target.value } })}>
                            <option value="" disabled>Select Employer</option>
                            <option value="Jabel Al Malayha W.Shop LLC SP">Jabel Al Malayha W.Shop LLC SP</option>
                            <option value="Atlas Laundry LLC">Atlas Laundry LLC</option>
                          </select>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-group"><label>Issuing Place</label>
                      <VerifiedField value={ocrForm.customFields.issuingPlace || ""} rawOcrText={rawOcrText}>
                        <select className="form-input" required disabled={!perms.edit}
                          value={ocrForm.customFields.issuingPlace || ""}
                          onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, issuingPlace: e.target.value } })}>
                          <option value="" disabled>Select Issuing Place</option>
                          <option value="Dubai">Dubai</option><option value="Sharjah">Sharjah</option>
                        </select>
                      </VerifiedField>
                    </div>
                  </>
                ) : activeTab === "Visa" ? (
                  <>
                    <ValidatedInput label="Name" fieldKey="fullName" value={ocrForm.fullName}
                      placeholder="e.g. Rachel Green" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, fullName: e.target.value })} />
                    <ValidatedInput label="ID Number" fieldKey="docNumber" value={ocrForm.docNumber}
                      placeholder="e.g. 784-1992-1234567-2" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, docNumber: e.target.value })} />
                    <div className="form-group"><label>File Number</label>
                      <VerifiedField value={ocrForm.customFields.fileNumber || ""} rawOcrText={rawOcrText}>
                        <input className="form-input" placeholder="e.g. 1029384" disabled={!perms.edit}
                          value={ocrForm.customFields.fileNumber || ""}
                          onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, fileNumber: e.target.value } })} />
                      </VerifiedField>
                    </div>
                    <div className="form-group"><label>Passport Number</label>
                      <VerifiedField value={ocrForm.customFields.passportNumber || ""} rawOcrText={rawOcrText}>
                        <input className="form-input" placeholder="e.g. K1234567" disabled={!perms.edit}
                          value={ocrForm.customFields.passportNumber || ""}
                          onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, passportNumber: e.target.value } })} />
                      </VerifiedField>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Place of Issue</label>
                        <VerifiedField value={ocrForm.customFields.issuingPlace || ""} rawOcrText={rawOcrText}>
                          <select className="form-input" disabled={!perms.edit}
                            value={ocrForm.customFields.issuingPlace || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, issuingPlace: e.target.value } })}>
                            <option value="" disabled>Select</option>
                            <option value="Dubai">Dubai</option><option value="Sharjah">Sharjah</option>
                          </select>
                        </VerifiedField>
                      </div>
                      <div className="form-group"><label>Occupation</label>
                        <VerifiedField value={ocrForm.customFields.occupation || ""} rawOcrText={rawOcrText}>
                          <select className="form-input" disabled={!perms.edit}
                            value={ocrForm.customFields.occupation || ""}
                            onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, occupation: e.target.value } })}>
                            <option value="" disabled>Select</option>
                            <option value="Welder">Welder</option><option value="Fabricator">Fabricator</option>
                            <option value="Helper">Helper</option><option value="Draftsman">Draftsman</option>
                            <option value="Driver">Driver</option><option value="Laundry Man">Laundry Man</option>
                            <option value="Pressman">Pressman</option>
                          </select>
                        </VerifiedField>
                      </div>
                    </div>
                    <div className="form-group"><label>Employer</label>
                      <VerifiedField value={ocrForm.customFields.employer || ""} rawOcrText={rawOcrText}>
                        <select className="form-input" disabled={!perms.edit}
                          value={ocrForm.customFields.employer || ""}
                          onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, employer: e.target.value } })}>
                          <option value="" disabled>Select</option>
                          <option value="Jabel Al Malayha W.Shop LLC SP">Jabel Al Malayha</option>
                          <option value="Atlas Laundry LLC">Atlas Laundry LLC</option>
                        </select>
                      </VerifiedField>
                    </div>
                    <div className="form-row">
                      <ValidatedInput label="Issue Date" fieldKey="startDate" value={ocrForm.startDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, startDate: e.target.value })} />
                      <ValidatedInput label="Expiry Date" fieldKey="expiryDate" value={ocrForm.expiryDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, expiryDate: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <ValidatedInput label="Document ID" fieldKey="docNumber" value={ocrForm.docNumber}
                      placeholder="e.g. 784-1992-1234567-2" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, docNumber: e.target.value })} />
                    <div className="form-row">
                      <ValidatedInput label="Issue Date" fieldKey="startDate" value={ocrForm.startDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, startDate: e.target.value })} />
                      <ValidatedInput label="Expiry Date" fieldKey="expiryDate" value={ocrForm.expiryDate}
                        placeholder="" activeTab={activeTab} fieldConfigs={fieldConfigs}
                        disabled={!perms.edit} type="date"
                        onChange={(e) => setOcrForm({ ...ocrForm, expiryDate: e.target.value })} />
                    </div>
                    <ValidatedInput label="Full Name" fieldKey="fullName" value={ocrForm.fullName}
                      placeholder="Enter name" activeTab={activeTab} fieldConfigs={fieldConfigs}
                      disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, fullName: e.target.value })} />
                  </>
                )}

                {activeTab === "Labour Card" && (
                  <div className="form-group"><label>Work Permit Number</label>
                    <VerifiedField value={ocrForm.customFields.workPermitNo || ""} rawOcrText={rawOcrText}>
                      <input className="form-input" placeholder="e.g. WP-9083120" disabled={!perms.edit}
                        value={ocrForm.customFields.workPermitNo || ""}
                        onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, workPermitNo: e.target.value } })} />
                    </VerifiedField>
                  </div>
                )}
                {activeTab === "ILOE" && (
                  <div className="form-group"><label>Insurance Provider</label>
                    <VerifiedField value={ocrForm.customFields.insuranceCompany || ""} rawOcrText={rawOcrText}>
                      <input className="form-input" placeholder="e.g. Dubai Insurance Co" disabled={!perms.edit}
                        value={ocrForm.customFields.insuranceCompany || ""}
                        onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, insuranceCompany: e.target.value } })} />
                    </VerifiedField>
                  </div>
                )}
                {activeTab === "Health Card" && (
                  <div className="form-group"><label>Health Network Tier</label>
                    <VerifiedField value={ocrForm.customFields.network || ""} rawOcrText={rawOcrText}>
                      <input className="form-input" placeholder="e.g. Premium VIP Network" disabled={!perms.edit}
                        value={ocrForm.customFields.network || ""}
                        onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, network: e.target.value } })} />
                    </VerifiedField>
                  </div>
                )}

                {Object.entries(fieldConfigs?.[activeTab] || {})
                  .filter(([key, config]) => config.isCustom)
                  .map(([key, config]) => (
                    <ValidatedInput key={`custom-${key}`} label={config.label || key} fieldKey={key}
                      value={ocrForm.customFields?.[key] || ''} placeholder={`e.g. ${config.label || key}`}
                      activeTab={activeTab} fieldConfigs={fieldConfigs} disabled={!perms.edit}
                      onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, [key]: e.target.value } })} />
                  ))
                }

                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  {perms.save && (
                    <button type="submit" className="btn btn-glow"
                      disabled={!ocrForm.docNumber || isScanning || hasValidationErrors}
                      style={{ flex: 1, justifyContent: 'center', opacity: hasValidationErrors ? 0.5 : 1, cursor: hasValidationErrors ? 'not-allowed' : 'pointer' }}>
                      Save & Approve Document Details
                    </button>
                  )}
                  {perms.add && (
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      scanSessionIdRef.current += 1;
                      setSelectedFile(null); setPreviewUrl(null); setIsScanning(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setOcrForm({ docNumber: "", startDate: "", expiryDate: "", fullName: "", customFields: {} });
                      setScanLogs([]); setRawOcrText("");
                    }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}