import sys

with open(r'src/components/UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Edit 1: add validationRules to props
content = content.replace(
    'export default function UserDashboard({ employee, onUpdateDocuments }) {',
    'export default function UserDashboard({ employee, validationRules, onUpdateDocuments }) {'
)

# Edit 2: add validateField helper
helper = """  const currentDoc = employee.documents[activeTab] || { status: 'missing' };

  const validateField = (docType, fieldName, value) => {
    if (!validationRules || !validationRules[docType] || !validationRules[docType][fieldName]) {
      return ''; 
    }
    const rule = validationRules[docType][fieldName];
    if (rule.regex && value) {
      try {
        const regex = new RegExp(rule.regex);
        if (!regex.test(value)) {
          return rule.errorMsg || 'Invalid format';
        }
      } catch (e) {
        console.error("Invalid regex in validation rule", e);
      }
    }
    return ''; 
  };

  const docNumberError = activeTab === 'Visa' ? validateField('Visa', 'docNumber', ocrForm.docNumber) : '';
  const fileNumberError = activeTab === 'Visa' ? validateField('Visa', 'fileNumber', ocrForm.customFields.fileNumber) : '';
  const passportNumberError = activeTab === 'Visa' ? validateField('Visa', 'passportNumber', ocrForm.customFields.passportNumber) : '';
  const hasValidationErrors = Boolean(docNumberError || fileNumberError || passportNumberError);

  // Write log helper"""

content = content.replace(
    "  const currentDoc = employee.documents[activeTab] || { status: 'missing' };\n\n  // Write log helper",
    helper
)

# Edit 3: Update Visa tab fields
old_visa_id = """                    <div className="form-group">
                      <label>Id Number</label>
                      <VerifiedField value={ocrForm.docNumber} rawOcrText={rawOcrText}>
<input 
                        className="form-input" 
                        required 
                        placeholder="e.g. 784-1992-1234567-2" 
                        value={ocrForm.docNumber}
                        onChange={(e) => setOcrForm({...ocrForm, docNumber: e.target.value})}
                      />
</VerifiedField>
                    </div>"""

new_visa_id = """                    <div className="form-group">
                      <label>Id Number</label>
                      <VerifiedField value={ocrForm.docNumber} rawOcrText={rawOcrText}>
<input 
                        className={`form-input ${docNumberError ? 'error-border' : ''}`} 
                        required 
                        placeholder="e.g. 784-1992-1234567-2" 
                        value={ocrForm.docNumber}
                        onChange={(e) => setOcrForm({...ocrForm, docNumber: e.target.value})}
                        style={docNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                      />
</VerifiedField>
                      {docNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{docNumberError}</span>}
                    </div>"""
content = content.replace(old_visa_id, new_visa_id)

old_visa_file = """                    <div className="form-group">
                      <label>File Number</label>
                      <VerifiedField value={ocrForm.customFields.fileNumber || ''} rawOcrText={rawOcrText}>
<input 
                        className="form-input" 
                        placeholder="e.g. 1029384"
                        value={ocrForm.customFields.fileNumber || ''}
                        onChange={(e) => setOcrForm({
                          ...ocrForm, 
                          customFields: { ...ocrForm.customFields, fileNumber: e.target.value }
                        })}
                      />
</VerifiedField>
                    </div>"""

new_visa_file = """                    <div className="form-group">
                      <label>File Number</label>
                      <VerifiedField value={ocrForm.customFields.fileNumber || ''} rawOcrText={rawOcrText}>
<input 
                        className={`form-input ${fileNumberError ? 'error-border' : ''}`} 
                        placeholder="e.g. 1029384"
                        value={ocrForm.customFields.fileNumber || ''}
                        onChange={(e) => setOcrForm({
                          ...ocrForm, 
                          customFields: { ...ocrForm.customFields, fileNumber: e.target.value }
                        })}
                        style={fileNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                      />
</VerifiedField>
                      {fileNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fileNumberError}</span>}
                    </div>"""
content = content.replace(old_visa_file, new_visa_file)

old_visa_passport = """                    <div className="form-group">
                      <label>Passport Number</label>
                      <VerifiedField value={ocrForm.customFields.passportNumber || ''} rawOcrText={rawOcrText}>
<input 
                        className="form-input" 
                        placeholder="e.g. K1234567"
                        value={ocrForm.customFields.passportNumber || ''}
                        onChange={(e) => setOcrForm({
                          ...ocrForm, 
                          customFields: { ...ocrForm.customFields, passportNumber: e.target.value }
                        })}
                      />
</VerifiedField>
                    </div>"""

new_visa_passport = """                    <div className="form-group">
                      <label>Passport Number</label>
                      <VerifiedField value={ocrForm.customFields.passportNumber || ''} rawOcrText={rawOcrText}>
<input 
                        className={`form-input ${passportNumberError ? 'error-border' : ''}`} 
                        placeholder="e.g. K1234567"
                        value={ocrForm.customFields.passportNumber || ''}
                        onChange={(e) => setOcrForm({
                          ...ocrForm, 
                          customFields: { ...ocrForm.customFields, passportNumber: e.target.value }
                        })}
                        style={passportNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                      />
</VerifiedField>
                      {passportNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{passportNumberError}</span>}
                    </div>"""
content = content.replace(old_visa_passport, new_visa_passport)

old_button = """                  <button 
                    type="submit" 
                    className="btn btn-glow" 
                    disabled={!ocrForm.docNumber || isScanning}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Save & Approve Document Details
                  </button>"""

new_button = """                  <button 
                    type="submit" 
                    className="btn btn-glow" 
                    disabled={!ocrForm.docNumber || isScanning || hasValidationErrors}
                    style={{ flex: 1, justifyContent: 'center', opacity: hasValidationErrors ? 0.5 : 1, cursor: hasValidationErrors ? 'not-allowed' : 'pointer' }}
                  >
                    Save & Approve Document Details
                  </button>"""
content = content.replace(old_button, new_button)

with open(r'src/components/UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Patched UserDashboard!')
