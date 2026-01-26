import json
from auth_utils import hash_password
from datetime import datetime

import os
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "academy", "users.json")

with open(USERS_FILE, "r") as f:
    users = json.load(f)

changed = False
for user in users["users"]:
    if user["username"] == "tobi":
        user["password_hash"] = hash_password("tobi123")
        user["created_at"] = datetime.utcnow().isoformat()
        changed = True

if changed:
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
    print("Passwort für tobi aktualisiert!")
else:
    print("User tobi nicht gefunden.")
