import json
import os

# Load curriculum
curriculum_path = os.path.join(os.path.dirname(__file__), 'data', 'academy', 'curriculum.json')
with open(curriculum_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove glossary from all didactics
for track in data['tracks']:
    for module in track['modules']:
        for drill in module['drills']:
            if 'didactics' in drill and 'glossary' in drill['didactics']:
                del drill['didactics']['glossary']

# Save back
with open(curriculum_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Removed all glossary entries from curriculum.json didactics")