import json
from auth_utils import hash_password
from datetime import datetime

USERS_FILE = "backend/data/academy/users.json"

with open(USERS_FILE, "r") as f:
    users = json.load(f)

changed = False
for user in users["users"]:
    if user["username"] == "christoph":
        user["password_hash"] = hash_password("christoph123")
        user["created_at"] = datetime.utcnow().isoformat()
        changed = True
    if user["username"] == "martin":
        user["password_hash"] = hash_password("martin123")
        user["created_at"] = datetime.utcnow().isoformat()
        changed = True

if changed:
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
    print("Passwörter aktualisiert!")
else:
    print("Keine passenden User gefunden.")
