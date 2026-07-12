import sys

with open(r'src/components/UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

helper = """  const validateField = (docType, fieldName, value) => {
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

content = content.replace('  // Write log helper', helper)

with open(r'src/components/UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('SUCCESS')
