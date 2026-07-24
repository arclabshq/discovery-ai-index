import { useEffect, useMemo, useState } from "react";

const STATUS_COPY = {
  verified: "Verified record",
  under_review: "Under review",
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

function DiscoveryRow({ discovery }) {
  return (
    <article className="story" role="row">
      <time className="story-date" dateTime={discovery.announcedAt} role="cell">
        <span className="mobile-label">Announced</span>
        {formatDate(discovery.announcedAt)}
      </time>
      <div className="story-title" role="cell">
        <span className="mobile-label">Discovery</span>
        <h3>{discovery.title}</h3>
        <p>{discovery.field}</p>
      </div>
      <div className="story-summary" role="cell">
        <span className="mobile-label">Plain-language summary</span>
        <p>{discovery.summary}</p>
      </div>
      <div className="story-system" role="cell">
        <span className="mobile-label">AI system</span>
        <strong>{discovery.aiSystem}</strong>
      </div>
      <div className="story-evidence" role="cell">
        <span className="status verified">{STATUS_COPY[discovery.status]}</span>
        <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
          Primary source <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
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
        <div className="review-system">
          <span>AI system</span>
          <strong>{discovery.aiSystem}</strong>
        </div>
        <h3>{discovery.title}</h3>
        <p>{discovery.summary}</p>
      </div>
      <div className="review-evidence">
        <b>What remains open</b>
        <p>{discovery.verificationNote}</p>
        <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
          Inspect the {discovery.sourceType.toLowerCase()} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export function App() {
  const [registry, setRegistry] = useState({
    verified: [],
    underReview: [],
    generatedAt: null,
  });
  const [state, setState] = useState("loading");
  const [field, setField] = useState("All fields");

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
  const featured = registry.verified[0];

  return (
    <main className="page">
      <header className="nav">
        <a className="brand" href="#top" aria-label="Discovery Index home">
          <span className="brand-mark" />
          Discovery Index
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#method">How it works</a>
          <a href="#researchers">For researchers</a>
          <a href="#newsroom">Newsroom</a>
        </nav>
        <a className="explore" href="#registry">
          Explore discoveries
        </a>
      </header>

      <div className="ticker" id="top">
        <strong>REGISTRY</strong>
        <span>{state === "ready" ? `${registry.verified.length} verified records` : "Loading records"}</span>
        <i />
        <span>Primary sources · human editorial review · no automatic publishing</span>
      </div>

      <section className="intro" id="about">
        <p className="eyebrow">A public record, not a hype feed</p>
        <h1>What did AI actually discover?</h1>
        <div className="intro-lower">
          <p>
            A carefully sourced index of discoveries made with artificial intelligence—and the
            evidence that separates a result from a claim.
          </p>
          <div className="hero-standard">
            <span>Editorial standard</span>
            <strong>Primary evidence before publication.</strong>
            <a href="#method">See how records are verified <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      {state === "loading" && (
        <section className="registry-state" aria-live="polite">
          <span className="state-rule" />
          <p>Opening the durable registry…</p>
        </section>
      )}

      {state === "error" && (
        <section className="registry-state error" role="alert">
          <p className="eyebrow">Registry unavailable</p>
          <h2>The evidence feed could not be loaded.</h2>
          <p>We do not substitute sample stories when the source registry is unavailable.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </section>
      )}

      {state === "ready" && (
        <>
          <section className="review-section" id="newsroom">
            <div className="section-heading">
              <div>
                <p className="section-kicker amber">Editorial desk · not yet verified</p>
                <h2>Under review now</h2>
              </div>
              <p>
                These are reported results, not verified registry entries. They remain visibly
                separate until an editor records the completed checks.
              </p>
            </div>
            <div className="review-list">
              {registry.underReview.map((discovery) => (
                <ReviewCard discovery={discovery} key={discovery.id} />
              ))}
            </div>
          </section>

          <section
            className="registry-controls"
            id="researchers"
            aria-label="Filter verified registry"
          >
            <div>
              <p className="section-kicker">Verified registry</p>
              <h2 id="registry">Records built for inspection</h2>
              <p className="registry-deck">
                Every entry names the AI system, explains the result plainly, and links to the
                original research.
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

          {featured ? (
            <>
              <article className="feature">
                <img
                  src="/assets/hero-geometry.png"
                  alt="Abstract geometric structure connected by fine brass lines"
                />
                <div className="feature-copy">
                  <div className="feature-meta">
                    <time dateTime={featured.announcedAt}>{formatDate(featured.announcedAt)}</time>
                    <span>{featured.field}</span>
                  </div>
                  <h2>{featured.title}</h2>
                  <p>{featured.summary}</p>
                  <div className="feature-system">
                    <span>AI system</span>
                    <strong>{featured.aiSystem}</strong>
                  </div>
                  <span className="status verified">Verified record</span>
                  <div className="evidence">
                    <b>Evidence</b>
                    <span>{featured.verificationNote}</span>
                    <a href={featured.primaryUrl} target="_blank" rel="noreferrer">
                      {featured.sourceLabel} <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </article>

              <section className="story-list" aria-label="Verified discovery registry" role="table">
                <div className="story-head" role="row">
                  <span role="columnheader">Announced</span>
                  <span role="columnheader">Discovery</span>
                  <span role="columnheader">Plain-language summary</span>
                  <span role="columnheader">AI system</span>
                  <span role="columnheader">Evidence</span>
                </div>
                <div role="rowgroup">
                  {filtered.map((discovery) => (
                    <DiscoveryRow discovery={discovery} key={discovery.id} />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="registry-state">
              <p>No verified records match this field yet.</p>
            </section>
          )}

          <section className="method" id="method">
            <div className="method-intro">
              <p className="section-kicker">Publication policy</p>
              <h2>Discovery is a claim. Verification is a process.</h2>
              <p>
                Automated scans can surface a paper, but they cannot add it to the public
                registry. Every promotion is a human editorial action with an audit note.
              </p>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h3>Candidate</h3>
                  <p>Primary-source scans create a private lead with no public status.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Under review</h3>
                  <p>An editor checks novelty, the AI’s role, evidence, and limitations.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Verified record</h3>
                  <p>The record is published with a source and a plain-language verification note.</p>
                </div>
              </li>
            </ol>
          </section>
        </>
      )}

      <footer>
        <span>Discovery Index</span>
        <span>Built for curiosity. Edited for evidence.</span>
        <span>
          {registry.generatedAt
            ? `Registry checked ${new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(registry.generatedAt))}`
            : "Durable registry"}
        </span>
      </footer>
    </main>
  );
}
