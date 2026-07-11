import re

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Direct field input (e.g. docNumber)
# Note: Since the input might be spread across multiple lines, we need robust regex
pat1 = r'<div className=\"form-group\">\s*<label>(.*?)</label>\s*<VerifiedField value=\{(ocrForm\.([a-zA-Z0-9_]+))(?: \|\| \'\')?\} rawOcrText=\{rawOcrText\}>\s*<input\s*className=\"form-input\"(?:[^>]*?)(?:(required))?(?:[^>]*?)placeholder=\"(.*?)\"(?:[^>]*?)onChange=\{\(e\) =>\s*setOcrForm\(\{\s*\.\.\.ocrForm,\s*\3:\s*e\.target\.value\s*\}\)\s*\}.*?/>\s*</VerifiedField>\s*</div>'

def repl1(m):
    label = m.group(1)
    val_expr = m.group(2)
    fieldKey = m.group(3)
    required = m.group(4)
    placeholder = m.group(5)
    
    req_str = "required " if required else ""
    return f'''<ValidatedInput 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{(e) => setOcrForm({{ ...ocrForm, {fieldKey}: e.target.value }})}}
                    />'''

content = re.sub(pat1, repl1, content, flags=re.DOTALL)

# Pattern 2: Custom field input
pat2 = r'<div className=\"form-group\">\s*<label>(.*?)</label>\s*<VerifiedField value=\{(ocrForm\.customFields\.([a-zA-Z0-9_]+))(?: \|\| \'\')?\} rawOcrText=\{rawOcrText\}>\s*<input\s*className=\"form-input\"(?:[^>]*?)(?:(required))?(?:[^>]*?)placeholder=\"(.*?)\"(?:[^>]*?)onChange=\{\(e\) =>\s*setOcrForm\(\{\s*\.\.\.ocrForm,\s*customFields:\s*\{\s*\.\.\.ocrForm\.customFields,\s*\3:\s*e\.target\.value\s*\}\s*\}\)\s*\}.*?/>\s*</VerifiedField>\s*</div>'

def repl2(m):
    label = m.group(1)
    val_expr = m.group(2)
    fieldKey = f"customFields.{m.group(3)}"
    req_str = "required " if m.group(4) else ""
    placeholder = m.group(5)
    
    return f'''<ValidatedInput 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{(e) => setOcrForm({{ ...ocrForm, customFields: {{ ...ocrForm.customFields, {m.group(3)}: e.target.value }} }})}}
                    />'''

content = re.sub(pat2, repl2, content, flags=re.DOTALL)


# Pattern 3: Direct field AutoResizeTextarea
pat3 = r'<div className=\"form-group\">\s*<label>(.*?)</label>\s*<VerifiedField value=\{(ocrForm\.([a-zA-Z0-9_]+))(?: \|\| \'\')?\} rawOcrText=\{rawOcrText\}>\s*<AutoResizeTextarea\s*className=\"form-input\"(?:[^>]*?)(?:(required))?(?:[^>]*?)placeholder=\"(.*?)\"(?:[^>]*?)onChange=\{\(e\) =>\s*setOcrForm\(\{\s*\.\.\.ocrForm,\s*\3:\s*e\.target\.value\s*\}\)\s*\}.*?/>\s*</VerifiedField>\s*</div>'

def repl3(m):
    label = m.group(1)
    val_expr = m.group(2)
    fieldKey = m.group(3)
    req_str = "required " if m.group(4) else ""
    placeholder = m.group(5)
    
    return f'''<ValidatedTextarea 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{(e) => setOcrForm({{ ...ocrForm, {fieldKey}: e.target.value }})}}
                    />'''

content = re.sub(pat3, repl3, content, flags=re.DOTALL)

