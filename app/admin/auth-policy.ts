export function parseAllowedUserIds(value: string | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function isAllowedAdminUser({
  allowedUserIds,
  isDevelopmentMock,
  userId,
}: {
  allowedUserIds: string[];
  isDevelopmentMock: boolean;
  userId: string;
}) {
  if (allowedUserIds.includes(userId)) return true;
  return isDevelopmentMock && userId === "dev-owner-01";
}
