"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CastAccountEventRecord,
  CastAccountRecord,
} from "./cast-account-domain";

type ArtistOption = { slug: string; name: string };
type AccountData = {
  artists: ArtistOption[];
  accounts: CastAccountRecord[];
  events: CastAccountEventRecord[];
};

export function CastAccountPanel({
  onNotice,
}: {
  onNotice: (label: string, message: string) => void;
}) {
  const [data, setData] = useState<AccountData>({ artists: [], accounts: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [temporaryCode, setTemporaryCode] = useState<{
    displayName: string;
    value: string;
  } | null>(null);

  const accountBySlug = useMemo(
    () => new Map(data.accounts.map((account) => [account.artistSlug, account])),
    [data.accounts],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/cast-accounts", {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as AccountData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Accounts could not be loaded.");
      setData(body);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Accounts could not be loaded.";
      setError(message);
      onNotice("ACCESS ERROR", message);
    } finally {
      setLoading(false);
    }
  }, [onNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function runAction(
    artist: ArtistOption,
    action: "create" | "rotate_credential" | "enable" | "disable",
  ) {
    const account = accountBySlug.get(artist.slug);
    setBusySlug(artist.slug);
    setError("");
    try {
      const response = await fetch("/api/admin/cast-accounts", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ action, artistSlug: artist.slug, accountId: account?.id }),
      });
      const body = (await response.json()) as {
        account?: CastAccountRecord;
        temporaryAccessCode?: string;
        error?: string;
      };
      if (!response.ok || !body.account) {
        throw new Error(body.error ?? "Account command failed.");
      }
      setData((current) => ({
        ...current,
        accounts: [
          ...current.accounts.filter((item) => item.id !== body.account!.id),
          body.account!,
        ],
      }));
      if (body.temporaryAccessCode) {
        setTemporaryCode({ displayName: artist.name, value: body.temporaryAccessCode });
      }
      const label = {
        create: "ACCOUNT CREATED",
        rotate_credential: "ACCESS CODE RESET",
        enable: "ACCOUNT ENABLED",
        disable: "ACCOUNT DISABLED",
      }[action];
      onNotice(label, `${artist.name} access was updated. Existing sessions were invalidated when applicable.`);
      await load();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Account command failed.";
      setError(message);
      onNotice("ACCESS COMMAND BLOCKED", message);
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <section className="ops-access">
      <div className="ops-panel-heading">
        <span>CAST IDENTITY & PERMISSIONS</span>
        <h2>STAFF ACCESS</h2>
        <em>{data.accounts.filter((account) => account.status === "active").length} ACTIVE ACCOUNTS</em>
      </div>

      <div className="ops-access-principles">
        <article><b>CAST SCOPE</b><p>Create, save and submit attendance for the profile bound to the account.</p></article>
        <article><b>ADMIN SCOPE</b><p>Approve, reject, publish, cancel and manage cast credentials.</p></article>
        <article><b>SESSION CONTROL</b><p>Disable or reset increments session version and closes earlier sessions.</p></article>
      </div>

      {temporaryCode && (
        <div className="ops-temporary-code" role="status">
          <div><span>ONE-TIME ACCESS CODE / {temporaryCode.displayName.toUpperCase()}</span><strong>{temporaryCode.value}</strong><p>Copy this now. Only the credential hash is stored and this code cannot be shown again.</p></div>
          <button type="button" onClick={() => setTemporaryCode(null)}>I SAVED IT</button>
        </div>
      )}

      {error && <div className="ops-attendance-error"><b>ATTENTION REQUIRED</b><p>{error}</p><button type="button" onClick={load}>RETRY LOAD</button></div>}

      {loading ? <p className="ops-attendance-empty">Loading cast identities…</p> : (
        <div className="ops-account-grid">
          {data.artists.map((artist) => {
            const account = accountBySlug.get(artist.slug);
            const busy = busySlug === artist.slug;
            return (
              <article key={artist.slug} className={account?.status === "disabled" ? "is-disabled" : ""}>
                <div className="ops-account-title"><span>{artist.slug}</span><h3>{artist.name}</h3><em>{account ? account.status.toUpperCase() : "NO ACCOUNT"}</em></div>
                {account ? (
                  <dl>
                    <div><dt>SESSION VERSION</dt><dd>V{account.sessionVersion}</dd></div>
                    <div><dt>LAST LOGIN</dt><dd>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString("en-GB", { timeZone: "Asia/Tokyo" }) : "NEVER"}</dd></div>
                    <div><dt>ACCOUNT ID</dt><dd>{account.id.slice(0, 18)}…</dd></div>
                  </dl>
                ) : <p>No sign-in identity exists for this profile.</p>}
                <div className="ops-account-actions">
                  {!account && <button type="button" disabled={busy} onClick={() => runAction(artist, "create")}>{busy ? "CREATING…" : "CREATE ACCOUNT"}</button>}
                  {account && <button type="button" className="is-secondary" disabled={busy} onClick={() => runAction(artist, "rotate_credential")}>{busy ? "RESETTING…" : "RESET ACCESS CODE"}</button>}
                  {account?.status === "active" && <button type="button" className="is-danger" disabled={busy} onClick={() => runAction(artist, "disable")}>DISABLE</button>}
                  {account?.status === "disabled" && <button type="button" disabled={busy} onClick={() => runAction(artist, "enable")}>ENABLE</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="ops-account-audit">
        <span>RECENT IDENTITY EVENTS</span>
        {data.events.length === 0 ? <p>No identity events yet.</p> : data.events.slice(0, 12).map((event) => (
          <article key={event.id}><b>{event.action.replaceAll("_", " ").toUpperCase()}</b><small>{event.actorUserId} / {new Date(event.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Tokyo" })}</small><p>{event.detail}</p></article>
        ))}
      </section>
    </section>
  );
}
