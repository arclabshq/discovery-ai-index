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
    <article className="story">
      <time dateTime={discovery.announcedAt}>{formatDate(discovery.announcedAt)}</time>
      <div className="story-title">
        <h3>{discovery.title}</h3>
        <p>
          {discovery.field} <i aria-hidden="true" /> {discovery.aiSystem}
        </p>
      </div>
      <span className="status verified">{STATUS_COPY[discovery.status]}</span>
      <p className="why">{discovery.whyItMatters}</p>
      <a href={discovery.primaryUrl} target="_blank" rel="noreferrer">
        Primary source <span aria-hidden="true">↗</span>
      </a>
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
        <p className="review-field">
          {discovery.field} · {discovery.aiSystem}
        </p>
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
  const featured = filtered[0];
  const listed = filtered.slice(1);

  return (
    <main className="page">
      <header className="nav">
        <a className="brand" href="#top" aria-label="Discovery Index home">
          <span className="brand-mark" />
          Discovery Index
        </a>
        <nav aria-label="Primary navigation">
          <a href="#method">Method</a>
          <a href="#registry">Verified</a>
          <a href="#review">Under review</a>
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

      <section className="intro">
        <p className="eyebrow">A public record, not a hype feed</p>
        <h1>What did AI actually discover?</h1>
        <p>
          A carefully sourced index of discoveries made with artificial intelligence—and the
          evidence that separates a result from a claim.
        </p>
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
          <section className="registry-controls" id="registry" aria-label="Filter verified registry">
            <div>
              <p className="section-kicker">Verified registry</p>
              <h2>Records with inspectable evidence</h2>
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
                    <span>
                      {featured.field} · {featured.aiSystem}
                    </span>
                  </div>
                  <h2>{featured.title}</h2>
                  <p>{featured.summary}</p>
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

              <section className="story-list" aria-label="Verified discovery registry">
                {listed.map((discovery) => (
                  <DiscoveryRow discovery={discovery} key={discovery.id} />
                ))}
              </section>
            </>
          ) : (
            <section className="registry-state">
              <p>No verified records match this field yet.</p>
            </section>
          )}

          <section className="review-section" id="review">
            <div className="section-heading">
              <div>
                <p className="section-kicker amber">Evidence still moving</p>
                <h2>Under editorial review</h2>
              </div>
              <p>
                These are reported results, not verified registry entries. We show what is known
                and what still needs checking.
              </p>
            </div>
            <div className="review-list">
              {registry.underReview.map((discovery) => (
                <ReviewCard discovery={discovery} key={discovery.id} />
              ))}
            </div>
          </section>

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
