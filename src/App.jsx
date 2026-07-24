import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Under review",
};

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-researchers", label: "For researchers" },
  { href: "/newsroom", label: "Newsroom" },
];

const PAGE_TITLES = {
  "/": "Discovery Index — Verified AI-assisted discoveries",
  "/about": "About — Discovery Index",
  "/how-it-works": "How it works — Discovery Index",
  "/for-researchers": "For researchers — Discovery Index",
  "/newsroom": "Newsroom — Discovery Index",
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

function Header({ path }) {
  return (
    <header className="nav">
      <a className="brand" href="/" aria-label="Discovery Index home">
        <span className="brand-mark" />
        Discovery Index
      </a>
      <nav aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <a
            href={item.href}
            key={item.href}
            aria-current={path === item.href ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <a className="explore" href="/#registry">
        Explore discoveries
      </a>
    </header>
  );
}

function NewsTicker({ registry, state }) {
  const count =
    state === "ready" ? `${registry.verified.length} verified records` : "Opening registry";
  const latest = registry.verified[0]?.title || "Evidence first";
  const items = [
    count,
    "Primary sources",
    `Latest: ${latest}`,
    "Human editorial review",
    "No automatic publishing",
  ];

  return (
    <div className="ticker" aria-label={items.join(". ")}>
      <strong>REGISTRY</strong>
      <div className="ticker-window">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <div className="ticker-group" aria-hidden={copy === 1} key={copy}>
              {items.map((item) => (
                <span className="ticker-item" key={`${copy}-${item}`}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
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
        <caption className="sr-only">Verified AI-assisted discovery registry</caption>
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
            <th scope="col">Discovery</th>
            <th scope="col">Plain-language summary</th>
            <th scope="col">AI system</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {discoveries.map((discovery) => (
            <tr key={discovery.id}>
              <td className="record-date">
                <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
              </td>
              <td className="record-field">{discovery.field}</td>
              <td className="record-title">
                <h3>{discovery.title}</h3>
              </td>
              <td className="record-summary">{discovery.summary}</td>
              <td className="record-system">
                <strong>{discovery.aiSystem}</strong>
              </td>
              <td className="record-evidence">
                <span className="status verified">{STATUS_COPY[discovery.status]}</span>
                <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
                  Primary source <span aria-hidden="true">↗</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <p>{discovery.summary}</p>
      </div>
      <div className="review-evidence">
        <b>What remains open</b>
        <p>{discovery.verificationNote}</p>
        <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
          Inspect the primary source <span aria-hidden="true">↗</span>
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
          <p className="section-kicker amber">Editorial desk · not yet verified</p>
          <h2>Under review</h2>
        </div>
        <p>
          These are reported results, not verified registry entries. They remain separate until
          an editor records the completed checks.
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
      <section className="registry-intro" id="registry">
        <div>
          <p className="section-kicker">Verified registry</p>
          <h1>AI-assisted discoveries, with receipts.</h1>
          <p>
            A plain-language index of results that can be traced to primary evidence. Start with
            the table; open the source when something catches your eye.
          </p>
        </div>
        <label>
          Field
          <select value={field} onChange={(event) => setField(event.target.value)}>
            {fields.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <RegistryState state={state} />

      {state === "ready" && (
        <>
          {filtered.length ? (
            <VerifiedTable discoveries={filtered} />
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
        title="A public index for a simple question."
        deck="When an AI system is credited with a scientific or mathematical result, what happened—and what evidence supports the claim?"
      />
      <section className="editorial-layout">
        <div className="prose">
          <h2>Built for curious readers</h2>
          <p>
            Discovery Index translates technical results without sanding off the distinction
            between a model’s suggestion, a checked result, and a published finding. Each
            verified record names the system, dates the result, and links directly to the
            research.
          </p>
          <h2>Deliberately narrow</h2>
          <p>
            This is not a catalog of every AI paper or product claim. A record belongs here when
            AI played a material role in producing a new result and the result can be inspected
            through primary evidence.
          </p>
        </div>
        <aside className="fact-card">
          <p className="section-kicker">The record answers</p>
          <dl>
            <div>
              <dt>What changed?</dt>
              <dd>A plain account of the new result.</dd>
            </div>
            <div>
              <dt>Which system?</dt>
              <dd>The named model, agent, or method.</dd>
            </div>
            <div>
              <dt>Why trust it?</dt>
              <dd>The strongest available primary evidence.</dd>
            </div>
          </dl>
        </aside>
      </section>
    </>
  );
}

function HowItWorksPage() {
  return (
    <>
      <PageHero
        kicker="How it works"
        title="A record earns its status."
        deck="Automation can surface a lead. It cannot publish one. The public labels describe what the editorial desk has actually checked."
      />
      <section className="status-explainer">
        <article>
          <span className="status-dot candidate-dot" />
          <p className="section-kicker">Candidate · private</p>
          <h2>A lead, not a public claim</h2>
          <p>
            Scheduled source scans may create a private candidate. It stays off the site until an
            editor confirms the source is relevant and writes the record.
          </p>
        </article>
        <article>
          <span className="status-dot review-dot" />
          <p className="section-kicker amber">Under review · public</p>
          <h2>Interesting, with open checks</h2>
          <p>
            Readers can inspect the primary source and see exactly what remains unresolved. This
            lane never counts as part of the verified registry.
          </p>
        </article>
        <article>
          <span className="status-dot verified-dot" />
          <p className="section-kicker">Verified record · public</p>
          <h2>Evidence recorded</h2>
          <p>
            An editor has confirmed the AI’s role, the result, the source, and the available
            validation, then recorded a publication note.
          </p>
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
    </>
  );
}

function ResearchersPage() {
  return (
    <>
      <PageHero
        kicker="For researchers"
        title="Make the evidence easy to inspect."
        deck="The strongest candidate records arrive with a primary source, a precise account of the AI system’s role, and a clear line between generated output and human validation."
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
          <p className="section-kicker">Current intake</p>
          <h2>Editorially sourced, by design</h2>
        </div>
        <p>
          The desk currently finds leads in primary literature and institutional research
          announcements. A public submission form will not open until it can preserve the same
          evidence and review trail as the registry.
        </p>
        <a className="text-link" href="/how-it-works">
          Read the editorial method <span aria-hidden="true">→</span>
        </a>
      </section>
    </>
  );
}

function NewsroomPage({ registry, state }) {
  return (
    <>
      <PageHero
        kicker="Newsroom"
        title="What the editorial desk is tracking."
        deck="New records appear here with their status visible. Under-review items are leads with open checks—not additions to the verified count."
      />
      <RegistryState state={state} />
      {state === "ready" && (
        <>
          <ReviewLane discoveries={registry.underReview} />
          <section className="news-verified">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Recently verified</p>
                <h2>Added to the registry</h2>
              </div>
              <a className="text-link" href="/#registry">
                Open the full table <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="news-list">
              {registry.verified.slice(0, 4).map((discovery) => (
                <article key={discovery.id}>
                  <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
                  <span>{discovery.field}</span>
                  <h3>{discovery.title}</h3>
                  <strong>{discovery.aiSystem}</strong>
                  <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
                    Primary source <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </section>
        </>
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
    <footer>
      <span>Discovery Index</span>
      <span>Built for curiosity. Edited for evidence.</span>
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
