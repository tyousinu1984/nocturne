# Cast Schedule Access Domain Model

Status: development baseline

Updated: 2026-08-10

## Goal and boundary

The current Attendance Alpha has one store operator identity. This slice adds a
separate cast-member identity so each girl can maintain and submit only her own
schedule while the store operator retains review, publication and access
management authority.

The Alpha covers schedule drafts, submission, review, publication, account
creation, access-code rotation, disabling and session revocation. Booking,
customer identity, payroll, messaging, document upload and multi-store tenancy
remain outside scope.

## Facts, assumptions and unknowns

Facts:

1. Public visitors must remain anonymous.
2. The store operator already uses a separately protected admin route.
3. Attendance has durable states, version checks, idempotent commands and an
   append-only audit trail.
4. Each public cast profile has a stable `artistSlug`.

Alpha assumptions:

1. One active cast account maps to exactly one cast profile.
2. A cast member signs in by selecting her profile and entering a high-entropy
   access code.
3. Cast members can create, edit and submit drafts for their own profile.
4. Store operators can create and edit attendance for every profile, then
   submit, approve, reject, publish or cancel it.
5. A rejected schedule is retained as history. The cast member creates a new
   draft revision if she wants to submit a replacement.
6. A store operator can correct an active or published schedule in place. The
   current lifecycle status is preserved and the change produces a new version
   plus an append-only audit event.

Unknowns requiring later business confirmation:

1. Whether a reviewer must differ from the staff member who operates access
   management.
2. Whether cast members need a change-request flow for already published
   schedules.
3. Whether accounts need personal usernames, email recovery or named staff
   administrator identities.

## Ubiquitous language

| Term | Meaning |
| --- | --- |
| Cast profile | Public catalogue identity identified by `artistSlug` |
| Cast account | Private login identity bound to exactly one cast profile |
| Store operator | Existing protected administrator identity |
| Access code | One-time displayed credential whose hash is stored in SQLite |
| Session version | Revocation counter embedded in signed staff sessions |
| Attendance draft | Editable private schedule owned by one cast profile |
| Submission | Command that locks a draft and moves it to operator review |
| Publication | Operator command that makes date and time visible publicly |

## Participants and contexts

### Public catalogue

Anonymous visitors can read only published attendance projections.

### Cast workspace

An authenticated cast member can list her own attendance, create a draft, save
changes and submit the draft. She cannot access another profile, approve,
reject, publish, cancel or manage identities.

### Store operations

The authenticated store operator can list all attendance, create or edit a
schedule for any profile, review submitted records, publish approved records,
cancel published records and manage cast accounts. The operator cannot use the
cast API merely by knowing an `artistSlug`; cast API access requires a valid
staff session.

## Core objects and ownership

### CastAccount aggregate

Fields:

- `id`
- `artistSlug`
- `displayName`
- `credentialHash`
- `status: active | disabled`
- `sessionVersion`
- `lastLoginAt`
- timestamps

Invariants:

1. `artistSlug` is unique across accounts.
2. Credential plaintext is never persisted.
3. Disabling or rotating an account increments `sessionVersion` and invalidates
   all existing staff sessions.
4. Disabled accounts cannot authenticate or use staff APIs.

### AttendanceEntry aggregate

Ownership is the existing `artistSlug`. Cast commands must match the session's
bound `artistSlug`. Operator commands can target any entry.

## Permission matrix

| Capability | Public | Cast member | Store operator |
| --- | ---: | ---: | ---: |
| Read published schedule | Yes | Yes | Yes |
| Read private draft and event history | No | Own only | All |
| Create attendance draft | No | Own only | Any profile |
| Save or correct active attendance | No | Own draft only | Any profile |
| Submit draft | No | Own only | Any profile |
| Approve or reject | No | No | Yes |
| Publish or cancel | No | No | Yes |
| Create, rotate, enable or disable accounts | No | No | Yes |

The server enforces this matrix inside the attendance store and account APIs.
UI visibility is secondary and cannot grant permission.

## Commands and events

### Cast account commands

| Command | Preconditions | Event | Failure |
| --- | --- | --- | --- |
| CreateCastAccount | Operator authenticated; profile exists; no account | `cast_account.created` | Duplicate profile, invalid profile |
| RotateAccessCode | Operator authenticated; account exists | `cast_account.credential_rotated` | Account missing |
| DisableCastAccount | Operator authenticated; account active | `cast_account.disabled` | Account missing or already disabled |
| EnableCastAccount | Operator authenticated; account disabled | `cast_account.enabled` | Account missing or already active |
| AuthenticateCast | Account active; code valid; rate limit open | `lastLoginAt` updated | Generic invalid-credentials response |

### Attendance commands

| Role | Allowed commands |
| --- | --- |
| Cast member | `create`, `save_draft`, `submit` for own `artistSlug` |
| Store operator | Every attendance command for any profile; `save_draft` preserves the current active status |

Existing attendance events remain append-only and identify the actor with
`cast:<accountId>` or `store-owner`.

## Critical exceptions and recovery

1. Cross-profile request: fail with HTTP 403 and no database change.
2. Cast attempts operator action: fail with HTTP 403 and no event.
3. Operator edits a rejected or cancelled historical record: fail with HTTP
   409; create a new active record instead.
4. Disabled account reuses an existing cookie: session-version and status check
   return HTTP 401.
5. Rotated access code leaves an old cookie active: incremented session version
   invalidates it on the next request.
6. Concurrent draft update: existing version conflict returns the latest entry.
7. Duplicate schedule date: existing unique active-schedule rule returns a
   schedule conflict.
8. Login brute force: repeated failures are temporarily rate-limited without
   revealing whether an account exists.

## Minimum vertical slice exit evidence

1. Operator creates one cast account and receives one temporary code.
2. Cast member signs in and creates, edits and submits her own draft.
3. The same cast session cannot read or change another profile.
4. Operator can also create or correct an active schedule for any profile.
5. Operator approves and publishes the submission.
6. Anonymous public projection changes only after publication; an operator
   correction to an already published record updates that projection.
7. Disabling the account invalidates its existing session.
8. Rotating the code invalidates the prior code and all prior sessions.
