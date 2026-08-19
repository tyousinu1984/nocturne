"use client";

import { useCallback, useEffect, useState } from "react";
import { artists } from "../data";
import { AttendancePanel } from "../admin/attendance-panel";
import { useTranslations } from "../../i18n/context";
import { staffSignedInNotice } from "../../i18n/messages";

type StaffAccount = {
  id: string;
  artistSlug: string;
  displayName: string;
  status: "active";
};

export function StaffPortal() {
  const { locale, dictionary } = useTranslations();
  const staff = dictionary.staffPortal;
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [checking, setChecking] = useState(true);
  const [artistSlug, setArtistSlug] = useState(artists[0]?.slug ?? "");
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ label: staff.portalLabel, message: staff.manageNotice });

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/session", { headers: { accept: "application/json" } });
      if (!response.ok) {
        setAccount(null);
        return;
      }
      const body = (await response.json()) as { account: StaffAccount };
      setAccount(body.account);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/staff/session", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ artistSlug, credential }),
      });
      const body = (await response.json()) as { account?: StaffAccount; error?: string };
      if (!response.ok || !body.account) throw new Error(body.error ?? staff.signInFailed);
      setAccount(body.account);
      setCredential("");
      setNotice({ label: staff.signedIn, message: staffSignedInNotice(locale, body.account.displayName) });
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : staff.signInFailed);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/staff/session", { method: "DELETE", headers: { accept: "application/json" } });
    setAccount(null);
    setNotice({ label: staff.signedOutLabel, message: staff.signedOutNotice });
  }

  if (checking) {
    return <main className="staff-shell"><h1 className="sr-only">{staff.myAttendanceHeading}</h1><p className="staff-loading">{staff.checkingSession}</p></main>;
  }

  if (!account) {
    return (
      <main className="staff-shell staff-login-shell">
        <a className="staff-brand" href={`/${locale}`}><strong>NOCTURNE</strong><span>{staff.portalLabel}</span></a>
        <form className="staff-login" onSubmit={signIn}>
          <span>{staff.privateAccessTitle}</span><h1>{staff.myAttendanceHeading}</h1><p>{staff.intro}</p>
          <label><span>{staff.castProfileLabel}</span><select value={artistSlug} onChange={(event) => setArtistSlug(event.target.value)}>{artists.map((artist) => <option key={artist.slug} value={artist.slug}>{artist.name}</option>)}</select></label>
          <label><span>{staff.accessCodeLabel}</span><input type="password" autoComplete="current-password" value={credential} onChange={(event) => setCredential(event.target.value)} /></label>
          {error && <div className="staff-login-error" role="alert">{error}</div>}
          <button type="submit" disabled={busy || credential.trim().length < 12}>{busy ? staff.signingIn : staff.signIn}</button>
          <small>{staff.disableNote}</small>
        </form>
      </main>
    );
  }

  return (
    <main className="staff-shell">
      <header className="staff-topbar"><a className="staff-brand" href={`/${locale}`}><strong>NOCTURNE</strong><span>{staff.portalLabel}</span></a><div><span>{staff.signedIn}</span><b>{account.displayName}</b><button type="button" onClick={signOut}>{staff.signOut}</button></div></header>
      <div className="ops-notice" role="status"><b>{notice.label}</b><span>{notice.message}</span></div>
      <AttendancePanel actorKind="cast" endpoint="/api/staff/attendance" identity={{ displayName: account.displayName, identityLabel: `CAST ACCOUNT / ${account.artistSlug}`, artistSlug: account.artistSlug, artistName: account.displayName }} onNotice={(label, message) => setNotice({ label, message })} onAuthenticationLost={() => setAccount(null)} />
    </main>
  );
}
