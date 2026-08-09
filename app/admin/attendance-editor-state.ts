import type { AttendanceEntryRecord } from "./attendance-domain";

export type AttendanceFormFields = {
  serviceDate: string;
  startTime: string;
  endTime: string;
  note: string;
  reason: string;
};

export function attendanceFormFromEntry(
  entry: AttendanceEntryRecord,
): AttendanceFormFields {
  return {
    serviceDate: entry.serviceDate,
    startTime: entry.startTime,
    endTime: entry.endTime,
    note: entry.note,
    reason: entry.cancellationReason ?? entry.rejectionReason ?? "",
  };
}

export function replaceAttendanceEntry(
  entries: AttendanceEntryRecord[],
  replacement: AttendanceEntryRecord,
) {
  return entries.map((entry) =>
    entry.id === replacement.id ? replacement : entry,
  );
}

export function attendancePreview(
  entry: AttendanceEntryRecord | null,
  fields: Pick<AttendanceFormFields, "serviceDate" | "startTime" | "endTime">,
) {
  if (entry?.status === "cancelled") {
    return {
      kind: "removed" as const,
      dateLabel: "NO PUBLISHED SHIFTS",
      timeLabel: "REMOVED FROM PUBLIC PROFILE",
      statusLabel: "REMOVED",
    };
  }

  return {
    kind: "schedule" as const,
    dateLabel: fields.serviceDate || "DATE PENDING",
    timeLabel: `${fields.startTime || "--:--"} TO ${fields.endTime || "--:--"}`,
    statusLabel: entry?.status === "published" ? "VISIBLE NOW" : "HIDDEN UNTIL PUBLISHED",
  };
}

export function attendanceFailureKind(status: number, code?: string) {
  if (status === 401 || code === "authentication_required") {
    return "auth_required" as const;
  }
  if (code === "cross_origin_blocked") return "command_error" as const;
  if (status === 403 || code === "admin_forbidden") {
    return "forbidden" as const;
  }
  if (status === 503 || code === "database_error") {
    return "storage_unavailable" as const;
  }
  return "command_error" as const;
}