# Pattern 4: Custom field AutoResizeTextarea
pat4 = r'<div className=\"form-group\">\s*<label>(.*?)</label>\s*<VerifiedField value=\{(ocrForm\.customFields\.([a-zA-Z0-9_]+))(?: \|\| \'\')?\} rawOcrText=\{rawOcrText\}>\s*<AutoResizeTextarea\s*className=\"form-input\"(?:[^>]*?)(?:(required))?(?:[^>]*?)placeholder=\"(.*?)\"(?:[^>]*?)onChange=\{\(e\) =>\s*setOcrForm\(\{\s*\.\.\.ocrForm,\s*customFields:\s*\{\s*\.\.\.ocrForm\.customFields,\s*\3:\s*e\.target\.value\s*\}\s*\}\)\s*\}.*?/>\s*</VerifiedField>\s*</div>'

def repl4(m):
    label = m.group(1)
    val_expr = m.group(2)
    fieldKey = f"customFields.{m.group(3)}"
    req_str = "required " if m.group(4) else ""
    placeholder = m.group(5)
    
    return f'''<ValidatedTextarea 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{(e) => setOcrForm({{ ...ocrForm, customFields: {{ ...ocrForm.customFields, {m.group(3)}: e.target.value }} }})}}
                    />'''

content = re.sub(pat4, repl4, content, flags=re.DOTALL)


# Restore Visa explicit borders (I replaced them with a manual pattern previously, so we should clean them up)
visa_id_pat = r'<div className=\"form-group\">\s*<label>Id Number</label>\s*<VerifiedField value=\{ocrForm\.docNumber\} rawOcrText=\{rawOcrText\}>\s*<input\s*className=\{`form-input \$\{docNumberError \? \'error-border\' : \'\'\}`\}.*?/>\s*</VerifiedField>\s*\{docNumberError && <span.*?>\{docNumberError\}</span>\}\s*</div>'
visa_id_repl = '''<ValidatedInput 
                      label="Id Number" 
                      fieldKey="docNumber" 
                      value={ocrForm.docNumber} 
                      required 
                      placeholder="e.g. 784-1992-1234567-2"
                      rawOcrText={rawOcrText}
                      activeTab={activeTab}
                      validationRules={validationRules}
                      onChange={(e) => setOcrForm({ ...ocrForm, docNumber: e.target.value })}
                    />'''
content = re.sub(visa_id_pat, visa_id_repl, content, flags=re.DOTALL)

visa_file_pat = r'<div className=\"form-group\">\s*<label>File Number</label>\s*<VerifiedField value=\{ocrForm\.customFields\.fileNumber \|\| \'\'\} rawOcrText=\{rawOcrText\}>\s*<input\s*className=\{`form-input \$\{fileNumberError \? \'error-border\' : \'\'\}`\}.*?/>\s*</VerifiedField>\s*\{fileNumberError && <span.*?>\{fileNumberError\}</span>\}\s*</div>'
visa_file_repl = '''<ValidatedInput 
                      label="File Number" 
                      fieldKey="customFields.fileNumber" 
                      value={ocrForm.customFields.fileNumber} 
                      placeholder="e.g. 1029384"
                      rawOcrText={rawOcrText}
                      activeTab={activeTab}
                      validationRules={validationRules}
                      onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, fileNumber: e.target.value } })}
                    />'''
content = re.sub(visa_file_pat, visa_file_repl, content, flags=re.DOTALL)

visa_pass_pat = r'<div className=\"form-group\">\s*<label>Passport Number</label>\s*<VerifiedField value=\{ocrForm\.customFields\.passportNumber \|\| \'\'\} rawOcrText=\{rawOcrText\}>\s*<input\s*className=\{`form-input \$\{passportNumberError \? \'error-border\' : \'\'\}`\}.*?/>\s*</VerifiedField>\s*\{passportNumberError && <span.*?>\{passportNumberError\}</span>\}\s*</div>'
visa_pass_repl = '''<ValidatedInput 
                      label="Passport Number" 
                      fieldKey="customFields.passportNumber" 
                      value={ocrForm.customFields.passportNumber} 
                      placeholder="e.g. K1234567"
                      rawOcrText={rawOcrText}
                      activeTab={activeTab}
                      validationRules={validationRules}
                      onChange={(e) => setOcrForm({ ...ocrForm, customFields: { ...ocrForm.customFields, passportNumber: e.target.value } })}
                    />'''
content = re.sub(visa_pass_pat, visa_pass_repl, content, flags=re.DOTALL)

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished patching all inputs!")
