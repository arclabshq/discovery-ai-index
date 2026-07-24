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
  "/": "Discovery Index — The public record of AI-assisted discovery",
  "/about": "About — Discovery Index",
  "/how-it-works": "How it works — Discovery Index",
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
  const items =
    state === "ready"
      ? registry.verified.map(
          (discovery) =>
            `${tickerField(discovery.field)} BREAKTHROUGH · ${tickerSystem(discovery)} · ${discovery.summary}`,
        )
      : [];

  return (
    <div
      className="ticker"
      aria-label={
        items.length ? `Verified breakthroughs. ${items.join(". ")}` : "Loading breakthroughs"
      }
    >
      <strong>BREAKTHROUGHS</strong>
      <div className="ticker-window">
        {items.length ? (
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
            <th scope="col">Breakthrough</th>
            <th scope="col">Why it matters</th>
            <th scope="col">AI system</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {discoveries.map((discovery) => (
            <tr key={discovery.id}>
              <td className="record-date" data-label="Announced">
                <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
              </td>
              <td className="record-field" data-label="Field">{discovery.field}</td>
              <td className="record-title" data-label="What changed">
                <h3>{discovery.title}</h3>
                <p>{discovery.summary}</p>
              </td>
              <td className="record-summary" data-label="Why it matters">
                {discovery.whyItMatters}
              </td>
              <td className="record-system" data-label="AI system">
                <strong>{discovery.aiSystem}</strong>
              </td>
              <td className="record-evidence" data-label="Evidence">
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
        <div className="review-plain-language">
          <p><b>What changed</b>{discovery.summary}</p>
          <p><b>Why it matters</b>{discovery.whyItMatters}</p>
        </div>
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

function HomeMethod() {
  const steps = [
    ["Find the claim", "We monitor primary research and credible announcements for meaningful AI-assisted results."],
    ["Trace the evidence", "We check what the AI contributed, what humans checked, and whether the headline matches the source."],
    ["Explain it plainly", "Every record answers two questions: what changed, and why should anyone care?"],
    ["Assign a status", "An editor records verified, under review, or rejected. Nothing publishes automatically."],
  ];

  return (
    <section className="home-method" aria-labelledby="home-method-title">
      <div className="home-method-heading">
        <div>
          <p className="section-kicker">How it works</p>
          <h2 id="home-method-title">A claim has to earn its place in the public record.</h2>
        </div>
        <div>
          <p>
            AI discovery headlines move quickly. We slow them down long enough to check the
            evidence, explain the result, and show what is known—and what is not.
          </p>
          <a className="text-link" href="/how-it-works">
            Read the full editorial method <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <ol>
        {steps.map(([title, copy], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
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
      <section className="registry-intro">
        <p className="section-kicker">The public registry of AI-assisted discovery</p>
        <h1>See what AI is helping us discover—and why it matters.</h1>
        <p>
          Discovery Index turns documented breakthroughs in math, science, medicine, and
          computing into public proof points anyone can understand. See what changed, why it
          matters beyond the lab, and the evidence behind every verified claim.
        </p>
      </section>

      <section className="purpose-grid" aria-label="Why this registry exists">
        <article>
          <span>01</span>
          <h2>See the pace</h2>
          <p>Follow verified discoveries over time—not benchmark scores or launch-day claims.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Understand the significance</h2>
          <p>Learn what each result could change in language written for curious non-specialists.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Trace the proof</h2>
          <p>Open the paper, proof, code, or research announcement behind every record.</p>
        </article>
      </section>

      <section className="registry-toolbar" id="registry">
        <div>
          <p className="section-kicker">Verified breakthroughs</p>
          <h2>What changed. Why it matters. Where the proof lives.</h2>
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
      <HomeMethod />
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
    ["Find the claim", "We monitor papers, proofs, research announcements, and credible reporting for meaningful AI-assisted results."],
    ["Trace the evidence", "We locate the primary source and check what the AI contributed, what humans contributed, and whether the headline matches the result."],
    ["Explain it for everyone", "We write two short summaries: what changed and why it matters outside the specialist field."],
    ["Assign a status", "Verified records meet the standard. Under-review records have credible evidence with important checks still open."],
    ["Keep the record current", "Corrections, stronger evidence, and status changes are added as the public record develops."],
  ];

  return (
    <>
      <PageHero
        kicker="How it works"
        title="How a claim becomes part of the public record."
        deck="AI discovery claims move quickly. We slow them down long enough to check the evidence, explain them clearly, and show what is known—and what is not."
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
