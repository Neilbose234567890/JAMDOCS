import re

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

blocks = re.split(r'(<div className="form-group">.*?</div>)', content, flags=re.DOTALL)
failed = []
for block in blocks:
    if '<div className="form-group">' in block and '<label>' in block:
        if '<input' in block or '<AutoResizeTextarea' in block:
            if 'ValidatedInput' in block or 'ValidatedTextarea' in block:
                continue
            
            label_match = re.search(r'<label>(.*?)</label>', block, flags=re.DOTALL)
            label = label_match.group(1).strip() if label_match else ''
            failed.append(label)

print('Failed to patch:', failed)
