import json
import os

CURRICULUM_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'academy', 'curriculum.json')

def load_curriculum():
    with open(CURRICULUM_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_tracks():
    return load_curriculum()['tracks']

def get_track(track_id):
    tracks = get_tracks()
    return next((t for t in tracks if t['id'] == track_id), None)

def get_module(track_id, module_id):
    track = get_track(track_id)
    if track:
        return next((m for m in track['modules'] if m['id'] == module_id), None)
    return None

def get_drill(track_id, module_id, drill_id):
    module = get_module(track_id, module_id)
    if module:
        return next((d for d in module['drills'] if d['id'] == drill_id), None)
    return None