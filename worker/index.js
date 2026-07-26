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
  why_it_matters,
  ai_role_plain,
  review_started_at,
  published_at,
  updated_at
`;

const PUBLIC_STATUSES = new Set(["verified", "under_review"]);
const EDITORIAL_STATUSES = new Set(["candidate", "under_review", "verified", "rejected"]);
const TRANSITIONS = {
  candidate: new Set(["under_review", "rejected"]),
  under_review: new Set(["verified", "rejected"]),
  verified: new Set(["under_review"]),
  rejected: new Set(["under_review"]),
};

const ARXIV_SOURCE_KEY = "arxiv-discovery-scan";
const ARXIV_ENDPOINT = "https://export.arxiv.org/api/query";
const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_MAX_RESULTS = 12;

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
    whyItMatters: row.why_it_matters,
    aiRole: row.ai_role_plain,
    reviewStartedAt: row.review_started_at,
    publishedAt: row.published_at,
    updatedAt: normalizeSqlTimestamp(row.updated_at),
  };
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
        publishing: "human_review_required",
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

async function handleEditorialApi(request, env, url) {
  if (!url.pathname.startsWith("/api/editorial/")) return null;

  if (!authorized(request, env.EDITORIAL_TOKEN)) {
    return privateJson(
      {
        error: env.EDITORIAL_TOKEN
          ? "Editorial authorization is required."
          : "Editorial writes are disabled until EDITORIAL_TOKEN is configured.",
      },
      { status: env.EDITORIAL_TOKEN ? 401 : 503 },
    );
  }

  if (url.pathname === "/api/editorial/queue" && request.method === "GET") {
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

  const transitionMatch = url.pathname.match(
    /^\/api\/editorial\/discoveries\/([^/]+)\/transition$/,
  );
  if (transitionMatch && request.method === "POST") {
    let payload;
    try {
      payload = await readJson(request);
    } catch (error) {
      return privateJson({ error: error.message }, { status: 400 });
    }

    const nextStatus = payload.status;
    const note = typeof payload.note === "string" ? payload.note.trim() : "";
    if (!EDITORIAL_STATUSES.has(nextStatus) || !note) {
      return privateJson(
        { error: "A valid status and non-empty editorial note are required." },
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
         why_it_matters,
         ai_role_plain
       FROM discoveries
       WHERE id = ?`,
    )
      .bind(id)
      .first();

    if (!current) return privateJson({ error: "Discovery not found." }, { status: 404 });
    if (!TRANSITIONS[current.status]?.has(nextStatus)) {
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

    if (nextStatus === "verified" && !verificationNote && !current.verification_note) {
      return privateJson(
        { error: "A verification note is required before publication." },
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
      "authenticated editor",
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

function arxivTimestamp(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "").replace(/\D/g, "");
}

function buildArxivUrl(now, env) {
  const lookbackDays = clampInteger(env.INTAKE_LOOKBACK_DAYS, DEFAULT_LOOKBACK_DAYS, 2, 30);
  const maxResults = clampInteger(env.INTAKE_MAX_RESULTS, DEFAULT_MAX_RESULTS, 1, 25);
  const start = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
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

function isPlausibleCandidate(entry) {
  const text = `${entry.title} ${entry.summary}`.toLowerCase();
  const methodSignals = [
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "language model",
    "neural network",
    "agent",
  ];
  const discoverySignals = [
    "discover",
    "novel",
    "new result",
    "new algorithm",
    "hypothesis",
    "scientific",
  ];
  return methodSignals.some((term) => text.includes(term)) &&
    discoverySignals.some((term) => text.includes(term));
}

function candidateSlug(externalId) {
  return `candidate-${externalId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.replace(
    /-+$/g,
    "",
  );
}

async function runCandidateIntake(env, now = new Date()) {
  if (env.INTAKE_ENABLED !== "true") {
    return { status: "disabled", candidatesSeen: 0, candidatesAdded: 0 };
  }

  const runId = crypto.randomUUID();
  const startedAt = now.toISOString();
  await env.DB.prepare(
    `INSERT INTO intake_runs (id, source_key, started_at, status)
     VALUES (?, ?, ?, 'running')`,
  )
    .bind(runId, ARXIV_SOURCE_KEY, startedAt)
    .run();

  try {
    const response = await fetch(buildArxivUrl(now, env), {
      headers: {
        accept: "application/atom+xml",
        "user-agent": "DiscoveryIndex/1.0 evidence-registry candidate scanner",
      },
    });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);

    const xml = await response.text();
    const candidates = parseArxivEntries(xml).filter(isPlausibleCandidate);
    const seenAt = new Date().toISOString();
    let added = 0;

    for (const entry of candidates) {
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
          why_it_matters,
          intake_source,
          external_id,
          last_seen_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 'Not yet assessed', 'candidate', ?, ?, ?, 'Preprint candidate',
          'Machine-found candidate. No editorial verification has occurred.',
          'unreviewed_candidate',
          'Editorial review is required before this candidate can appear in the public registry.',
          ?, ?, ?, ?, ?)`,
      )
        .bind(
          `candidate-arxiv-${entry.externalId}`,
          candidateSlug(entry.externalId),
          entry.title,
          entry.summary.slice(0, 1600),
          entry.field,
          entry.announcedAt,
          entry.sourceUrl,
          "arXiv candidate",
          ARXIV_SOURCE_KEY,
          entry.externalId,
          seenAt,
          seenAt,
          seenAt,
        )
        .run();
      added += result.meta?.changes || 0;

      await env.DB.prepare(
        `UPDATE discoveries
         SET last_seen_at = ?
         WHERE source_url = ? AND status = 'candidate'`,
      )
        .bind(seenAt, entry.sourceUrl)
        .run();
    }

    await env.DB.prepare(
      `UPDATE intake_runs
       SET finished_at = ?, status = 'completed', candidates_seen = ?, candidates_added = ?
       WHERE id = ?`,
    )
      .bind(seenAt, candidates.length, added, runId)
      .run();

    return {
      status: "completed",
      runId,
      candidatesSeen: candidates.length,
      candidatesAdded: added,
    };
  } catch (error) {
    await env.DB.prepare(
      `UPDATE intake_runs
       SET finished_at = ?, status = 'failed', error_message = ?
       WHERE id = ?`,
    )
      .bind(new Date().toISOString(), String(error.message).slice(0, 500), runId)
      .run();
    throw error;
  }
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

    const editorialResponse = await handleEditorialApi(request, env, url);
    if (editorialResponse) return editorialResponse;

    const intakeResponse = await handleIntakeApi(request, env, url);
    if (intakeResponse) return intakeResponse;
  } catch (error) {
    console.error("Discovery Index request failed", error);
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "The registry is temporarily unavailable." }, { status: 500 });
    }
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

export { buildArxivUrl, parseArxivEntries, runCandidateIntake };

export default {
  fetch: fetchHandler,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      runCandidateIntake(env, new Date(controller.scheduledTime)).catch((error) => {
        console.error("Scheduled Discovery Index intake failed", error);
      }),
    );
  },
};
