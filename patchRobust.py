import re

with open(r'src/components/UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into chunks of <div className="form-group">...</div>
# We need to be careful with nested divs. Wait, these don't have nested divs!
blocks = re.split(r'(<div className="form-group">.*?</div>)', content, flags=re.DOTALL)

for i, block in enumerate(blocks):
    if '<div className="form-group">' in block and '<label>' in block:
        if '<input' in block or '<AutoResizeTextarea' in block:
            # Skip if already Validated
            if 'ValidatedInput' in block or 'ValidatedTextarea' in block:
                continue

            # Extract label
            label_match = re.search(r'<label>(.*?)</label>', block, flags=re.DOTALL)
            label = label_match.group(1).strip() if label_match else ""

            # Extract required
            required = 'required' in block

            # Extract placeholder
            placeholder_match = re.search(r'placeholder="(.*?)"', block)
            placeholder = placeholder_match.group(1) if placeholder_match else ""

            # Extract value expression
            # e.g. value={ocrForm.docNumber} or value={ocrForm.customFields.employer || ''}
            val_match = re.search(r'value=\{(ocrForm\.[a-zA-Z0-9_\.]+)(?:\s*\|\|\s*\'\')?\}', block)
            if not val_match:
                # Could be a generic input we don't know how to handle
                continue
            
            val_expr = val_match.group(1) # e.g. ocrForm.docNumber
            fieldKey = val_expr.replace("ocrForm.", "")

            # Determine onChange logic based on fieldKey
            if "customFields." in fieldKey:
                prop = fieldKey.replace("customFields.", "")
                on_change = f"(e) => setOcrForm({{ ...ocrForm, customFields: {{ ...ocrForm.customFields, {prop}: e.target.value }} }})"
            else:
                on_change = f"(e) => setOcrForm({{ ...ocrForm, {fieldKey}: e.target.value }})"

            if '<input' in block:
                req_str = "required " if required else ""
                new_block = f'''<ValidatedInput 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{{on_change}}}
                    />'''
                blocks[i] = new_block

            elif '<AutoResizeTextarea' in block:
                req_str = "required " if required else ""
                new_block = f'''<ValidatedTextarea 
                      label="{label}" 
                      fieldKey="{fieldKey}" 
                      value={{{val_expr}}} 
                      {req_str}
                      placeholder="{placeholder}"
                      rawOcrText={{rawOcrText}}
                      activeTab={{activeTab}}
                      validationRules={{validationRules}}
                      onChange={{{on_change}}}
                    />'''
                blocks[i] = new_block

content = "".join(blocks)

with open(r'src/components/UserDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished robust patching!")
