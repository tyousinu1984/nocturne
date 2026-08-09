export function isSameOriginCommandRequest({
  origin,
  requestUrl,
}: {
  origin: string | null;
  requestUrl: string;
}) {
  if (!origin) return true;
  return origin === new URL(requestUrl).origin;
}
