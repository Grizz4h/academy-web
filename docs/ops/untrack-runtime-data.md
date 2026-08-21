# Ops: untrack runtime user data (Phase 1)

`.gitignore` now excludes runtime user data. Files already tracked in Git stay
tracked until you remove them from the index (**files on disk are kept**).

## Manual untrack (do this once on the server / your machine)

```bash
cd /opt/academy-web

git rm -r --cached data/academy/users.json \
  data/academy/profiles \
  data/academy/rewards \
  data/academy/sessions \
  data/academy/uploads \
  data/scenes \
  data/observations

# Restore directory placeholders so empty dirs remain in the repo
git add data/academy/profiles/.gitkeep \
  data/academy/rewards/.gitkeep \
  data/academy/sessions/.gitkeep \
  data/academy/uploads/.gitkeep \
  data/academy/uploads/avatars/.gitkeep \
  data/scenes/.gitkeep \
  data/observations/.gitkeep \
  .gitignore
```

Then commit when you are ready (this PR/step does not auto-commit).

## Still tracked (source content — keep)

- `data/academy/curriculum.json`
- `data/academy/foundation/**`
- `data/academy/lab_content.json`
- `data/academy/teams*.json`
- `data/academy/players/**`
- `data/academy/penny_del_import_teams.json`
- `data/academy/sidequests/**` (if present as content)
- `data/games/**`, `data/rosters/**` (catalog imports)

## History

Password hashes and sessions already exist in Git history. For a **private** repo
this is lower urgency; rotate JWT + consider password resets before public launch.
A `git filter-repo` history rewrite is optional and **not** done automatically.
