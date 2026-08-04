import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Verification pending",
};

const TABLE_STATUS_COPY = {
  verified: "Verified",
  under_review: "Pending",
};

const DISCOVERY_TYPE_LABELS = {
  discovery: "Discovery",
  proof: "Proof",
  design: "Design",
  translation: "Translation",
  research_milestone: "Research milestone",
  unclassified: "Unclassified",
};

const VALIDATION_STAGE_LABELS = {
  not_assessed: "Not assessed",
  primary_source_only: "Primary source only",
  author_checked: "Author checked",
  author_reported_experimental: "Author-reported experiment",
  expert_checked: "Expert checked",
  formally_verified: "Formally verified",
  peer_reviewed: "Peer reviewed",
  statistical_validation: "Statistically validated",
  field_confirmed: "Field confirmed",
  lab_confirmed: "Lab confirmed",
  animal_study: "Animal study",
  human_cell_study: "Human-cell study",
  hardware_demonstration: "Hardware demonstration",
  human_trial: "Human trial",
  deployed: "Deployed",
};

const NAV_ITEMS = [
  { href: "/#registry", label: "Discoveries", match: "/" },
  { href: "/method", label: "Method", match: "/method" },
  { href: "/about", label: "About", match: "/about" },
];

const PAGE_TITLES = {
  "/": "Discovery AI Index — The global catalog of AI-enabled discoveries",
  "/about": "About — Discovery AI Index",
  "/method": "Method — Discovery AI Index",
  "/how-it-works": "Method — Discovery AI Index",
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

function discoveryTypeLabel(value) {
  return DISCOVERY_TYPE_LABELS[value] || "Discovery";
}

function validationStageLabel(value) {
  return VALIDATION_STAGE_LABELS[value] || "Published evidence";
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
      <a className="brand" href="/" aria-label="Discovery AI Index home">
        <span className="brand-mark" />
        Discovery AI Index
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

function BreakthroughTicker({ registry, state }) {
  const discoveries = registry.verified.slice(0, 8);

  return (
    <section className="breakthrough-ticker" aria-label="Latest verified breakthroughs">
      <strong>Latest discoveries</strong>
      <div className="ticker-window">
        {state === "ready" && discoveries.length ? (
          <div className="ticker-track">
            {[0, 1].map((copyIndex) => (
              <div
                className="ticker-group"
                aria-hidden={copyIndex === 1 ? "true" : undefined}
                key={copyIndex}
              >
                {discoveries.map((discovery) => (
                  <a
                    href={`/discoveries/${discovery.slug}`}
                    key={`${copyIndex}-${discovery.id}`}
                    tabIndex={copyIndex === 1 ? -1 : undefined}
                  >
                    <span>{discovery.field} breakthrough</span>
                    <b>{discovery.aiSystem}</b>
                    <em>{discovery.summary}</em>
                  </a>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <span className="ticker-state">
            {state === "error" ? "Discovery feed temporarily unavailable" : "Opening discovery feed…"}
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
                  <span className="record-type-label">
                    {discoveryTypeLabel(discovery.discoveryType)}
                  </span>
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
                  <span className="record-cell-clamp">{discovery.summary}</span>
                </td>
                <td className="record-impact" data-label="Why this matters">
                  <span className="record-cell-clamp">{discovery.whyItMatters}</span>
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
                  <small>{validationStageLabel(discovery.validationStage)}</small>
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
                    <span>{discoveryTypeLabel(discovery.discoveryType)}</span>
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
                    <span className="leaderboard-validation">
                      {validationStageLabel(discovery.validationStage)}
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
  const [discoveryType, setDiscoveryType] = useState("All types");
  const [validationStage, setValidationStage] = useState("All evidence");
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
  const discoveryTypes = useMemo(
    () => [
      "All types",
      ...new Set(discoveries.map((item) => item.discoveryType || "unclassified")),
    ],
    [discoveries],
  );
  const validationStages = useMemo(
    () => [
      "All evidence",
      ...new Set(discoveries.map((item) => item.validationStage || "not_assessed")),
    ],
    [discoveries],
  );
  const filtered = useMemo(
    () =>
      discoveries.filter(
        (item) =>
          (field === "All fields" || item.field === field) &&
          (discoveryType === "All types" ||
            (item.discoveryType || "unclassified") === discoveryType) &&
          (validationStage === "All evidence" ||
            (item.validationStage || "not_assessed") === validationStage),
      ),
    [discoveries, discoveryType, field, validationStage],
  );
  const visibleVerified = filtered.filter((item) => item.status === "verified").length;
  const visibleUnderReview = filtered.length - visibleVerified;

  return (
    <>
      <section className="registry-intro">
        <p className="section-kicker">Global discovery catalog</p>
        <h1>See what AI is helping humanity discover.</h1>
        <p>
          Explore discoveries across medicine, science, mathematics, and technology—explained
          simply, traced to the original research, and labeled by how each result was validated.
        </p>
      </section>

      <section className="registry-toolbar" id="registry">
        <div>
          <p className="section-kicker">Discovery registry</p>
          <h2>A growing record of new knowledge, designs, and proofs.</h2>
          <p className="registry-deck">
            {state === "ready"
              ? `${filtered.length} shown · ${visibleVerified} verified · ${visibleUnderReview} verification pending.`
              : "Every record links to the original research."}
          </p>
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
          <label>
            Discovery type
            <select
              value={discoveryType}
              onChange={(event) => setDiscoveryType(event.target.value)}
            >
              {discoveryTypes.map((item) => (
                <option key={item} value={item}>
                  {item === "All types" ? item : discoveryTypeLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Strongest check
            <select
              value={validationStage}
              onChange={(event) => setValidationStage(event.target.value)}
            >
              {validationStages.map((item) => (
                <option key={item} value={item}>
                  {item === "All evidence" ? item : validationStageLabel(item)}
                </option>
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
          <span>{discoveryTypeLabel(discovery.discoveryType)}</span>
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
                <dt>Discovery type</dt>
                <dd>{discoveryTypeLabel(discovery.discoveryType)}</dd>
              </div>
              <div>
                <dt>Strongest documented check</dt>
                <dd>{validationStageLabel(discovery.validationStage)}</dd>
              </div>
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
        title="The global catalog of discoveries materially enabled by AI."
        deck="Discovery AI Index makes advances across research visible beyond the fields where they happen—without flattening the evidence or overstating what has been proven."
      />
      <section className="editorial-layout">
        <div className="prose">
          <h2>Why this record matters</h2>
          <p>
            Benchmarks show what a model can do in a test. This catalog documents what people
            and AI systems have actually found, proved, designed, or moved into real-world
            testing.
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
          Discovery AI Index uses an AI-assisted editorial system to trace primary sources and
          document external verification. It does not independently prove claims or represent the
          researchers listed. Status changes are based on published evidence, constrained by explicit
          transition rules, and recorded with an editorial note.
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
        title="What was discovered—and how far it has been checked."
        deck="Every record separates the kind of contribution from its evidence maturity, then links directly to the original research."
      />
      <section className="type-explainer" aria-label="Discovery types">
        <article>
          <p className="section-kicker">Discovery</p>
          <h2>Found</h2>
          <p>A previously unknown object, pattern, molecule, mechanism, or hypothesis.</p>
        </article>
        <article>
          <p className="section-kicker">Proof</p>
          <h2>Proved</h2>
          <p>A new theorem, construction, algorithm, formula, or explanatory relationship.</p>
        </article>
        <article>
          <p className="section-kicker">Design</p>
          <h2>Designed</h2>
          <p>A new protein, gene editor, material, molecule, or engineered system.</p>
        </article>
        <article>
          <p className="section-kicker">Translation</p>
          <h2>Tested</h2>
          <p>An AI-originated result that reached deployment, animal studies, or human trials.</p>
        </article>
        <article>
          <p className="section-kicker">Research milestone</p>
          <h2>Enabled</h2>
          <p>A new research capability demonstrated in a blind test, laboratory, or physical system.</p>
        </article>
      </section>
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
            The record documents what changed, how AI contributed, the strongest completed
            check—from formal proof to field confirmation or human trial—and any material
            limitation that remains.
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
        A daily source scan can add private candidates. Luna Max then assesses the queue using the
        same evidence rules, while the site remains protected from code, schema, and deployment edits.
      </p>
      <section className="method-policies">
        <article>
          <p className="section-kicker">Update cadence</p>
          <h2>Evidence checks are date-stamped.</h2>
          <p>
            The automated scan looks for new candidate discoveries, and Luna Max rechecks pending
            records for paper revisions, peer review, formal checks, replications, corrections, and
            retractions. Every status or content change is written to the audit trail.
          </p>
        </article>
        <article>
          <p className="section-kicker">Corrections</p>
          <h2>The evidence trail stays intact.</h2>
          <p>Corrections are checked against primary sources and recorded as a new audited update.</p>
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
        <span>Discovery AI Index</span>
        <span>The global catalog of discoveries materially enabled by AI.</span>
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
      ? `${selectedDiscovery.title} — Discovery AI Index`
      : recordSlug
        ? "Discovery record — Discovery AI Index"
        : PAGE_TITLES[path] || "Page not found — Discovery AI Index";
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
      <BreakthroughTicker registry={registry} state={state} />
      {content}
      <Footer lastEditorialUpdateAt={registry.lastEditorialUpdateAt} />
    </main>
  );
}
