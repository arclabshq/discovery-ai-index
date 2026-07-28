import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Verification pending",
};

const TABLE_STATUS_COPY = {
  verified: "Verified",
  under_review: "Pending",
};

const NAV_ITEMS = [
  { href: "/#registry", label: "Discoveries", match: "/" },
  { href: "/method", label: "Method", match: "/method" },
  { href: "/about", label: "About", match: "/about" },
];

const PAGE_TITLES = {
  "/": "Discovery Index — See what AI is helping us discover",
  "/about": "About — Discovery Index",
  "/method": "Method — Discovery Index",
  "/how-it-works": "Method — Discovery Index",
};

function formatDate(value) {
  if (!value) return "Date pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value) {
  if (!value) return "Update time pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function yearFromDate(value) {
  return value ? value.slice(0, 4) : "Date pending";
}

function DiscoveryHistory({ discovery }) {
  const history = discovery.history;
  if (!history?.startDate || !history?.durationLabel) return null;

  return (
    <span
      className="discovery-history"
      aria-label={`${history.startLabel} ${yearFromDate(history.startDate)}; ${
        history.resultLabel
      } ${yearFromDate(discovery.announcedAt)}; reported after ${history.durationLabel}`}
    >
      <span>
        {history.sourceUrl ? (
          <a href={history.sourceUrl} target="_blank" rel="noreferrer">
            {yearFromDate(history.startDate)}
          </a>
        ) : (
          <b>{yearFromDate(history.startDate)}</b>
        )}
        <em>{history.startLabel}</em>
      </span>
      <i aria-hidden="true">→</i>
      <span>
        <b>{yearFromDate(discovery.announcedAt)}</b>
        <em>{history.resultLabel}</em>
      </span>
      <strong>{history.durationLabel}</strong>
    </span>
  );
}

function normalizePath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatch = (event) => setMatches(event.matches);

    setMatches(media.matches);
    media.addEventListener("change", updateMatch);
    return () => media.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

