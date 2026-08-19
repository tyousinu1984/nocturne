export function isSameOriginCommandRequest({
  origin,
  requestUrl,
}: {
  origin: string | null;
  requestUrl: string;
}) {
  // Fail closed when Origin is absent. Same-origin fetch/XHR/form writes from
  // a browser always carry an Origin header for state-changing methods, so a
  // missing header means either a cross-site request too old-fashioned to
  // send one, or a non-browser client — neither should be trusted by default.
  if (!origin) return false;
  return origin === new URL(requestUrl).origin;
}
