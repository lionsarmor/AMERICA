"""Validate the public app and the two owner-requested hosted resume originals."""
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

root = Path(__file__).resolve().parents[1]
site = root / "site"
seed = json.loads((site / "profile-seed.json").read_text())
expected = {'James_Weeks_Technician_Resume.docx': 'fb8de06897fcbcc1dc4a384e22818bcd2341351543fcc3b23fa397045e316b62', 'James_Weeks_Software_Resume_Updated.docx': 'eaae0b5801ff7f7ddb76ce4d066045cc42efaf8754ac00f691c1de0681eb4429'}
allowed = {"index.html", "contracts.html", "styles.css", "app.js", "engine.js", "workbench.js", "agent.js", "question-library.js", "companion.js", "automation.js", "employer-policy.js", "answer-policy.js", "matching.js", "cover-letter.js", "travel-feed.json", "job-sources.json", "profile-seed.json", ".nojekyll", "404.html", "resumes"}
assert all(p.name in allowed and not p.is_symlink() for p in site.iterdir()), "Unexpected public artifact"
assert set(p.name for p in (site / "resumes").iterdir()) == set(expected), "Only the two requested originals may be hosted"
for filename, digest in expected.items():
    path = site / "resumes" / filename
    assert path.is_file() and not path.is_symlink(), "Resume must be an ordinary file"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == digest, f"Original resume changed: {filename}"
assert set(seed["resumes"]) == {"software", "technician"}
for record in seed["resumes"].values():
    assert record["name"] in expected
    assert record["url"] == "resumes/" + record["name"]
assert not any(k in seed for k in ("answers", "applications", "drafts", "wizard", "archived")), "Browser records must not be bundled"
print("Public artifact verified: both requested resume originals and matching profile; no browser records or private workspace files.")

feed = json.loads((site / "travel-feed.json").read_text())
assert set(feed) == {"generatedAt", "source", "query", "sources", "jobs"}, "Unexpected public feed metadata"
manifest = json.loads((site / "job-sources.json").read_text())
allowed_hosts = {urlparse(s["home"]).hostname for s in manifest["sources"]}
allowed_hosts.add("jobs.smartrecruiters.com")
for job in feed["jobs"]:
    assert set(job) <= {"externalId", "title", "company", "location", "description", "url", "employment", "published", "provider", "projectOpportunity", "remote", "payData"}, "Private fields in public feed"
    assert job["provider"] in feed["sources"], "Unexpected provider in public feed"
    parsed = urlparse(job["url"])
    assert parsed.scheme == "https" and parsed.hostname and "." in parsed.hostname and not parsed.username and not parsed.password, "Unexpected listing URL"
for report in feed["sources"].values():
    assert set(report) <= {"company", "home", "state", "read", "jobs", "generatedAt", "error"}, "Private source metadata"
print(f"Public feed verified: {len(feed['jobs'])} listings, {len(feed['sources'])} configured employer feeds.")
