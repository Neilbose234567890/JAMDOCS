import sys
import re

with open(r'src/components/UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<label>Id Number</label>\s*<VerifiedField[^>]*>\s*<input\s*className=\"form-input\"([^>]*placeholder=\"e\.g\. 784-1992-1234567-2\"[^>]*)/>\s*</VerifiedField>\s*</div>', 
    r'''<label>Id Number</label>
                      <VerifiedField value={ocrForm.docNumber} rawOcrText={rawOcrText}>
                        <input
                          className={`form-input ${docNumberError ? 'error-border' : ''}`}
                          \1
                          style={docNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                        />
                      </VerifiedField>
                      {docNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{docNumberError}</span>}
                    </div>''', content)

content = re.sub(r'<label>File Number</label>\s*<VerifiedField[^>]*>\s*<input\s*className=\"form-input\"([^>]*placeholder=\"e\.g\. 1029384\"[^>]*)/>\s*</VerifiedField>\s*</div>', 
    r'''<label>File Number</label>
                      <VerifiedField value={ocrForm.customFields.fileNumber || ''} rawOcrText={rawOcrText}>
                        <input
                          className={`form-input ${fileNumberError ? 'error-border' : ''}`}
                          \1
                          style={fileNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                        />
                      </VerifiedField>
                      {fileNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fileNumberError}</span>}
                    </div>''', content)

content = re.sub(r'<label>Passport Number</label>\s*<VerifiedField[^>]*>\s*<input\s*className=\"form-input\"([^>]*placeholder=\"e\.g\. K1234567\"[^>]*)/>\s*</VerifiedField>\s*</div>', 
    r'''<label>Passport Number</label>
                      <VerifiedField value={ocrForm.customFields.passportNumber || ''} rawOcrText={rawOcrText}>
                        <input
                          className={`form-input ${passportNumberError ? 'error-border' : ''}`}
                          \1
                          style={passportNumberError ? { borderColor: 'var(--status-expired)' } : {}}
                        />
                      </VerifiedField>
                      {passportNumberError && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{passportNumberError}</span>}
                    </div>''', content)

content = re.sub(r'disabled=\{\!ocrForm\.docNumber \|\| isScanning\}\s*style=\{\{ flex: 1, justifyContent: .center. \}\}',
    r'''disabled={!ocrForm.docNumber || isScanning || hasValidationErrors}
                    style={{ flex: 1, justifyContent: 'center', opacity: hasValidationErrors ? 0.5 : 1, cursor: hasValidationErrors ? 'not-allowed' : 'pointer' }}''', content)

with open(r'src/components/UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Patched edits 3 & 4!')
