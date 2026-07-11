import sys

with open(r'c:\Document Projects\OCR DOC\src\components\AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_doctype = """                <div className="form-group">
                  <label>Document Type</label>
                  <select 
                    className="form-input" 
                    value={valConfig.docType}
                    onChange={(e) => setValConfig({ ...valConfig, docType: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                  </select>
                </div>"""

new_doctype = """                <div className="form-group">
                  <label>Document Type</label>
                  <select 
                    className="form-input" 
                    value={valConfig.docType}
                    onChange={(e) => setValConfig({ ...valConfig, docType: e.target.value })}
                  >
                    <option value="Global">All Document Types (Global)</option>
                    <option value="Emirates ID">Emirates ID</option>
                    <option value="Visa">Visa</option>
                    <option value="Labour Card">Labour Card</option>
                    <option value="ILOE">ILOE</option>
                    <option value="Health Card">Health Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Drivers License">Drivers License</option>
                    <option value="Other Documents">Other Documents</option>
                  </select>
                </div>"""

old_field = """                <div className="form-group">
                  <label>Field</label>
                  <select 
                    className="form-input" 
                    value={valConfig.field}
                    onChange={(e) => setValConfig({ ...valConfig, field: e.target.value })}
                  >
                    <option value="docNumber">Id Number</option>
                    <option value="fileNumber">File Number</option>
                    <option value="passportNumber">Passport Number</option>
                  </select>
                </div>"""

new_field = """                <div className="form-group">
                  <label>Field Object Key</label>
                  <input 
                    className="form-input" 
                    list="field-suggestions"
                    placeholder="e.g. docNumber, customFields.employer"
                    value={valConfig.field}
                    onChange={(e) => setValConfig({ ...valConfig, field: e.target.value })}
                  />
                  <datalist id="field-suggestions">
                    <option value="docNumber">Document Number / ID</option>
                    <option value="fullName">Full Name</option>
                    <option value="startDate">Issue Date</option>
                    <option value="expiryDate">Expiry Date</option>
                    <option value="customFields.fileNumber">File Number</option>
                    <option value="customFields.passportNumber">Passport Number</option>
                    <option value="customFields.employer">Employer</option>
                    <option value="customFields.occupation">Occupation</option>
                    <option value="customFields.nationality">Nationality</option>
                    <option value="customFields.sex">Sex</option>
                    <option value="customFields.dateOfBirth">Date of Birth</option>
                  </datalist>
                </div>"""

if old_doctype in content and old_field in content:
    content = content.replace(old_doctype, new_doctype)
    content = content.replace(old_field, new_field)
    with open(r'c:\Document Projects\OCR DOC\src\components\AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('AdminDashboard patched successfully!')
else:
    print('Could not find matching blocks in AdminDashboard.')
