declare const __NOCTURNE_DEV_AUTH__: boolean | undefined;

export function getRuntimeEnvValue(name: string): string | undefined {
  if (
    name === "NOCTURNE_DEV_AUTH" &&
    typeof __NOCTURNE_DEV_AUTH__ === "boolean" &&
    __NOCTURNE_DEV_AUTH__
  ) {
    return "1";
  }

  return undefined;
}
