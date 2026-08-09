/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState } from "react";
import { artists } from "../data";
import { AttendancePanel } from "./attendance-panel";
import {
  canApproveRevision,
  canEditDraft,
  canEmergencyTakedown,
  canPublishRevision,
  canRollbackPublication,
  clearPublicPointer,
  publishPointers,
  rollbackPointers,
  type ProbeActorId,
  type ProfileSnapshot,
  type PublicationStatus,
  type RevisionStatus,
} from "./workflow";

type AdminView =
  | "queue"
  | "attendance"
  | "content"
  | "release"
  | "governance";
type ProbeRole = "editor" | "reviewer";

type AuditEntry = {
  action: string;
  actor: string;
  detail: string;
  time: string;
};

const navItems: Array<{
  id: AdminView;
  number: string;
  label: string;
  hint: string;
}> = [
  { id: "queue", number: "01", label: "WORK QUEUE", hint: "What needs action" },
  {
    id: "attendance",
    number: "02",
    label: "ATTENDANCE",
    hint: "Schedule and publish",
  },
  { id: "content", number: "03", label: "CAST & MEDIA", hint: "Edit one profile" },
  { id: "release", number: "04", label: "RELEASE", hint: "Preview and publish" },
  {
    id: "governance",
    number: "05",
    label: "GOVERNANCE",
    hint: "Rights and session log",
  },
];

const revisionStatusCopy: Record<RevisionStatus, string> = {
  draft: "DRAFT",
  pending: "PENDING REVIEW",
  approved: "APPROVED",
};

const publicationStatusCopy: Record<PublicationStatus, string> = {
  "baseline-live": "BASELINE REVISION LIVE",
  "revision-live": "PROBE REVISION LIVE",
  "rolled-back": "ROLLED BACK",
  "taken-down": "EMERGENCY TAKEDOWN",
};

const probeActors: Record<
  ProbeRole,
  { id: ProbeActorId; label: string; scope: string }
> = {
  editor: {
    id: "editor-01",
    label: "Content Editor",
    scope: "Draft and submit",
  },
  reviewer: {
    id: "reviewer-01",
    label: "Operations Reviewer",
    scope: "Approve and recover",
  },
};

const photos = [
  "/photos-preview/yuna-01.jpg",
  "/photos-preview/yuna-02.jpg",
  "/photos-preview/yuna-03.jpg",
];

const initialAudit: AuditEntry[] = [
  {
    action: "SESSION SEEDED",
    actor: "Lead Agent",
    detail:
      "One-profile simulated workflow initialized. This timeline resets on refresh.",
    time: "TODAY / 09:20",
  },
  {
    action: "RIGHTS CONFIRMATION",
    actor: "Human Owner",
    detail: "Adult status and publication permission confirmed for supplied photos.",
    time: "TODAY / 09:05",
  },
];

function nowLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function AdminConsole({
  adminUser,
}: {
  adminUser: {
    displayName: string;
    identityLabel: string;
  };
}) {
  const yuna = artists.find((artist) => artist.slug === "yuna") ?? artists[0];
  const baselineSnapshot: ProfileSnapshot = {
    revisionId: "04",
    displayName: yuna.name,
    roleLine: yuna.role,
    biography: yuna.biography,
    cover: photos[0],
  };
  const [activeView, setActiveView] = useState<AdminView>("queue");
  const [role, setRole] = useState<ProbeRole>("editor");
  const [revisionStatus, setRevisionStatus] =
    useState<RevisionStatus>("draft");
  const [publicationStatus, setPublicationStatus] =
    useState<PublicationStatus>("baseline-live");
  const [displayName, setDisplayName] = useState(yuna.name);
  const [roleLine, setRoleLine] = useState(yuna.role);
  const [biography, setBiography] = useState(yuna.biography);
  const [rightsReference, setRightsReference] = useState("");
  const [adultVerified, setAdultVerified] = useState(true);
  const [websiteUsage, setWebsiteUsage] = useState(true);
  const [exifClean, setExifClean] = useState(true);
  const [coverIndex, setCoverIndex] = useState(0);
  const [submittedSnapshot, setSubmittedSnapshot] =
    useState<ProfileSnapshot | null>(null);
  const [submittedBy, setSubmittedBy] = useState<ProbeActorId | null>(null);
  const [approvedBy, setApprovedBy] = useState<ProbeActorId | null>(null);
  const [currentPublicSnapshot, setCurrentPublicSnapshot] =
    useState<ProfileSnapshot | null>(() => baselineSnapshot);
  const [previousPublicSnapshot, setPreviousPublicSnapshot] =
    useState<ProfileSnapshot | null>(null);
  const [auditEntries, setAuditEntries] =
    useState<AuditEntry[]>(initialAudit);
  const [notice, setNotice] = useState(
    "Authenticated operations console. Attendance writes use durable D1; profile revision data still resets on refresh.",
  );
  const [attendanceLabel, setAttendanceLabel] = useState("D1 READY");

  const actor = probeActors[role];
  const isDraftEditable = canEditDraft(revisionStatus, actor.id);
  const reviewSnapshot: ProfileSnapshot = submittedSnapshot ?? {
    revisionId: "05",
    displayName,
    roleLine,
    biography,
    cover: photos[coverIndex],
  };

  const bannerLabel =
    activeView === "attendance"
      ? attendanceLabel
      : revisionStatus !== "approved" || publicationStatus === "baseline-live"
        ? revisionStatusCopy[revisionStatus]
        : publicationStatusCopy[publicationStatus];

  const handleAttendanceNotice = useCallback(
    (label: string, message: string) => {
      setAttendanceLabel(label);
      setNotice(message);
    },
    [],
  );

  const approvalAllowed = canApproveRevision({
    actorId: actor.id,
    hasSnapshot: submittedSnapshot !== null,
    revisionStatus,
    submittedBy,
  });
  const publicationAllowed = canPublishRevision({
    actorId: actor.id,
    approvedBy,
    hasSnapshot: submittedSnapshot !== null,
    publicationStatus,
    revisionStatus,
  });
  const rollbackAllowed = canRollbackPublication({
    actorId: actor.id,
    hasPreviousSnapshot: previousPublicSnapshot !== null,
    publicationStatus,
  });
  const takedownAllowed = canEmergencyTakedown({
    actorId: actor.id,
    hasCurrentSnapshot: currentPublicSnapshot !== null,
  });

  const governanceChecks = [
    {
      label: "Adult status confirmed",
      value: adultVerified,
      setValue: setAdultVerified,
    },
    {
      label: "Website usage included",
      value: websiteUsage,
      setValue: setWebsiteUsage,
    },
    {
      label: "Public derivative has no EXIF",
      value: exifClean,
      setValue: setExifClean,
    },
  ];

  const blockingIssues = useMemo(() => {
    const issues: string[] = [];
    if (!adultVerified) issues.push("Adult verification is incomplete.");
    if (!websiteUsage) issues.push("Website usage permission is missing.");
    if (!exifClean) issues.push("Public image derivative still needs metadata removal.");
    if (!rightsReference.trim()) issues.push("Rights evidence reference is missing.");
    return issues;
  }, [adultVerified, exifClean, rightsReference, websiteUsage]);

  function appendAudit(action: string, detail: string) {
    setAuditEntries((entries) => [
      {
        action,
        actor: `${actor.label} / ${actor.id}`,
        detail,
        time: `TODAY / ${nowLabel()}`,
      },
      ...entries,
    ]);
  }

  function saveDraft() {
    if (!isDraftEditable) {
      setNotice("Only editor-01 can save an unlocked draft.");
      return;
    }
    setNotice("Draft saved inside the development probe.");
    appendAudit("DRAFT SAVED", `Updated temporary profile copy for ${displayName}.`);
  }

  function submitReview() {
    if (!isDraftEditable) {
      setNotice("Only editor-01 can submit an unlocked draft.");
      return;
    }

    if (blockingIssues.length > 0) {
      setActiveView("governance");
      setNotice("Submission blocked. Complete every governance requirement.");
      appendAudit("SUBMISSION BLOCKED", blockingIssues.join(" "));
      return;
    }

    const snapshot: ProfileSnapshot = {
      revisionId: "05",
      displayName,
      roleLine,
      biography,
      cover: photos[coverIndex],
    };

    setSubmittedSnapshot(snapshot);
    setSubmittedBy(actor.id);
    setApprovedBy(null);
    setRevisionStatus("pending");
    setActiveView("release");
    setNotice(
      `Revision ${snapshot.revisionId} locked and submitted by ${actor.id}. Switch to reviewer-01 to continue.`,
    );
    appendAudit(
      "SUBMITTED FOR REVIEW",
      `Revision ${snapshot.revisionId} and three media assets locked for reviewer-01.`,
    );
  }

  function approveRevision() {
    if (!approvalAllowed) {
      if (submittedBy !== null && actor.id === submittedBy) {
        setNotice("The submitting identity cannot approve its own revision.");
        appendAudit(
          "APPROVAL BLOCKED",
          `${actor.id} matches the recorded submitting identity.`,
        );
        return;
      }

      setNotice("Reviewer-01 and a locked pending revision are required.");
      return;
    }

    if (!submittedSnapshot) {
      setNotice("The locked review snapshot is unavailable.");
      return;
    }

    setRevisionStatus("approved");
    setApprovedBy(actor.id);
    setNotice(
      `Revision ${submittedSnapshot.revisionId} approved by ${actor.id}. Publication remains simulated.`,
    );
    appendAudit(
      "REVISION APPROVED",
      `Revision ${submittedSnapshot.revisionId} approved independently after governance review.`,
    );
  }

  function publishRevision() {
    if (publicationStatus === "taken-down") {
      setNotice(
        "Emergency takedown closed this session. The approved snapshot cannot be republished.",
      );
      appendAudit(
        "REPUBLISH BLOCKED",
        "Emergency takedown requires a separately reviewed future revision.",
      );
      return;
    }

    if (!publicationAllowed || !submittedSnapshot) {
      setNotice("Approve the revision before publication.");
      return;
    }

    const priorRevisionId = currentPublicSnapshot?.revisionId ?? "none";
    const pointers = publishPointers(
      currentPublicSnapshot,
      submittedSnapshot,
    );
    setPreviousPublicSnapshot(pointers.previousPublicSnapshot);
    setCurrentPublicSnapshot(pointers.currentPublicSnapshot);
    setPublicationStatus("revision-live");
    setNotice(
      `Probe public pointer moved from revision ${priorRevisionId} to ${submittedSnapshot.revisionId}. The production site was not changed.`,
    );
    appendAudit(
      "PROBE PUBLISHED",
      `Public pointer moved from revision ${priorRevisionId} to ${submittedSnapshot.revisionId}.`,
    );
  }

  function rollbackRevision() {
    if (
      !rollbackAllowed ||
      !currentPublicSnapshot ||
      !previousPublicSnapshot
    ) {
      setNotice("A reviewer can roll back only after a probe publication.");
      return;
    }

    const removedRevisionId = currentPublicSnapshot.revisionId;
    const pointers = rollbackPointers(
      currentPublicSnapshot,
      previousPublicSnapshot,
    );
    const restoredSnapshot = pointers.currentPublicSnapshot;
    setCurrentPublicSnapshot(pointers.currentPublicSnapshot);
    setPreviousPublicSnapshot(pointers.previousPublicSnapshot);
    setPublicationStatus("rolled-back");
    setNotice(
      `Probe public pointer restored to revision ${restoredSnapshot.revisionId}. Revision ${removedRevisionId} remains approved.`,
    );
    appendAudit(
      "ROLLBACK COMPLETED",
      `Revision ${restoredSnapshot.revisionId} restored; revision ${removedRevisionId} remains an approved snapshot.`,
    );
  }

  function emergencyTakedown() {
    if (!takedownAllowed) {
      setNotice("Emergency takedown requires reviewer authority.");
      return;
    }

    const result = clearPublicPointer(currentPublicSnapshot);
    setCurrentPublicSnapshot(result.currentPublicSnapshot);
    setPublicationStatus("taken-down");
    setNotice(
      `Emergency takedown hid public revision ${result.hiddenRevisionId} across profile, directory and gallery. This session is closed to republishing.`,
    );
    appendAudit(
      "EMERGENCY TAKEDOWN",
      `Public pointer cleared after hiding revision ${result.hiddenRevisionId}; republishing is locked.`,
    );
  }

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <a href="/" className="ops-brand">
          <strong>NOCTURNE</strong>
          <span>OPS</span>
          <small>AUTHORIZED OPERATIONS ALPHA</small>
        </a>

        <div className="ops-environment">
          <i />
          PRODUCTION / ATTENDANCE ALPHA
        </div>

        <nav aria-label="Operations sections">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? "is-active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.number}</span>
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>

        <div className="ops-sidebar-note">
          <b>ALPHA BOUNDARY</b>
          <p>
            One owner allowlist, one cast profile, one attendance date and one
            anonymous public projection.
          </p>
        </div>
      </aside>

      <section className="ops-workspace">
        <header className="ops-topbar">
          <div>
            <span>NOCTURNE TOKYO / INTERNAL OPERATIONS</span>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          {activeView === "attendance" ? (
            <div className="ops-role-switcher ops-authenticated-user">
              <span>AUTHENTICATED OWNER</span>
              <b>{adminUser.displayName}</b>
              <small>{adminUser.identityLabel} / SERVER ALLOWLIST</small>
            </div>
          ) : (
            <label className="ops-role-switcher">
              <span>SIMULATED CONTENT ROLE</span>
              <select
                aria-label="SIMULATED CONTENT ROLE"
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as ProbeRole;
                  setRole(nextRole);
                  setNotice(
                    `Simulated identity changed to ${probeActors[nextRole].id}.`,
                  );
                }}
              >
                <option value="editor">Content Editor / editor-01</option>
                <option value="reviewer">
                  Operations Reviewer / reviewer-01
                </option>
              </select>
              <small>
                {actor.id} / {actor.scope}
              </small>
            </label>
          )}
        </header>

        <div className="ops-notice" role="status">
          <b>{bannerLabel}</b>
          <span>{notice}</span>
        </div>

        {activeView === "queue" && (
          <QueueView
            revisionStatus={revisionStatus}
            blockingIssuesCount={blockingIssues.length}
            currentPublicRevisionId={
              currentPublicSnapshot?.revisionId ?? "HIDDEN"
            }
            openContent={() => setActiveView("content")}
          />
        )}

        {activeView === "attendance" && (
          <AttendancePanel
            adminUser={adminUser}
            onNotice={handleAttendanceNotice}
          />
        )}

        {activeView === "content" && (
          <section className="ops-editor-layout" aria-label="Cast profile editor">
            <div className="ops-editor-panel">
              <div className="ops-panel-heading">
                <span>PROFILE REVISION</span>
                <h2>{displayName}</h2>
                <em>REVISION 05 / LOCAL PROBE</em>
              </div>

              <div className="ops-form-grid">
                <label>
                  <span>PUBLIC NAME</span>
                  <input
                    value={displayName}
                    disabled={!isDraftEditable}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                <label>
                  <span>PUBLIC ROLE</span>
                  <input
                    value={roleLine}
                    disabled={!isDraftEditable}
                    onChange={(event) => setRoleLine(event.target.value)}
                  />
                </label>
                <label className="is-wide">
                  <span>PUBLIC BIOGRAPHY</span>
                  <textarea
                    value={biography}
                    disabled={!isDraftEditable}
                    onChange={(event) => setBiography(event.target.value)}
                    rows={5}
                  />
                </label>
              </div>

              <div className="ops-media-heading">
                <div>
                  <span>MEDIA SET</span>
                  <h3>3 SUPPLIED PHOTOS</h3>
                </div>
                <small>Select the directory cover</small>
              </div>

              <div className="ops-media-grid">
                {photos.map((photo, index) => (
                  <article className={coverIndex === index ? "is-cover" : ""} key={photo}>
                    <img
                      src={photo}
                      alt={`${displayName}, supplied view ${index + 1}`}
                    />
                    <div>
                      <b>PHOTO 0{index + 1}</b>
                      <button
                        type="button"
                        disabled={!isDraftEditable || coverIndex === index}
                        onClick={() => setCoverIndex(index)}
                      >
                        {coverIndex === index ? "CURRENT COVER" : "SET AS COVER"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="ops-editor-actions">
                <button
                  type="button"
                  className="is-secondary"
                  disabled={!isDraftEditable}
                  onClick={saveDraft}
                >
                  SAVE DRAFT
                </button>
                <button
                  type="button"
                  disabled={!isDraftEditable}
                  onClick={submitReview}
                >
                  SUBMIT FOR REVIEW
                </button>
              </div>
            </div>

            <ProfilePreview
              biography={reviewSnapshot.biography}
              cover={reviewSnapshot.cover}
              displayName={reviewSnapshot.displayName}
              roleLine={reviewSnapshot.roleLine}
            />
          </section>
        )}

        {activeView === "release" && (
          <section className="ops-release-layout">
            <ProfilePreview
              biography={reviewSnapshot.biography}
              cover={reviewSnapshot.cover}
              displayName={reviewSnapshot.displayName}
              roleLine={reviewSnapshot.roleLine}
              label="LOCKED REVIEW SNAPSHOT"
              badge={`REVISION ${reviewSnapshot.revisionId}`}
              large
            />
            <div className="ops-release-panel">
              <div className="ops-panel-heading">
                <span>REVIEW & RELEASE</span>
                <h2>CONTROLLED PUBLICATION</h2>
                <em>{bannerLabel}</em>
              </div>

              <div className="ops-public-pointer" aria-label="Probe public pointers">
                <article>
                  <span>CURRENT PUBLIC</span>
                  <b>{currentPublicSnapshot?.revisionId ?? "HIDDEN"}</b>
                  <small>
                    {currentPublicSnapshot
                      ? currentPublicSnapshot.displayName
                      : "Profile, directory and gallery hidden"}
                  </small>
                </article>
                <article>
                  <span>PREVIOUS POINTER</span>
                  <b>{previousPublicSnapshot?.revisionId ?? "NONE"}</b>
                  <small>
                    {previousPublicSnapshot
                      ? "Available as the last pointer transition"
                      : "No prior probe publication yet"}
                  </small>
                </article>
                <article>
                  <span>SUBMITTED BY</span>
                  <b>{submittedBy ?? "NONE"}</b>
                  <small>Approval requires a different fixed identity</small>
                </article>
              </div>

              <ol className="ops-release-steps">
                <li className="is-complete">
                  <b>01</b>
                  <span>Draft created</span>
                </li>
                <li className={revisionStatus !== "draft" ? "is-complete" : ""}>
                  <b>02</b>
                  <span>Governance passed</span>
                </li>
                <li
                  className={revisionStatus === "approved" ? "is-complete" : ""}
                >
                  <b>03</b>
                  <span>Independent approval</span>
                </li>
                <li
                  className={
                    publicationStatus === "revision-live" ? "is-complete" : ""
                  }
                >
                  <b>04</b>
                  <span>Probe publication</span>
                </li>
              </ol>

              <div className="ops-release-actions">
                <button
                  type="button"
                  disabled={!approvalAllowed}
                  onClick={approveRevision}
                >
                  APPROVE REVISION
                </button>
                <button
                  type="button"
                  disabled={!publicationAllowed}
                  onClick={publishRevision}
                >
                  PUBLISH PROBE
                </button>
                <button
                  type="button"
                  className="is-secondary"
                  disabled={!rollbackAllowed}
                  onClick={rollbackRevision}
                >
                  ROLLBACK
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={!takedownAllowed}
                  onClick={emergencyTakedown}
                >
                  EMERGENCY TAKEDOWN
                </button>
              </div>
            </div>
          </section>
        )}

        {activeView === "governance" && (
          <section className="ops-governance-layout">
            <div className="ops-governance-panel">
              <div className="ops-panel-heading">
                <span>PUBLICATION GATE</span>
                <h2>RIGHTS & SAFETY</h2>
                <em>{blockingIssues.length} BLOCKING ITEMS</em>
              </div>

              <div className="ops-check-list">
                {governanceChecks.map((item, index) => {
                  const inputId = `governance-check-${index}`;

                  return (
                    <label
                      key={item.label}
                      htmlFor={inputId}
                      aria-label={item.label}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={item.value}
                        disabled={!isDraftEditable}
                        onChange={(event) => item.setValue(event.target.checked)}
                      />
                      <span>
                        <b>{item.label}</b>
                        <small>Required before review submission</small>
                      </span>
                    </label>
                  );
                })}
              </div>

              <label className="ops-rights-reference">
                <span>RIGHTS EVIDENCE REFERENCE</span>
                <input
                  value={rightsReference}
                  placeholder="Example: RIGHTS-YUNA-2026-001"
                  disabled={!isDraftEditable}
                  onChange={(event) => setRightsReference(event.target.value)}
                />
                <small>
                  The probe stores only a reference. Identity documents and original
                  agreements remain outside the public content system.
                </small>
              </label>

              {blockingIssues.length > 0 ? (
                <div className="ops-blockers">
                  <b>PUBLICATION BLOCKED</b>
                  {blockingIssues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              ) : (
                <div className="ops-ready">
                  <b>READY FOR REVIEW</b>
                  <p>Every deterministic publication gate has passed.</p>
                </div>
              )}
            </div>

            <AuditTimeline entries={auditEntries} />
          </section>
        )}
      </section>
    </main>
  );
}

function QueueView({
  revisionStatus,
  blockingIssuesCount,
  currentPublicRevisionId,
  openContent,
}: {
  revisionStatus: RevisionStatus;
  blockingIssuesCount: number;
  currentPublicRevisionId: string;
  openContent: () => void;
}) {
  const summary = [
    ["01", "ACTIVE REVISION", "Yuna / Revision 05"],
    [
      String(blockingIssuesCount).padStart(2, "0"),
      "RIGHTS GAPS",
      blockingIssuesCount > 0
        ? "Evidence reference still needs filing"
        : "Every deterministic rights gate is complete",
    ],
    [currentPublicRevisionId, "CURRENT PUBLIC", "Single-profile probe pointer"],
    ["00", "PUBLISH FAILURES", "No failed probe releases"],
  ];

  return (
    <section className="ops-queue">
      <div className="ops-summary-grid">
        {summary.map(([value, label, detail], index) => (
          <article key={label} className={index === 1 ? "is-alert" : ""}>
            <b>{value}</b>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </div>

      <div className="ops-queue-table">
        <div className="ops-table-head">
          <span>PRIORITY</span>
          <span>OBJECT</span>
          <span>REASON</span>
          <span>STATUS</span>
          <span>ACTION</span>
        </div>
        <article>
          <b className="is-pink">P1</b>
          <span>Yuna / Revision 05</span>
          <p>New biography and three supplied photos</p>
          <em>{revisionStatusCopy[revisionStatus]}</em>
          <button type="button" onClick={openContent}>
            OPEN REVISION
          </button>
        </article>
      </div>

      <div className="ops-next-slice">
        <span>ACTIVE VERTICAL SLICE</span>
        <h2>ATTENDANCE IS NOW DURABLE AND PUBLICATION-GATED</h2>
        <p>
          Open Attendance to create one Yuna shift, move it through review and
          publish it to the anonymous profile projection. Attendance is live;
          cast and media publishing remains a simulated Alpha workflow.
        </p>
      </div>
    </section>
  );
}

function ProfilePreview({
  biography,
  cover,
  displayName,
  roleLine,
  label = "PUBLIC PROFILE PREVIEW",
  badge = "MOBILE",
  large = false,
}: {
  biography: string;
  cover: string;
  displayName: string;
  roleLine: string;
  label?: string;
  badge?: string;
  large?: boolean;
}) {
  return (
    <aside className={`ops-preview ${large ? "is-large" : ""}`}>
      <div className="ops-preview-label">
        <span>{label}</span>
        <b>{badge}</b>
      </div>
      <div className="ops-phone">
        <div className="ops-phone-brand">
          <b>NOCTURNE</b>
          <span>TOKYO</span>
        </div>
        <img src={cover} alt={`${displayName} profile preview`} />
        <div className="ops-phone-copy">
          <em>TONIGHT / GINZA</em>
          <h3>{displayName || "Untitled profile"}</h3>
          <b>{roleLine || "Public role pending"}</b>
          <p>{biography || "Public biography pending."}</p>
          <span className="ops-contact-preview">
            CONTACT ENTRY PREVIEW ONLY
          </span>
        </div>
      </div>
      <small>Simulated preview. No customer data or production write occurs.</small>
    </aside>
  );
}

function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  return (
    <aside className="ops-audit-panel">
      <div className="ops-panel-heading">
        <span>SESSION-ONLY RECORD</span>
        <h2>SIMULATED TIMELINE</h2>
        <em>RESETS ON REFRESH</em>
      </div>
      <div className="ops-audit-list">
        {entries.map((entry, index) => (
          <article key={`${entry.time}-${entry.action}-${index}`}>
            <span>{String(entries.length - index).padStart(2, "0")}</span>
            <div>
              <b>{entry.action}</b>
              <small>
                {entry.actor} / {entry.time}
              </small>
              <p>{entry.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
