# Jobbies

A personal job-search workspace for US remote work and domestic or international travel contracts. Discover openings, rank pay and fit, answer repeated questions once, and review before a single **Yes, apply** starts the employer application.

**Live site:** https://lionsarmor.github.io/AMERICA/

The interface follows Orbit’s charcoal and copper styling, with a shortlist, collapsible filters, and labeled navigation on phones. Existing browser storage and backup formats remain compatible.

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:4173/. No build or dependencies are required.

## Your profile and resumes

Both original resumes and the resume-derived starting profile are hosted on the site at the owner’s request. Open **My profile** for technician and software download buttons. The matching resume is selected automatically for each prepared application. New browsers load the profile automatically; the update also repairs browsers that cached the earlier empty profile. Uploaded replacements, saved answers, pulls, and application history remain in IndexedDB in the current browser. Existing custom profiles and submitted snapshots are preserved.

Private source history, project notes, and the prepared import bundle remain in the ignored local `private/` and `data/` directories. The two explicitly hosted DOCX originals are the only document exceptions to the repository ignore rules. Clearing browser storage removes saved data. A different browser or domain starts a separate workspace.

## Jobs and business contracts

**Jobbies Jobs** at `/` prioritizes technical roles explicitly advertising 100% travel: field service, fiber/telecom, network infrastructure, data centers, and electronics. Software must explicitly support remote work; office, hybrid, and unconfirmed-remote software are rejected. Senior roles and requirements unsupported by the profile stay outside recommendations. Scores describe evidence, not a probability of being hired.

**Jobbies Contracts** at `/contracts.html` has its own company profile, intake rules, business lead collection, and proposal pipeline. It accepts explicit C2C, 1099, subcontracting, and project-bid opportunities. W-2 contract assignments remain in Jobs; listings offering both arrangements can appear in both systems. Add client leads manually, save scope notes, generate an editable proposal from company details, and track new/qualifying/draft/sent/won/lost stages. Sent is a manual record of delivery; generating a proposal does not send it. Company services, commercial terms, and business filters do not change employee preferences. Both systems share source connections and browser backup infrastructure.

The main navigation focuses on **Recommended jobs**, **Review & send**, and **Needs your input**. Profile, source configuration, history, and advanced settings stay available under Profile & settings. Multi-select tags cover technical disciplines, travel, skills, government/private sectors, work arrangement, clearance, pay, per diem, lodging, rotation, and PTO; selected tags persist and match together.

Open **Job intake rules** or **Contract intake rules** to choose technical disciplines, minimum advertised travel, government/government-contractor/private/corporate/startup sector, work arrangement, clearance, minimum hourly/annual pay, published-pay requirements, and excluded keywords. Intake applies before storing feed results or preparing applications. Unknown travel never counts as 100%. Disabling remote software also avoids remote-only source requests when neither workspace needs them. Public feeds without provider-side filters still require downloading their responses; unsuitable listings are discarded locally before preparation or AI use.

Discovery includes a targeted Parsons technical-travel snapshot plus Remotive, Jobicy, and Greenhouse boards for CoreWeave, Astranis, and Anduril. The deployment fetches public Parsons Workday listings every six hours and displays the employer-feed timestamp. Snapshots older than 72 hours are rejected. Add other public Greenhouse, Lever, or Ashby boards in Sources. Other boards have clearly labeled search links and manual import; broad business procurement coverage and credentialed government feeds are not connected.

Every prepared application gets a tailored cover-letter draft from supported resume/profile evidence. The local Codex companion automatically improves the letter and drafts eligible unanswered employer questions, with evidence references and no invented declarations. Manual letter edits are preserved. Cover-letter fields fill automatically, file fields receive a generated PDF during supported local delivery, and editable RTF letters are available for manual delivery.

Profile questions add reusable facts once. Confirmed answers and supported resume facts automatically fill equivalent employer questions, including employer-specific option IDs. Employer-specific questions stay in application review. Radio/dropdown answers save immediately; text saves on Continue, Enter, or navigation. Saved facts are merged across tabs, persist after reload, and update unsent drafts. Submitted snapshots remain frozen. All answers supports review and corrections. Unknown eligibility declarations are never invented.

Automatic pulls run while the app is open. Accepted jobs can be prepared into a review queue; browsing Contracts does not start employee preparation or Codex drafting. Source failures retain prior results and are reported visibly.

## Application delivery

Review the selected resume, cover letter, and profile, then press **Yes, apply**. That approval starts the local Playwright worker: open the employer application, create an account when required, reuse its saved login session, discover and fill the actual fields, upload attachments, advance through pages, and submit. The worker uses confirmed profile facts first and Codex for evidence-backed narrative answers. No account creation, uploads, or application submission occur just from opening review.

The browser driver supports standard application forms, native fields, radio/checkbox groups, custom listbox controls, file attachments, and common Workday-style Apply / Create Account / Save and Continue flows. It is no longer restricted to Greenhouse URLs. This is a bounded form-navigation worker, not a guarantee of compatibility with every ATS. Unexpected controls, employer validation failures, unknown declarations, and verification challenges pause inside Jobbies with the reason and retained progress. Verification codes and an interactive verification screenshot allow continuation without downloading a package or restarting the application. Missing facts are saved for reuse; employer-dependent answers remain scoped. Existing-account passwords can be provided once when not already known. There is no connected email inbox for automatic verification-link retrieval.

