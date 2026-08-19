/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState } from "react";
import { artists } from "../data";
import { useTranslations } from "../../i18n/context";
import type { Dictionary } from "../../i18n/dictionary-types";
import type { Locale } from "../../i18n/locales";
import {
  approvalBlockedDetail,
  approvedAuditDetail,
  approvedNotice,
  draftUpdatedDetail,
  profilePreviewAlt,
  publishedAuditDetail,
  publishedNotice,
  rollbackAuditDetail,
  rollbackNotice,
  roleChangedNotice,
  submittedAuditDetail,
  submittedNotice,
  suppliedPhotoAlt,
  takedownAuditDetail,
  takedownNotice,
} from "../../i18n/messages";
import { AttendancePanel } from "./attendance-panel";
import { CastAccountPanel } from "./cast-account-panel";
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
  | "access"
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

const probeActorIds: Record<ProbeRole, ProbeActorId> = {
  editor: "editor-01",
  reviewer: "reviewer-01",
};

const photos = [
  "/photos-preview/yuna-01.jpg",
  "/photos-preview/yuna-02.jpg",
  "/photos-preview/yuna-03.jpg",
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
  const { locale, dictionary } = useTranslations();
  const admin = dictionary.admin;

  const probeActors: Record<ProbeRole, { id: ProbeActorId; label: string; scope: string }> = {
    editor: {
      id: "editor-01",
      label: "Content Editor",
      scope: admin.access.castScopeTitle,
    },
    reviewer: {
      id: "reviewer-01",
      label: "Operations Reviewer",
      scope: admin.access.adminScopeTitle,
    },
  };

  const initialAudit: AuditEntry[] = admin.auditSeed.map((seed, index) => ({
    action: seed.action,
    actor: index === 0 ? "Lead Agent" : "Human Owner",
    detail: seed.detail,
    time: index === 0 ? "TODAY / 09:20" : "TODAY / 09:05",
  }));

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
    "Protected operations console. Attendance writes use durable PostgreSQL storage; profile revision data still resets on refresh.",
  );
  const [attendanceLabel, setAttendanceLabel] = useState("POSTGRES READY");
  const [accessLabel, setAccessLabel] = useState(admin.access.title);
  const [accessNotice, setAccessNotice] = useState(
    "Create cast identities, rotate access codes and invalidate sessions from one protected view.",
  );

  const actor = probeActors[role];
  const isDraftEditable = canEditDraft(revisionStatus, actor.id);
  const reviewSnapshot: ProfileSnapshot = submittedSnapshot ?? {
    revisionId: "05",
    displayName,
    roleLine,
    biography,
    cover: photos[coverIndex],
  };

  const navItemLabel = (id: AdminView) => admin.nav.find((item) => item.id === id)?.label ?? id;

  const bannerLabel =
    activeView === "attendance"
      ? attendanceLabel
      : activeView === "access"
        ? accessLabel
      : revisionStatus !== "approved" || publicationStatus === "baseline-live"
        ? admin.revisionStatus[revisionStatus]
        : admin.publicationStatus[publicationStatus];

  const handleAttendanceNotice = useCallback(
    (label: string, message: string) => {
      setAttendanceLabel(label);
      setNotice(message);
    },
    [setAttendanceLabel, setNotice],
  );

  const handleAccessNotice = useCallback(
    (label: string, message: string) => {
      setAccessLabel(label);
      setAccessNotice(message);
    },
    [setAccessLabel, setAccessNotice],
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
      label: admin.governance.checks.adultVerified,
      value: adultVerified,
      setValue: setAdultVerified,
    },
    {
      label: admin.governance.checks.websiteUsage,
      value: websiteUsage,
      setValue: setWebsiteUsage,
    },
    {
      label: admin.governance.checks.exifClean,
      value: exifClean,
      setValue: setExifClean,
    },
  ];

  const blockingIssues = useMemo(() => {
    const issues: string[] = [];
    if (!adultVerified) issues.push(admin.governance.issues.adultIncomplete);
    if (!websiteUsage) issues.push(admin.governance.issues.websiteUsageMissing);
    if (!exifClean) issues.push(admin.governance.issues.exifNotClean);
    if (!rightsReference.trim()) issues.push(admin.governance.issues.rightsReferenceMissing);
    return issues;
  }, [
    adultVerified,
    exifClean,
    rightsReference,
    websiteUsage,
    admin.governance.issues.adultIncomplete,
    admin.governance.issues.websiteUsageMissing,
    admin.governance.issues.exifNotClean,
    admin.governance.issues.rightsReferenceMissing,
  ]);

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
      setNotice(admin.notices.onlyEditorCanSave);
      return;
    }
    setNotice(admin.notices.draftSaved);
    appendAudit(admin.audit.draftSavedAction, draftUpdatedDetail(locale, displayName));
  }

  function submitReview() {
    if (!isDraftEditable) {
      setNotice(admin.notices.onlyEditorCanSubmit);
      return;
    }

    if (blockingIssues.length > 0) {
      setActiveView("governance");
      setNotice(admin.notices.submissionBlocked);
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
    setNotice(submittedNotice(locale, snapshot.revisionId, actor.id));
    appendAudit(admin.audit.submittedAction, submittedAuditDetail(locale, snapshot.revisionId));
  }

  function approveRevision() {
    if (!approvalAllowed) {
      if (submittedBy !== null && actor.id === submittedBy) {
        setNotice(admin.notices.submitterCannotApprove);
        appendAudit(admin.audit.approvalBlockedAction, approvalBlockedDetail(locale, actor.id));
        return;
      }

      setNotice(admin.notices.reviewerAndPendingRequired);
      return;
    }

    if (!submittedSnapshot) {
      setNotice(admin.notices.snapshotUnavailable);
      return;
    }

    setRevisionStatus("approved");
    setApprovedBy(actor.id);
    setNotice(approvedNotice(locale, submittedSnapshot.revisionId, actor.id));
    appendAudit(admin.audit.approvedAction, approvedAuditDetail(locale, submittedSnapshot.revisionId));
  }

  function publishRevision() {
    if (publicationStatus === "taken-down") {
      setNotice(admin.notices.takedownClosedSession);
      appendAudit(
        admin.audit.repostBlockedAction,
        "Emergency takedown requires a separately reviewed future revision.",
      );
      return;
    }

    if (!publicationAllowed || !submittedSnapshot) {
      setNotice(admin.notices.approveBeforePublication);
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
    setNotice(publishedNotice(locale, priorRevisionId, submittedSnapshot.revisionId));
    appendAudit(
      admin.audit.publishedAction,
      publishedAuditDetail(locale, priorRevisionId, submittedSnapshot.revisionId),
    );
  }

  function rollbackRevision() {
    if (
      !rollbackAllowed ||
      !currentPublicSnapshot ||
      !previousPublicSnapshot
    ) {
      setNotice(admin.notices.rollbackRequiresPublication);
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
    setNotice(rollbackNotice(locale, restoredSnapshot.revisionId, removedRevisionId));
    appendAudit(
      admin.audit.rollbackAction,
      rollbackAuditDetail(locale, restoredSnapshot.revisionId, removedRevisionId),
    );
  }

  function emergencyTakedown() {
    if (!takedownAllowed) {
      setNotice(admin.notices.takedownRequiresReviewer);
      return;
    }

    const result = clearPublicPointer(currentPublicSnapshot);
    setCurrentPublicSnapshot(result.currentPublicSnapshot);
    setPublicationStatus("taken-down");
    setNotice(takedownNotice(locale, result.hiddenRevisionId));
    appendAudit(admin.audit.takedownAction, takedownAuditDetail(locale, result.hiddenRevisionId));
  }

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <a href={`/${locale}`} className="ops-brand">
          <strong>NOCTURNE</strong>
          <span>OPS</span>
          <small>{admin.brandSub}</small>
        </a>

        <div className="ops-environment">
          <i />
          {admin.environmentBanner}
        </div>

        <nav aria-label="Operations sections">
          {admin.nav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? "is-active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id as AdminView)}
            >
              <span>{item.number}</span>
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>

        <div className="ops-sidebar-note">
          <b>{admin.sidebarNoteTitle}</b>
          <p>{admin.sidebarNoteBody}</p>
        </div>
      </aside>

      <section className="ops-workspace">
        <header className="ops-topbar">
          <div>
            <span>{admin.topbarEyebrow}</span>
            <h1>{navItemLabel(activeView)}</h1>
          </div>
          {activeView === "attendance" || activeView === "access" ? (
            <div className="ops-role-switcher ops-authenticated-user">
              <span>{admin.authenticatedOperatorLabel}</span>
              <b>{adminUser.displayName}</b>
              <small>
                {adminUser.identityLabel} / {admin.siteAccessCodeSuffix}
              </small>
            </div>
          ) : (
            <label className="ops-role-switcher">
              <span>{admin.simulatedRoleLabel}</span>
              <select
                aria-label={admin.simulatedRoleLabel}
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as ProbeRole;
                  setRole(nextRole);
                  setNotice(roleChangedNotice(locale, probeActorIds[nextRole]));
                }}
              >
                <option value="editor">{admin.roleOptionEditor}</option>
                <option value="reviewer">{admin.roleOptionReviewer}</option>
              </select>
              <small>
                {actor.id} / {actor.scope}
              </small>
            </label>
          )}
        </header>

        <div className="ops-notice" role="status">
          <b>{bannerLabel}</b>
          <span>{activeView === "access" ? accessNotice : notice}</span>
        </div>

        {activeView === "queue" && (
          <QueueView
            admin={admin}
            revisionStatus={revisionStatus}
            blockingIssuesCount={blockingIssues.length}
            currentPublicRevisionId={
              currentPublicSnapshot?.revisionId ?? admin.release.hiddenLabel
            }
            openContent={() => setActiveView("content")}
          />
        )}

        {activeView === "attendance" && (
          <AttendancePanel
            actorKind="admin"
            endpoint="/api/admin/attendance"
            identity={{
              displayName: adminUser.displayName,
              identityLabel: `${adminUser.identityLabel} / REVERSE PROXY`,
            }}
            onNotice={handleAttendanceNotice}
          />
        )}

        {activeView === "access" && (
          <CastAccountPanel onNotice={handleAccessNotice} />
        )}

        {activeView === "content" && (
          <section className="ops-editor-layout" aria-label="Cast profile editor">
            <div className="ops-editor-panel">
              <div className="ops-panel-heading">
                <span>{admin.content.profileRevisionEyebrow}</span>
                <h2>{displayName}</h2>
                <em>{admin.content.revisionBadge}</em>
              </div>

              <div className="ops-form-grid">
                <label>
                  <span>{admin.content.publicNameLabel}</span>
                  <input
                    value={displayName}
                    disabled={!isDraftEditable}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                <label>
                  <span>{admin.content.publicRoleLabel}</span>
                  <input
                    value={roleLine}
                    disabled={!isDraftEditable}
                    onChange={(event) => setRoleLine(event.target.value)}
                  />
                </label>
                <label className="is-wide">
                  <span>{admin.content.publicBiographyLabel}</span>
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
                  <span>{admin.content.mediaSetEyebrow}</span>
                  <h3>{admin.content.suppliedPhotosLabel}</h3>
                </div>
                <small>{admin.content.selectCoverHint}</small>
              </div>

              <div className="ops-media-grid">
                {photos.map((photo, index) => (
                  <article className={coverIndex === index ? "is-cover" : ""} key={photo}>
                    <img
                      src={photo}
                      alt={suppliedPhotoAlt(locale, displayName, index + 1)}
                    />
                    <div>
                      <b>
                        {admin.content.photoLabelPrefix}
                        {index + 1}
                      </b>
                      <button
                        type="button"
                        disabled={!isDraftEditable || coverIndex === index}
                        onClick={() => setCoverIndex(index)}
                      >
                        {coverIndex === index ? admin.content.currentCover : admin.content.setAsCover}
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
                  {admin.content.saveDraft}
                </button>
                <button
                  type="button"
                  disabled={!isDraftEditable}
                  onClick={submitReview}
                >
                  {admin.content.submitForReview}
                </button>
              </div>
            </div>

            <ProfilePreview
              admin={admin}
              locale={locale}
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
              admin={admin}
              locale={locale}
              biography={reviewSnapshot.biography}
              cover={reviewSnapshot.cover}
              displayName={reviewSnapshot.displayName}
              roleLine={reviewSnapshot.roleLine}
              label={admin.release.lockedSnapshotLabel}
              badge={`${admin.release.revisionBadgePrefix} ${reviewSnapshot.revisionId}`}
              large
            />
            <div className="ops-release-panel">
              <div className="ops-panel-heading">
                <span>{admin.release.reviewReleaseEyebrow}</span>
                <h2>{admin.release.controlledPublicationTitle}</h2>
                <em>{bannerLabel}</em>
              </div>

              <div className="ops-public-pointer" aria-label="Probe public pointers">
                <article>
                  <span>{admin.release.currentPublicLabel}</span>
                  <b>{currentPublicSnapshot?.revisionId ?? admin.release.hiddenLabel}</b>
                  <small>
                    {currentPublicSnapshot
                      ? currentPublicSnapshot.displayName
                      : admin.release.profileHiddenNote}
                  </small>
                </article>
                <article>
                  <span>{admin.release.previousPointerLabel}</span>
                  <b>{previousPublicSnapshot?.revisionId ?? admin.release.noneLabel}</b>
                  <small>
                    {previousPublicSnapshot
                      ? admin.release.availableAsPointerNote
                      : admin.release.noPriorPublicationNote}
                  </small>
                </article>
                <article>
                  <span>{admin.release.submittedByLabel}</span>
                  <b>{submittedBy ?? admin.release.noneLabel}</b>
                  <small>{admin.release.approvalRequiresDifferentIdentity}</small>
                </article>
              </div>

              <ol className="ops-release-steps">
                <li className="is-complete">
                  <b>01</b>
                  <span>{admin.release.stepDraftCreated}</span>
                </li>
                <li className={revisionStatus !== "draft" ? "is-complete" : ""}>
                  <b>02</b>
                  <span>{admin.release.stepGovernancePassed}</span>
                </li>
                <li
                  className={revisionStatus === "approved" ? "is-complete" : ""}
                >
                  <b>03</b>
                  <span>{admin.release.stepIndependentApproval}</span>
                </li>
                <li
                  className={
                    publicationStatus === "revision-live" ? "is-complete" : ""
                  }
                >
                  <b>04</b>
                  <span>{admin.release.stepProbePublication}</span>
                </li>
              </ol>

              <div className="ops-release-actions">
                <button
                  type="button"
                  disabled={!approvalAllowed}
                  onClick={approveRevision}
                >
                  {admin.release.approveRevision}
                </button>
                <button
                  type="button"
                  disabled={!publicationAllowed}
                  onClick={publishRevision}
                >
                  {admin.release.publishProbe}
                </button>
                <button
                  type="button"
                  className="is-secondary"
                  disabled={!rollbackAllowed}
                  onClick={rollbackRevision}
                >
                  {admin.release.rollback}
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={!takedownAllowed}
                  onClick={emergencyTakedown}
                >
                  {admin.release.emergencyTakedown}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeView === "governance" && (
          <section className="ops-governance-layout">
            <div className="ops-governance-panel">
              <div className="ops-panel-heading">
                <span>{admin.governance.publicationGateEyebrow}</span>
                <h2>{admin.governance.rightsSafetyTitle}</h2>
                <em>
                  {blockingIssues.length} {admin.governance.blockingItemsSuffix}
                </em>
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
                        <small>{admin.governance.requiredBeforeSubmission}</small>
                      </span>
                    </label>
                  );
                })}
              </div>

              <label className="ops-rights-reference">
                <span>{admin.governance.rightsEvidenceLabel}</span>
                <input
                  value={rightsReference}
                  placeholder={admin.governance.rightsEvidencePlaceholder}
                  disabled={!isDraftEditable}
                  onChange={(event) => setRightsReference(event.target.value)}
                />
                <small>{admin.governance.rightsEvidenceNote}</small>
              </label>

              {blockingIssues.length > 0 ? (
                <div className="ops-blockers">
                  <b>{admin.governance.publicationBlocked}</b>
                  {blockingIssues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              ) : (
                <div className="ops-ready">
                  <b>{admin.governance.readyForReview}</b>
                  <p>{admin.governance.readyForReviewNote}</p>
                </div>
              )}
            </div>

            <AuditTimeline admin={admin} entries={auditEntries} />
          </section>
        )}
      </section>
    </main>
  );
}

function QueueView({
  admin,
  revisionStatus,
  blockingIssuesCount,
  currentPublicRevisionId,
  openContent,
}: {
  admin: Dictionary["admin"];
  revisionStatus: RevisionStatus;
  blockingIssuesCount: number;
  currentPublicRevisionId: string;
  openContent: () => void;
}) {
  const summary = [
    ["01", admin.queue.summaryActiveRevision, admin.queue.summaryActiveRevisionDetail],
    [
      String(blockingIssuesCount).padStart(2, "0"),
      admin.queue.summaryRightsGaps,
      blockingIssuesCount > 0
        ? admin.queue.summaryRightsGapsPending
        : admin.queue.summaryRightsGapsClear,
    ],
    [currentPublicRevisionId, admin.queue.summaryCurrentPublic, admin.queue.summaryCurrentPublicDetail],
    ["00", admin.queue.summaryPublishFailures, admin.queue.summaryPublishFailuresDetail],
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
          <span>{admin.queue.tableHeadPriority}</span>
          <span>{admin.queue.tableHeadObject}</span>
          <span>{admin.queue.tableHeadReason}</span>
          <span>{admin.queue.tableHeadStatus}</span>
          <span>{admin.queue.tableHeadAction}</span>
        </div>
        <article>
          <b className="is-pink">P1</b>
          <span>Yuna / Revision 05</span>
          <p>{admin.queue.priorityReason}</p>
          <em>{admin.revisionStatus[revisionStatus]}</em>
          <button type="button" onClick={openContent}>
            {admin.queue.openRevision}
          </button>
        </article>
      </div>

      <div className="ops-next-slice">
        <span>{admin.queue.sliceEyebrow}</span>
        <h2>{admin.queue.sliceTitle}</h2>
        <p>{admin.queue.sliceBody}</p>
      </div>
    </section>
  );
}

function ProfilePreview({
  admin,
  locale,
  biography,
  cover,
  displayName,
  roleLine,
  label,
  badge,
  large = false,
}: {
  admin: Dictionary["admin"];
  locale: Locale;
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
        <span>{label ?? admin.preview.defaultLabel}</span>
        <b>{badge ?? admin.preview.defaultBadge}</b>
      </div>
      <div className="ops-phone">
        <div className="ops-phone-brand">
          <b>NOCTURNE</b>
          <span>TOKYO</span>
        </div>
        <img src={cover} alt={profilePreviewAlt(locale, displayName)} />
        <div className="ops-phone-copy">
          <em>{admin.preview.tonightGinza}</em>
          <h3>{displayName || admin.preview.untitledProfile}</h3>
          <b>{roleLine || admin.preview.rolePending}</b>
          <p>{biography || admin.preview.biographyPending}</p>
          <span className="ops-contact-preview">{admin.preview.contactPreviewOnly}</span>
        </div>
      </div>
      <small>{admin.preview.simulatedNote}</small>
    </aside>
  );
}

function AuditTimeline({
  admin,
  entries,
}: {
  admin: Dictionary["admin"];
  entries: AuditEntry[];
}) {
  return (
    <aside className="ops-audit-panel">
      <div className="ops-panel-heading">
        <span>{admin.auditPanel.sessionOnlyRecord}</span>
        <h2>{admin.auditPanel.simulatedTimeline}</h2>
        <em>{admin.auditPanel.resetsOnRefresh}</em>
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
