# AMERICA

A personal job-search workspace for US remote work and domestic or international travel contracts. Discover openings, rank pay and fit, prepare application packages, answer repeated questions once, and review before submitting on the employer site.

**Live site:** https://lionsarmor.github.io/AMERICA/

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:4173/. No build or dependencies are required.

## Your profile and resumes

Both original resumes and the resume-derived starting profile are hosted on the site at the owner’s request. Open **My profile** for technician and software download buttons. The matching resume is selected automatically for each prepared application. New browsers load the profile automatically; the update also repairs browsers that cached the earlier empty profile. Uploaded replacements, saved answers, pulls, and application history remain in IndexedDB in the current browser. Existing custom profiles and submitted snapshots are preserved.

Private source history, project notes, and the prepared import bundle remain in the ignored local `private/` and `data/` directories. The two explicitly hosted DOCX originals are the only document exceptions to the repository ignore rules. Clearing browser storage removes saved data. A different browser or domain starts a separate workspace.

## Discovery and applications

Five sources are connected by default: Remotive, Jobicy, and public Greenhouse employer boards for CoreWeave, Astranis, and Anduril. Add public Greenhouse, Lever, or Ashby employer boards through Job sources. Major and specialist boards without a live integration have search links and manual import.

Pulls respect individual source cooldowns, retain jobs on failure, and auto-prepare up to twelve matching packages. Published Greenhouse questions are loaded where available. The Job Wizard presents one question at a time, with progress, Save & next, Skip for now, paused-answer recovery, and editing of saved answers. Questions arising from prepared jobs take priority; equivalent questions are combined. New questions appear as jobs are pulled, without replacing the step or answer currently being typed. Skipped questions stay available for later. Saved answers update matching unsent drafts and invalidate prior approvals. Submitted snapshots remain frozen.

Search supports quoted phrases, OR, and -exclusions. Filter work type, source, published pay, and clearance. Compare overall fit, pay, skills, hiring signals, and family time. Match scores are keyword evidence rather than calibrated hiring probabilities. Employer terms and unknown eligibility need review.

Auto-pull works while the app is open and checks overdue work on return. It is not a server scheduler. Final forms, dynamic questions, assessments, consent, and submission remain on the employer's site. A submission is recorded only after explicit user confirmation. Applications can be archived and restored without resubmitting.

## Deployment

The GitHub Actions workflow validates JavaScript and the public artifact, then publishes only `site/` to GitHub Pages on each push to `main`. The deployed files include the two requested resume originals and matching starting profile. Local application records, extra documents, private source history, and the import bundle are excluded. Six fictional design examples are available separately through View design samples.

The original owner-private ChatGPT Site is a separate deployment. This repository is the source for the GitHub Pages version.
