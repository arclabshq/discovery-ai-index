import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Newly reported",
};

const TABLE_STATUS_COPY = {
  verified: "Verified",
  under_review: "Newly reported",
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

const VELOCITY_BUCKETS = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];

function parseUtcDate(value) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function startOfPeriod(date, bucket) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (bucket === "year") {
    return new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
  }
  if (bucket === "month") {
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  }
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return start;
}

function shiftPeriod(date, bucket, amount) {
  const shifted = new Date(date);
  if (bucket === "year") shifted.setUTCFullYear(shifted.getUTCFullYear() + amount);
  if (bucket === "month") shifted.setUTCMonth(shifted.getUTCMonth() + amount);
  if (bucket === "week") shifted.setUTCDate(shifted.getUTCDate() + amount * 7);
  return shifted;
}

function periodKey(date, bucket) {
  if (bucket === "year") return String(date.getUTCFullYear());
  if (bucket === "month") {
    return `${date.getUTCFullYear()}-${padNumber(date.getUTCMonth() + 1)}`;
  }
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const weekNumber =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${thursday.getUTCFullYear()}-W${padNumber(weekNumber)}`;
}

function periodLabel(date, bucket) {
  if (bucket === "year") return String(date.getUTCFullYear());
  if (bucket === "month") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildVelocitySeries(discoveries, bucket) {
  const announcedDates = discoveries.map((item) => parseUtcDate(item.announcedAt)).filter(Boolean);
  const verifiedDates = discoveries.map((item) => parseUtcDate(item.verifiedAt)).filter(Boolean);
  const eventDates = [...announcedDates, ...verifiedDates].sort((a, b) => a - b);
  if (!eventDates.length) return { rows: [], max: 1, rangeLabel: "No dated records" };

  const latest = startOfPeriod(eventDates[eventDates.length - 1], bucket);
  const earliest = startOfPeriod(eventDates[0], bucket);
  const maximumPeriods = bucket === "year" ? 20 : bucket === "month" ? 24 : 26;
  const limitedStart = shiftPeriod(latest, bucket, -(maximumPeriods - 1));
  const start = limitedStart > earliest ? limitedStart : earliest;
  const rows = [];

  for (let cursor = new Date(start); cursor <= latest; cursor = shiftPeriod(cursor, bucket, 1)) {
    const key = periodKey(cursor, bucket);
    rows.push({
      key,
      label: periodLabel(cursor, bucket),
      announced: announcedDates.filter((date) => periodKey(startOfPeriod(date, bucket), bucket) === key)
        .length,
      verified: verifiedDates.filter((date) => periodKey(startOfPeriod(date, bucket), bucket) === key)
        .length,
    });
  }

  const max = Math.max(1, ...rows.map((row) => row.announced + row.verified));
  const firstLabel = rows[0]?.label || "";
  const lastLabel = rows[rows.length - 1]?.label || "";
  return {
    rows,
    max,
    rangeLabel: firstLabel && lastLabel && firstLabel !== lastLabel ? `${firstLabel} – ${lastLabel}` : lastLabel,
  };
}

function medianDaysToVerify(discoveries) {
  const durations = discoveries
    .map((item) => {
      const announced = parseUtcDate(item.announcedAt);
      const verified = parseUtcDate(item.verifiedAt);
      return announced && verified ? (verified - announced) / 86400000 : null;
    })
    .filter((value) => value !== null && value >= 0)
    .sort((a, b) => a - b);
  if (!durations.length) return null;
  const middle = Math.floor(durations.length / 2);
  return durations.length % 2
    ? durations[middle]
    : (durations[middle - 1] + durations[middle]) / 2;
}

function formatDays(value) {
  if (value === null) return "—";
  if (value < 1) return "Same day";
  return `${Math.round(value)} ${Math.round(value) === 1 ? "day" : "days"}`;
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
        <b>Newly reported</b>
        <em>Independent evidence still open</em>
      </span>
    </div>
  );
}

function VelocityPanel({ discoveries }) {
  const [bucket, setBucket] = useState("month");
  const series = useMemo(() => buildVelocitySeries(discoveries, bucket), [discoveries, bucket]);
  const verified = discoveries.filter((item) => item.status === "verified").length;
  const underReview = discoveries.length - verified;
  const medianVerificationDays = medianDaysToVerify(discoveries);
  const labelStep = bucket === "year" ? 1 : bucket === "month" ? 2 : 4;

  return (
    <section className="velocity-panel" aria-labelledby="velocity-title">
      <header className="velocity-heading">
        <div>
          <p className="section-kicker">Discovery velocity</p>
          <h2 id="velocity-title">How quickly are AI-assisted findings entering the record?</h2>
          <p>
            Announced records show research activity. Verified records show when the Index
            completed its evidence review. Neither is a ranking of scientific importance.
          </p>
        </div>
        <div className="velocity-buckets" role="group" aria-label="Velocity time scale">
          {VELOCITY_BUCKETS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={bucket === option.value ? "is-selected" : ""}
              aria-pressed={bucket === option.value}
              onClick={() => setBucket(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="velocity-stats" aria-label="Registry velocity metrics">
        <div>
          <span>Records</span>
          <strong>{discoveries.length}</strong>
          <small>Verified and newly reported</small>
        </div>
        <div>
          <span>Verified</span>
          <strong>{verified}</strong>
          <small>Review complete</small>
        </div>
        <div>
          <span>Newly reported</span>
          <strong>{underReview}</strong>
          <small>Independent evidence open</small>
        </div>
        <div>
          <span>Median announce → verify</span>
          <strong>{formatDays(medianVerificationDays)}</strong>
          <small>Recorded dates, including backfills</small>
        </div>
      </div>

      <div className="velocity-chart-shell">
        <div className="velocity-chart-heading">
          <div className="velocity-legend" aria-label="Chart legend">
            <span><i className="velocity-swatch announced-swatch" />Records announced</span>
            <span><i className="velocity-swatch verified-swatch" />Verification completed</span>
          </div>
          <span>{series.rangeLabel}</span>
        </div>
        <div className="velocity-chart-scroll">
          <div
            className="velocity-chart"
            role="img"
            aria-label={`Discovery velocity chart for ${series.rangeLabel}. Each period is one stacked column: records announced are light blue and verification completed are dark blue.`}
          >
            {series.rows.map((row, index) => (
              <div
                className="velocity-period"
                key={row.key}
                title={`${row.label}: ${row.announced} announced, ${row.verified} verified`}
              >
                <div className="velocity-bars" aria-hidden="true">
                  <span
                    className="velocity-bar-stack"
                    style={{
                      height: row.announced + row.verified
                        ? `${Math.max(5, ((row.announced + row.verified) / series.max) * 100)}%`
                        : "0%",
                    }}
                  >
                    <span
                      className="velocity-bar-segment announced-bar"
                      style={{
                        height: row.announced + row.verified
                          ? `${(row.announced / (row.announced + row.verified)) * 100}%`
                          : "0%",
                      }}
                    />
                    <span
                      className="velocity-bar-segment verified-bar"
                      style={{
                        height: row.announced + row.verified
                          ? `${(row.verified / (row.announced + row.verified)) * 100}%`
                          : "0%",
                      }}
                    />
                  </span>
                </div>
                <span className="velocity-period-label">
                  {index % labelStep === 0 || index === series.rows.length - 1
                    ? row.label
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="velocity-note">
          Each column stacks announced and verification events. Announced uses each record&apos;s
          research date; verification uses the date the Index completed review. Historical backfills
          may be same-day, so the chart describes catalog activity, not research quality.
        </p>
        <table className="velocity-data-table sr-only">
          <caption>Discovery velocity data by {bucket}</caption>
          <thead>
            <tr><th scope="col">Period</th><th scope="col">Announced</th><th scope="col">Verified</th></tr>
          </thead>
          <tbody>
            {series.rows.map((row) => (
              <tr key={`${row.key}-accessible`}>
                <th scope="row">{row.label}</th>
                <td>{row.announced}</td>
                <td>{row.verified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RegistryStatusFilter({ value, onChange, counts }) {
  const options = [
    { value: "all", label: "All", count: counts.all },
    { value: "verified", label: "Verified", count: counts.verified },
    { value: "under_review", label: "New", count: counts.underReview },
  ];

  return (
    <fieldset className="registry-status-filter">
      <legend>Show</legend>
      <div className="registry-status-buttons">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={value === option.value ? "is-selected" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label} <span>{option.count}</span>
          </button>
        ))}
      </div>
    </fieldset>
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
          <col className="col-discovery" />
          <col className="col-model" />
          <col className="col-evidence" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Announced</th>
            <th scope="col">Breakthrough</th>
            <th scope="col">AI system</th>
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
                <td className="record-title" data-label="Breakthrough">
                  <div className="record-title-meta">
                    <span>{discovery.field}</span>
                    <i aria-hidden="true">·</i>
                    <span>{discoveryTypeLabel(discovery.discoveryType)}</span>
                  </div>
                  <h3>
                    <a
                      className="record-link"
                      href={`/discoveries/${discovery.slug}`}
                      aria-label={`View record: ${discovery.title}`}
                    >
                      {discovery.title} <span aria-hidden="true">→</span>
                    </a>
                  </h3>
                  <p className="record-row-summary">{discovery.summary}</p>
                </td>
                <td className="record-model" data-label="AI system">
                  <strong>{discovery.aiSystem}</strong>
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
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
    () => {
      const searchNeedle = search.trim().toLowerCase();
      return discoveries.filter((item) => {
        const searchable = [
          item.title,
          item.summary,
          item.field,
          item.aiSystem,
          item.whyItMatters,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (field === "All fields" || item.field === field) &&
          (discoveryType === "All types" ||
            (item.discoveryType || "unclassified") === discoveryType) &&
          (validationStage === "All evidence" ||
            (item.validationStage || "not_assessed") === validationStage) &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (!searchNeedle || searchable.includes(searchNeedle))
        );
      });
    },
    [discoveries, discoveryType, field, search, statusFilter, validationStage],
  );
  const visibleVerified = filtered.filter((item) => item.status === "verified").length;
  const visibleUnderReview = filtered.length - visibleVerified;
  const counts = {
    all: discoveries.length,
    verified: registry.verified.length,
    underReview: registry.underReview.length,
  };
  const hasActiveFilters =
    Boolean(search.trim()) ||
    field !== "All fields" ||
    discoveryType !== "All types" ||
    validationStage !== "All evidence" ||
    statusFilter !== "all";
  const clearFilters = () => {
    setField("All fields");
    setDiscoveryType("All types");
    setValidationStage("All evidence");
    setStatusFilter("all");
    setSearch("");
  };

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

      {state === "ready" && <VelocityPanel discoveries={discoveries} />}

      <section className="registry-toolbar" id="registry">
        <div>
          <p className="section-kicker">Discovery registry</p>
          <h2>A focused record of new knowledge, designs, and proofs.</h2>
          <p className="registry-deck">
            {state === "ready"
              ? "Filter by title, field, AI system, or evidence stage."
              : "Every record links to the original research."}
          </p>
        </div>
        <div className="registry-controls">
          <label className="registry-search-field">
            Search
            <input
              type="search"
              value={search}
              placeholder="Title, field, or AI system"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <RegistryStatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />
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

      <div className="registry-filter-summary" aria-live="polite">
        <span>
          {filtered.length} {filtered.length === 1 ? "record" : "records"} shown · {visibleVerified} verified · {visibleUnderReview} newly reported
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
      <RegistryState state={state} />

      {state === "ready" && (
        <>
          <p className="sr-only" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "discovery" : "discoveries"} shown:
            {" "}{visibleVerified} verified and {visibleUnderReview} newly reported.
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
          <p className="section-kicker amber">Orange · newly reported</p>
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
            The automated scan looks for new candidate discoveries, and Luna Max rechecks under-review
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
