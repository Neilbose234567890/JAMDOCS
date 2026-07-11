import re

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ValidatedInput and ValidatedTextarea at the top
helpers = """
function ValidatedInput({ label, fieldKey, value, onChange, placeholder, required, rawOcrText, activeTab, validationRules, type = "text" }) {
  let error = '';
  if (validationRules?.[activeTab]?.[fieldKey]?.regex) {
     const regex = new RegExp(validationRules[activeTab][fieldKey].regex);
     if (!regex.test(value || '')) error = validationRules[activeTab][fieldKey].errorMsg || 'Invalid format';
  }
  if (!error && validationRules?.['Global']?.[fieldKey]?.regex) {
     const regex = new RegExp(validationRules['Global'][fieldKey].regex);
     if (!regex.test(value || '')) error = validationRules['Global'][fieldKey].errorMsg || 'Invalid format';
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <VerifiedField value={value || ''} rawOcrText={rawOcrText}>
        <input 
          type={type}
          className={`form-input ${error ? 'error-border' : ''}`}
          required={required}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          style={error ? { borderColor: 'var(--status-expired)' } : {}}
        />
      </VerifiedField>
      {error && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function ValidatedTextarea({ label, fieldKey, value, onChange, placeholder, required, rawOcrText, activeTab, validationRules }) {
  let error = '';
  if (validationRules?.[activeTab]?.[fieldKey]?.regex) {
     const regex = new RegExp(validationRules[activeTab][fieldKey].regex);
     if (!regex.test(value || '')) error = validationRules[activeTab][fieldKey].errorMsg || 'Invalid format';
  }
  if (!error && validationRules?.['Global']?.[fieldKey]?.regex) {
     const regex = new RegExp(validationRules['Global'][fieldKey].regex);
     if (!regex.test(value || '')) error = validationRules['Global'][fieldKey].errorMsg || 'Invalid format';
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <VerifiedField value={value || ''} rawOcrText={rawOcrText}>
        <AutoResizeTextarea
          className={`form-input ${error ? 'error-border' : ''}`}
          required={required}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          style={error ? { borderColor: 'var(--status-expired)' } : {}}
        />
      </VerifiedField>
      {error && <span style={{ color: 'var(--status-expired)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}
"""

content = content.replace("export default function UserDashboard", helpers + "\nexport default function UserDashboard")

# 2. Update the dynamic validation check in UserDashboard
old_check = """  const validateField = (docType, fieldName, value) => {
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
        console.error('Invalid regex in validation rule', e);
      }
    }
    return '';
  };

  const docNumberError =
    activeTab === 'Visa'
      ? validateField('Visa', 'docNumber', ocrForm.docNumber)
      : '';
  const fileNumberError =
    activeTab === 'Visa'
      ? validateField('Visa', 'fileNumber', ocrForm.customFields.fileNumber)
      : '';
  const passportNumberError =
    activeTab === 'Visa'
      ? validateField('Visa', 'passportNumber', ocrForm.customFields.passportNumber)
      : '';
  const hasValidationErrors = Boolean(
    docNumberError || fileNumberError || passportNumberError,
  );"""

new_check = """  const getAllErrors = () => {
    let hasError = false;
    const check = (val, key) => {
      if (validationRules?.[activeTab]?.[key]?.regex) {
         try {
           if (!new RegExp(validationRules[activeTab][key].regex).test(val || '')) hasError = true;
         } catch(e) {}
      }
      if (validationRules?.['Global']?.[key]?.regex) {
         try {
           if (!new RegExp(validationRules['Global'][key].regex).test(val || '')) hasError = true;
         } catch(e) {}
      }
    };
    if (!ocrForm) return false;
    Object.keys(ocrForm).forEach(k => {
      if (k === 'customFields' && ocrForm.customFields) {
         Object.keys(ocrForm.customFields).forEach(ck => check(ocrForm.customFields[ck], `customFields.${ck}`));
      } else {
         check(ocrForm[k], k);
      }
    });
    return hasError;
  };
  const hasValidationErrors = getAllErrors();"""

if old_check in content:
    content = content.replace(old_check, new_check)
else:
    # Just in case there's weird formatting, let's do a regex sub
    content = re.sub(r'const validateField = .*?hasValidationErrors = Boolean\([\s\S]*?\);', new_check, content, flags=re.MULTILINE|re.DOTALL)

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Base helpers and logic updated!")
