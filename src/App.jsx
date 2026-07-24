import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Under review",
};

const NAV_ITEMS = [
  { href: "/#registry", label: "Discoveries", match: "/" },
  { href: "/how-it-works", label: "How we verify", match: "/how-it-works" },
  { href: "/about", label: "About", match: "/about" },
];

const PAGE_TITLES = {
  "/": "Discovery Index — See what AI is helping us discover",
  "/about": "About — Discovery Index",
  "/how-it-works": "How we verify — Discovery Index",
  "/for-researchers": "For researchers — Discovery Index",
  "/newsroom": "Newsroom — Discovery Index",
};

const TICKER_FIELD_LABELS = {
  Mathematics: "MATH",
  "Computer science": "COMPUTING",
  "Materials science": "MATERIALS",
  Biology: "BIOLOGY",
  Medicine: "HEALTHCARE",
  Biomedicine: "HEALTHCARE",
};

const TICKER_SYSTEM_LABELS = {
  "disc-openai-unit-distance": "OPENAI",
  "disc-funsearch": "GOOGLE DEEPMIND / FUNSEARCH",
  "disc-gnome": "GOOGLE DEEPMIND / GNOME",
  "disc-alphatensor": "GOOGLE DEEPMIND / ALPHATENSOR",
  "disc-alphafold2": "GOOGLE DEEPMIND / ALPHAFOLD",
  "disc-halicin": "MIT / DRUG DISCOVERY MODEL",
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

function normalizePath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function tickerField(field) {
  return TICKER_FIELD_LABELS[field] || field.toUpperCase();
}

function tickerSystem(discovery) {
  return TICKER_SYSTEM_LABELS[discovery.id] || discovery.aiSystem.toUpperCase();
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
            aria-current={path === item.match ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <a className="explore" href="/#registry">
        Latest discoveries
      </a>
    </header>
  );
}

function NewsTicker({ registry, state }) {
  const items = useMemo(
    () =>
      state === "ready"
        ? registry.verified.map((discovery) => ({
            id: discovery.id,
            href: `/#record-${discovery.slug}`,
            label: `${tickerField(discovery.field)} · ${tickerSystem(discovery)} · ${discovery.title}`,
          }))
        : [],
    [registry.verified, state],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const interval = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % items.length),
      6500,
    );
    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  const activeItem = items[activeIndex];

  return (
    <div
      className="ticker"
      aria-label={
        items.length
          ? `Verified breakthroughs. ${items.map((item) => item.label).join(". ")}`
          : "Loading breakthroughs"
      }
    >
      <strong>BREAKTHROUGHS</strong>
      <div className="ticker-window" aria-live="off">
        {activeItem ? (
          <a className="ticker-current" href={activeItem.href} key={activeItem.id}>
            {activeItem.label}
          </a>
        ) : (
          <span className="ticker-loading">Opening verified breakthroughs…</span>
        )}
      </div>
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

function VerifiedTable({ discoveries }) {
  return (
    <div className="table-scroll">
      <table className="registry-table">
        <caption className="sr-only">Verified research breakthroughs involving AI</caption>
        <colgroup>
          <col className="col-date" />
          <col className="col-field" />
          <col className="col-discovery" />
          <col className="col-summary" />
          <col className="col-system" />
          <col className="col-evidence" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Announced</th>
            <th scope="col">Field</th>
            <th scope="col">Breakthrough</th>
            <th scope="col">Why this matters</th>
            <th scope="col">How AI helped</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {discoveries.map((discovery) => (
            <tr id={`record-${discovery.slug}`} key={discovery.id}>
              <td className="record-date" data-label="Announced">
                <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
              </td>
              <td className="record-field" data-label="Field">{discovery.field}</td>
              <td className="record-title" data-label="What was discovered">
                <h3>{discovery.title}</h3>
                <p>{discovery.summary}</p>
              </td>
              <td className="record-summary" data-label="Why this matters">
                {discovery.whyItMatters}
              </td>
              <td className="record-system" data-label="How AI helped">
                <p>
                  {discovery.aiRole ||
                    "The original research documents how the system contributed to the result."}
                </p>
                <strong>{discovery.aiSystem}</strong>
              </td>
              <td className="record-evidence" data-label="Evidence">
                <span className="status verified">{STATUS_COPY[discovery.status]}</span>
                <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
                  Original research <span aria-hidden="true">↗</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiscoveryCard({ discovery, featured = false }) {
  return (
    <article
      className={`discovery-card${featured ? " featured" : ""}`}
      id={`record-${discovery.slug}`}
    >
      <header className="discovery-meta">
        <span>{discovery.field}</span>
        <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
        <span className="status verified">{STATUS_COPY[discovery.status]}</span>
      </header>
      <div className="discovery-card-body">
        <div className="discovery-result">
          <p className="card-label">What was discovered</p>
          <h3>{discovery.title}</h3>
          <p>{discovery.summary}</p>
        </div>
        <div className="discovery-impact">
          <p className="card-label">Why this matters</p>
          <p>{discovery.whyItMatters}</p>
        </div>
      </div>
      <footer className="discovery-support">
        <div className="discovery-ai-role">
          <p className="card-label">How AI helped</p>
          <p>
            {discovery.aiRole ||
              "The original research documents how the system contributed to the result."}
          </p>
          <strong>{discovery.aiSystem}</strong>
        </div>
        <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
          Read the original research <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </article>
  );
}

function VerifiedCards({ discoveries }) {
  return (
    <div className="discovery-grid">
      {discoveries.map((discovery, index) => (
        <DiscoveryCard discovery={discovery} featured={index === 0} key={discovery.id} />
      ))}
    </div>
  );
}

function MobileLeaderboard({ discoveries }) {
  return (
    <section className="mobile-leaderboard" aria-labelledby="mobile-leaderboard-title">
      <h2 className="sr-only" id="mobile-leaderboard-title">
        Verified discoveries, newest first
      </h2>
      <p className="leaderboard-note">Newest first · Reference numbers, not rankings</p>
      <div className="leaderboard-header" aria-hidden="true">
        <span>No.</span>
        <span>Breakthrough</span>
        <span>Details</span>
      </div>
      <ol>
        {discoveries.map((discovery, index) => (
          <li id={`record-${discovery.slug}`} key={discovery.id}>
            <details className="leaderboard-row">
              <summary data-testid={`leaderboard-row-${discovery.slug}`}>
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
                  <span className="leaderboard-why">{discovery.whyItMatters}</span>
                  <span className="leaderboard-footer">
                    <strong>{discovery.aiSystem}</strong>
                    <span className="leaderboard-status">Verified</span>
                  </span>
                </span>
                <span className="leaderboard-action" aria-hidden="true">
                  <span className="action-open">View</span>
                  <span className="action-close">Close</span>
                </span>
              </summary>
              <div className="leaderboard-detail">
                <div>
                  <h3>What was discovered</h3>
                  <p>{discovery.summary}</p>
                </div>
                <div>
                  <h3>How AI helped</h3>
                  <p>
                    {discovery.aiRole ||
                      "The original research documents how the system contributed to the result."}
                  </p>
                </div>
                <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
                  Read the original research <span aria-hidden="true">↗</span>
                </a>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReviewCard({ discovery }) {
  return (
    <article className="review-card">
      <div className="review-meta">
        <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
        <span className="status reviewing">Under review</span>
      </div>
      <div className="review-copy">
        <p className="review-field">{discovery.field}</p>
        <strong className="review-system">{discovery.aiSystem}</strong>
        <h3>{discovery.title}</h3>
        <div className="review-plain-language">
          <p><b>What was discovered</b>{discovery.summary}</p>
          <p><b>Why this matters</b>{discovery.whyItMatters}</p>
          <p>
            <b>How AI helped</b>
            {discovery.aiRole ||
              "The original research documents how the system contributed to the result."}
          </p>
        </div>
      </div>
      <div className="review-evidence">
        <b>What still needs to be confirmed</b>
        <p>{discovery.verificationNote}</p>
        <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
          Read the original research <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function ReviewLane({ discoveries, compact = false }) {
  const visible = compact ? discoveries.slice(0, 2) : discoveries;

  return (
    <section className="review-section">
      <div className="section-heading">
        <div>
          <p className="section-kicker amber">Promising findings · still being checked</p>
          <h2>Under review</h2>
        </div>
        <p>
          These findings could be important, but they have not yet met the evidence standard for
          the verified list.
        </p>
      </div>
      <div className="review-list">
        {visible.map((discovery) => (
          <ReviewCard discovery={discovery} key={discovery.id} />
        ))}
      </div>
      {compact && discoveries.length > visible.length && (
        <a className="text-link review-more" href="/newsroom">
          See every record under review <span aria-hidden="true">→</span>
        </a>
      )}
    </section>
  );
}

function HomePage({ registry, state }) {
  const [field, setField] = useState("All fields");
  const [view, setView] = useState("stories");
  const isMobile = useMediaQuery("(max-width: 760px)");
  const fields = useMemo(
    () => ["All fields", ...new Set(registry.verified.map((item) => item.field))],
    [registry.verified],
  );
  const filtered = useMemo(
    () =>
      field === "All fields"
        ? registry.verified
        : registry.verified.filter((item) => item.field === field),
    [field, registry.verified],
  );

  return (
    <>
      <section className="registry-intro">
        <p className="section-kicker">Verified AI-assisted breakthroughs</p>
        <h1>Real discoveries AI helped make.</h1>
        <p>
          Explore documented advances in medicine, biology, mathematics, materials, and
          computing—explained in plain English and linked to the original research.
        </p>
      </section>

      <section className="registry-toolbar" id="registry">
        <div>
          <p className="section-kicker">Verified discoveries</p>
          <h2>See what changed—and why it matters.</h2>
          <p className="registry-deck">
            Start with the result. Then see how AI helped and inspect the evidence yourself.
          </p>
        </div>
        <div className="registry-controls">
          <div className="view-switch" role="group" aria-label="Discovery layout">
            <button
              aria-pressed={view === "stories"}
              onClick={() => setView("stories")}
              type="button"
            >
              Story view
            </button>
            <button
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              type="button"
            >
              Table view
            </button>
          </div>
          <label id="fields">
            Field
            <select value={field} onChange={(event) => setField(event.target.value)}>
              {fields.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <details className="verification-key">
            <summary>What “verified” means</summary>
            <p>The primary evidence was checked, the result was bounded, and its limitations were recorded.</p>
          </details>
        </div>
      </section>

      <RegistryState state={state} />

      {state === "ready" && (
        <>
          <p className="sr-only" aria-live="polite">
            {filtered.length} verified {filtered.length === 1 ? "discovery" : "discoveries"} shown.
          </p>
          {filtered.length ? (
            isMobile ? (
              <MobileLeaderboard discoveries={filtered} />
            ) : view === "stories" ? (
              <VerifiedCards discoveries={filtered} />
            ) : (
              <VerifiedTable discoveries={filtered} />
            )
          ) : (
            <section className="registry-state">
              <p>No verified records match this field yet.</p>
            </section>
          )}
          <ReviewLane discoveries={registry.underReview} compact />
        </>
      )}
    </>
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
    </>
  );
}

function HowItWorksPage() {
  const steps = [
    ["Trace the original evidence", "We start with the paper, proof, code, dataset, or institutional research report—not a social post or secondhand headline."],
    ["Check what actually changed", "We confirm the new result, how AI contributed, how people tested it, and what limitations or open questions remain."],
    ["Explain it plainly", "Every public record tells readers what was discovered, why the advancement matters, and where they can inspect the evidence."],
  ];

  return (
    <>
      <PageHero
        kicker="How we verify"
        title="How a breakthrough earns a verified status."
        deck="A verified record is more than a promising headline. It has traceable evidence, a bounded claim, and a plain-English explanation of what the research advances."
      />
      <section className="method-steps" aria-label="Editorial process">
        <ol>
          {steps.map(([title, copy], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="status-explainer status-legend">
        <article>
          <span className="status-dot candidate-dot" />
          <p className="section-kicker">Candidate · private</p>
          <h2>A lead, not a public claim</h2>
          <p>A source scan or editor has found a possible result. It does not appear publicly.</p>
        </article>
        <article>
          <span className="status-dot review-dot" />
          <p className="section-kicker amber">Under review · public</p>
          <h2>Credible, with open checks</h2>
          <p>Readers can inspect the source and see exactly what remains unresolved.</p>
        </article>
        <article>
          <span className="status-dot verified-dot" />
          <p className="section-kicker">Verified record · public</p>
          <h2>Evidence recorded</h2>
          <p>An editor has checked the AI’s role, result, source, validation, and limitations.</p>
        </article>
      </section>
      <section className="checklist">
        <div>
          <p className="section-kicker">Editorial checks</p>
          <h2>What gets examined</h2>
        </div>
        <ul>
          <li><strong>Novelty</strong><span>Is the result actually new, and is that claim bounded?</span></li>
          <li><strong>AI’s role</strong><span>Did the system generate, search, predict, or only summarize?</span></li>
          <li><strong>Validation</strong><span>Was the output formally checked, benchmarked, or tested experimentally?</span></li>
          <li><strong>Limitations</strong><span>What still needs review, replication, or independent confirmation?</span></li>
        </ul>
      </section>
      <p className="method-note">
        Nothing enters the verified registry automatically. Every public status is an editorial
        decision backed by cited evidence.
      </p>
    </>
  );
}

function ResearchersPage() {
  return (
    <>
      <PageHero
        kicker="For researchers"
        title="Help make the evidence easy to inspect."
        deck="A strong candidate record includes a primary source, a precise account of the AI system’s role, and a clear line between generated output and human validation."
      />
      <section className="researcher-grid">
        <article>
          <p className="section-kicker">A useful record includes</p>
          <h2>Source details</h2>
          <ul>
            <li>A stable paper, proof, dataset, or institutional research URL</li>
            <li>The first public date of the result</li>
            <li>The exact AI system or method used</li>
            <li>A plain statement of what is genuinely new</li>
          </ul>
        </article>
        <article>
          <p className="section-kicker">Evidence details</p>
          <h2>Validation and limits</h2>
          <ul>
            <li>How outputs were checked independently of the model’s prose</li>
            <li>Whether review was formal, experimental, benchmarked, or expert-led</li>
            <li>What remains unreplicated or unpublished</li>
            <li>Where the authors’ interpretation begins</li>
          </ul>
        </article>
      </section>
      <section className="researcher-note">
        <div>
          <p className="section-kicker">Submissions and corrections</p>
          <h2>A public intake channel is next.</h2>
        </div>
        <p>
          The desk currently sources records from primary literature and institutional research
          announcements. A public submission and correction channel will open only when it can
          preserve the same evidence trail as the registry. Until then, no automated submission
          can become a public record.
        </p>
        <a className="text-link" href="/how-it-works">
          Read the editorial method <span aria-hidden="true">→</span>
        </a>
      </section>
    </>
  );
}

function NewsroomPage({ registry, state }) {
  const updates = useMemo(
    () =>
      [...registry.verified, ...registry.underReview]
        .map((discovery) => ({
          ...discovery,
          updateDate:
            discovery.status === "verified"
              ? discovery.publishedAt || discovery.verifiedAt || discovery.announcedAt
              : discovery.reviewStartedAt || discovery.announcedAt,
        }))
        .sort((a, b) => String(b.updateDate).localeCompare(String(a.updateDate))),
    [registry],
  );

  return (
    <>
      <PageHero
        kicker="Newsroom"
        title="The registry change log."
        deck="A dated record of breakthroughs entering verification, moving under review, and joining the public registry."
      />
      <RegistryState state={state} />
      {state === "ready" && (
        <section className="news-verified">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Latest movements</p>
              <h2>Changes to the public record</h2>
            </div>
            <p>
              Verified means the evidence checks were recorded. Under review means the claim is
              credible enough to inspect publicly but is not part of the verified count.
            </p>
          </div>
          <div className="news-list">
            {updates.map((discovery) => (
              <article key={discovery.id}>
                <time dateTime={discovery.updateDate}>{formatDate(discovery.updateDate)}</time>
                <span
                  className={
                    discovery.status === "verified"
                      ? "news-status-verified"
                      : "news-status-review"
                  }
                >
                  {discovery.status === "verified" ? "Added to registry" : "Entered review"}
                </span>
                <div>
                  <h3>{discovery.title}</h3>
                  <p>{discovery.whyItMatters}</p>
                </div>
                <strong>{discovery.aiSystem}</strong>
                <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
                  Primary source <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
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

function Footer({ generatedAt }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span>Discovery Index</span>
        <span>Real discoveries, explained clearly.</span>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <a href="/for-researchers">For researchers</a>
        <a href="/newsroom">Newsroom</a>
        <a href="/how-it-works">How we verify</a>
        <a href="/about">About</a>
      </nav>
      <span>
        {generatedAt
          ? `Registry checked ${new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(generatedAt))}`
          : "Durable registry"}
      </span>
    </footer>
  );
}

export function App() {
  const [registry, setRegistry] = useState({
    verified: [],
    underReview: [],
    generatedAt: null,
  });
  const [state, setState] = useState("loading");
  const path = normalizePath(window.location.pathname);

  useEffect(() => {
    document.title = PAGE_TITLES[path] || "Page not found — Discovery Index";
  }, [path]);

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
  else if (path === "/about") content = <AboutPage />;
  else if (path === "/how-it-works") content = <HowItWorksPage />;
  else if (path === "/for-researchers") content = <ResearchersPage />;
  else if (path === "/newsroom") content = <NewsroomPage registry={registry} state={state} />;
  else content = <NotFoundPage />;

  return (
    <main className="page">
      <Header path={path} />
      <NewsTicker registry={registry} state={state} />
      {content}
      <Footer generatedAt={registry.generatedAt} />
    </main>
  );
}
