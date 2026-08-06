"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { artists, featureTiles, testimonials, type Artist } from "./data";

type ArtStyle = CSSProperties & {
  "--tone-a": string;
  "--tone-b": string;
  "--tone-c": string;
};

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
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? "is-open" : ""}`} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function AgeGate() {
  const [declined, setDeclined] = useState(false);
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

  function accept() {
    window.localStorage.setItem("nocturne-age-confirmed", "yes");
    window.dispatchEvent(new Event("nocturne-age-change"));
  }

  if (confirmed) return null;

  return (
    <div className="age-layer">
      <div
        className="age-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-title"
        aria-describedby="age-description"
      >
        <div className="age-mark" aria-hidden="true">
          N
        </div>
        <p className="kicker">Adults-only interface study</p>
        <h2 id="age-title">
          A private catalogue
          <br />
          after dark.
        </h2>
        {declined ? (
          <div className="age-declined" role="status">
            <p>This prototype stays closed until you confirm you are 21 or older.</p>
            <button type="button" className="text-button" onClick={() => setDeclined(false)}>
              Go back
            </button>
          </div>
        ) : (
          <>
            <p id="age-description">
              Nocturne is a fictional, non-transactional design prototype. All
              profiles are invented adults and every artwork is abstract.
            </p>
            <div className="age-actions">
              <button type="button" className="button button-light" onClick={accept}>
                I am 21 or older
                <ArrowIcon />
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setDeclined(true)}
              >
                Leave the catalogue
              </button>
            </div>
          </>
        )}
        <p className="age-fineprint">
          Local demo only. No booking, payment, messaging, or real-world service.
        </p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Nocturne home">
      <span className="brand-glyph">N</span>
      <span>
        <b>Nocturne</b>
        <small>Tokyo after dark</small>
      </span>
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    ["Directory", "/#directory"],
    ["Tonight", "/#tonight"],
    ["Districts", "/#districts"],
    ["Journal", "/#journal"],
    ["Reviews", "/#reviews"],
    ["Studio", "/#studio"],
  ];

  return (
    <>
      <div className="masthead">
        <div className="shell masthead-inner">
          <Brand />
          <div className="masthead-meta">
            <span>21+ fictional catalogue</span>
            <span>Tokyo / 35.6762° N</span>
          </div>
          <button
            type="button"
            className="mobile-menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>
      <nav className="global-nav" aria-label="Primary navigation">
        <div className="shell global-nav-inner">
          {navItems.map(([label, href]) => (
            <Link key={label} href={href}>
              {label}
            </Link>
          ))}
          <span className="nav-spacer" />
          <Link className="nav-featured" href="/profile/aika">
            Featured dossier
            <ArrowIcon />
          </Link>
        </div>
      </nav>
      <nav
        id="mobile-navigation"
        className={`mobile-navigation ${menuOpen ? "is-open" : ""}`}
        aria-label="Mobile navigation"
      >
        {navItems.map(([label, href], index) => (
          <Link key={label} href={href} onClick={() => setMenuOpen(false)}>
            <span>0{index + 1}</span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer" id="studio">
      <div className="shell footer-top">
        <div>
          <p className="kicker">Nocturne / local study</p>
          <h2>Designed for the hour when the city changes character.</h2>
        </div>
        <p>
          This original interface prototype studies the hierarchy of a public
          directory website. It contains no real people, adult media,
          transactions, messaging, contact details, or external service links.
        </p>
      </div>
      <div className="shell footer-grid">
        <div>
          <Brand />
        </div>
        <div>
          <span>Explore</span>
          <Link href="/#directory">Directory</Link>
          <Link href="/#journal">Journal</Link>
          <Link href="/profile/aika">Featured dossier</Link>
        </div>
        <div>
          <span>Prototype</span>
          <p>Original copy</p>
          <p>Abstract CSS artwork</p>
          <p>Local data only</p>
        </div>
        <div>
          <span>Boundary</span>
          <p>Fictional adults 21+</p>
          <p>No commerce</p>
          <p>No external APIs</p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Nocturne interface study</span>
        <span>Made for local evaluation</span>
      </div>
    </footer>
  );
}

function AbstractArt({
  artist,
  index = 0,
  variant = "card",
}: {
  artist: Artist;
  index?: number;
  variant?: "card" | "hero" | "profile" | "gallery";
}) {
  const style: ArtStyle = {
    "--tone-a": artist.palette[0],
    "--tone-b": artist.palette[1],
    "--tone-c": artist.palette[2],
  };

  return (
    <div
      className={`abstract-art art-${variant} art-variant-${index % 6}`}
      style={style}
      aria-label={`Abstract artwork for ${artist.name}`}
      role="img"
    >
      <span className="art-orbit" />
      <span className="art-plane" />
      <span className="art-glow" />
      <span className="art-grain" />
      <b>{artist.monogram}</b>
    </div>
  );
}

function FeatureTiles() {
  return (
    <section className="feature-rail shell" aria-label="Catalogue sections">
      {featureTiles.map((tile, index) => (
        <a key={tile.eyebrow} className="feature-tile" href={index === 0 ? "#directory" : "#journal"}>
          <span>{tile.eyebrow}</span>
          <div className={`mini-art mini-art-${index + 1}`} aria-hidden="true">
            <i />
          </div>
          <h2>{tile.title}</h2>
          <p>{tile.note}</p>
        </a>
      ))}
    </section>
  );
}

function Hero() {
  const featured = artists.slice(0, 3);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-track">
        {featured.map((artist, index) => (
          <Link className="hero-panel" href={`/profile/${artist.slug}`} key={artist.slug}>
            <AbstractArt artist={artist} index={index} variant="hero" />
            <div className="hero-panel-copy">
              <span>0{index + 1} / Featured study</span>
              <h2>{artist.name}</h2>
              <p>{artist.role}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="hero-copy shell">
        <p className="kicker">Nocturne edition 08.26</p>
        <h1 id="hero-title">
          The night has
          <br />
          its own index.
        </h1>
        <p>
          A fictional directory of adult artists, nocturnal practices, and
          abstract dossiers shaped around Tokyo&apos;s quieter hours.
        </p>
        <a className="round-link" href="#directory" aria-label="Explore the directory">
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function TonightStrip() {
  return (
    <section className="tonight-strip" id="tonight" aria-label="Tonight status">
      <div className="tonight-label">
        <span className="pulse" />
        Tonight in the archive
      </div>
      <div className="marquee-viewport">
        <div className="marquee-track">
          {[...artists.slice(0, 8), ...artists.slice(0, 8)].map((artist, index) => (
            <Link href={`/profile/${artist.slug}`} key={`${artist.slug}-${index}`}>
              <b>{artist.name}</b>
              <span>{artist.role}</span>
              <i>{artist.status}</i>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  return (
    <article className="artist-card">
      <Link className="artist-art-link" href={`/profile/${artist.slug}`}>
        <AbstractArt artist={artist} index={index} />
        <span className="language-badge">{artist.languages.join(" / ")}</span>
        <span className="profile-number">N° {String(index + 1).padStart(2, "0")}</span>
      </Link>
      <div className="artist-status">
        <span className={`tier tier-${artist.tier.toLowerCase()}`}>{artist.tier}</span>
        <span>{artist.district}</span>
      </div>
      <div className="artist-copy">
        <div>
          <h3>
            <Link href={`/profile/${artist.slug}`}>{artist.name}</Link>
          </h3>
          <p>{artist.role}</p>
        </div>
        <span className={`availability availability-${artist.status.toLowerCase().replace(" ", "-")}`}>
          {artist.status}
        </span>
        <p className="artist-note">{artist.shortNote}</p>
        <Link className="card-link" href={`/profile/${artist.slug}`}>
          Open dossier
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
      const matchesDistrict = district === "All" || artist.district === district;
      const matchesStatus = status === "All" || artist.status === status;
      const haystack = [
        artist.name,
        artist.role,
        artist.district,
        ...artist.disciplines,
      ]
        .join(" ")
        .toLowerCase();
      return matchesDistrict && matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [district, status, query]);

  return (
    <section className="directory-section" id="directory">
      <div className="shell directory-heading">
        <div>
          <p className="kicker">The directory / 12 fictional adults</p>
          <h2>Choose a frequency.</h2>
        </div>
        <p>
          Browse an original set of abstract profiles. Filters work locally and
          never send data away from this page.
        </p>
      </div>
      <div className="shell filter-panel">
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">Search profiles</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(8);
            }}
            placeholder="Search name, practice, district"
          />
        </label>
        <div className="filter-group" aria-label="Filter by district">
          <span>District</span>
          {["All", "Aoyama", "Ginza", "Daikanyama"].map((value) => (
            <button
              type="button"
              key={value}
              className={district === value ? "is-active" : ""}
              aria-pressed={district === value}
              onClick={() => {
                setDistrict(value);
                setVisibleCount(8);
              }}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="filter-group" aria-label="Filter by status">
          <span>Index</span>
          {["All", "Tonight", "This week", "Private"].map((value) => (
            <button
              type="button"
              key={value}
              className={status === value ? "is-active" : ""}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setVisibleCount(8);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="shell result-meta" role="status">
        <span>{String(filtered.length).padStart(2, "0")} dossiers</span>
        <span>Updated 06 Aug 2026 / local data</span>
      </div>
      {filtered.length ? (
        <div className="artist-grid shell">
          {filtered.slice(0, visibleCount).map((artist) => (
            <ArtistCard artist={artist} index={artists.indexOf(artist)} key={artist.slug} />
          ))}
        </div>
      ) : (
        <div className="shell empty-state">
          <p>No dossier matches that combination.</p>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setDistrict("All");
              setStatus("All");
              setQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      {visibleCount < filtered.length && (
        <div className="load-more-wrap">
          <button
            type="button"
            className="button button-dark"
            onClick={() => setVisibleCount((count) => count + 4)}
          >
            Reveal four more
            <ArrowIcon />
          </button>
        </div>
      )}
    </section>
  );
}

function Reviews() {
  return (
    <section className="reviews-section" id="reviews">
      <div className="shell section-rule-heading">
        <p className="kicker">Reader notes / controlled prototype feedback</p>
        <h2>Four impressions from the dark.</h2>
      </div>
      <div className="shell reviews-grid">
        {testimonials.map((item, index) => (
          <blockquote key={item.source}>
            <span>0{index + 1}</span>
            <p>“{item.quote}”</p>
            <cite>{item.source}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function Journal() {
  const entries = [
    {
      date: "06.08.26",
      title: "How neon changes the distance between two colours",
      category: "Light study",
      artist: artists[2],
    },
    {
      date: "02.08.26",
      title: "Seven records for a room with one small window",
      category: "Listening note",
      artist: artists[1],
    },
  ];
  return (
    <section className="journal-section" id="journal">
      <div className="shell journal-heading">
        <div>
          <p className="kicker">Latest field notes</p>
          <h2>The archive keeps moving.</h2>
        </div>
        <p>
          Short fictional dispatches extend the directory into an editorial
          world without introducing a real contact or transaction layer.
        </p>
      </div>
      <div className="shell journal-grid">
        {entries.map((entry, index) => (
          <article key={entry.title}>
            <AbstractArt artist={entry.artist} index={index + 3} variant="gallery" />
            <div>
              <span>
                {entry.category} / {entry.date}
              </span>
              <h3>{entry.title}</h3>
              <Link href={`/profile/${entry.artist.slug}`}>
                Read the dossier
                <ArrowIcon />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomeExperience() {
  return (
    <>
      <AgeGate />
      <Header />
      <main>
        <FeatureTiles />
        <Hero />
        <TonightStrip />
        <Directory />
        <Reviews />
        <Journal />
      </main>
      <Footer />
    </>
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

function ProfileGallery({ artist }: { artist: Artist }) {
  const [active, setActive] = useState(0);
  return (
    <section className="profile-gallery" aria-labelledby="gallery-title">
      <div className="profile-section-title">
        <span>02</span>
        <div>
          <p className="kicker">Abstract studies</p>
          <h2 id="gallery-title">Selected fragments</h2>
        </div>
      </div>
      <div className="gallery-stage">
        <AbstractArt artist={artist} index={active} variant="profile" />
        <div className="gallery-caption">
          <span>Study {String(active + 1).padStart(2, "0")}</span>
          <p>
            A generated colour composition representing texture, light, and
            movement. No source photograph is used.
          </p>
        </div>
      </div>
      <div className="gallery-thumbs" aria-label="Select an abstract study">
        {[0, 1, 2, 3].map((index) => (
          <button
            type="button"
            key={index}
            onClick={() => setActive(index)}
            className={active === index ? "is-active" : ""}
            aria-label={`Show study ${index + 1}`}
            aria-pressed={active === index}
          >
            <AbstractArt artist={artist} index={index} variant="gallery" />
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfileJournal({ artist }: { artist: Artist }) {
  return (
    <section className="profile-journal" aria-labelledby="profile-journal-title">
      <div className="profile-section-title">
        <span>03</span>
        <div>
          <p className="kicker">Notebook</p>
          <h2 id="profile-journal-title">Three studio entries</h2>
        </div>
      </div>
      <div className="profile-entry-grid">
        {[
          ["06.08.26", "A room can be tuned like an instrument."],
          ["01.08.26", "Colour arrives before the story does."],
          ["24.07.26", "Keep one imperfect edge in every composition."],
        ].map(([date, title], index) => (
          <article key={date}>
            <span>{date}</span>
            <AbstractArt artist={artist} index={index + 2} variant="gallery" />
            <h3>{title}</h3>
            <p>
              A fictional studio annotation written for the Nocturne interface
              prototype.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileReviews({ artist }: { artist: Artist }) {
  return (
    <section className="profile-reviews" aria-labelledby="profile-reviews-title">
      <div className="profile-section-title">
        <span>04</span>
        <div>
          <p className="kicker">Archive responses</p>
          <h2 id="profile-reviews-title">Notes on {artist.name}&apos;s work</h2>
        </div>
      </div>
      <div className="profile-review-list">
        {testimonials.map((item, index) => (
          <article key={item.source}>
            <div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>Verified prototype note</small>
            </div>
            <blockquote>{item.quote}</blockquote>
            <p>{item.source}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProfileExperience({ artist }: { artist: Artist }) {
  const related = artists
    .filter((candidate) => candidate.slug !== artist.slug)
    .slice(0, 4);
  return (
    <>
      <AgeGate />
      <Header />
      <main className="profile-main">
        <div className="shell profile-breadcrumb">
          <Link href="/">Index</Link>
          <span>/</span>
          <Link href="/#directory">Directory</Link>
          <span>/</span>
          <b>{artist.name}</b>
        </div>
        <section className="profile-hero">
          <div className="shell profile-hero-grid">
            <div className="profile-art-column">
              <AbstractArt artist={artist} variant="profile" />
              <div className="profile-thumb-row" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <AbstractArt artist={artist} index={index + 1} variant="gallery" key={index} />
                ))}
              </div>
            </div>
            <div className="profile-copy-column">
              <p className="kicker">
                N° {String(artists.indexOf(artist) + 1).padStart(2, "0")} /{" "}
                {artist.district}
              </p>
              <h1>{artist.name}</h1>
              <p className="profile-role">{artist.role}</p>
              <p className="profile-intro">{artist.biography}</p>
              <div className="profile-tags">
                {artist.disciplines.map((discipline) => (
                  <span key={discipline}>{discipline}</span>
                ))}
              </div>
              <div className="profile-stats">
                {artist.stats.map((stat) => (
                  <div key={stat.label}>
                    <span>{stat.label}</span>
                    <b>{stat.value}</b>
                  </div>
                ))}
              </div>
              <div className="profile-note">
                <span className="pulse" />
                <div>
                  <b>{artist.status} in the editorial index</b>
                  <p>Informational status only. This demo has no booking path.</p>
                </div>
              </div>
              <Link className="button button-dark profile-return" href="/#directory">
                Return to directory
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
        <section className="profile-information shell">
          <div className="profile-section-title">
            <span>01</span>
            <div>
              <p className="kicker">Five-day editorial rhythm</p>
              <h2>Current studio index</h2>
            </div>
          </div>
          <ProfileSchedule artist={artist} />
          <div className="profile-quote">
            <span>“</span>
            <p>{artist.shortNote}</p>
          </div>
        </section>
        <div className="shell profile-content-stack">
          <ProfileGallery artist={artist} />
          <ProfileJournal artist={artist} />
          <ProfileReviews artist={artist} />
        </div>
        <section className="related-section">
          <div className="shell section-rule-heading">
            <p className="kicker">Continue through the index</p>
            <h2>Four adjacent dossiers.</h2>
          </div>
          <div className="shell artist-grid related-grid">
            {related.map((candidate) => (
              <ArtistCard
                artist={candidate}
                index={artists.indexOf(candidate)}
                key={candidate.slug}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
