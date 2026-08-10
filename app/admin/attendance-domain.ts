export const attendanceStatuses = [
  "draft",
  "pending",
  "approved",
  "published",
  "rejected",
  "cancelled",
] as const;

export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const attendanceActions = [
  "create",
  "save_draft",
  "submit",
  "approve",
  "reject",
  "publish",
  "cancel",
] as const;

export type AttendanceAction = (typeof attendanceActions)[number];

export type AttendanceActor = {
  userId: string;
  role: "admin" | "cast";
  artistSlug?: string;
};

export type AttendanceDraftInput = {
  artistSlug: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  note?: string;
};

export type AttendanceEntryRecord = {
  id: string;
  artistSlug: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  status: AttendanceStatus;
  version: number;
  submittedBy: string | null;
  reviewedBy: string | null;
  note: string;
  rejectionReason: string | null;
  cancellationReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceEventRecord = {
  id: number;
  attendanceId: string;
  idempotencyKey: string;
  action: AttendanceAction;
  fromStatus: AttendanceStatus | null;
  toStatus: AttendanceStatus;
  actorUserId: string;
  entryVersion: number;
  detail: string;
  createdAt: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const transitionTargets: Record<
  Exclude<AttendanceAction, "create">,
  { from: AttendanceStatus; to: AttendanceStatus }
> = {
  save_draft: { from: "draft", to: "draft" },
  submit: { from: "draft", to: "pending" },
  approve: { from: "pending", to: "approved" },
  reject: { from: "pending", to: "rejected" },
  publish: { from: "approved", to: "published" },
  cancel: { from: "published", to: "cancelled" },
};

export class AttendanceDomainError extends Error {
  readonly code:
    | "invalid_artist"
    | "invalid_date"
    | "invalid_time"
    | "invalid_time_order"
    | "invalid_transition"
    | "permission_denied"
    | "reason_required"
    | "text_too_long";

  constructor(
    code:
      | "invalid_artist"
      | "invalid_date"
      | "invalid_time"
      | "invalid_time_order"
      | "invalid_transition"
      | "permission_denied"
      | "reason_required"
      | "text_too_long",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export function assertAttendancePermission({
  action,
  actor,
  artistSlug,
}: {
  action: AttendanceAction;
  actor: AttendanceActor;
  artistSlug: string;
}) {
  const castActions: AttendanceAction[] = ["create", "save_draft", "submit"];
  const allowed =
    actor.role === "cast"
      ? castActions.includes(action) && actor.artistSlug === artistSlug
      : attendanceActions.includes(action);

  if (!allowed) {
    throw new AttendanceDomainError(
      "permission_denied",
      "This identity cannot perform that attendance action.",
    );
  }
}

export function isAttendanceAction(value: unknown): value is AttendanceAction {
  return (
    typeof value === "string" &&
    attendanceActions.includes(value as AttendanceAction)
  );
}

export function assertValidAttendanceDraft(input: AttendanceDraftInput) {
  if (!slugPattern.test(input.artistSlug)) {
    throw new AttendanceDomainError(
      "invalid_artist",
      "Choose a valid cast profile.",
    );
  }
  if (!datePattern.test(input.serviceDate)) {
    throw new AttendanceDomainError(
      "invalid_date",
      "Service date must use YYYY-MM-DD.",
    );
  }
  const parsedDate = new Date(`${input.serviceDate}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.valueOf()) ||
    parsedDate.toISOString().slice(0, 10) !== input.serviceDate
  ) {
    throw new AttendanceDomainError(
      "invalid_date",
      "Choose a real calendar date.",
    );
  }
  if (!timePattern.test(input.startTime) || !timePattern.test(input.endTime)) {
    throw new AttendanceDomainError(
      "invalid_time",
      "Start and end times must use HH:MM.",
    );
  }
  if (input.startTime >= input.endTime) {
    throw new AttendanceDomainError(
      "invalid_time_order",
      "End time must be later than start time.",
    );
  }
  if ((input.note?.trim().length ?? 0) > 500) {
    throw new AttendanceDomainError(
      "text_too_long",
      "Internal note must be 500 characters or fewer.",
    );
  }
}

export function attendanceTargetStatus(
  action: Exclude<AttendanceAction, "create">,
  currentStatus: AttendanceStatus,
  actorRole: AttendanceActor["role"] = "cast",
) {
  if (action === "save_draft" && actorRole === "admin") {
    if (currentStatus === "rejected" || currentStatus === "cancelled") {
      throw new AttendanceDomainError(
        "invalid_transition",
        `save_draft cannot run while attendance is ${currentStatus}.`,
      );
    }
    return currentStatus;
  }
  const transition = transitionTargets[action];
  if (transition.from !== currentStatus) {
    throw new AttendanceDomainError(
      "invalid_transition",
      `${action} cannot run while attendance is ${currentStatus}.`,
    );
  }
  return transition.to;
}

export function assertAttendanceReason(
  action: AttendanceAction,
  reason: string | undefined,
) {
  if (
    (action === "reject" || action === "cancel") &&
    !reason?.trim()
  ) {
    throw new AttendanceDomainError(
      "reason_required",
      `${action === "reject" ? "Rejection" : "Cancellation"} reason is required.`,
    );
  }
  if ((reason?.trim().length ?? 0) > 500) {
    throw new AttendanceDomainError(
      "text_too_long",
      "Reason must be 500 characters or fewer.",
    );
  }
}

export function attendanceEventName(action: AttendanceAction) {
  const suffix: Record<AttendanceAction, string> = {
    create: "created",
    save_draft: "draft_saved",
    submit: "submitted",
    approve: "approved",
    reject: "rejected",
    publish: "published",
    cancel: "cancelled",
  };
  return `attendance.${suffix[action]}`;
}

export function attendanceActionDetail({
  action,
  reason,
  serviceDate,
  startTime,
  endTime,
}: {
  action: AttendanceAction;
  reason?: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
}) {
  const schedule = `${serviceDate} ${startTime}-${endTime}`;
  if (action === "reject") return `Rejected ${schedule}: ${reason?.trim()}`;
  if (action === "cancel") return `Cancelled ${schedule}: ${reason?.trim()}`;
  return `${attendanceEventName(action)} for ${schedule}`;
}
