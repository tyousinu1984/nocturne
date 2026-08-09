export type RevisionStatus = "draft" | "pending" | "approved";

export type PublicationStatus =
  | "baseline-live"
  | "revision-live"
  | "rolled-back"
  | "taken-down";

export type ProbeActorId = "editor-01" | "reviewer-01";

export type ProfileSnapshot = {
  revisionId: string;
  displayName: string;
  roleLine: string;
  biography: string;
  cover: string;
};

export function canEditDraft(
  revisionStatus: RevisionStatus,
  actorId: ProbeActorId,
) {
  return revisionStatus === "draft" && actorId === "editor-01";
}

export function canApproveRevision({
  actorId,
  hasSnapshot,
  revisionStatus,
  submittedBy,
}: {
  actorId: ProbeActorId;
  hasSnapshot: boolean;
  revisionStatus: RevisionStatus;
  submittedBy: ProbeActorId | null;
}) {
  return (
    actorId === "reviewer-01" &&
    revisionStatus === "pending" &&
    hasSnapshot &&
    submittedBy !== null &&
    actorId !== submittedBy
  );
}

export function canPublishRevision({
  actorId,
  approvedBy,
  hasSnapshot,
  publicationStatus,
  revisionStatus,
}: {
  actorId: ProbeActorId;
  approvedBy: ProbeActorId | null;
  hasSnapshot: boolean;
  publicationStatus: PublicationStatus;
  revisionStatus: RevisionStatus;
}) {
  return (
    actorId === "reviewer-01" &&
    approvedBy === actorId &&
    hasSnapshot &&
    revisionStatus === "approved" &&
    publicationStatus !== "revision-live" &&
    publicationStatus !== "taken-down"
  );
}

export function canRollbackPublication({
  actorId,
  hasPreviousSnapshot,
  publicationStatus,
}: {
  actorId: ProbeActorId;
  hasPreviousSnapshot: boolean;
  publicationStatus: PublicationStatus;
}) {
  return (
    actorId === "reviewer-01" &&
    publicationStatus === "revision-live" &&
    hasPreviousSnapshot
  );
}

export function canEmergencyTakedown({
  actorId,
  hasCurrentSnapshot,
}: {
  actorId: ProbeActorId;
  hasCurrentSnapshot: boolean;
}) {
  return actorId === "reviewer-01" && hasCurrentSnapshot;
}

export function publishPointers(
  currentPublicSnapshot: ProfileSnapshot | null,
  approvedSnapshot: ProfileSnapshot,
) {
  return {
    currentPublicSnapshot: approvedSnapshot,
    previousPublicSnapshot: currentPublicSnapshot,
  };
}

export function rollbackPointers(
  currentPublicSnapshot: ProfileSnapshot,
  previousPublicSnapshot: ProfileSnapshot,
) {
  return {
    currentPublicSnapshot: previousPublicSnapshot,
    previousPublicSnapshot: currentPublicSnapshot,
  };
}

export function clearPublicPointer(
  currentPublicSnapshot: ProfileSnapshot | null,
) {
  return {
    hiddenRevisionId: currentPublicSnapshot?.revisionId ?? "none",
    currentPublicSnapshot: null,
  };
}
