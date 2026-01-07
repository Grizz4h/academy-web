#!/usr/bin/env python3
import re

# Read file
with open('/opt/academy-web/data/academy/curriculum_A1_enhanced.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace smart quotes with standard quotes
replacements = {
    '„': '"',
    '"': '"',
    '"': '"',
    ''': "'",
    ''': "'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Write back
with open('/opt/academy-web/data/academy/curriculum_A1_enhanced.json', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Fixed quotes in enhanced file")
