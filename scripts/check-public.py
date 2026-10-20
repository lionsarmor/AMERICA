"""Keep the Pages artifact free of bundled candidate records and resumes."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
site = root / "site"
seed = json.loads((site / "profile-seed.json").read_text())
assert all(not seed.get(k) for k in ("name", "email", "phone", "linkedin", "github", "portfolio", "skills", "bases", "experience", "education")), "Public seed must be empty"
assert all(not r.get("name") and not r.get("url") and not r.get("file") for r in seed["resumes"].values()), "Public seed must not contain resume references"
allowed = {"index.html", "styles.css", "app.js", "engine.js", "workbench.js", "profile-seed.json", ".nojekyll", "404.html"}
assert all(p.is_file() and p.name in allowed for p in site.iterdir()), "Unexpected file or directory in public artifact"
assert all(not p.is_symlink() for p in site.iterdir()), "Public artifact cannot contain symlinks"
private_seed = root / "private/sites-source/dist/profile-seed.json"
if private_seed.exists():
    private = json.loads(private_seed.read_text())
    for path in site.iterdir():
        contents = path.read_text()
        for key in ("name", "email", "phone", "linkedin", "portfolio"):
            value = private.get(key)
            assert not value or value.lower() not in contents.lower(), f"Private {key} found in {path.name}"
print("Public artifact verified: empty profile seed; no bundled personal documents.")
