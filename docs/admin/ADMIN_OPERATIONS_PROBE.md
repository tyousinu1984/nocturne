# Nocturne Operations Console Probe

## Decision summary

This plan was formed before implementation through three independent candidate
plans, three anonymous cross-reviews and Lead Agent adjudication.

The configured MoA runner was attempted in `cross_review` mode, but the
reference-model health gate failed twice at the reference layer. The workflow
therefore stopped its bounded retries and used three independent Agent
candidates as the documented fallback.

### Consensus adopted

1. The first operational bottleneck is content and media maintenance that still
   depends on code changes.
2. The first value chain is:
   `draft → rights gate → preview → independent review → publish → rollback or takedown`.
3. Profile state, media state, rights state, attendance state and publication
   state remain separate.
4. Customer identity, reservations, payments, CRM, public comments and
   automated publishing stay outside the first slice.
5. The first development slice is intentionally limited to one editor, one
   reviewer, one profile, three supplied photos and one rollback path.

### Minority view retained

One review recommended placing attendance submission and approval inside MVP
v1 immediately after the content workflow. This is retained as the fixed next
slice, while the current implementation avoids mixing both state machines into
one page.

## Facts, assumptions and unknowns

### Facts

- The public catalogue has an age gate, 12 profiles, profile galleries,
  ranking, attendance, guide, FAQ, access and editorial sections.
- Seven photo sets containing 21 Human Owner-supplied photographs are currently
  published.
- The Human Owner confirmed the photographed people are adults and the images
  may be publicly used on the site.
- The existing visual direction has received business approval.

### Working assumptions

- The first operational users are a content editor and an operations reviewer.
- The existing public contact channel remains outside this probe.
- Rights documents remain in controlled storage; the content system stores a
  reference and deterministic publication status.
- The first round should validate workflow comprehension before introducing D1,
  R2, production authentication or customer-data handling.
- The role selector represents two fixed simulated identities, `editor-01` and
  `reviewer-01`; it is not authentication.
- All form, publication-pointer and timeline state is session-only and resets
  when the development page refreshes.

### Reality checks still required

1. Exact staff roles and whether two-person review is available throughout
   operating hours.
2. The real contact endpoint and responsible staff member.
3. Rights evidence fields, validity period, withdrawal handling and custodian.
4. Attendance submission cut-off, cancellation and conflict rules.
5. Applicable local advertising, privacy and content requirements.

## Domain model v0.1

### Core objects

| Object | Responsibility |
| --- | --- |
| `PublicProfile` | Current public nickname, copy, tags and visibility |
| `ProfileRevision` | Draft, reviewable and publishable profile snapshot |
| `MediaAsset` | Original, public derivative, order and processing status |
| `UsageRight` | Adult confirmation, usage scope, evidence reference and withdrawal status |
| `Publication` | Simulated current public pointer, prior pointer and release actor |
| `SessionEvent` | Refreshable development timeline of submission, approval, publication, rollback and takedown |
| `AttendanceEntry` | Independent next-slice lifecycle for public shifts |

### Roles

- `ContentEditor`: creates and submits a revision.
- `OperationsReviewer`: approves, publishes, rolls back and performs emergency
  takedown.
- `ComplianceOwner`: future restricted role for rights evidence and complaints.
- `SystemAdmin`: future account and infrastructure role with no automatic
  content approval authority.

### States

`ProfileRevision`:

`draft → pending review → approved`

`Publication`:

`baseline live → revision live → rolled back`

Control:

`any visible public pointer → emergency takedown`

### Invariants

1. The simulated public surface reads only the current public pointer.
2. A media asset cannot enter review without adult confirmation, permitted
   website use, metadata-clean public derivatives and a rights evidence
   reference.
3. Submission captures a locked revision snapshot; pending and approved
   revisions cannot be edited in place.
4. The fixed simulated submitting identity cannot approve the same sensitive
   media change.
5. Rollback changes only the public pointer and keeps the approved revision
   snapshot intact.
6. Publication failure retains the previous public version.
7. Emergency takedown clears the public pointer across profile, directory and
   gallery references and closes the current simulated session to republishing.
   A future persistent implementation must require a separately reviewed new
   revision before content can return.
8. Public output never contains identity documents, private notes, original
   storage URLs or rights documents.

## Product projection

The probe uses four top-level intentions:

1. `Work Queue`: the single Yuna revision, its rights gaps and current public
   pointer.
2. `Cast & Media`: edit one profile and choose the public cover.
3. `Release`: preview, approve, publish, roll back and take down.
4. `Governance`: deterministic rights gates and a session-only simulated
   timeline.

The dashboard avoids a full CMS, general settings, reservations, payments,
customer identity or analytics screens.

## Probe completion definition

1. A content editor can modify one profile and select one of three supplied
   photos as the public cover.
2. Submission is blocked until every rights and safety gate is complete.
3. The operations reviewer can approve and simulate publication.
4. Publication moves the public pointer from revision 04 to revision 05.
5. Rollback restores revision 04 while revision 05 remains approved.
6. Emergency takedown clears the simulated public pointer and blocks
   republishing for the remainder of the session.
7. Core workflow actions produce a session event.
8. Pending and approved snapshots are locked against in-place editing.
9. The interface names the two fixed simulated identities and prevents the
   editor identity from approving.
10. The interface clearly labels all actions as a development probe with
   production writes disabled.
11. Production builds always return 404 for `/admin`; authentication and a
   controlled production admin boundary remain a future slice.

## Responsibility ledger

| Responsibility | Owner | Approver | Completion evidence | Status |
| --- | --- | --- | --- | --- |
| Product and domain baseline | Lead Agent | Human Owner | This document and MoA cross-review | In progress |
| Development probe implementation | Lead Agent | Human Owner | `/admin` desktop and mobile validation | In progress |
| Real staff workflow facts | Human Owner | Human Owner | Named roles, contact flow and attendance rules | Waiting for reality check |
| Legal and content policy | Human Owner or qualified local advisor | Human Owner | Approved policy and rights fields | Outside technical completion |
| Production authentication and persistence | Lead Agent | Human Owner | D1/R2/auth design and isolated tests | Deferred until probe acceptance |

## Deferred capabilities

- D1 persistence and version concurrency.
- R2 private originals and generated public derivatives.
- MFA-backed role authentication.
- Persistent audit storage.
- Actual production publication.
- Attendance submission and approval.
- Reservation requests and customer personal information.
- Blog, ranking and fixed-page CMS.
- Payments, CRM, chat, comments, multi-store and AI auto-publishing.
