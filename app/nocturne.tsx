/* eslint-disable @next/next/no-img-element */
"use client";

import {
  type AnchorHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { artists, type Artist } from "./data";

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

const navItems = [
  ["HOME", "/"],
  ["CAST", "/#directory"],
  ["SCHEDULE", "/#schedule"],
  ["RANKING", "/#ranking"],
  ["SYSTEM", "/#system"],
  ["ACCESS", "/#access"],
  ["REVIEWS", "/#reviews"],
  ["BLOG", "/#journal"],
  ["FAQ", "/#faq"],
  ["CONTACT", "/#contact"],
];

const quickLinks = [
  { number: "01", title: "FIRST GUIDE", sub: "How to explore", slug: "aika", href: "#system" },
  { number: "02", title: "ALL CAST", sub: "Meet the lineup", slug: "ren", href: "#directory" },
  { number: "03", title: "SCHEDULE", sub: "This week", slug: "mio", href: "#schedule" },
  { number: "04", title: "RANKING", sub: "Most viewed", slug: "sora", href: "#ranking" },
  { number: "05", title: "STUDIO INFO", sub: "Tokyo locations", slug: "yuna", href: "#access" },
];

const reviews = [
  {
    title: "A polished night-time directory",
    body: "The profiles are easy to compare and every status is visible before opening a page.",
    date: "2026.08.05",
  },
  {
    title: "Dense, direct and surprisingly clear",
    body: "The large cast grid feels energetic while the filters keep the browsing experience manageable.",
    date: "2026.08.03",
  },
  {
    title: "The profile pages carry the same rhythm",
    body: "Portraits, schedules, personal notes and reviews all stay in one continuous visual flow.",
    date: "2026.07.30",
  },
  {
    title: "Strong Tokyo directory character",
    body: "Black, white and neon accents make the entire site feel immediate and recognisable.",
    date: "2026.07.28",
  },
  {
    title: "The mobile menu is quick to understand",
    body: "The compact navigation keeps the long directory usable on a small screen.",
    date: "2026.07.24",
  },
  {
    title: "A useful editorial showcase",
    body: "There is plenty to explore without introducing messaging, payment or reservation flows.",
    date: "2026.07.20",
  },
];

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

function portraitPath(slug: string) {
  return `/portraits/${slug}.jpg`;
}

function AgeGate() {
  const [declined, setDeclined] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("nocturne-age-change", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("nocturne-age-change", onStoreChange);
      };
    },
    () => window.localStorage.getItem("nocturne-age-confirmed") === "yes",
    () => false,
  );

  useEffect(() => {
    if (confirmed) return;

    const panel = panelRef.current;
    const siteContent = Array.from(
      document.querySelectorAll<HTMLElement>("[data-site-content]"),
    );
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    siteContent.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      : [];

    focusables[0]?.focus();

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    panel?.addEventListener("keydown", trapFocus);

    return () => {
      panel?.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      siteContent.forEach((element) => {
        element.inert = false;
        element.removeAttribute("aria-hidden");
      });
    };
  }, [confirmed, declined]);

  function accept() {
    window.localStorage.setItem("nocturne-age-confirmed", "yes");
    window.dispatchEvent(new Event("nocturne-age-change"));
  }

  if (confirmed) return null;

  return (
    <div className="gate-overlay">
      <div
        className="gate-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        aria-describedby="gate-copy"
      >
        <p className="gate-overline">TOKYO NIGHT DIRECTORY</p>
        <div className="gate-logo">
          <span>NOCTURNE</span>
          <small>東京・夜のエンターテインメントガイド</small>
        </div>
        <div className="gate-rule" />
        {declined ? (
          <div className="gate-declined" role="status">
            <h2 id="gate-title">ENTRY PAUSED</h2>
            <p id="gate-copy">This directory is intended for visitors aged 21 and over.</p>
            <button type="button" className="gate-text-button" onClick={() => setDeclined(false)}>
              RETURN
            </button>
          </div>
        ) : (
          <>
            <h2 id="gate-title">WELCOME TO NOCTURNE TOKYO</h2>
            <p id="gate-copy">
              This editorial directory contains fictional adult profiles. Please
              confirm that you are 21 years of age or older.
            </p>
            <div className="gate-actions">
              <button type="button" className="gate-enter" onClick={accept}>
                ENTER 21+
                <ArrowIcon />
              </button>
              <button type="button" className="gate-exit" onClick={() => setDeclined(true)}>
                EXIT
              </button>
            </div>
          </>
        )}
        <p className="gate-note">
          All profiles are fictional adults. No booking, payment or contact service is provided.
        </p>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand-lockup ${compact ? "is-compact" : ""}`} href="/">
      <strong>NOCTURNE</strong>
      <span>TOKYO</span>
      <small>NIGHT ENTERTAINMENT DIRECTORY</small>
    </Link>
  );
}

function Header() {
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
              OPEN TODAY
            </span>
            <span className="language-select">EN / JP</span>
            <button
              type="button"
              className="menu-button"
              ref={menuButtonRef}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </div>

      <section className="quick-section" aria-label="Quick guide" data-menu-underlay>
        <div className="site-width quick-grid">
          {quickLinks.map((item) => (
            <a href={item.href} className="quick-card" key={item.number}>
              <img src={portraitPath(item.slug)} alt="" />
              <span className="quick-shade" />
              <b>{item.number}</b>
              <div>
                <strong>{item.title}</strong>
                <small>{item.sub}</small>
              </div>
              <ArrowIcon />
            </a>
          ))}
        </div>
      </section>

      <nav
        className="main-navigation"
        aria-label="Primary navigation"
        data-menu-underlay
      >
        <div className="site-width main-navigation-inner">
          {navItems.map(([label, href]) => (
            <Link key={label} href={href}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-head">
          <Brand compact />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        {navItems.map(([label, href], index) => (
          <Link href={href} key={label} onClick={() => setMenuOpen(false)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{label}</b>
            <ArrowIcon />
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="home-hero">
      <img
        className="hero-lineup"
        src="/portraits/hero-lineup.jpg"
        alt="Four fictional adult performers from the Nocturne directory"
      />
      <span className="hero-darken" />
      <div className="site-width hero-content">
        <p className="hero-kicker">TOKYO / AOYAMA / GINZA / DAIKANYAMA</p>
        <h1>
          TONIGHT&apos;S
          <br />
          <em>CAST FILE</em>
        </h1>
        <p className="hero-description">
          Meet the latest fictional adult performers, creators and hosts featured
          in the Nocturne Tokyo editorial directory.
        </p>
        <a href="#directory" className="hero-button">
          VIEW ALL CAST
          <ArrowIcon />
        </a>
      </div>
      <div className="hero-badge">
        <span>2026</span>
        <b>NEW</b>
        <small>LINEUP</small>
      </div>
    </section>
  );
}

function LiveTicker() {
  const names = [...artists.slice(0, 9), ...artists.slice(0, 9)];
  return (
    <section className="live-ticker" id="schedule">
      <div className="live-label">
        <i />
        NOW ONLINE
      </div>
      <div className="live-window">
        <div className="live-track">
          {names.map((artist, index) => (
            <Link href={`/profile/${artist.slug}`} key={`${artist.slug}-${index}`}>
              <img src={portraitPath(artist.slug)} alt="" />
              <span>
                <b>{artist.name}</b>
                <small>{artist.district}</small>
              </span>
              <em>{artist.status}</em>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoticeBanner() {
  return (
    <section className="notice-wrap">
      <div className="site-width notice-banner">
        <div className="notice-date">
          <b>06</b>
          <span>AUG</span>
        </div>
        <div>
          <p>UPDATED TODAY</p>
          <h2>12 CAST PROFILES ARE NOW LIVE</h2>
          <span>New schedules, photo updates and directory notes have been added.</span>
        </div>
        <a href="#directory">
          CHECK TODAY&apos;S CAST
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
  const locationClass = artist.district.toLowerCase();
  return (
    <article className="cast-card">
      <Link className="cast-photo" href={`/profile/${artist.slug}`}>
        <img src={portraitPath(artist.slug)} alt={`${artist.name}, fictional adult profile`} />
        <span className="language-chip">{artist.languages.join(" / ")}</span>
        <span className="cast-id">N° {String(index + 1).padStart(2, "0")}</span>
        <span className={`cast-location is-${locationClass}`}>{artist.district}</span>
      </Link>
      <div className="cast-bars">
        <span className={`rank-tag is-${artist.tier.toLowerCase()}`}>{artist.tier}</span>
        <span className="status-tag">
          <i />
          {artist.status}
        </span>
      </div>
      <div className="cast-info">
        <h3>
          <Link href={`/profile/${artist.slug}`}>{artist.name}</Link>
        </h3>
        <p className="cast-role">{artist.role}</p>
        <p className="cast-comment">{artist.shortNote}</p>
        <div className="cast-skills">
          {artist.disciplines.slice(0, 3).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <Link className="profile-link" href={`/profile/${artist.slug}`}>
          OPEN PROFILE
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

function Directory() {
  const [district, setDistrict] = useState("All");
  const [status, setStatus] = useState("All");
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
  }, [district, query, status]);

  function resetCount() {
    setVisibleCount(8);
  }

  return (
    <section className="directory" id="directory">
      <div className="site-width">
        <SectionTitle
          eyebrow="CAST DIRECTORY"
          title="MEET THE NOCTURNE LINEUP"
          note="Browse every fictional adult profile by district, activity and editorial status."
        />

        <div className="directory-toolbar" id="districts">
          <label className="directory-search">
            <SearchIcon />
            <span className="sr-only">Search the cast directory</span>
            <input
              value={query}
              placeholder="SEARCH NAME OR STYLE"
              onChange={(event) => {
                setQuery(event.target.value);
                resetCount();
              }}
            />
          </label>
          <div className="filter-row" aria-label="District filter">
            <b>AREA</b>
            {["All", "Aoyama", "Ginza", "Daikanyama"].map((value) => (
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
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="filter-row" aria-label="Status filter">
            <b>STATUS</b>
            {["All", "Tonight", "This week", "Private"].map((value) => (
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
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="directory-result" role="status">
          <b>{String(filtered.length).padStart(2, "0")} PROFILES</b>
          <span>LAST UPDATE 2026.08.06 / 19:00 JST</span>
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
            <b>NO PROFILE FOUND</b>
            <button
              type="button"
              onClick={() => {
                setDistrict("All");
                setStatus("All");
                setQuery("");
              }}
            >
              RESET FILTERS
            </button>
          </div>
        )}

        {visibleCount < filtered.length && (
          <button
            type="button"
            className="more-cast"
            onClick={() => setVisibleCount((current) => current + 4)}
          >
            SHOW MORE CAST
            <ArrowIcon />
          </button>
        )}
      </div>
    </section>
  );
}

function Ranking() {
  return (
    <section className="ranking-section" id="ranking">
      <div className="site-width">
        <SectionTitle
          eyebrow="WEEKLY RANKING"
          title="MOST VIEWED PROFILES"
          note="The five profiles receiving the most editorial views this week."
          light
        />
        <div className="ranking-grid">
          {artists.slice(0, 5).map((artist, index) => (
            <Link href={`/profile/${artist.slug}`} key={artist.slug}>
              <span className="ranking-number">0{index + 1}</span>
              <img src={portraitPath(artist.slug)} alt="" />
              <div>
                <b>{artist.name}</b>
                <small>{artist.role}</small>
              </div>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SystemGuide() {
  const steps = [
    ["01", "CHECK THE CAST", "Compare profiles, styles and current editorial status."],
    ["02", "OPEN A PROFILE", "View portrait updates, schedules, notes and archive entries."],
    ["03", "FOLLOW THE JOURNAL", "Return for weekly ranking and new directory stories."],
  ];
  return (
    <section className="system-guide" id="system">
      <div className="site-width">
        <SectionTitle
          eyebrow="FIRST GUIDE"
          title="HOW TO EXPLORE NOCTURNE"
          note="A simple three-step path through the Tokyo night directory."
        />
        <div className="guide-grid">
          {steps.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="review-section" id="reviews">
      <div className="site-width">
        <SectionTitle
          eyebrow="READER REVIEWS"
          title="LATEST DIRECTORY NOTES"
          note="Recent impressions from visitors exploring Nocturne Tokyo."
        />
        <div className="review-grid">
          {reviews.map((review, index) => (
            <article key={review.title}>
              <div className="review-icon">
                <img src={portraitPath(artists[index].slug)} alt="" />
              </div>
              <div>
                <span>{review.date}</span>
                <h3>{review.title}</h3>
                <p>{review.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journal() {
  const stories = [
    {
      artist: artists[7],
      category: "AOYAMA NIGHT NOTE",
      date: "2026.08.06",
      title: "Three ways the city changes after the last train",
    },
    {
      artist: artists[9],
      category: "CAST INTERVIEW",
      date: "2026.08.02",
      title: "Hana talks colour, rhythm and the perfect late-night room",
    },
  ];
  return (
    <section className="journal-section" id="journal">
      <div className="site-width">
        <SectionTitle
          eyebrow="LATEST BLOG"
          title="STORIES FROM TOKYO"
          note="New interviews, visual notes and city guides from the directory."
          light
        />
        <div className="journal-cards">
          {stories.map((story) => (
            <article key={story.title}>
              <img src={portraitPath(story.artist.slug)} alt="" />
              <div>
                <span>{story.category}</span>
                <time>{story.date}</time>
                <h3>{story.title}</h3>
                <Link href={`/profile/${story.artist.slug}`}>
                  READ PROFILE
                  <ArrowIcon />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="contact" data-menu-underlay>
      <section className="access-band" id="access">
        <div className="site-width">
          <div>
            <span>01</span>
            <b>AOYAMA</b>
            <small>Editorial district</small>
          </div>
          <div>
            <span>02</span>
            <b>GINZA</b>
            <small>Central directory</small>
          </div>
          <div>
            <span>03</span>
            <b>DAIKANYAMA</b>
            <small>Creative district</small>
          </div>
        </div>
      </section>
      <div className="site-width footer-main">
        <Brand />
        <div className="footer-links">
          <div>
            <b>DIRECTORY</b>
            <Link href="/#directory">All cast</Link>
            <Link href="/#schedule">Schedule</Link>
            <Link href="/#ranking">Ranking</Link>
          </div>
          <div id="faq">
            <b>GUIDE</b>
            <Link href="/#system">First guide</Link>
            <Link href="/#reviews">Reviews</Link>
            <Link href="/#journal">Blog</Link>
          </div>
          <div>
            <b>INFORMATION</b>
            <p>Fictional adult profiles</p>
            <p>Editorial showcase</p>
            <p>No booking or payment</p>
          </div>
        </div>
      </div>
      <div className="site-width footer-bottom">
        <span>© 2026 NOCTURNE TOKYO</span>
        <span>ALL PROFILES ARE FICTIONAL ADULTS AGED 21+</span>
      </div>
    </footer>
  );
}

export function HomeExperience() {
  return (
    <>
      <AgeGate />
      <div data-site-content>
        <Header />
        <main data-menu-underlay>
          <Hero />
          <LiveTicker />
          <NoticeBanner />
          <Directory />
          <Ranking />
          <SystemGuide />
          <Reviews />
          <Journal />
        </main>
        <Footer />
      </div>
    </>
  );
}

function ProfilePhotoGallery({ artist }: { artist: Artist }) {
  const [active, setActive] = useState(0);
  const variants = ["", "is-pink", "is-warm", "is-mono"];
  return (
    <div className="profile-photo-gallery">
      <div className={`profile-main-photo ${variants[active]}`}>
        <img src={portraitPath(artist.slug)} alt={`${artist.name}, fictional adult profile`} />
        <span className="profile-photo-label">PHOTO 0{active + 1}</span>
      </div>
      <div className="profile-thumbnails">
        {variants.map((variant, index) => (
          <button
            type="button"
            key={variant || "default"}
            className={active === index ? "is-active" : ""}
            onClick={() => setActive(index)}
            aria-label={`Show profile photo ${index + 1}`}
            aria-pressed={active === index}
          >
            <span className={variant}>
              <img src={portraitPath(artist.slug)} alt="" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileSchedule({ artist }: { artist: Artist }) {
  return (
    <div className="profile-schedule">
      {artist.schedule.map((item) => (
        <div key={item.day}>
          <span>{item.day}</span>
          <b>{item.date}</b>
          <small>{item.state}</small>
        </div>
      ))}
    </div>
  );
}

export function ProfileExperience({ artist }: { artist: Artist }) {
  const related = artists.filter((candidate) => candidate.slug !== artist.slug).slice(0, 4);

  return (
    <>
      <AgeGate />
      <div data-site-content>
        <Header />
        <main className="profile-page" data-menu-underlay>
          <div className="profile-path">
            <div className="site-width">
              <Link href="/">HOME</Link>
              <span>/</span>
              <Link href="/#directory">CAST</Link>
              <span>/</span>
              <b>{artist.name.toUpperCase()}</b>
            </div>
          </div>

          <section className="profile-intro-section">
            <div className="site-width profile-card-shell">
              <ProfilePhotoGallery artist={artist} />
              <div className="profile-details">
                <div className="profile-heading">
                  <span>N° {String(artists.indexOf(artist) + 1).padStart(2, "0")}</span>
                  <em>{artist.status}</em>
                  <h1>{artist.name}</h1>
                  <p>{artist.role}</p>
                </div>
                <div className="profile-message">
                  <b>CAST MESSAGE</b>
                  <p>{artist.biography}</p>
                </div>
                <div className="profile-stat-grid">
                  {artist.stats.map((stat) => (
                    <div key={stat.label}>
                      <span>{stat.label}</span>
                      <b>{stat.value}</b>
                    </div>
                  ))}
                </div>
                <div className="profile-meta-list">
                  <div>
                    <span>AREA</span>
                    <b>{artist.district}</b>
                  </div>
                  <div>
                    <span>LANGUAGE</span>
                    <b>{artist.languages.join(" / ")}</b>
                  </div>
                  <div>
                    <span>STYLE</span>
                    <b>{artist.disciplines.join(" / ")}</b>
                  </div>
                </div>
                <Link className="profile-back-button" href="/#directory">
                  RETURN TO CAST DIRECTORY
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </section>

          <section className="profile-schedule-section">
            <div className="site-width">
              <SectionTitle
                eyebrow="WEEKLY SCHEDULE"
                title={`${artist.name.toUpperCase()}'S CURRENT INDEX`}
                note="Editorial availability labels for the current five-day directory cycle."
                light
              />
              <ProfileSchedule artist={artist} />
            </div>
          </section>

          <section className="profile-content">
            <div className="site-width">
              <section className="profile-gallery-section">
                <div className="profile-block-heading">
                  <span>PHOTO GALLERY</span>
                  <h2>LATEST PHOTO UPDATES</h2>
                </div>
                <div className="profile-gallery-grid">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      className={
                        index % 3 === 1 ? "is-pink" : index % 3 === 2 ? "is-warm" : ""
                      }
                      key={index}
                    >
                      <img src={portraitPath(artist.slug)} alt="" />
                      <span>UPDATE 0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="profile-blog-section">
                <div className="profile-block-heading">
                  <span>LATEST BLOG</span>
                  <h2>NOTES FROM {artist.name.toUpperCase()}</h2>
                </div>
                <div className="profile-blog-grid">
                  {[0, 1].map((index) => (
                    <article key={index}>
                      <img
                        className={index === 1 ? "is-pink" : ""}
                        src={portraitPath(artist.slug)}
                        alt=""
                      />
                      <div>
                        <time>2026.08.0{6 - index}</time>
                        <h3>
                          {index === 0
                            ? "A quick note before tonight"
                            : "Three details I always notice in Tokyo"}
                        </h3>
                        <p>
                          A short editorial update from the Nocturne archive,
                          collecting colour, music and city observations.
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="profile-review-section">
                <div className="profile-block-heading">
                  <span>PROFILE REVIEWS</span>
                  <h2>READER NOTES</h2>
                </div>
                <div className="profile-review-list">
                  {reviews.slice(0, 5).map((review, index) => (
                    <article key={review.title}>
                      <div>
                        <b>0{index + 1}</b>
                        <span>{review.date}</span>
                      </div>
                      <h3>{review.title}</h3>
                      <p>{review.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section className="related-section">
            <div className="site-width">
              <SectionTitle
                eyebrow="RELATED CAST"
                title="MORE PROFILES TO EXPLORE"
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
