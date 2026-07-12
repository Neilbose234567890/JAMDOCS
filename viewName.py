import re

with open(r'src/components/UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.search(r'<div className="form-group">\s*<label>Name</label>.*?</div>', content, re.DOTALL)
print(matches.group(0) if matches else 'Not found')
