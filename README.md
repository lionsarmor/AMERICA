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

Pulls respect individual source cooldowns, retain jobs on failure, and auto-prepare up to twelve matching packages. Published Greenhouse questions are loaded where available. The Job Wizard presents one question at a time. Radio choices and single-choice dropdowns save and advance automatically. Text answers advance on Enter or when the completed field loses focus; multiline answers use Ctrl+Enter. Multiple selections have a Continue control. Back restores prior answers, including after a reload. The All answers page (`#answers`) shows profile facts, saved and inferred responses, and the complete answer set for each application, with editing links. Questions arising from prepared jobs take priority; equivalent questions are combined. A local knowledge layer normalizes question wording, negation, country scope, and employer-specific choice IDs. A confirmed US citizenship answer covers equivalent citizenship prompts and derives standard US employment-authorization, immigration-sponsorship, and US-person export-status answers. It asks the foundational fact before dependent questions, recognizes previously answered company-specific variants, and preserves explicit overrides. Derivations are recalculated when their source facts change and show their origin in the answer library and application review. Additional conditions such as clearance, other-country authorization, documents, and consent remain separate. This knowledge layer works locally. The optional private Codex companion below can also draft answers using the supplied resume and confirmed-answer evidence. New questions appear as jobs are pulled, without replacing the step or answer currently being typed. Skipped questions stay available for later. Saved answers update matching unsent drafts and invalidate prior approvals. Submitted snapshots remain frozen.

The common-question library contains 271 complete prompts. All answers offers search, category, and filled/unknown filters; unused library entries are optional. Resume evidence supplies supported facts and descriptions, with dated roles used conservatively for experience estimates. Imported forms preserve employer descriptions, help text, and section context. Fields that contain only an unexplained heading are flagged for employer-form review instead of appearing as wizard questions. Hidden location coordinates and alternative resume text/file controls do not create extra quiz steps. Existing unsent drafts refresh their question sets; submitted snapshots remain frozen.

Search supports quoted phrases, OR, and -exclusions. Filter work type, source, published pay, and clearance. Compare overall fit, pay, skills, hiring signals, and family time. Match scores are keyword evidence rather than calibrated hiring probabilities. Employer terms and unknown eligibility need review.

Auto-pull works while the app is open and checks overdue work on return. It is not a server scheduler. Final forms, dynamic questions, assessments, consent, and submission remain on the employer's site. A submission is recorded only after explicit user confirmation. Applications can be archived and restored without resubmitting.

## Deployment

The GitHub Actions workflow validates JavaScript and the public artifact, then publishes only `site/` to GitHub Pages on each push to `main`. The deployed files include the two requested resume originals and matching starting profile. Local application records, extra documents, private source history, and the import bundle are excluded. Six fictional design examples are available separately through View design samples.

The original owner-private ChatGPT Site is a separate deployment. This repository is the source for the GitHub Pages version.

The distinction between US work authorization, visa sponsorship, and export status follows the [DOJ employer and worker FAQ](https://www.justice.gov/crt/iers-frequently-asked-questions-faqs). A saved eligibility answer does not replace employer verification or create access credentials.

## Private Codex companion

The companion adds automatic Codex drafts, evidence in application review, saved-answer context, workspace transfer, and private local backups. The public GitHub Pages site remains a static application. Open **Intelligence** to download your current workspace, open the private app, and import that backup. It preserves saved answers, jobs, archives, application histories, submitted snapshots, and uploaded files. A fresh browser on the private app restores the companion backup automatically.

Requires Node.js 22+ and a signed-in Codex CLI. On the owner's computer a user service and **AMERICA Private** desktop launcher are installed. The private app is available at http://127.0.0.1:4317/#intelligence on that computer.

```sh
npm ci
npm start
```

Optional Linux user-service setup:

```sh
node companion/install-service.mjs
```

Stop or disable the installed service with `systemctl --user disable --now america-companion.service`. Override the executable with `AMERICA_CODEX_BIN`, port with `AMERICA_PORT`, or daily-limit timezone with `AMERICA_TIME_ZONE` (default Asia/Manila).

When connected, automatic drafting is enabled by default and can be paused in Intelligence. The worker processes one application at a time, reuses identical requests, and limits new requests to 24 per day. Requests use the account signed into Codex; no paid inference runs in CI. Missing personal declarations and precise durations stay with confirmed answers or the wizard. Drafts never submit applications. The application review shows the reasoning and resume/answer evidence for each generated value. Manual corrections are supplied as confirmed context for future drafts, with employer-dependent answers scoped to that employer. Generated drafts are not silently promoted into confirmed facts. Evidence changes invalidate affected drafts; unrelated facts do not force regeneration. Results that finish after an application or its knowledge changes are discarded. Submitted records remain frozen.

The worker listens only on loopback, accepts authenticated same-origin requests, and serves the existing interface locally. It does not expose a CORS bridge to the public site. Browser credentials are HttpOnly, and Codex sign-in stays with Codex. Reasoning runs use an empty working directory, read-only sandbox, disabled browsing/shell/apps/plugins/agent tools, ignored user configuration, and ephemeral threads. Input is untrusted job data, and output is checked for expected fields, real option IDs, evidence references, and restricted declarations before applying it. Workspace backups and the last result are stored only under ignored `private/companion/`; concurrent stale backup writes are rejected.

```sh
npm test
npm run check
```

Tests cover reasoning validation, local access, file boundaries, backup persistence and conflicts, caching, cancellation, and malformed workspaces. Browser verification also covers automatic drafting, evidence review, stale-result protection, corrections, frozen submissions, attachment transfer, fresh-browser restore, and mobile layout. A live Codex smoke test used synthetic candidate evidence successfully. Remote phone access and automatic source-code maintenance are not connected; a private authenticated remote backend is a later step.

Official integration references: [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk), [Codex CLI options](https://learn.chatgpt.com/docs/cli/reference).
