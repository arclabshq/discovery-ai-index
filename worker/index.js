const PUBLIC_FIELDS = `
  id,
  slug,
  title,
  summary,
  field,
  ai_system,
  status,
  announced_at,
  verified_at,
  source_url,
  source_label,
  source_type,
  verification_note,
  evidence_level,
  discovery_type,
  validation_stage,
  why_it_matters,
  ai_role_plain,
  history_start_label,
  history_start_date,
  history_result_label,
  history_duration_label,
  history_source_url,
  review_started_at,
  published_at,
  updated_at
`;

const PUBLIC_STATUSES = new Set(["verified", "under_review"]);
const SITE_ORIGIN = "https://www.discoveryindex.arclabshq.com";
const PUBLIC_SEO_ROUTES = ["/", "/about", "/method"];
const SEO_STATUS_LABELS = {
  verified: "Verified record",
  under_review: "Newly reported",
};
const SEO_DISCOVERY_TYPE_LABELS = {
  discovery: "Discovery",
  proof: "Proof",
  design: "Design",
  translation: "Translation",
  research_milestone: "Research milestone",
  unclassified: "Unclassified",
};
const SEO_VALIDATION_STAGE_LABELS = {
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
const EDITORIAL_STATUSES = new Set(["candidate", "under_review", "verified", "rejected"]);
const DISCOVERY_TYPES = new Set([
  "discovery",
  "proof",
  "design",
  "translation",
  "research_milestone",
  "unclassified",
]);
const VALIDATION_STAGES = new Set([
  "not_assessed",
  "primary_source_only",
  "author_checked",
  "author_reported_experimental",
  "expert_checked",
  "formally_verified",
  "peer_reviewed",
  "statistical_validation",
  "field_confirmed",
  "lab_confirmed",
  "animal_study",
  "human_cell_study",
  "hardware_demonstration",
  "human_trial",
  "deployed",
]);
const WEAK_VERIFIED_STAGES = new Set([
  "not_assessed",
  "primary_source_only",
  "author_checked",
  "author_reported_experimental",
]);
const AUTOMATION_UPDATE_FIELDS = [
  "title",
  "summary",
  "field",
  "aiSystem",
  "sourceLabel",
  "sourceType",
  "evidenceLevel",
  "discoveryType",
  "validationStage",
  "whyItMatters",
  "aiRole",
  "verificationNote",
];
const TRANSITIONS = {
  candidate: new Set(["under_review", "rejected"]),
  under_review: new Set(["verified", "rejected"]),
  verified: new Set(["under_review"]),
  rejected: new Set(["under_review"]),
};

const ARXIV_SOURCE_KEY = "arxiv-discovery-scan";
const ARXIV_ENDPOINT = "https://export.arxiv.org/api/query";
const BIORXIV_SOURCE_KEY = "biorxiv-discovery-scan";
const MEDRXIV_SOURCE_KEY = "medrxiv-discovery-scan";
const BIORXIV_API_ENDPOINT = "https://api.biorxiv.org";
const PUBMED_SOURCE_KEY = "pubmed-discovery-scan";
const PUBMED_EUTILS_ENDPOINT = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CROSSREF_SOURCE_KEY = "crossref-discovery-scan";
const CROSSREF_API_ENDPOINT = "https://api.crossref.org/works";
const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_MAX_RESULTS = 12;
const INTAKE_RUN_TIMEOUT_MINUTES = 30;

const INTAKE_SOURCE_DEFINITIONS = [
  {
    key: ARXIV_SOURCE_KEY,
    label: "arXiv candidate",
    type: "Preprint candidate",
    fetchEntries: fetchArxivEntries,
  },
  {
    key: BIORXIV_SOURCE_KEY,
    label: "bioRxiv candidate",
    type: "Preprint candidate",
    fetchEntries: (now, env) => fetchBiorxivEntries("biorxiv", now, env),
  },
  {
    key: MEDRXIV_SOURCE_KEY,
    label: "medRxiv candidate",
    type: "Medical preprint candidate",
    fetchEntries: (now, env) => fetchBiorxivEntries("medrxiv", now, env),
  },
  {
    key: PUBMED_SOURCE_KEY,
    label: "PubMed candidate",
    type: "Journal article candidate",
    fetchEntries: fetchPubmedEntries,
  },
  {
    key: CROSSREF_SOURCE_KEY,
    label: "Crossref-indexed article candidate",
    type: "Research publication candidate",
    fetchEntries: fetchCrossrefEntries,
  },
];

function candidateOnlyResult(result) {
  return {
    ...result,
    mode: "candidate_only",
    publicRecordsChanged: 0,
  };
}

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function publicJson(data) {
  return json(data, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

function privateJson(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return json(data, { ...init, headers });
}

function normalizeSqlTimestamp(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return `${value.replace(" ", "T")}Z`;
  }
  return value;
}

function toPublicDiscovery(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    field: row.field,
    aiSystem: row.ai_system,
    status: row.status,
    announcedAt: row.announced_at,
    verifiedAt: row.verified_at,
    primaryUrl: row.source_url,
    sourceLabel: row.source_label,
    sourceType: row.source_type,
    verificationNote: row.verification_note,
    evidenceLevel: row.evidence_level,
    discoveryType: row.discovery_type,
    validationStage: row.validation_stage,
    whyItMatters: row.why_it_matters,
    aiRole: row.ai_role_plain,
    history: row.history_start_date
      ? {
          startLabel: row.history_start_label,
          startDate: row.history_start_date,
          resultLabel: row.history_result_label,
          durationLabel: row.history_duration_label,
          sourceUrl: row.history_source_url,
        }
      : null,
    reviewStartedAt: row.review_started_at,
    publishedAt: row.published_at,
    updatedAt: normalizeSqlTimestamp(row.updated_at),
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function absoluteHttpUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value, SITE_ORIGIN);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function humanizeSeoValue(value, fallback = "Not specified") {
  if (!value) return fallback;
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function seoStatusLabel(status) {
  return SEO_STATUS_LABELS[status] || humanizeSeoValue(status, "Published record");
}

function seoDiscoveryTypeLabel(value) {
  return SEO_DISCOVERY_TYPE_LABELS[value] || humanizeSeoValue(value, "Discovery");
}

function seoValidationStageLabel(value) {
  return SEO_VALIDATION_STAGE_LABELS[value] || humanizeSeoValue(value, "Published evidence");
}

function discoveryCanonical(discovery) {
  return `${SITE_ORIGIN}/discoveries/${encodeURIComponent(discovery.slug)}`;
}

async function getPublicDiscoveryBySlug(env, slug) {
  if (!env.DB?.prepare) return null;
  const { results = [] } = await env.DB.prepare(
    `SELECT ${PUBLIC_FIELDS}
     FROM discoveries
     WHERE slug = ? AND status IN ('verified', 'under_review')
     LIMIT 1`,
  )
    .bind(slug)
    .all();

  return results[0] ? toPublicDiscovery(results[0]) : null;
}

async function listPublicSitemapRows(env) {
  if (!env.DB?.prepare) return [];
  const { results = [] } = await env.DB.prepare(
    `SELECT slug, updated_at
     FROM discoveries
     WHERE status IN ('verified', 'under_review')
     ORDER BY announced_at DESC, title ASC`,
  ).all();
  return results;
}

function sitemapLastModified(value) {
  const normalized = normalizeSqlTimestamp(value);
  if (!normalized) return "";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : `<lastmod>${date.toISOString()}</lastmod>`;
}

function buildSitemapXml(rows = []) {
  const paths = [
    ...PUBLIC_SEO_ROUTES.map((pathname) => ({ pathname })),
    ...rows
      .filter((row) => typeof row.slug === "string" && row.slug.trim())
      .map((row) => ({
        pathname: `/discoveries/${encodeURIComponent(row.slug)}`,
        updatedAt: row.updated_at,
      })),
  ];
  const seen = new Set();
  const urls = paths
    .filter(({ pathname }) => {
      if (seen.has(pathname)) return false;
      seen.add(pathname);
      return true;
    })
    .map(({ pathname, updatedAt }) => {
      const lastModified = sitemapLastModified(updatedAt);
      return `    <url><loc>${escapeHtml(`${SITE_ORIGIN}${pathname}`)}</loc>${lastModified}</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function renderDiscoveryMarkup(discovery) {
  const status = seoStatusLabel(discovery.status);
  const sourceUrl = absoluteHttpUrl(discovery.primaryUrl);
  const history = discovery.history?.startDate
    ? `<section>
        <h2>Problem history</h2>
        <p>${escapeHtml(discovery.history.startLabel || "Original problem")}: ${escapeHtml(discovery.history.startDate)}. ${escapeHtml(discovery.history.resultLabel || "Reported result")}${discovery.history.durationLabel ? ` after ${escapeHtml(discovery.history.durationLabel)}` : ""}.</p>
      </section>`
    : "";

  return `<main class="record-page ssr-record-page">
    <article>
      <p>Discovery AI Index · ${escapeHtml(status)}</p>
      <h1>${escapeHtml(discovery.title)}</h1>
      <p>${escapeHtml(discovery.summary || "A public record in the Discovery AI Index.")}</p>
      <dl>
        <div><dt>Field</dt><dd>${escapeHtml(discovery.field || "Not specified")}</dd></div>
        <div><dt>AI system</dt><dd>${escapeHtml(discovery.aiSystem || "Not specified")}</dd></div>
        <div><dt>Discovery type</dt><dd>${escapeHtml(seoDiscoveryTypeLabel(discovery.discoveryType))}</dd></div>
        <div><dt>Strongest documented check</dt><dd>${escapeHtml(seoValidationStageLabel(discovery.validationStage))}</dd></div>
        <div><dt>Reported</dt><dd>${escapeHtml(discovery.announcedAt || "Date pending")}</dd></div>
      </dl>
      <section>
        <h2>Why this matters</h2>
        <p>${escapeHtml(discovery.whyItMatters || "The significance of this result is documented in the record.")}</p>
      </section>
      <section>
        <h2>How AI helped</h2>
        <p>${escapeHtml(discovery.aiRole || "The original research documents how AI contributed to the result.")}</p>
      </section>
      ${history}
      <section>
        <h2>Evidence and verification</h2>
        <p>${escapeHtml(discovery.verificationNote || "The strongest available evidence is linked from this record.")}</p>
        <p>${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" rel="noreferrer">Read the original research</a>` : escapeHtml(discovery.sourceLabel || "Original research link pending")}</p>
      </section>
      <p><a href="/#registry">Browse all discoveries</a> · <a href="/method">Read the method</a></p>
    </article>
  </main>`;
}

const STATIC_SEO_PAGES = {
  "/": {
    title: "Discovery AI Index — The global catalog of AI-enabled discoveries",
    description:
      "The global catalog of discoveries materially enabled by AI—explained simply, traced to primary research, and labeled by how each result was validated.",
    canonicalPath: "/",
    markup: `<main class="ssr-home-page">
      <section>
        <p>Global discovery catalog</p>
        <h1>See what AI is helping humanity discover.</h1>
        <p>Explore discoveries across medicine, science, mathematics, and technology—explained simply, traced to the original research, and labeled by how each result was validated.</p>
      </section>
      <section>
        <h2>A growing record of new knowledge, designs, and proofs.</h2>
        <p>Every public record links to the original research and identifies the strongest documented check.</p>
      </section>
    </main>`,
  },
  "/about": {
    title: "About — Discovery AI Index",
    description:
      "Why Discovery AI Index catalogs discoveries materially enabled by AI and keeps evidence, AI contribution, and verification visible.",
    canonicalPath: "/about",
    markup: `<main class="ssr-static-page">
      <p>About the index</p>
      <h1>The global catalog of discoveries materially enabled by AI.</h1>
      <p>Discovery AI Index makes advances across research visible without flattening the evidence or overstating what has been proven.</p>
      <h2>Evidence before excitement</h2>
      <p>Each public record explains the result in ordinary language, names the AI's role, and links to the strongest available primary evidence.</p>
      <h2>What every record answers</h2>
      <p>What changed, why it matters, and where the proof can be checked.</p>
    </main>`,
  },
  "/method": {
    title: "Method — Discovery AI Index",
    description:
      "How Discovery AI Index separates the type of AI-enabled contribution from the evidence maturity of each public record.",
    canonicalPath: "/method",
    markup: `<main class="ssr-static-page">
      <p>Method</p>
      <h1>What was discovered—and how far it has been checked.</h1>
      <p>Every record separates the kind of contribution from its evidence maturity, then links directly to the original research.</p>
      <h2>Discovery types</h2>
      <p>Records may describe a discovery, proof, design, translation, or research milestone.</p>
      <h2>Public status</h2>
      <p>Newly reported records have a primary source linked while independent evidence remains open. Verified records document a meaningful external check.</p>
    </main>`,
  },
};

function replaceHeadTag(html, pattern, replacement) {
  const updated = html.replace(pattern, replacement);
  return updated === html ? html.replace(/<\/head>/i, `${replacement}\n</head>`) : updated;
}

function replaceMeta(html, attribute, value, content) {
  const escapedContent = escapeHtml(content);
  const tag = `<meta ${attribute}="${escapeHtml(value)}" content="${escapedContent}" />`;
  return replaceHeadTag(
    html,
    new RegExp(`<meta\\s+${attribute}="${value}"[^>]*>`, "i"),
    tag,
  );
}

function customizeSeoTemplate(template, { title, description, canonicalPath, type = "website", jsonLd }) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, "name", "description", description);
  html = replaceMeta(html, "name", "robots", "index, follow");
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:type", type);
  html = replaceMeta(html, "property", "og:url", `${SITE_ORIGIN}${canonicalPath}`);
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceHeadTag(
    html,
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(`${SITE_ORIGIN}${canonicalPath}`)}" />`,
  );
  if (jsonLd) {
    html = html.replace(
      /<\/head>/i,
      `<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>\n</head>`,
    );
  }
  return html;
}

async function renderSeoPage(request, env, page, markup, jsonLd) {
  if (!env.ASSETS?.fetch) return null;
  const indexUrl = new URL(request.url);
  indexUrl.pathname = "/";
  indexUrl.search = "";
  const templateResponse = await env.ASSETS.fetch(new Request(indexUrl, request));
  if (!templateResponse.ok) return templateResponse;

  const template = await templateResponse.text();
  const html = customizeSeoTemplate(template, { ...page, jsonLd }).replace(
    '<div id="root"></div>',
    `<div id="root">${markup}</div>`,
  );
  const headers = new Headers(templateResponse.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=60, stale-while-revalidate=300");
  return new Response(request.method === "HEAD" ? null : html, {
    status: 200,
    headers,
  });
}

function discoveryJsonLd(discovery) {
  const canonical = discoveryCanonical(discovery);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": canonical,
    url: canonical,
    headline: discovery.title,
    description: discovery.summary,
    articleSection: discovery.field,
    datePublished: normalizeSqlTimestamp(discovery.publishedAt || discovery.announcedAt),
    dateModified: discovery.updatedAt || undefined,
    author: { "@id": `${SITE_ORIGIN}/#organization` },
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };
}

async function handlePublicSeo(request, env, url) {
  if (!["GET", "HEAD"].includes(request.method)) return null;

  if (url.pathname === "/robots.txt") {
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }

  if (url.pathname === "/sitemap.xml") {
    const rows = await listPublicSitemapRows(env);
    return new Response(buildSitemapXml(rows), {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=300, stale-while-revalidate=900",
        "x-content-type-options": "nosniff",
      },
    });
  }

  const discoveryMatch = url.pathname.match(/^\/discoveries\/([^/]+)$/);
  if (discoveryMatch && env.DB?.prepare) {
    const discovery = await getPublicDiscoveryBySlug(env, decodeURIComponent(discoveryMatch[1]));
    if (!discovery) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const page = {
      title: `${discovery.title} — Discovery AI Index`,
      description: discovery.summary || "A public record in the Discovery AI Index.",
      canonicalPath: `/discoveries/${encodeURIComponent(discovery.slug)}`,
      type: "article",
    };
    return renderSeoPage(request, env, page, renderDiscoveryMarkup(discovery), discoveryJsonLd(discovery));
  }

  const staticPage = STATIC_SEO_PAGES[url.pathname];
  if (staticPage) {
    return renderSeoPage(request, env, staticPage, staticPage.markup);
  }

  return null;
}

async function listByStatus(env, status) {
  const { results = [] } = await env.DB.prepare(
    `SELECT ${PUBLIC_FIELDS}
     FROM discoveries
     WHERE status = ?
     ORDER BY announced_at DESC, title ASC`,
  )
    .bind(status)
    .all();

  return results.map(toPublicDiscovery);
}

async function handlePublicApi(request, env, url) {
  if (url.pathname === "/api/registry" && request.method === "GET") {
    const [verified, underReview] = await Promise.all([
      listByStatus(env, "verified"),
      listByStatus(env, "under_review"),
    ]);
    const lastEditorialUpdateAt = [...verified, ...underReview].reduce(
      (latest, discovery) =>
        discovery.updatedAt && (!latest || discovery.updatedAt > latest)
          ? discovery.updatedAt
          : latest,
      null,
    );

    return publicJson({
      verified,
      underReview,
      policy: {
        candidateVisibility: "editorial_only",
        publishing: "authenticated_review_required",
      },
      lastEditorialUpdateAt,
      generatedAt: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/discoveries" && request.method === "GET") {
    const status = url.searchParams.get("status") || "verified";
    if (!PUBLIC_STATUSES.has(status)) {
      return json(
        { error: "Public records are available only for verified or under_review status." },
        { status: 400 },
      );
    }

    return publicJson({ discoveries: await listByStatus(env, status) });
  }

  return null;
}

function authorized(request, expectedToken) {
  if (!expectedToken) return false;
  const authorization = request.headers.get("authorization") || "";
  return authorization === `Bearer ${expectedToken}`;
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected an application/json request body.");
  }
  return request.json();
}

async function handleEditorialApi(request, env, url, { automation = false } = {}) {
  const routePrefix = automation ? "/api/automation" : "/api/editorial";
  if (!url.pathname.startsWith(`${routePrefix}/`)) return null;

  const expectedToken = automation ? env.AUTOMATION_TOKEN : env.EDITORIAL_TOKEN;
  const actor = automation ? "luna-max-automation" : "authenticated editor";

  if (!authorized(request, expectedToken)) {
    return privateJson(
      {
        error: expectedToken
          ? `${automation ? "Automation" : "Editorial"} authorization is required.`
          : `${automation ? "Automation writes" : "Editorial writes"} are disabled until ${
              automation ? "AUTOMATION_TOKEN" : "EDITORIAL_TOKEN"
            } is configured.`,
      },
      { status: expectedToken ? 401 : 503 },
    );
  }

  if (url.pathname === `${routePrefix}/queue` && request.method === "GET") {
    const { results = [] } = await env.DB.prepare(
      `SELECT ${PUBLIC_FIELDS}, intake_source, external_id, last_seen_at, created_at
       FROM discoveries
       WHERE status IN ('candidate', 'under_review')
       ORDER BY
         CASE status WHEN 'under_review' THEN 0 ELSE 1 END,
         announced_at DESC`,
    ).all();

    return privateJson({ discoveries: results });
  }

  const classificationMatch = url.pathname.match(
    automation
      ? /^\/api\/automation\/discoveries\/([^/]+)\/classification$/
      : /^\/api\/editorial\/discoveries\/([^/]+)\/classification$/,
  );
  if (classificationMatch && request.method === "PATCH") {
    let payload;
    try {
      payload = await readJson(request);
    } catch (error) {
      return privateJson({ error: error.message }, { status: 400 });
    }

    const discoveryType =
      typeof payload.discoveryType === "string" ? payload.discoveryType.trim() : "";
    const validationStage =
      typeof payload.validationStage === "string" ? payload.validationStage.trim() : "";
    const note = typeof payload.note === "string" ? payload.note.trim() : "";
    if (
      !DISCOVERY_TYPES.has(discoveryType) ||
      !VALIDATION_STAGES.has(validationStage) ||
      !note
    ) {
      return privateJson(
        { error: "A valid discovery type, validation stage, and editorial note are required." },
        { status: 400 },
      );
    }

    const id = decodeURIComponent(classificationMatch[1]);
    const current = await env.DB.prepare(
      `SELECT id, status, discovery_type, validation_stage
       FROM discoveries
       WHERE id = ?`,
    )
      .bind(id)
      .first();
    if (!current) return privateJson({ error: "Discovery not found." }, { status: 404 });
    if (current.status === "verified" && WEAK_VERIFIED_STAGES.has(validationStage)) {
      return privateJson(
        { error: "A verified record cannot retain a weak or unassessed validation stage." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const update = env.DB.prepare(
      `UPDATE discoveries
       SET discovery_type = ?, validation_stage = ?, updated_at = ?
       WHERE id = ? AND discovery_type = ? AND validation_stage = ?`,
    ).bind(
      discoveryType,
      validationStage,
      now,
      id,
      current.discovery_type,
      current.validation_stage,
    );
    const event = env.DB.prepare(
      `INSERT INTO editorial_events
        (id, discovery_id, from_status, to_status, note, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      current.status,
      current.status,
      `${note} Classification changed from ${current.discovery_type}/${current.validation_stage} to ${discoveryType}/${validationStage}.`,
      actor,
      now,
    );

    const [updateResult] = await env.DB.batch([update, event]);
    if (updateResult.meta?.changes !== 1) {
      return privateJson(
        { error: "The record changed during review. Reload the queue and try again." },
        { status: 409 },
      );
    }
    return privateJson({ id, discoveryType, validationStage, updatedAt: now });
  }

  const transitionMatch = url.pathname.match(
    automation
      ? /^\/api\/automation\/discoveries\/([^/]+)\/transition$/
      : /^\/api\/editorial\/discoveries\/([^/]+)\/transition$/,
  );
  if (transitionMatch && ["POST", "PATCH"].includes(request.method)) {
    let payload;
    try {
      payload = await readJson(request);
    } catch (error) {
      return privateJson({ error: error.message }, { status: 400 });
    }

    const sameStatusUpdate = request.method === "PATCH";
    const note = typeof payload.note === "string" ? payload.note.trim() : "";
    if (!note) {
      return privateJson(
        { error: "A non-empty editorial note is required." },
        { status: 400 },
      );
    }

    const id = decodeURIComponent(transitionMatch[1]);
    const current = await env.DB.prepare(
      `SELECT
         id,
         status,
         title,
         summary,
         field,
         ai_system,
         source_label,
         source_type,
         verification_note,
         evidence_level,
         discovery_type,
         validation_stage,
         why_it_matters,
         ai_role_plain
       FROM discoveries
       WHERE id = ?`,
    )
      .bind(id)
      .first();

    if (!current) return privateJson({ error: "Discovery not found." }, { status: 404 });

    if (sameStatusUpdate) {
      if (!automation) {
        return privateJson(
          { error: "Same-status updates are available only to the automation route." },
          { status: 405 },
        );
      }
      if (current.status !== "under_review") {
        return privateJson(
          { error: "Automation may update an existing record only while it is under review." },
          { status: 409 },
        );
      }
      if (payload.status && payload.status !== current.status) {
        return privateJson(
          { error: "A same-status update cannot change the record status." },
          { status: 400 },
        );
      }
      if (!AUTOMATION_UPDATE_FIELDS.some((field) => typeof payload[field] === "string")) {
        return privateJson(
          { error: "A same-status update must include at least one editorial field." },
          { status: 400 },
        );
      }
    }

    const nextStatus = sameStatusUpdate ? current.status : payload.status;
    if (!EDITORIAL_STATUSES.has(nextStatus)) {
      return privateJson(
        { error: "A valid status and non-empty editorial note are required." },
        { status: 400 },
      );
    }
    if (!sameStatusUpdate && !TRANSITIONS[current.status]?.has(nextStatus)) {
      return privateJson(
        { error: `Transition from ${current.status} to ${nextStatus} is not allowed.` },
        { status: 409 },
      );
    }

    const verificationNote =
      typeof payload.verificationNote === "string" ? payload.verificationNote.trim() : "";
    const editorialRecord = {
      title: typeof payload.title === "string" ? payload.title.trim() : current.title,
      summary: typeof payload.summary === "string" ? payload.summary.trim() : current.summary,
      field: typeof payload.field === "string" ? payload.field.trim() : current.field,
      aiSystem:
        typeof payload.aiSystem === "string" ? payload.aiSystem.trim() : current.ai_system,
      sourceLabel:
        typeof payload.sourceLabel === "string"
          ? payload.sourceLabel.trim()
          : current.source_label,
      sourceType:
        typeof payload.sourceType === "string" ? payload.sourceType.trim() : current.source_type,
      evidenceLevel:
        typeof payload.evidenceLevel === "string"
          ? payload.evidenceLevel.trim()
          : current.evidence_level,
      discoveryType:
        typeof payload.discoveryType === "string"
          ? payload.discoveryType.trim()
          : current.discovery_type,
      validationStage:
        typeof payload.validationStage === "string"
          ? payload.validationStage.trim()
          : current.validation_stage,
      whyItMatters:
        typeof payload.whyItMatters === "string"
          ? payload.whyItMatters.trim()
          : current.why_it_matters,
      aiRole:
        typeof payload.aiRole === "string"
          ? payload.aiRole.trim()
          : current.ai_role_plain,
      verificationNote: verificationNote || current.verification_note,
    };

    if (
      current.status === "candidate" &&
      nextStatus === "under_review" &&
      ![
        "title",
        "summary",
        "field",
        "aiSystem",
        "sourceLabel",
        "sourceType",
        "evidenceLevel",
        "discoveryType",
        "validationStage",
        "whyItMatters",
        "aiRole",
        "verificationNote",
      ].every((key) => typeof payload[key] === "string" && payload[key].trim())
    ) {
      return privateJson(
        {
          error:
            "Starting public review requires an editor-written title, summary, field, AI system, AI-role explanation, source label, source type, why-it-matters note, and verification note.",
        },
        { status: 400 },
      );
    }

    if (
      !DISCOVERY_TYPES.has(editorialRecord.discoveryType) ||
      !VALIDATION_STAGES.has(editorialRecord.validationStage)
    ) {
      return privateJson(
        { error: "A valid discovery type and validation stage are required." },
        { status: 400 },
      );
    }

    if (nextStatus === "verified" && !verificationNote && !current.verification_note) {
      return privateJson(
        { error: "A verification note is required before publication." },
        { status: 400 },
      );
    }
    if (nextStatus === "verified" && WEAK_VERIFIED_STAGES.has(editorialRecord.validationStage)) {
      return privateJson(
        { error: "A verified record requires a stronger documented validation stage." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const update = env.DB.prepare(
      `UPDATE discoveries
       SET
         status = ?,
         title = ?,
         summary = ?,
         field = ?,
         ai_system = ?,
         source_label = ?,
         source_type = ?,
         verification_note = ?,
         evidence_level = ?,
         discovery_type = ?,
         validation_stage = ?,
         why_it_matters = ?,
         ai_role_plain = ?,
         review_started_at = CASE
           WHEN ? = 'under_review' THEN COALESCE(review_started_at, ?)
           ELSE review_started_at
         END,
         verified_at = CASE WHEN ? = 'verified' THEN ? ELSE verified_at END,
         published_at = CASE WHEN ? = 'verified' THEN ? ELSE published_at END,
         updated_at = ?
       WHERE id = ? AND status = ?`,
    ).bind(
      nextStatus,
      editorialRecord.title,
      editorialRecord.summary,
      editorialRecord.field,
      editorialRecord.aiSystem,
      editorialRecord.sourceLabel,
      editorialRecord.sourceType,
      editorialRecord.verificationNote,
      editorialRecord.evidenceLevel,
      editorialRecord.discoveryType,
      editorialRecord.validationStage,
      editorialRecord.whyItMatters,
      editorialRecord.aiRole,
      nextStatus,
      now,
      nextStatus,
      now,
      nextStatus,
      now,
      now,
      id,
      current.status,
    );

    const event = env.DB.prepare(
      `INSERT INTO editorial_events
        (id, discovery_id, from_status, to_status, note, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      current.status,
      nextStatus,
      note,
      actor,
      now,
    );

    const [updateResult] = await env.DB.batch([update, event]);
    if (updateResult.meta?.changes !== 1) {
      return privateJson(
        { error: "The record changed during review. Reload the queue and try again." },
        { status: 409 },
      );
    }

    return privateJson({ id, fromStatus: current.status, status: nextStatus, updatedAt: now });
  }

  return json({ error: "Editorial route not found." }, { status: 404 });
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function intakeDateRange(now, env) {
  const lookbackDays = clampInteger(env.INTAKE_LOOKBACK_DAYS, DEFAULT_LOOKBACK_DAYS, 2, 30);
  const start = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  return {
    start,
    end: now,
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

function arxivTimestamp(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "").replace(/\D/g, "");
}

function buildArxivUrl(now, env) {
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  const { start } = intakeDateRange(now, env);
  const dateRange = `submittedDate:[${arxivTimestamp(start)} TO ${arxivTimestamp(now)}]`;
  const topic =
    '(ti:discovery OR abs:"scientific discovery" OR abs:"algorithmic discovery")';
  const method =
    '(abs:"machine learning" OR abs:"artificial intelligence" OR abs:"language model" OR abs:"neural network")';
  const params = new URLSearchParams({
    search_query: `${topic} AND ${method} AND ${dateRange}`,
    start: "0",
    max_results: String(maxResults),
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  return `${ARXIV_ENDPOINT}?${params}`;
}

function buildBiorxivUrl(server, now, env) {
  const { startDate, endDate } = intakeDateRange(now, env);
  return `${BIORXIV_API_ENDPOINT}/details/${encodeURIComponent(server)}/${startDate}/${endDate}/0`;
}

function buildPubmedSearchUrl(now, env) {
  const { startDate, endDate } = intakeDateRange(now, env);
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  const method = [
    '"artificial intelligence"[Title/Abstract]',
    '"machine learning"[Title/Abstract]',
    '"language model"[Title/Abstract]',
    '"generative"[Title/Abstract]',
  ].join(" OR ");
  const discovery = [
    '"discovery"[Title]',
    '"design"[Title]',
    '"novel"[Title]',
    '"algorithm"[Title]',
    '"synthesis"[Title]',
  ].join(" OR ");
  const dateRange = `("${startDate}"[Date - Publication] : "${endDate}"[Date - Publication])`;
  const params = new URLSearchParams({
    db: "pubmed",
    term: `(${method}) AND (${discovery}) AND ${dateRange}`,
    retmax: String(maxResults),
    retmode: "json",
    sort: "pub date",
  });
  return `${PUBMED_EUTILS_ENDPOINT}/esearch.fcgi?${params}`;
}

function buildPubmedSummaryUrl(ids) {
  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "json",
  });
  return `${PUBMED_EUTILS_ENDPOINT}/esummary.fcgi?${params}`;
}

function buildCrossrefUrl(now, env) {
  const { startDate, endDate } = intakeDateRange(now, env);
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  const params = new URLSearchParams({
    filter: `from-pub-date:${startDate},until-pub-date:${endDate},type:journal-article`,
    "query.bibliographic": "artificial intelligence scientific discovery",
    rows: String(maxResults),
    select: "DOI,title,abstract,published,published-online,type,URL,container-title",
    sort: "published",
    order: "desc",
  });
  return `${CROSSREF_API_ENDPOINT}?${params}`;
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkup(value = "") {
  return decodeXml(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function xmlText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
}

function parseArxivEntries(xml) {
  const entries = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
    const entry = match[1];
    const idUrl = xmlText(entry, "id").replace(/^http:/, "https:");
    const externalId = idUrl.match(/\/abs\/([^?#]+)/)?.[1]?.replace(/v\d+$/, "");
    if (!externalId) continue;

    const category = entry.match(/<category[^>]+term=["']([^"']+)["']/i)?.[1] || "Unclassified";
    entries.push({
      externalId,
      sourceUrl: `https://arxiv.org/abs/${externalId}`,
      title: xmlText(entry, "title"),
      summary: xmlText(entry, "summary"),
      announcedAt: xmlText(entry, "published").slice(0, 10),
      field: category,
    });
  }
  return entries;
}

function normalizeDoi(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[)\].,;]+$/, "");
}

function normalizeIntakeDate(value) {
  const text = stripMarkup(value).replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;

  const numeric = text.match(/\b(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?\b/);
  if (numeric) {
    const [, year, month, day] = numeric;
    return day
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : `${year}-${month.padStart(2, "0")}`;
  }

  const monthNumbers = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    sept: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };
  const named = text.match(/\b(\d{4})\s+([A-Za-z]+)(?:\s+(\d{1,2}))?\b/);
  if (named) {
    const [, year, monthName, day] = named;
    const month = monthNumbers[monthName.toLowerCase()];
    if (month) return day ? `${year}-${month}-${day.padStart(2, "0")}` : `${year}-${month}`;
  }

  return text.match(/\b(20\d{2})\b/)?.[1] || null;
}

function parseBiorxivEntries(payload, server) {
  const collection = Array.isArray(payload?.collection) ? payload.collection : [];
  return collection
    .map((item) => {
      const doi = normalizeDoi(item.doi);
      const title = stripMarkup(item.title);
      if (!doi || !title) return null;
      const normalizedServer = server === "medrxiv" ? "medrxiv" : "biorxiv";
      return {
        externalId: doi,
        sourceUrl: `https://doi.org/${doi}`,
        title,
        summary: stripMarkup(item.abstract),
        announcedAt: normalizeIntakeDate(item.date),
        field: stripMarkup(item.category) || (normalizedServer === "medrxiv" ? "Medicine" : "Biology"),
      };
    })
    .filter(Boolean);
}

function pubmedArticleDoi(item) {
  const articleIds = Array.isArray(item?.articleids) ? item.articleids : [];
  const doi = articleIds.find((articleId) => articleId?.idtype === "doi")?.value;
  return normalizeDoi(doi);
}

function parsePubmedEntries(payload) {
  const result = payload?.result || {};
  const ids = Array.isArray(result.uids) ? result.uids : [];
  return ids
    .map((pmid) => {
      const item = result[pmid];
      if (!item || typeof item !== "object") return null;
      const title = stripMarkup(item.title);
      if (!title) return null;
      const doi = pubmedArticleDoi(item);
      const journal = stripMarkup(item.fulljournalname || item.source || "PubMed");
      return {
        externalId: `pmid-${pmid}`,
        sourceUrl: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        title,
        summary: `PubMed-indexed research record in ${journal}; the primary article and abstract require editorial review.`,
        announcedAt: normalizeIntakeDate(item.pubdate || item.sortpubdate),
        field: journal,
        sourceScreened: true,
      };
    })
    .filter(Boolean);
}

function parseCrossrefEntries(payload) {
  const items = Array.isArray(payload?.message?.items) ? payload.message.items : [];
  const allowedTypes = new Set(["journal-article", "proceedings-article", "posted-content"]);
  return items
    .map((item) => {
      const doi = normalizeDoi(item.DOI);
      const title = stripMarkup(item.title?.[0]);
      if (!doi || !title || (item.type && !allowedTypes.has(item.type))) return null;
      const abstract = stripMarkup(item.abstract);
      const publishedDateParts =
        item.published?.["date-parts"]?.[0] || item["published-online"]?.["date-parts"]?.[0];
      return {
        externalId: doi,
        sourceUrl: `https://doi.org/${doi}`,
        title,
        summary:
          abstract ||
          `Crossref-indexed research publication in ${stripMarkup(item["container-title"]?.[0]) || "an academic venue"}; the primary article requires editorial review.`,
        announcedAt: normalizeIntakeDate(publishedDateParts?.join("-")),
        field: stripMarkup(item["container-title"]?.[0]) || "Research publication",
      };
    })
    .filter(Boolean);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "DiscoveryAIIndex/1.0 evidence-registry candidate scanner",
      ...headers,
    },
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
  return response.json();
}

async function fetchArxivEntries(now, env) {
  const response = await fetch(buildArxivUrl(now, env), {
    headers: {
      accept: "application/atom+xml",
      "user-agent": "DiscoveryAIIndex/1.0 evidence-registry candidate scanner",
    },
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
  return parseArxivEntries(await response.text());
}

async function fetchBiorxivEntries(server, now, env) {
  const payload = await fetchJson(buildBiorxivUrl(server, now, env));
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  return parseBiorxivEntries(payload, server).slice(0, maxResults);
}

async function fetchPubmedEntries(now, env) {
  const search = await fetchJson(buildPubmedSearchUrl(now, env));
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  const ids = search?.esearchresult?.idlist?.slice(0, maxResults) || [];
  if (!ids.length) return [];
  return parsePubmedEntries(await fetchJson(buildPubmedSummaryUrl(ids))).slice(0, maxResults);
}

async function fetchCrossrefEntries(now, env) {
  const payload = await fetchJson(buildCrossrefUrl(now, env));
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  return parseCrossrefEntries(payload).slice(0, maxResults);
}

function isPlausibleCandidate(entry) {
  const text = `${entry.title} ${entry.summary}`.toLowerCase();
  const methodSignals = [
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "language model",
    "generative model",
    "foundation model",
    "neural network",
    "agent",
  ];
  const discoverySignals = [
    "discover",
    "design",
    "novel",
    "new result",
    "new algorithm",
    "hypothesis",
    "synthesis",
    "scientific",
  ];
  return methodSignals.some((term) => text.includes(term)) &&
    discoverySignals.some((term) => text.includes(term));
}

function candidateSlug(externalId) {
  const normalized = String(externalId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
  return `candidate-${normalized}`;
}

function sourcePrefix(sourceKey) {
  return sourceKey.replace(/-discovery-scan$/, "").replace(/[^a-z0-9]+/g, "-");
}

function candidateId(source, externalId) {
  const prefix = source.key === ARXIV_SOURCE_KEY ? "candidate-arxiv" : `candidate-${sourcePrefix(source.key)}`;
  return `${prefix}-${candidateSlug(externalId).replace(/^candidate-/, "")}`;
}

function sourceDefinitionsForEnv(env) {
  const requested = String(env.INTAKE_SOURCES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!requested.length) return INTAKE_SOURCE_DEFINITIONS;
  const requestedSet = new Set(requested);
  return INTAKE_SOURCE_DEFINITIONS.filter((source) => requestedSet.has(source.key));
}

async function insertIntakeCandidate(env, source, entry, seenAt) {
  const existing = await env.DB.prepare(
    `SELECT id, status
     FROM discoveries
     WHERE source_url = ?
     LIMIT 1`,
  )
    .bind(entry.sourceUrl)
    .first();
  if (existing) {
    if (existing.status === "candidate") {
      await env.DB.prepare(
        `UPDATE discoveries
         SET last_seen_at = ?
         WHERE id = ? AND status = 'candidate'`,
      )
        .bind(seenAt, existing.id)
        .run();
    }
    return 0;
  }

  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO discoveries (
      id,
      slug,
      title,
      summary,
      field,
      ai_system,
      status,
      announced_at,
      source_url,
      source_label,
      source_type,
      verification_note,
      evidence_level,
      discovery_type,
      validation_stage,
      why_it_matters,
      intake_source,
      external_id,
      last_seen_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, 'Not yet assessed', 'candidate', ?, ?, ?, ?,
      'Machine-found candidate. No editorial verification has occurred.',
      'unreviewed_candidate',
      'unclassified',
      'not_assessed',
      'Editorial review is required before this candidate can appear in the public registry.',
      ?, ?, ?, ?, ?)`,
  )
    .bind(
      candidateId(source, entry.externalId),
      source.key === ARXIV_SOURCE_KEY
        ? candidateSlug(entry.externalId)
        : candidateSlug(`${sourcePrefix(source.key)}-${entry.externalId}`),
      entry.title,
      String(entry.summary || "").slice(0, 1600),
      entry.field || "Unclassified",
      entry.announcedAt,
      entry.sourceUrl,
      source.label,
      source.type,
      source.key,
      entry.externalId,
      seenAt,
      seenAt,
      seenAt,
    )
    .run();
  return result.meta?.changes || 0;
}

async function runSourceCandidateIntake(env, source, now) {
  const runId = crypto.randomUUID();
  const startedAt = now.toISOString();
  const staleBefore = new Date(
    now.getTime() - INTAKE_RUN_TIMEOUT_MINUTES * 60 * 1000,
  ).toISOString();

  await env.DB.prepare(
    `UPDATE intake_runs
     SET finished_at = ?, status = 'failed', error_message = ?
     WHERE source_key = ? AND status = 'running' AND started_at < ?`,
  )
    .bind(
      startedAt,
      `Automatically closed after ${INTAKE_RUN_TIMEOUT_MINUTES} minutes without completion.`,
      source.key,
      staleBefore,
    )
    .run();

  const lease = await env.DB.prepare(
    `INSERT OR IGNORE INTO intake_runs (id, source_key, started_at, status)
     VALUES (?, ?, ?, 'running')`,
  )
    .bind(runId, source.key, startedAt)
    .run();

  if (lease.meta?.changes !== 1) {
    return {
      sourceKey: source.key,
      status: "skipped",
      reason: "source_scan_already_running",
      candidatesSeen: 0,
      candidatesAdded: 0,
    };
  }

  try {
    const entries = await source.fetchEntries(now, env);
    const candidates = entries.filter(
      (entry) =>
        entry?.sourceUrl &&
        entry?.title &&
        entry?.announcedAt &&
        (entry.sourceScreened || isPlausibleCandidate(entry)),
    );
    const seenAt = startedAt;
    let added = 0;

    for (const entry of candidates) {
      added += await insertIntakeCandidate(env, source, entry, seenAt);
    }

    await env.DB.prepare(
      `UPDATE intake_runs
       SET finished_at = ?, status = 'completed', candidates_seen = ?, candidates_added = ?
       WHERE id = ?`,
    )
      .bind(seenAt, candidates.length, added, runId)
      .run();

    return {
      sourceKey: source.key,
      status: "completed",
      runId,
      candidatesSeen: candidates.length,
      candidatesAdded: added,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE intake_runs
       SET finished_at = ?, status = 'failed', error_message = ?
       WHERE id = ?`,
    )
      .bind(finishedAt, String(error.message).slice(0, 500), runId)
      .run();
    return {
      sourceKey: source.key,
      status: "failed",
      runId,
      candidatesSeen: 0,
      candidatesAdded: 0,
      error: String(error.message).slice(0, 500),
    };
  }
}

async function runCandidateIntake(env, now = new Date()) {
  if (env.INTAKE_ENABLED !== "true") {
    return candidateOnlyResult({ status: "disabled", candidatesSeen: 0, candidatesAdded: 0 });
  }

  const sources = sourceDefinitionsForEnv(env);
  if (!sources.length) {
    return candidateOnlyResult({
      status: "disabled",
      reason: "no_enabled_sources",
      candidatesSeen: 0,
      candidatesAdded: 0,
      sources: [],
    });
  }

  const sourceResults = [];
  for (const source of sources) {
    sourceResults.push(await runSourceCandidateIntake(env, source, now));
  }

  const candidatesSeen = sourceResults.reduce((total, result) => total + result.candidatesSeen, 0);
  const candidatesAdded = sourceResults.reduce((total, result) => total + result.candidatesAdded, 0);
  const failed = sourceResults.filter((result) => result.status === "failed");
  const completed = sourceResults.filter((result) => result.status === "completed");
  const skipped = sourceResults.filter((result) => result.status === "skipped");
  const status =
    skipped.length === sourceResults.length
      ? "skipped"
      : failed.length === 0
        ? "completed"
        : completed.length > 0
          ? "partial"
          : "failed";

  return candidateOnlyResult({
    status,
    ...(status === "skipped" ? { reason: "source_scan_already_running" } : {}),
    candidatesSeen,
    candidatesAdded,
    sources: sourceResults,
  });
}

async function handleIntakeApi(request, env, url) {
  if (url.pathname !== "/api/intake/run") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed." }, { status: 405 });
  if (!authorized(request, env.INTAKE_TOKEN)) {
    return privateJson(
      {
        error: env.INTAKE_TOKEN
          ? "Intake authorization is required."
          : "Manual intake is disabled until INTAKE_TOKEN is configured.",
      },
      { status: env.INTAKE_TOKEN ? 401 : 503 },
    );
  }

  try {
    return privateJson(await runCandidateIntake(env));
  } catch {
    return privateJson({ error: "The source scan failed and published records were unchanged." }, { status: 502 });
  }
}

async function fetchHandler(request, env) {
  const url = new URL(request.url);

  try {
    const publicResponse = await handlePublicApi(request, env, url);
    if (publicResponse) return publicResponse;

    const automationResponse = await handleEditorialApi(request, env, url, { automation: true });
    if (automationResponse) return automationResponse;

    const editorialResponse = await handleEditorialApi(request, env, url);
    if (editorialResponse) return editorialResponse;

    const intakeResponse = await handleIntakeApi(request, env, url);
    if (intakeResponse) return intakeResponse;

    const seoResponse = await handlePublicSeo(request, env, url);
    if (seoResponse) return seoResponse;
  } catch (error) {
    console.error("Discovery AI Index request failed", error);
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "The registry is temporarily unavailable." }, { status: 500 });
    }
  }

  if (!env.ASSETS?.fetch) {
    return json({ error: "Not found." }, { status: 404 });
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  const isAppNavigation =
    acceptsHtml &&
    ["GET", "HEAD"].includes(request.method) &&
    !url.pathname.startsWith("/api/") &&
    url.pathname !== "/" &&
    url.pathname !== "/index.html";

  if (isAppNavigation) {
    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  }

  const response = await env.ASSETS.fetch(request);

  if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
    return response;
  }

  const indexUrl = new URL(request.url);
  indexUrl.pathname = "/";
  indexUrl.search = "";
  return env.ASSETS.fetch(new Request(indexUrl, request));
}

export {
  buildArxivUrl,
  buildBiorxivUrl,
  buildPubmedSearchUrl,
  buildCrossrefUrl,
  parseArxivEntries,
  parseBiorxivEntries,
  parsePubmedEntries,
  parseCrossrefEntries,
  runCandidateIntake,
};

export default {
  fetch: fetchHandler,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      runCandidateIntake(env, new Date(controller.scheduledTime)).catch((error) => {
        console.error("Scheduled Discovery AI Index intake failed", error);
      }),
    );
  },
};
