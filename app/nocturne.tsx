/* eslint-disable @next/next/no-img-element */
"use client";

import {
  type AnchorHTMLAttributes,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Artist } from "./data";
import { useTranslations } from "../i18n/context";
import { castProfileHref, localeHref } from "../i18n/locale-path";
import { localizeArtist } from "../i18n/localize-artist";
import { SUPPORTED_LOCALES, localeLabel, type Locale } from "../i18n/locales";
import {
  cardPortraitAlt,
  currentIndexTitle,
  notesFromTitle,
  profilePortraitAlt,
  scheduleDateLabel,
  showProfilePhotoAria,
} from "../i18n/messages";

type StaticLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

function Link({ href, children, ...props }: StaticLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

// Static (untranslated) href list — labels come from dictionary.nav at
// render time via LocalizedLink below.
const navHrefs = [
  ["home", "/"],
  ["cast", "/cast/list.html"],
  ["schedule", "/schedule.html"],
  ["system", "/system.html"],
  ["blog", "/blog.html"],
  ["faq", "/faq.html"],
  ["contact", "/contact.html"],
  ["recruit", "/recruit.html"],
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-lines ${open ? "is-open" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

const previewPhotoSets: Record<string, string[]> = {
  aika: [
    "/photos-preview/aika-01.jpg",
    "/photos-preview/aika-02.jpg",
    "/photos-preview/aika-03.jpg",
  ],
  ren: [
    "/photos-preview/ren-01.jpg",
    "/photos-preview/ren-02.jpg",
    "/photos-preview/ren-03.jpg",
  ],
  mio: ["/photos-preview/mio-01.jpg"],
  sora: ["/photos-preview/sora-01.jpg", "/photos-preview/sora-02.jpg"],
  yuna: [
    "/photos-preview/yuna-01.jpg",
    "/photos-preview/yuna-02.jpg",
    "/photos-preview/yuna-03.jpg",
    "/photos-preview/yuna-04.jpg",
    "/photos-preview/yuna-05.jpg",
  ],
  kei: [
    "/photos-preview/kei-01.jpg",
    "/photos-preview/kei-02.jpg",
    "/photos-preview/kei-03.jpg",
  ],
  nami: [
    "/photos-preview/nami-01.jpg",
    "/photos-preview/nami-02.jpg",
    "/photos-preview/nami-03.jpg",
    "/photos-preview/nami-04.jpg",
  ],
};

function artistPhotos(slug: string) {
  return previewPhotoSets[slug] ?? [`/portraits/${slug}.jpg`];
}

function portraitPath(slug: string) {
  return artistPhotos(slug)[0];
}

function artistPhotoPath(slug: string, index: number) {
  const photos = artistPhotos(slug);
  return photos[index % photos.length];
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { locale, dictionary } = useTranslations();
  return (
    <Link className={`brand-lockup ${compact ? "is-compact" : ""}`} href={localeHref(locale, "/")}>
      <strong>NOCTURNE</strong>
      <span>TOKYO</span>
      <small>{dictionary.brand.sub}</small>
    </Link>
  );
}

function LanguageSwitcher() {
  const { locale } = useTranslations();
  const pathname = usePathname() ?? `/${locale}`;

  function hrefForLocale(target: Locale) {
    const segments = pathname.split("/");
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }

  return (
    <span className="language-select">
      {SUPPORTED_LOCALES.map((code, index) => (
        <span key={code}>
          {index > 0 && <i aria-hidden="true"> / </i>}
          <a
            href={hrefForLocale(code)}
            aria-current={code === locale ? "true" : undefined}
            className={code === locale ? "is-active" : undefined}
          >
            {localeLabel[code]}
          </a>
        </span>
      ))}
    </span>
  );
}

function Header() {
  const { locale, dictionary } = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuWasOpen = useRef(false);

  useEffect(() => {
    const menu = menuRef.current;
    const underlay = Array.from(
      document.querySelectorAll<HTMLElement>("[data-menu-underlay]"),
    );

    if (!menuOpen) {
      if (menuWasOpen.current) {
        menuButtonRef.current?.focus();
      }
      menuWasOpen.current = false;
      return;
    }

    menuWasOpen.current = true;
    underlay.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusableSelector =
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const focusables = menu
      ? Array.from(menu.querySelectorAll<HTMLElement>(focusableSelector))
      : [];

    focusables[0]?.focus();

    function handleMenuKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !menu?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !menu?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    menu?.addEventListener("keydown", handleMenuKeydown);

    return () => {
      menu?.removeEventListener("keydown", handleMenuKeydown);
      underlay.forEach((element) => {
        element.inert = false;
        element.removeAttribute("aria-hidden");
      });
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="header-top" data-menu-underlay>
        <div className="site-width header-top-inner">
          <Brand />
          <div className="header-tools">
            <span className="open-status">
              <i />
              {dictionary.header.openToday}
            </span>
            <LanguageSwitcher />
            <button
              type="button"
              className="menu-button"
              ref={menuButtonRef}
              aria-label={menuOpen ? dictionary.header.closeMenu : dictionary.header.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </div>

      <nav
        className="main-navigation"
        aria-label={dictionary.header.primaryNavAria}
        data-menu-underlay
      >
        <div className="site-width main-navigation-inner">
          {navHrefs.map(([key, href]) => (
            <Link key={key} href={localeHref(locale, href)}>
              {dictionary.nav[key]}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        aria-label={dictionary.header.mobileNavAria}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-head">
          <Brand compact />
          <button
            type="button"
            aria-label={dictionary.header.closeMenu}
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        {navHrefs.map(([key, href], index) => (
          <Link href={localeHref(locale, href)} key={key} onClick={() => setMenuOpen(false)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{dictionary.nav[key]}</b>
            <ArrowIcon />
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Hero() {
  const { locale, dictionary } = useTranslations();
  const heroArtists = ["ren", "mio", "sora", "yuna"];

  return (
    <section className="home-hero">
      <div
        className="hero-lineup hero-photo-grid"
        role="img"
        aria-label={dictionary.hero.ariaLabel}
      >
        {heroArtists.map((slug) => (
          <img src={portraitPath(slug)} alt="" key={slug} />
        ))}
      </div>
      <span className="hero-darken" />
      <div className="site-width hero-content">
        <p className="hero-kicker">{dictionary.hero.kicker}</p>
        <h1>
          {dictionary.hero.headlineLine1}
          <br />
          <em>{dictionary.hero.headlineLine2}</em>
        </h1>
        <p className="hero-description">{dictionary.hero.description}</p>
        <a href={localeHref(locale, "/cast/list.html")} className="hero-button">
          {dictionary.hero.viewAllCast}
          <ArrowIcon />
        </a>
      </div>
      <div className="hero-badge">
        <span>{dictionary.hero.badgeYear}</span>
        <b>{dictionary.hero.badgeNew}</b>
        <small>{dictionary.hero.badgeLineup}</small>
      </div>
    </section>
  );
}

// Homepage-only from here down: the promotions/news list and today's
// availability preview that replaced the old single NoticeBanner + the
// SystemGuide/Journal sections (moved to their own pages — /system.html,
// /blog.html). Reviews was a third such section but has been removed
// entirely (it was placeholder review copy, not real content).

export type HomeNewsItem = { id: string; date: string; title: string; body: string };

// `news` comes from app/[locale]/page.tsx's listAnnouncements() call
// (app/admin/announcement-store.ts) — admin-editable, no longer static
// dictionary content.
function HomeNews({ news }: { news: HomeNewsItem[] }) {
  const { dictionary } = useTranslations();
  return (
    <section className="home-news">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.homeNews.eyebrow}
          title={dictionary.homeNews.title}
          note={dictionary.homeNews.note}
        />
        <div className="home-news-grid">
          {news.map((item) => (
            <article key={item.id}>
              <span>{item.date}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export type TodayAvailabilityEntry = {
  artist: Artist;
  startTime: string;
  endTime: string;
};

// Fed by app/[locale]/page.tsx (a Server Component), which queries
// today's published attendance the same way app/[locale]/schedule/page.tsx
// queries the whole week — see listPublicAttendance in
// app/admin/attendance-store.ts.
function TodayAvailability({ entries }: { entries: TodayAvailabilityEntry[] }) {
  const { locale, dictionary } = useTranslations();
  return (
    <section className="today-availability">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.todayAvailability.eyebrow}
          title={dictionary.todayAvailability.title}
          note={dictionary.todayAvailability.note}
        />
        {entries.length > 0 ? (
          <div className="today-availability-list">
            {entries.map(({ artist, startTime, endTime }) => {
              const localized = localizeArtist(artist, dictionary);
              return (
                <Link
                  className="today-availability-card"
                  href={castProfileHref(locale, artist.id)}
                  key={artist.slug}
                >
                  <img src={portraitPath(artist.slug)} alt="" />
                  <div>
                    <b>{artist.name}</b>
                    <span>{localized.localizedRole}</span>
                    <em>
                      {startTime}–{endTime}
                    </em>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="today-availability-empty">{dictionary.todayAvailability.none}</p>
        )}
        <a className="today-availability-cta" href={localeHref(locale, "/schedule.html")}>
          {dictionary.todayAvailability.viewFullSchedule}
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  note,
  light = false,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  light?: boolean;
}) {
  return (
    <div className={`section-title ${light ? "is-light" : ""}`}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}

function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const { locale, dictionary } = useTranslations();
  const localized = localizeArtist(artist, dictionary);
  const locationClass = artist.district.toLowerCase();
  const profileHref = castProfileHref(locale, artist.id);
  return (
    <article className="cast-card">
      <Link className="cast-photo" href={profileHref}>
        <img src={portraitPath(artist.slug)} alt={cardPortraitAlt(locale, artist.name)} />
        <span className="language-chip">{localized.localizedLanguages.join(" / ")}</span>
        <span className="cast-id">N° {String(index + 1).padStart(2, "0")}</span>
        <span className={`cast-location is-${locationClass}`}>{localized.localizedDistrict}</span>
      </Link>
      <div className="cast-bars">
        <span className={`rank-tag is-${artist.tier.toLowerCase()}`}>{localized.localizedTier}</span>
        <span className="status-tag">
          <i />
          {localized.localizedStatus}
        </span>
      </div>
      <div className="cast-info">
        <h3>
          <Link href={profileHref}>{artist.name}</Link>
        </h3>
        <p className="cast-role">{localized.localizedRole}</p>
        <p className="cast-comment">{localized.localizedShortNote}</p>
        <div className="cast-skills">
          {localized.localizedDisciplines.slice(0, 3).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <Link className="profile-link" href={profileHref}>
          {dictionary.card.openProfile}
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

function Directory({ artists }: { artists: Artist[] }) {
  const { dictionary } = useTranslations();
  const [district, setDistrict] = useState<"All" | "Aoyama" | "Ginza" | "Daikanyama">("All");
  const [status, setStatus] = useState<"All" | "Tonight" | "This week" | "Private">("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return artists.filter((artist) => {
      const districtMatch = district === "All" || artist.district === district;
      const statusMatch = status === "All" || artist.status === status;
      const text = [artist.name, artist.role, artist.district, ...artist.disciplines]
        .join(" ")
        .toLowerCase();
      return districtMatch && statusMatch && (!needle || text.includes(needle));
    });
  }, [artists, district, query, status]);

  function resetCount() {
    setVisibleCount(8);
  }

  const districtValues = ["All", "Aoyama", "Ginza", "Daikanyama"] as const;
  const statusValues = ["All", "Tonight", "This week", "Private"] as const;

  return (
    <section className="directory" id="directory">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.sections.directory.eyebrow}
          title={dictionary.sections.directory.title}
          note={dictionary.sections.directory.note}
        />

        <div className="directory-toolbar" id="districts">
          <label className="directory-search">
            <SearchIcon />
            <span className="sr-only">{dictionary.directory.searchSrLabel}</span>
            <input
              value={query}
              placeholder={dictionary.directory.searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
                resetCount();
              }}
            />
          </label>
          <div className="filter-row" aria-label={dictionary.directory.districtFilterAria}>
            <b>{dictionary.directory.areaLabel}</b>
            {districtValues.map((value) => (
              <button
                type="button"
                className={district === value ? "is-active" : ""}
                aria-pressed={district === value}
                onClick={() => {
                  setDistrict(value);
                  resetCount();
                }}
                key={value}
              >
                {dictionary.filters.districts[value]}
              </button>
            ))}
          </div>
          <div className="filter-row" aria-label={dictionary.directory.statusFilterAria}>
            <b>{dictionary.directory.statusLabel}</b>
            {statusValues.map((value) => (
              <button
                type="button"
                className={status === value ? "is-active" : ""}
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  resetCount();
                }}
                key={value}
              >
                {dictionary.filters.statuses[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="directory-result" role="status">
          <b>
            {String(filtered.length).padStart(2, "0")} {dictionary.directory.profilesSuffix}
          </b>
          <span>{dictionary.directory.lastUpdate}</span>
        </div>

        {filtered.length > 0 ? (
          <div className="cast-grid">
            {filtered.slice(0, visibleCount).map((artist) => (
              <ArtistCard
                artist={artist}
                index={artists.indexOf(artist)}
                key={artist.slug}
              />
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <b>{dictionary.directory.noProfileFound}</b>
            <button
              type="button"
              onClick={() => {
                setDistrict("All");
                setStatus("All");
                setQuery("");
              }}
            >
              {dictionary.directory.resetFilters}
            </button>
          </div>
        )}

        {visibleCount < filtered.length && (
          <button
            type="button"
            className="more-cast"
            onClick={() => setVisibleCount((current) => current + 4)}
          >
            {dictionary.directory.showMoreCast}
            <ArrowIcon />
          </button>
        )}
      </div>
    </section>
  );
}

function SystemGuide() {
  const { dictionary } = useTranslations();
  return (
    <section className="system-guide" id="system">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.sections.systemGuide.eyebrow}
          title={dictionary.sections.systemGuide.title}
          note={dictionary.sections.systemGuide.note}
        />
        <div className="guide-grid">
          {dictionary.systemGuideSteps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Static (untranslated) journal metadata — which artist and how many days
// ago each story runs — paired with dictionary.journalStories by index for
// the translated category/date/title.
const journalArtistIndexes = [7, 9] as const;

function Journal({ artists }: { artists: Artist[] }) {
  const { locale, dictionary } = useTranslations();
  return (
    <section className="journal-section" id="journal">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.sections.journal.eyebrow}
          title={dictionary.sections.journal.title}
          note={dictionary.sections.journal.note}
          light
        />
        <div className="journal-cards">
          {dictionary.journalStories.map((story, index) => {
            const artist = artists[journalArtistIndexes[index]];
            return (
              <article key={story.title}>
                <img src={portraitPath(artist.slug)} alt="" />
                <div>
                  <span>{story.category}</span>
                  <time>{story.date}</time>
                  <h3>{story.title}</h3>
                  <Link href={castProfileHref(locale, artist.id)}>
                    {dictionary.card.readProfile}
                    <ArrowIcon />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { locale, dictionary } = useTranslations();
  return (
    <footer className="footer" id="contact" data-menu-underlay>
      <div className="site-width footer-main">
        <Brand />
        <div className="footer-links">
          <div>
            <b>{dictionary.footer.groupDirectory}</b>
            <Link href={localeHref(locale, "/cast/list.html")}>{dictionary.footer.linkAllCast}</Link>
          </div>
          <div id="faq">
            <b>{dictionary.footer.groupGuide}</b>
            <Link href={localeHref(locale, "/system.html")}>{dictionary.footer.linkFirstGuide}</Link>
            <Link href={localeHref(locale, "/blog.html")}>{dictionary.footer.linkBlog}</Link>
          </div>
          <div>
            <b>{dictionary.footer.groupInformation}</b>
            {dictionary.footer.infoLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="site-width footer-bottom">
        <span>{dictionary.footer.copyright}</span>
        <span>{dictionary.footer.disclaimer}</span>
      </div>
    </footer>
  );
}

export function HomeExperience({
  todayAvailability,
  news,
}: {
  todayAvailability: TodayAvailabilityEntry[];
  news: HomeNewsItem[];
}) {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <Hero />
          <HomeNews news={news} />
          <TodayAvailability entries={todayAvailability} />
        </main>
        <Footer />
      </div>
    </>
  );
}

// Used by app/[locale]/cast/page.tsx (public URL: /cast/list.html — see
// next.config.ts's rewrites). Directory used to be an anchor-scrolled
// section embedded in the homepage; it's now a real standalone page.
export function CastListExperience({ artists }: { artists: Artist[] }) {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <Directory artists={artists} />
        </main>
        <Footer />
      </div>
    </>
  );
}

// The next two are mechanical extractions of sections that used to be
// anchor-scrolled parts of the homepage (SystemGuide/Journal) into their
// own standalone pages, same pattern as CastListExperience above. Public
// URLs: /system.html, /blog.html (see next.config.ts's rewrites). Reviews
// used to be a third such page but has been removed entirely.

export function SystemGuideExperience() {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <SystemGuide />
        </main>
        <Footer />
      </div>
    </>
  );
}

export function BlogExperience({ artists }: { artists: Artist[] }) {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <Journal artists={artists} />
        </main>
        <Footer />
      </div>
    </>
  );
}

// Public URL: /faq.html. Native <details>/<summary> — keyboard-accessible
// and expand/collapse without any client state of our own.
function FaqList() {
  const { dictionary } = useTranslations();
  return (
    <section className="faq-page">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.faqPage.eyebrow}
          title={dictionary.faqPage.title}
          note={dictionary.faqPage.note}
        />
        <div className="faq-list">
          {dictionary.faqPage.items.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqExperience() {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <FaqList />
        </main>
        <Footer />
      </div>
    </>
  );
}

// Public URL: /contact.html. Real submit-and-follow-up inquiry form (see
// app/api/public/inquiries/route.ts and app/admin/inquiry-store.ts) — not
// a live booking calendar. Staff review and follow up from the admin
// console; this form only ever creates a "new" inquiry row.
function InquiryForm() {
  const { dictionary } = useTranslations();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const headcountRaw = Number.parseInt(String(data.get("headcount") ?? ""), 10);

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: data.get("companyName"),
          contactName: data.get("contactName"),
          email: data.get("email"),
          phone: data.get("phone"),
          eventName: data.get("eventName"),
          eventDate: data.get("eventDate"),
          eventLocation: data.get("eventLocation"),
          headcount: Number.isInteger(headcountRaw) ? headcountRaw : 0,
          message: data.get("message"),
        }),
      });

      if (response.status === 201) {
        setStatus("success");
        form.reset();
        return;
      }

      const body = (await response.json().catch(() => null)) as { code?: string } | null;
      setStatus("error");
      setErrorMessage(
        body?.code === "invalid_input" ? dictionary.contactPage.errorInvalid : dictionary.contactPage.errorGeneric,
      );
    } catch {
      setStatus("error");
      setErrorMessage(dictionary.contactPage.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success" role="status">
        <h2>{dictionary.contactPage.successTitle}</h2>
        <p>{dictionary.contactPage.successBody}</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        <span>{dictionary.contactPage.companyLabel}</span>
        <input name="companyName" required />
      </label>
      <label>
        <span>{dictionary.contactPage.contactNameLabel}</span>
        <input name="contactName" required />
      </label>
      <label>
        <span>{dictionary.contactPage.emailLabel}</span>
        <input name="email" type="email" required />
      </label>
      <label>
        <span>{dictionary.contactPage.phoneLabel}</span>
        <input name="phone" type="tel" />
      </label>
      <label>
        <span>{dictionary.contactPage.eventNameLabel}</span>
        <input name="eventName" required />
      </label>
      <label>
        <span>{dictionary.contactPage.eventDateLabel}</span>
        <input name="eventDate" type="date" required />
      </label>
      <label>
        <span>{dictionary.contactPage.eventLocationLabel}</span>
        <input name="eventLocation" required />
      </label>
      <label>
        <span>{dictionary.contactPage.headcountLabel}</span>
        <input name="headcount" type="number" min={1} defaultValue={1} required />
      </label>
      <label className="contact-form-message">
        <span>{dictionary.contactPage.messageLabel}</span>
        <textarea name="message" rows={4} placeholder={dictionary.contactPage.messagePlaceholder} />
      </label>
      {status === "error" ? (
        <p className="contact-form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? dictionary.contactPage.submitting : dictionary.contactPage.submit}
      </button>
    </form>
  );
}

function ContactPage() {
  const { dictionary } = useTranslations();
  return (
    <section className="contact-page">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.contactPage.eyebrow}
          title={dictionary.contactPage.title}
          note={dictionary.contactPage.note}
        />
        <InquiryForm />
      </div>
    </section>
  );
}

export function ContactExperience() {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <ContactPage />
        </main>
        <Footer />
      </div>
    </>
  );
}

// Public URL: /recruit.html. Real submit-and-follow-up model application
// form (see app/api/public/applications/route.ts and
// app/admin/application-store.ts) — same pattern as the /contact.html
// inquiry form, just a different table/form/audience (applicants, not
// corporate clients).
function ApplicationForm() {
  const { dictionary } = useTranslations();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/public/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          portfolioUrl: data.get("portfolioUrl"),
          experience: data.get("experience"),
          message: data.get("message"),
        }),
      });

      if (response.status === 201) {
        setStatus("success");
        form.reset();
        return;
      }

      const body = (await response.json().catch(() => null)) as { code?: string } | null;
      setStatus("error");
      setErrorMessage(
        body?.code === "invalid_input"
          ? dictionary.recruitPage.errorInvalid
          : dictionary.recruitPage.errorGeneric,
      );
    } catch {
      setStatus("error");
      setErrorMessage(dictionary.recruitPage.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success" role="status">
        <h2>{dictionary.recruitPage.successTitle}</h2>
        <p>{dictionary.recruitPage.successBody}</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        <span>{dictionary.recruitPage.nameLabel}</span>
        <input name="name" required />
      </label>
      <label>
        <span>{dictionary.recruitPage.emailLabel}</span>
        <input name="email" type="email" required />
      </label>
      <label>
        <span>{dictionary.recruitPage.phoneLabel}</span>
        <input name="phone" type="tel" />
      </label>
      <label>
        <span>{dictionary.recruitPage.portfolioLabel}</span>
        <input name="portfolioUrl" type="url" />
      </label>
      <label className="contact-form-message">
        <span>{dictionary.recruitPage.experienceLabel}</span>
        <textarea name="experience" rows={3} />
      </label>
      <label className="contact-form-message">
        <span>{dictionary.recruitPage.messageLabel}</span>
        <textarea name="message" rows={4} placeholder={dictionary.recruitPage.messagePlaceholder} />
      </label>
      {status === "error" ? (
        <p className="contact-form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? dictionary.recruitPage.submitting : dictionary.recruitPage.submit}
      </button>
    </form>
  );
}

function RecruitPage() {
  const { dictionary } = useTranslations();
  return (
    <section className="contact-page">
      <div className="site-width">
        <SectionTitle
          eyebrow={dictionary.recruitPage.eyebrow}
          title={dictionary.recruitPage.title}
          note={dictionary.recruitPage.note}
        />
        <div className="recruit-requirements">
          <h3>{dictionary.recruitPage.requirementsTitle}</h3>
          <ul>
            {dictionary.recruitPage.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <h3 className="recruit-form-title">{dictionary.recruitPage.formTitle}</h3>
        <ApplicationForm />
      </div>
    </section>
  );
}

export function RecruitExperience() {
  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <RecruitPage />
        </main>
        <Footer />
      </div>
    </>
  );
}

export type ScheduleDayEntry = {
  artist: Artist;
  startTime: string;
  endTime: string;
};

export type ScheduleDay = {
  date: string;
  dayKey: "THU" | "FRI" | "SAT" | "SUN" | "MON" | "TUE" | "WED";
  entries: ScheduleDayEntry[];
};

// Used by app/[locale]/schedule/page.tsx (public URL: /schedule.html — see
// next.config.ts's rewrites). The Server Component page fetches published
// attendance per artist (app/admin/attendance-store.ts's
// listPublicAttendance — the same function the public per-profile schedule
// already uses), groups it by calendar date for the current Mon–Sun week,
// and passes that down here rather than this Client Component fetching or
// re-grouping it itself. `initialDayIndex` lets the page open on today
// instead of always defaulting to Monday.
export function ScheduleExperience({
  week,
  initialDayIndex = 0,
}: {
  week: ScheduleDay[];
  initialDayIndex?: number;
}) {
  const { locale, dictionary } = useTranslations();
  const [activeIndex, setActiveIndex] = useState(initialDayIndex);
  const activeDay = week[activeIndex] ?? week[0];

  return (
    <>
      <div>
        <Header />
        <main data-menu-underlay>
          <section className="schedule-page">
            <div className="site-width">
              <SectionTitle
                eyebrow={dictionary.schedulePage.eyebrow}
                title={dictionary.schedulePage.title}
                note={dictionary.schedulePage.note}
              />
              <div className="schedule-tabs" role="tablist">
                {week.map((day, index) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? "is-active" : ""}
                    onClick={() => setActiveIndex(index)}
                    key={day.date}
                  >
                    {scheduleDateLabel(locale, day.date, dictionary.weekdayAbbrev[day.dayKey])}
                    {day.entries.length > 0 ? (
                      <span className="schedule-tab-count">{day.entries.length}</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="schedule-day-panel" role="tabpanel">
                {activeDay.entries.length > 0 ? (
                  <ul className="schedule-day-entries">
                    {activeDay.entries.map(({ artist, startTime, endTime }) => {
                      const localized = localizeArtist(artist, dictionary);
                      return (
                        <li key={artist.slug}>
                          <Link href={castProfileHref(locale, artist.id)}>
                            <img src={portraitPath(artist.slug)} alt="" />
                            <div>
                              <b>{artist.name}</b>
                              <span>{localized.localizedRole}</span>
                            </div>
                            <em>
                              {startTime}–{endTime}
                            </em>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="schedule-day-empty">{dictionary.schedulePage.noneScheduled}</p>
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

function ProfilePhotoGallery({ artist }: { artist: Artist }) {
  const { locale, dictionary } = useTranslations();
  const [active, setActive] = useState(0);
  const photos = artistPhotos(artist.slug);
  const thumbnailPhotos =
    photos.length === 1 ? [photos[0], photos[0], photos[0], photos[0]] : photos;

  return (
    <div className="profile-photo-gallery">
      <div className="profile-main-photo">
        <img
          src={thumbnailPhotos[active]}
          alt={profilePortraitAlt(locale, artist.name, active + 1)}
        />
        <span className="profile-photo-label">
          {dictionary.profile.photoLabelPrefix}
          {active + 1}
        </span>
      </div>
      <div className="profile-thumbnails">
        {thumbnailPhotos.map((photo, index) => (
          <button
            type="button"
            key={`${photo}-${index}`}
            className={active === index ? "is-active" : ""}
            onClick={() => setActive(index)}
            aria-label={showProfilePhotoAria(locale, index + 1)}
            aria-pressed={active === index}
          >
            <span>
              <img src={photo} alt="" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileSchedule({ artist }: { artist: Artist }) {
  const { locale, dictionary } = useTranslations();
  const localized = localizeArtist(artist, dictionary);
  type PublicAttendanceEntry = {
    id: string;
    artistSlug: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
  };
  type ScheduleState =
    | { kind: "loading"; artistSlug: string }
    | { kind: "unavailable"; artistSlug: string }
    | {
        kind: "ready";
        artistSlug: string;
        managed: boolean;
        entries: PublicAttendanceEntry[];
      };

  const [scheduleState, setScheduleState] = useState<ScheduleState>({
    kind: "loading",
    artistSlug: artist.slug,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadPublishedAttendance() {
      try {
        const response = await fetch(
          `/api/public/attendance?artist=${encodeURIComponent(artist.slug)}`,
          {
            cache: "no-store",
            headers: { accept: "application/json" },
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as {
          availability?: "ready" | "unavailable";
          managed?: boolean;
          entries?: PublicAttendanceEntry[];
        };
        if (
          !response.ok ||
          payload.availability !== "ready" ||
          typeof payload.managed !== "boolean" ||
          !Array.isArray(payload.entries)
        ) {
          setScheduleState({ kind: "unavailable", artistSlug: artist.slug });
          return;
        }
        setScheduleState({
          kind: "ready",
          artistSlug: artist.slug,
          managed: payload.managed,
          entries: payload.entries,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setScheduleState({ kind: "unavailable", artistSlug: artist.slug });
      }
    }

    void loadPublishedAttendance();
    return () => controller.abort();
  }, [artist.slug]);

  if (
    scheduleState.kind === "loading" ||
    scheduleState.artistSlug !== artist.slug
  ) {
    return (
      <div className="profile-schedule-empty" role="status" aria-live="polite">
        <b>{dictionary.scheduleState.checkingTitle}</b>
        <span>{dictionary.scheduleState.checkingBody}</span>
      </div>
    );
  }

  if (scheduleState.kind === "unavailable") {
    return (
      <div className="profile-schedule-empty is-unavailable" role="status">
        <b>{dictionary.scheduleState.unavailableTitle}</b>
        <span>{dictionary.scheduleState.unavailableBody}</span>
      </div>
    );
  }

  if (scheduleState.managed && scheduleState.entries.length === 0) {
    return (
      <div className="profile-schedule-empty" role="status">
        <b>{dictionary.scheduleState.noShiftsTitle}</b>
        <span>{dictionary.scheduleState.noShiftsBody}</span>
      </div>
    );
  }

  const intlLocale = locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-CN" : "en-US";

  if (scheduleState.managed) {
    return (
      <div className="profile-schedule is-managed">
        {scheduleState.entries.map((item) => {
          const date = new Date(`${item.serviceDate}T00:00:00+09:00`);
          return (
            <div key={item.id}>
              <span>
                {new Intl.DateTimeFormat(intlLocale, {
                  weekday: "short",
                  timeZone: "Asia/Tokyo",
                })
                  .format(date)
                  .toUpperCase()}
              </span>
              <b>{item.serviceDate.slice(-2)}</b>
              <small>
                {item.startTime}–{item.endTime}
              </small>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="profile-schedule">
      {localized.localizedSchedule.map((item, index) => (
        <div key={`${item.day}-${index}`}>
          <span>{item.day}</span>
          <b>{item.date}</b>
          <small>{item.state}</small>
        </div>
      ))}
    </div>
  );
}

export function ProfileExperience({ artist, artists }: { artist: Artist; artists: Artist[] }) {
  const { locale, dictionary } = useTranslations();
  const localized = localizeArtist(artist, dictionary);
  const related = artists.filter((candidate) => candidate.slug !== artist.slug).slice(0, 4);

  return (
    <>
      <div>
        <Header />
        <main className="profile-page" data-menu-underlay>
          <div className="profile-path">
            <div className="site-width">
              <Link href={localeHref(locale, "/")}>{dictionary.profile.breadcrumbHome}</Link>
              <span>/</span>
              <Link href={localeHref(locale, "/cast/list.html")}>{dictionary.profile.breadcrumbCast}</Link>
              <span>/</span>
              <b>{artist.name.toUpperCase()}</b>
            </div>
          </div>

          <section className="profile-intro-section">
            <div className="site-width profile-card-shell">
              <ProfilePhotoGallery artist={artist} />
              <div className="profile-details">
                <div className="profile-heading">
                  <span>
                    N°{" "}
                    {String(
                      artists.findIndex((candidate) => candidate.slug === artist.slug) + 1,
                    ).padStart(2, "0")}
                  </span>
                  <em>{localized.localizedStatus}</em>
                  <h1>{artist.name}</h1>
                  <p>{localized.localizedRole}</p>
                </div>
                <div className="profile-message">
                  <b>{dictionary.profile.castMessage}</b>
                  <p>{localized.localizedBiography}</p>
                </div>
                <div className="profile-stat-grid">
                  {localized.localizedStats.map((stat) => (
                    <div key={stat.label}>
                      <span>{stat.label}</span>
                      <b>{stat.value}</b>
                    </div>
                  ))}
                </div>
                <div className="profile-meta-list">
                  <div>
                    <span>{dictionary.profile.areaLabel}</span>
                    <b>{localized.localizedDistrict}</b>
                  </div>
                  <div>
                    <span>{dictionary.profile.languageLabel}</span>
                    <b>{localized.localizedLanguages.join(" / ")}</b>
                  </div>
                  <div>
                    <span>{dictionary.profile.styleLabel}</span>
                    <b>{localized.localizedDisciplines.join(" / ")}</b>
                  </div>
                </div>
                <Link className="profile-back-button" href={localeHref(locale, "/cast/list.html")}>
                  {dictionary.profile.returnToDirectory}
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </section>

          <section className="profile-schedule-section">
            <div className="site-width">
              <SectionTitle
                eyebrow={dictionary.sections.profileSchedule.eyebrow}
                title={currentIndexTitle(locale, artist.name)}
                note={dictionary.sections.profileSchedule.note}
                light
              />
              <ProfileSchedule artist={artist} />
            </div>
          </section>

          <section className="profile-content">
            <div className="site-width">
              <section className="profile-gallery-section">
                <div className="profile-block-heading">
                  <span>{dictionary.profile.galleryEyebrow}</span>
                  <h2>{dictionary.profile.galleryTitle}</h2>
                </div>
                <div className="profile-gallery-grid">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div key={index}>
                      <img src={artistPhotoPath(artist.slug, index)} alt="" />
                      <span>
                        {dictionary.profile.updateLabelPrefix}
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="profile-blog-section">
                <div className="profile-block-heading">
                  <span>{dictionary.profile.blogEyebrow}</span>
                  <h2>{notesFromTitle(locale, artist.name)}</h2>
                </div>
                <div className="profile-blog-grid">
                  {[0, 1].map((index) => (
                    <article key={index}>
                      <img
                        src={artistPhotoPath(artist.slug, index + 1)}
                        alt=""
                      />
                      <div>
                        <time>2026.08.0{6 - index}</time>
                        <h3>
                          {index === 0
                            ? dictionary.profile.blogPost1Title
                            : dictionary.profile.blogPost2Title}
                        </h3>
                        <p>{dictionary.profile.blogBody}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section className="related-section">
            <div className="site-width">
              <SectionTitle
                eyebrow={dictionary.sections.related.eyebrow}
                title={dictionary.sections.related.title}
                light
              />
              <div className="cast-grid">
                {related.map((candidate) => (
                  <ArtistCard
                    artist={candidate}
                    index={artists.indexOf(candidate)}
                    key={candidate.slug}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