Employer credentials, sessions, and approved request payloads are encrypted in the ignored local application vault; its key is stored separately with owner-only file permissions. This protects those files from accidental publication, not a compromised OS account. Tasks and receipts persist across reloads and restarts. Submission intent is written before the final employer button is clicked. Unknown outcomes never automatically retry, including after a crash; legacy direct-send receipts are also checked. A recognizable employer confirmation is required to mark an application submitted. Closing Jobbies does not cancel an approved running task while the companion service remains on.

The GitHub Pages **Yes, apply** button opens the worker on the same computer and transfers the reviewed package and workspace directly through origin-, window-, and nonce-checked messaging. No manual backup/import is needed for application delivery, and no CORS access or Codex credentials are exposed to the public site. Progress and the receipt return to the original tab. This requires the companion at `http://127.0.0.1:4317/` on that computer; Pages cannot itself execute a browser, and a phone or another computer does not reach this desktop's loopback service. The public app reports an unavailable worker instead of presenting a manual submission handoff. Business proposals remain a separate workflow.

Regression coverage uses intercepted synthetic employer forms: account creation and encrypted credential storage, multi-page navigation, custom dropdowns, required facts and continuation, uploads, one submission, receipt persistence, restart ambiguity, and the public-to-local window transfer. The real Parsons registration screen was inspected without entering candidate details. No real employer account or application was created during testing.

## Deployment

The GitHub Actions workflow runs unit and browser regression tests, refreshes public travel listings, validates the public artifact, then publishes only `site/` on each push to `main` and every six hours. A failed source refresh leaves the previous deployment in place. The deployed files include both workspaces, public employer listings, the two requested resume originals, and the matching starting profile. Local application records, extra documents, private source history, and the import bundle are excluded. Six fictional design examples are available separately through View design samples.

The original owner-private ChatGPT Site is a separate deployment. This repository is the source for the GitHub Pages version.

The distinction between US work authorization, visa sponsorship, and export status follows the [DOJ employer and worker FAQ](https://www.justice.gov/crt/iers-frequently-asked-questions-faqs). A saved eligibility answer does not replace employer verification or create access credentials.

## Private Codex companion

The companion adds automatic Codex drafts, evidence in application review, saved-answer context, workspace transfer, and private local backups. The public GitHub Pages site remains a static application. Press **Yes, apply** from the hosted app to transfer the reviewed workspace to the private worker automatically. Manual backups remain available under Intelligence. It preserves saved answers, jobs, archives, application histories, submitted snapshots, and uploaded files. A fresh browser on the private app restores the companion backup automatically.

Requires Node.js 22+ and a signed-in Codex CLI. On the owner's computer a user service and **Jobbies Private** desktop launcher are installed. The private app is available at http://127.0.0.1:4317/#intelligence on that computer.

```sh
npm ci
npx playwright install chromium
npm start
```

Optional Linux user-service setup:

```sh
node companion/install-service.mjs
```

Stop or disable the installed service with `systemctl --user disable --now america-companion.service`. Override the executable with `AMERICA_CODEX_BIN`, port with `AMERICA_PORT`, or daily-limit timezone with `AMERICA_TIME_ZONE` (default Asia/Manila).

When connected, automatic drafting is enabled by default and can be paused in Intelligence. Background drafting processes one request at a time, reuses identical requests, and limits new requests to 24 per day. The approved browser queue runs one application at a time; live form reasoning uses the same signed-in Codex account separately from that background draft quota. Requests use the account signed into Codex; no paid inference runs in CI. Missing personal declarations and precise durations stay with confirmed answers or the wizard. Background drafts do not submit applications; only a job-specific **Yes, apply** approval starts the submission worker. The application review shows the reasoning and resume/answer evidence for each generated value. Manual corrections are supplied as confirmed context for future drafts, with employer-dependent answers scoped to that employer. Generated drafts are not silently promoted into confirmed facts. Evidence changes invalidate affected drafts; unrelated facts do not force regeneration. Results that finish after an application or its knowledge changes are discarded. Submitted records remain frozen.

The worker listens only on loopback, accepts authenticated same-origin requests, and serves the existing interface locally. It does not expose a CORS bridge to the public site. Browser credentials are HttpOnly, and Codex sign-in stays with Codex. Reasoning runs use an empty working directory, read-only sandbox, disabled browsing/shell/apps/plugins/agent tools, ignored user configuration, and ephemeral threads. Input is untrusted job data, and output is checked for expected fields, real option IDs, evidence references, and restricted declarations before applying it. Workspace backups and the last result are stored only under ignored `private/companion/`; concurrent stale backup writes are rejected.

```sh
npm test
npm run check
npm run test:browser
```

Tests cover reasoning validation, local access, file boundaries, backup persistence and conflicts, caching, cancellation, and malformed workspaces. Browser verification also covers automatic drafting, evidence review, stale-result protection, corrections, frozen submissions, attachment transfer, fresh-browser restore, and mobile layout. A live Codex smoke test used synthetic candidate evidence successfully. Remote access to the private companion and automatic source-code maintenance are not connected; a private authenticated remote backend is a later step.

Official integration references: [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk), [Codex CLI options](https://learn.chatgpt.com/docs/cli/reference).
