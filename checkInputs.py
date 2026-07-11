import re

with open(r'c:\Document Projects\OCR DOC\src\components\UserDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Just checking for remaining raw inputs
count_inputs = content.count('<input')
count_validated = content.count('<ValidatedInput')
print(f"Raw inputs: {count_inputs}, ValidatedInputs: {count_validated}")

count_textareas = content.count('<AutoResizeTextarea')
count_validated_textareas = content.count('<ValidatedTextarea')
print(f"Raw textareas: {count_textareas}, ValidatedTextareas: {count_validated_textareas}")