function Header({ path }) {
  return (
    <header className="nav">
      <a className="brand" href="/" aria-label="Discovery Index home">
        <span className="brand-mark" />
        Discovery Index
      </a>
      <nav className="primary-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <a
            href={item.href}
            key={item.href}
            aria-current={
              path === item.match || (item.match === "/" && path.startsWith("/discoveries/"))
                ? "page"
                : undefined
            }
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function RegistryStatusBar({ registry, state }) {
  const verifiedCount = registry.verified.length;
  const reviewCount = registry.underReview.length;
  const totalCount = verifiedCount + reviewCount;

  return (
    <section className="registry-status-bar" aria-label="Registry status" aria-live="polite">
      <strong>REGISTRY</strong>
      <div className="registry-status-content">
        {state === "ready" ? (
          <>
            <span><b>{totalCount}</b> public records</span>
            <span className="status-count">
              <i className="status-count-dot verified-dot" aria-hidden="true" />
              <b>{verifiedCount}</b> verified
            </span>
            <span className="status-count">
              <i className="status-count-dot review-dot" aria-hidden="true" />
              <b>{reviewCount}</b> verification pending
            </span>
            <span className="status-updated">
              <time dateTime={registry.lastEditorialUpdateAt || undefined}>
                Last editorial update {formatDateTime(registry.lastEditorialUpdateAt)}
              </time>
            </span>
            <span>Evidence checks are date-stamped</span>
          </>
        ) : (
          <span>
            {state === "error"
              ? "Registry status temporarily unavailable"
              : "Opening durable registry…"}
          </span>
        )}
      </div>
    </section>
  );
}

function StatusLegend() {
  return (
    <div className="status-legend-inline" aria-label="Verification status legend">
      <span>
        <i className="legend-dot verified-dot" aria-hidden="true" />
        <b>Verified</b>
        <em>Review complete</em>
      </span>
      <span>
        <i className="legend-dot review-dot" aria-hidden="true" />
        <b>Verification pending</b>
        <em>Independent evidence still open</em>
      </span>
    </div>
  );
}

function RegistryState({ state }) {
  if (state === "loading") {
    return (
      <section className="registry-state" aria-live="polite">
        <span className="state-rule" />
        <p>Opening the durable registry…</p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="registry-state error" role="alert">
        <p className="eyebrow">Registry unavailable</p>
        <h2>The evidence feed could not be loaded.</h2>
        <p>We do not substitute sample stories when the source registry is unavailable.</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </section>
    );
  }

  return null;
}

function RegistryTable({ discoveries }) {
  return (
    <div className="table-scroll">
      <table className="registry-table">
        <caption className="sr-only">
          AI-assisted research breakthroughs by verification status
        </caption>
        <colgroup>
          <col className="col-date" />
          <col className="col-field" />
          <col className="col-model" />
          <col className="col-discovery" />
          <col className="col-summary" />
          <col className="col-impact" />
          <col className="col-evidence" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Announced</th>
            <th scope="col">Field</th>
            <th scope="col">Model</th>
            <th scope="col">Breakthrough</th>
            <th scope="col">Summary</th>
            <th scope="col">Why this matters</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {discoveries.map((discovery) => {
            const isVerified = discovery.status === "verified";

            return (
              <tr
                className={isVerified ? "row-verified" : "row-review"}
                id={`record-${discovery.slug}`}
                key={discovery.id}
              >
                <td className="record-date" data-label="Announced">
                  <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
                </td>
                <td className="record-field" data-label="Field">
                  {discovery.field}
                </td>
                <td className="record-model" data-label="Model">
                  <strong>{discovery.aiSystem}</strong>
                </td>
                <td className="record-title" data-label="Breakthrough">
                  <h3>
                    <a
                      className="record-link"
                      href={`/discoveries/${discovery.slug}`}
                      aria-label={`View record: ${discovery.title}`}
                    >
                      {discovery.title} <span aria-hidden="true">→</span>
                    </a>
                  </h3>
                </td>
                <td className="record-plain-summary" data-label="Summary">
                  {discovery.summary}
                </td>
                <td className="record-impact" data-label="Why this matters">
                  {discovery.whyItMatters}
                </td>
                <td className="record-evidence" data-label="Evidence">
                  <a
                    className={`status evidence-link ${isVerified ? "verified" : "reviewing"}`}
                    href={`/discoveries/${discovery.slug}#evidence`}
                    aria-label={`${TABLE_STATUS_COPY[discovery.status]}: View evidence for ${
                      discovery.title
                    }`}
                  >
                    {TABLE_STATUS_COPY[discovery.status]}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileLeaderboard({ discoveries }) {
  return (
    <section className="mobile-leaderboard" aria-labelledby="mobile-leaderboard-title">
      <h2 className="sr-only" id="mobile-leaderboard-title">
        Discoveries by verification status, newest first
      </h2>
      <p className="leaderboard-note">Newest first · Reference numbers, not rankings</p>
      <div className="leaderboard-header" aria-hidden="true">
        <span>No.</span>
        <span>Breakthrough</span>
        <span>Details</span>
      </div>
      <ol>
        {discoveries.map((discovery, index) => {
          const isVerified = discovery.status === "verified";

          return (
            <li
              className={isVerified ? "leaderboard-verified" : "leaderboard-review"}
              id={`record-${discovery.slug}`}
              key={discovery.id}
            >
              <a
                className="leaderboard-row"
                data-testid={`leaderboard-row-${discovery.slug}`}
                href={`/discoveries/${discovery.slug}`}
                aria-label={`View record: ${discovery.title}`}
              >
                <span className="leaderboard-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leaderboard-content">
                  <span className="leaderboard-meta">
                    <span>{discovery.field}</span>
                    <time dateTime={discovery.announcedAt}>
                      {formatDate(discovery.announcedAt)}
                    </time>
                  </span>
                  <span className="leaderboard-title">{discovery.title}</span>
                  <span className="leaderboard-summary">{discovery.summary}</span>
                  <span className="leaderboard-footer">
                    <strong>{discovery.aiSystem}</strong>
                    <span
                      className={`leaderboard-status ${
                        isVerified ? "leaderboard-status-verified" : "leaderboard-status-review"
                      }`}
                    >
                      {TABLE_STATUS_COPY[discovery.status]}
                    </span>
                  </span>
                </span>
                <span className="leaderboard-action" aria-hidden="true">View</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function HomePage({ registry, state }) {
  const [field, setField] = useState("All fields");
  const isMobile = useMediaQuery("(max-width: 760px)");
  const discoveries = useMemo(
    () =>
      [...registry.verified, ...registry.underReview].sort((a, b) =>
        (b.announcedAt || "").localeCompare(a.announcedAt || ""),
      ),
    [registry.underReview, registry.verified],
  );
  const fields = useMemo(
    () => ["All fields", ...new Set(discoveries.map((item) => item.field))],
    [discoveries],
  );
  const filtered = useMemo(
    () =>
      field === "All fields"
        ? discoveries
        : discoveries.filter((item) => item.field === field),
    [discoveries, field],
  );
  const visibleVerified = filtered.filter((item) => item.status === "verified").length;
  const visibleUnderReview = filtered.length - visibleVerified;

  return (
    <>
      <section className="registry-intro">
        <p className="section-kicker">AI-assisted breakthroughs</p>
        <h1>Real discoveries AI helped make.</h1>
        <p>
          Explore documented advances in medicine, biology, mathematics, materials, and
          computing—and see what changed, why it matters, and where the evidence comes from.
        </p>
      </section>

      <section className="registry-toolbar" id="registry">
        <div>
          <p className="section-kicker">Discovery registry</p>
          <h2>See what changed—and why it matters.</h2>
          <p className="registry-deck">Every record links to the original research.</p>
        </div>
        <div className="registry-controls">
          <label id="fields">
            Field
            <select value={field} onChange={(event) => setField(event.target.value)}>
              {fields.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <StatusLegend />
      <RegistryState state={state} />

      {state === "ready" && (
        <>
          <p className="sr-only" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "discovery" : "discoveries"} shown:
            {" "}{visibleVerified} verified and {visibleUnderReview} verification pending.
          </p>
          {filtered.length ? (
            isMobile ? (
              <MobileLeaderboard discoveries={filtered} />
            ) : (
              <RegistryTable discoveries={filtered} />
            )
          ) : (
            <section className="registry-state">
              <p>No records match this field yet.</p>
            </section>
          )}
        </>
      )}
    </>
  );
}

function DiscoveryRecordPage({ discovery, state }) {
  if (state !== "ready") {
    return (
      <section className="record-page record-page-state">
        <a className="record-back" href="/#registry">← Back to all discoveries</a>
        <RegistryState state={state} />
      </section>
    );
  }

  if (!discovery) return <NotFoundPage />;

  const isVerified = discovery.status === "verified";
  const statusClass = isVerified ? "verified" : "reviewing";
  const verificationHeading = isVerified
    ? "External verification is documented."
    : "Independent evidence is still open.";
  const statusCriteria = isVerified
    ? "Verified means the registry has documented a meaningful independent check. It does not imply that every possible application or consequence has been replicated."
    : "This record changes to Verified only after peer review, expert verification, formal checking, replication, or comparable independent evidence is documented.";

  return (
    <article className={`record-page ${isVerified ? "record-page-verified" : "record-page-review"}`}>
      <a className="record-back" href="/#registry">← Back to all discoveries</a>

      <header className="record-page-hero">
        <div className="record-page-meta">
          <span>{discovery.field}</span>
          <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
          <span className={`status ${statusClass}`}>{STATUS_COPY[discovery.status]}</span>
        </div>
        <h1>{discovery.title}</h1>
        <p>{discovery.summary}</p>
      </header>

      <section className="record-detail-grid" aria-label="Discovery overview">
        <article>
          <p className="section-kicker">Model</p>
          <h2>{discovery.aiSystem}</h2>
          <p>
            {discovery.aiRole ||
              "The original research documents how the system contributed to the result."}
          </p>
        </article>
        <article>
          <p className="section-kicker">Why this matters</p>
          <h2>The significance of the result</h2>
          <p>{discovery.whyItMatters}</p>
        </article>
      </section>

      {discovery.history && (
        <section className="record-history-panel">
          <div>
            <p className="section-kicker">Problem history</p>
            <h2>From the original question to the reported result.</h2>
            <p>The starting date links to the original conjecture or problem statement.</p>
          </div>
          <DiscoveryHistory discovery={discovery} />
        </section>
      )}

      <section className="record-proof" id="evidence">
        <header>
          <div>
            <p className="section-kicker">Evidence</p>
            <h2>{verificationHeading}</h2>
          </div>
          <span className={`status ${statusClass}`}>{STATUS_COPY[discovery.status]}</span>
        </header>
        <div className="record-proof-grid">
          <article>
            <h3>{isVerified ? "What was checked" : "What remains open"}</h3>
            <p>
              {discovery.verificationNote ||
                "The evidence note is being prepared from the strongest available primary source."}
            </p>
            <p className="record-criteria">{statusCriteria}</p>
          </article>
          <aside>
            <dl>
              <div>
                <dt>Primary source</dt>
                <dd>{discovery.sourceLabel || "Original research"}</dd>
              </div>
              <div>
                <dt>Source type</dt>
                <dd>{discovery.sourceType || "Research publication"}</dd>
              </div>
              <div>
                <dt>Last evidence check</dt>
                <dd>
                  <time dateTime={discovery.updatedAt || undefined}>
                    {formatDateTime(discovery.updatedAt)}
                  </time>
                </dd>
              </div>
            </dl>
            <a
              className="record-source-link"
              href={discovery.primaryUrl}
              target="_blank"
              rel="noreferrer"
            >
              Read the original research <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </div>
      </section>

      <nav className="record-bottom-nav" aria-label="Discovery record navigation">
        <a href="/#registry">← Browse all discoveries</a>
      </nav>
    </article>
  );
}

function PageHero({ kicker, title, deck }) {
  return (
    <section className="subpage-hero">
      <p className="section-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p>{deck}</p>
    </section>
  );
}

function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About the index"
        title="A public record of what AI is helping us discover."
        deck="Breakthrough headlines are arriving faster than most people can evaluate them. Discovery Index turns specialist research into evidence-backed proof points anyone can understand."
      />
      <section className="editorial-layout">
        <div className="prose">
          <h2>Why this record matters</h2>
          <p>
            Benchmarks show what a model can do in a test. This registry shows something
            different: documented moments when AI helped produce a new proof, prediction,
            algorithm, material candidate, or scientific lead.
          </p>
          <p>
            The goal is to make the pace of real discovery visible beyond the fields where it
            happens. Each record explains the result in ordinary language, names the AI’s role,
            and links to the strongest available evidence.
          </p>
          <h2>Evidence before excitement</h2>
          <p>
            This is not a catalog of every AI paper, demo, or company announcement. A verified
            record belongs here only when AI played a material role in producing a new result and
            that result can be checked through primary evidence.
          </p>
        </div>
        <aside className="fact-card">
          <p className="section-kicker">Every record answers</p>
          <dl>
            <div>
              <dt>What changed?</dt>
              <dd>The new result, without abstract-style language.</dd>
            </div>
            <div>
              <dt>Why does it matter?</dt>
              <dd>The scientific or real-world benefit a curious reader can understand.</dd>
            </div>
            <div>
              <dt>Where is the proof?</dt>
              <dd>The paper, proof, code, or announcement behind the claim.</dd>
            </div>
          </dl>
        </aside>
      </section>
      <section className="independence-note">
        <div>
          <p className="section-kicker">Independent project</p>
          <h2>Maintained with AI-assisted editorial review.</h2>
        </div>
        <p>
          Discovery Index uses an AI-assisted editorial system to trace primary sources and
          document external verification. It does not independently prove claims or represent the
          researchers listed. Status changes are based on published evidence and recorded with an
          editorial note.
        </p>
      </section>
    </>
  );
}

function HowItWorksPage() {
  return (
    <>
      <PageHero
        kicker="Method"
        title="Two statuses. One evidence trail."
        deck="Orange means independent evidence is still missing. Blue means external verification is documented. Every public record links to the original research."
      />
      <section className="status-explainer status-legend public-statuses">
        <article>
          <span className="status-dot review-dot" />
          <p className="section-kicker amber">Orange · verification pending</p>
          <h2>Primary source linked. Independent evidence still open.</h2>
          <p>
            The AI-assisted editorial system has checked the source, but the record still lacks
            sufficient independent evidence such as peer review, expert verification, formal
            checking, or replication.
          </p>
        </article>
        <article>
          <span className="status-dot verified-dot" />
          <p className="section-kicker">Blue · verified</p>
          <h2>External verification documented.</h2>
          <p>
            The record documents what changed, how AI contributed, the strongest independent
            check, and any material limitation that remains.
          </p>
        </article>
      </section>
      <section className="checklist">
        <div>
          <p className="section-kicker">For every record</p>
          <h2>We answer three questions.</h2>
        </div>
        <ul>
          <li><strong>What changed?</strong><span>The specific result the researchers report.</span></li>
          <li><strong>How did AI help?</strong><span>The system’s material role in producing the result.</span></li>
          <li><strong>How was it checked?</strong><span>The proof, experiment, benchmark, or expert review behind it.</span></li>
        </ul>
      </section>
      <p className="method-intro-note">
        No scan, model, or submission can publish a record or change its status automatically.
      </p>
      <section className="method-policies">
        <article>
          <p className="section-kicker">Update cadence</p>
          <h2>Evidence checks are date-stamped.</h2>
          <p>
            Pending records are rechecked for new paper versions, peer review, independent expert
            reports, formal checks, replications, corrections, and retractions. A scan alone never
            changes a public status.
          </p>
        </article>
        <article>
          <p className="section-kicker">Corrections</p>
          <h2>The evidence trail stays intact.</h2>
          <p>Corrections are checked against primary sources. No public record changes automatically.</p>
        </article>
      </section>
    </>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="section-kicker">404</p>
      <h1>This page is not in the index.</h1>
      <a className="explore" href="/">Return to the registry</a>
    </section>
  );
}

function Footer({ lastEditorialUpdateAt }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span>Discovery Index</span>
        <span>Real discoveries, explained clearly.</span>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <a href="/">Discoveries</a>
        <a href="/method">Method</a>
        <a href="/about">About</a>
      </nav>
      <span>
        {lastEditorialUpdateAt
          ? `Last editorial update ${formatDateTime(lastEditorialUpdateAt)}`
          : "Editorial update time pending"}
      </span>
    </footer>
  );
}

export function App() {
  const [registry, setRegistry] = useState({
    verified: [],
    underReview: [],
    generatedAt: null,
    lastEditorialUpdateAt: null,
  });
  const [state, setState] = useState("loading");
  const path = normalizePath(window.location.pathname);
  const recordSlug = path.match(/^\/discoveries\/([^/]+)$/)?.[1] || null;
  const discoveries = [...registry.verified, ...registry.underReview];
  const selectedDiscovery = recordSlug
    ? discoveries.find((discovery) => discovery.slug === recordSlug)
    : null;

  useEffect(() => {
    document.title = selectedDiscovery
      ? `${selectedDiscovery.title} — Discovery Index`
      : recordSlug
        ? "Discovery record — Discovery Index"
        : PAGE_TITLES[path] || "Page not found — Discovery Index";
  }, [path, recordSlug, selectedDiscovery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRegistry() {
      try {
        const response = await fetch("/api/registry", {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Registry request failed: ${response.status}`);
        const data = await response.json();
        setRegistry(data);
        setState("ready");
      } catch (error) {
        if (error.name !== "AbortError") setState("error");
      }
    }

    loadRegistry();
    return () => controller.abort();
  }, []);

  let content;
  if (path === "/") content = <HomePage registry={registry} state={state} />;
  else if (recordSlug) {
    content = <DiscoveryRecordPage discovery={selectedDiscovery} state={state} />;
  }
  else if (path === "/about") content = <AboutPage />;
  else if (path === "/method" || path === "/how-it-works") content = <HowItWorksPage />;
  else content = <NotFoundPage />;

  return (
    <main className="page">
      <Header path={path} />
      <RegistryStatusBar registry={registry} state={state} />
      {content}
      <Footer lastEditorialUpdateAt={registry.lastEditorialUpdateAt} />
    </main>
  );
}
