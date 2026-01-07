#!/usr/bin/env python3
import json

# Load files
with open('/opt/academy-web/data/academy/curriculum.json', 'r') as f:
    curriculum = json.load(f)

with open('/opt/academy-web/data/academy/curriculum_A1_enhanced.json', 'r') as f:
    enhanced = json.load(f)

# Update A1 drills
for track in curriculum['tracks']:
    if track['id'] == 'A':
        for module in track['modules']:
            if module['id'] == 'A1':
                for drill in module['drills']:
                    key = f"{drill['id']}_didactics"
                    if key in enhanced:
                        drill['didactics'] = enhanced[key]

# Write back
with open('/opt/academy-web/data/academy/curriculum.json', 'w') as f:
    json.dump(curriculum, f, indent=2, ensure_ascii=False)

print("✓ Enhanced A1 drills with full didactic structure")
