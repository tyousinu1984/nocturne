"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "../../i18n/context";
import { AttendancePanel } from "./attendance-panel";
import { CastAccountPanel } from "./cast-account-panel";
import { ModelProfilePanel } from "./model-profile-panel";
import { AnnouncementPanel } from "./announcement-panel";
import { DashboardPanel } from "./dashboard-panel";

type AdminView = "dashboard" | "attendance" | "access" | "models" | "announcements";

export function AdminConsole({
  adminUser,
}: {
  adminUser: {
    displayName: string;
    identityLabel: string;
  };
}) {
  const { locale, dictionary } = useTranslations();
  const admin = dictionary.admin;

  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [notice, setNotice] = useState(admin.consoleWelcomeNotice);
  const [bannerLabel, setBannerLabel] = useState("READY");

  const navItemLabel = (id: AdminView) => admin.nav.find((item) => item.id === id)?.label ?? id;

  const handleNotice = useCallback((label: string, message: string) => {
    setBannerLabel(label);
    setNotice(message);
  }, []);

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <a href={`/${locale}`} className="ops-brand">
          <strong>NOCTURNE</strong>
          <span>OPS</span>
          <small>{admin.brandSub}</small>
        </a>

        <div className="ops-environment">
          <i />
          {admin.environmentBanner}
        </div>

        <nav aria-label="Operations sections">
          {admin.nav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? "is-active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id as AdminView)}
            >
              <span>{item.number}</span>
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>

        <div className="ops-sidebar-note">
          <b>{admin.sidebarNoteTitle}</b>
          <p>{admin.sidebarNoteBody}</p>
        </div>
      </aside>

      <section className="ops-workspace">
        <header className="ops-topbar">
          <div>
            <span>{admin.topbarEyebrow}</span>
            <h1>{navItemLabel(activeView)}</h1>
          </div>
          <div className="ops-role-switcher ops-authenticated-user">
            <span>{admin.authenticatedOperatorLabel}</span>
            <b>{adminUser.displayName}</b>
            <small>
              {adminUser.identityLabel} / {admin.siteAccessCodeSuffix}
            </small>
          </div>
        </header>

        <div className="ops-notice" role="status">
          <b>{bannerLabel}</b>
          <span>{notice}</span>
        </div>

        {activeView === "dashboard" && <DashboardPanel />}

        {activeView === "attendance" && (
          <AttendancePanel
            actorKind="admin"
            endpoint="/api/admin/attendance"
            identity={{
              displayName: adminUser.displayName,
              identityLabel: `${adminUser.identityLabel} / REVERSE PROXY`,
            }}
            onNotice={handleNotice}
          />
        )}

        {activeView === "access" && <CastAccountPanel onNotice={handleNotice} />}

        {activeView === "models" && <ModelProfilePanel onNotice={handleNotice} />}

        {activeView === "announcements" && <AnnouncementPanel onNotice={handleNotice} />}
      </section>
    </main>
  );
}
