"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "../../i18n/context";
import { accountUpdatedNotice, oneTimeCodeLabel } from "../../i18n/messages";
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
  const { locale, dictionary } = useTranslations();
  const access = dictionary.admin.access;
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
      if (!response.ok) throw new Error(body.error ?? access.accountsLoadFailed);
      setData(body);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : access.accountsLoadFailed;
      setError(message);
      onNotice(access.accessError, message);
    } finally {
      setLoading(false);
    }
  }, [onNotice, access.accountsLoadFailed, access.accessError]);

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
        throw new Error(body.error ?? access.accountCommandFailed);
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
      const label = access.actionLabels[action];
      onNotice(label, accountUpdatedNotice(locale, artist.name));
      await load();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : access.accountCommandFailed;
      setError(message);
      onNotice(access.accessCommandBlocked, message);
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <section className="ops-access">
      <div className="ops-panel-heading">
        <span>{access.eyebrow}</span>
        <h2>{access.title}</h2>
        <em>
          {data.accounts.filter((account) => account.status === "active").length}{" "}
          {access.activeAccountsSuffix}
        </em>
      </div>

      <div className="ops-access-principles">
        <article><b>{access.castScopeTitle}</b><p>{access.castScopeBody}</p></article>
        <article><b>{access.adminScopeTitle}</b><p>{access.adminScopeBody}</p></article>
        <article><b>{access.sessionControlTitle}</b><p>{access.sessionControlBody}</p></article>
      </div>

      {temporaryCode && (
        <div className="ops-temporary-code" role="status">
          <div>
            <span>{oneTimeCodeLabel(locale, temporaryCode.displayName.toUpperCase())}</span>
            <strong>{temporaryCode.value}</strong>
            <p>{access.oneTimeCodeNote}</p>
          </div>
          <button type="button" onClick={() => setTemporaryCode(null)}>{access.savedIt}</button>
        </div>
      )}

      {error && <div className="ops-attendance-error"><b>{access.attentionRequired}</b><p>{error}</p><button type="button" onClick={load}>{access.retryLoad}</button></div>}

      {loading ? <p className="ops-attendance-empty">{access.loadingIdentities}</p> : (
        <div className="ops-account-grid">
          {data.artists.map((artist) => {
            const account = accountBySlug.get(artist.slug);
            const busy = busySlug === artist.slug;
            return (
              <article key={artist.slug} className={account?.status === "disabled" ? "is-disabled" : ""}>
                <div className="ops-account-title"><span>{artist.slug}</span><h3>{artist.name}</h3><em>{account ? account.status.toUpperCase() : access.noAccount}</em></div>
                {account ? (
                  <dl>
                    <div><dt>{access.sessionVersionLabel}</dt><dd>V{account.sessionVersion}</dd></div>
                    <div><dt>{access.lastLoginLabel}</dt><dd>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString("en-GB", { timeZone: "Asia/Tokyo" }) : access.never}</dd></div>
                    <div><dt>{access.accountIdLabel}</dt><dd>{account.id.slice(0, 18)}…</dd></div>
                  </dl>
                ) : <p>{access.noSignInIdentity}</p>}
                <div className="ops-account-actions">
                  {!account && <button type="button" disabled={busy} onClick={() => runAction(artist, "create")}>{busy ? access.creating : access.createAccount}</button>}
                  {account && <button type="button" className="is-secondary" disabled={busy} onClick={() => runAction(artist, "rotate_credential")}>{busy ? access.resetting : access.resetAccessCode}</button>}
                  {account?.status === "active" && <button type="button" className="is-danger" disabled={busy} onClick={() => runAction(artist, "disable")}>{access.disable}</button>}
                  {account?.status === "disabled" && <button type="button" disabled={busy} onClick={() => runAction(artist, "enable")}>{access.enable}</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="ops-account-audit">
        <span>{access.recentEvents}</span>
        {data.events.length === 0 ? <p>{access.noEventsYet}</p> : data.events.slice(0, 12).map((event) => (
          <article key={event.id}><b>{event.action.replaceAll("_", " ").toUpperCase()}</b><small>{event.actorUserId} / {new Date(event.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Tokyo" })}</small><p>{event.detail}</p></article>
        ))}
      </section>
    </section>
  );
}
