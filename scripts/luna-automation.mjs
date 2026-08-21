#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SITE_URL = (process.env.DISCOVERY_AI_INDEX_URL || "https://www.discoveryindex.arclabshq.com").replace(
  /\/$/,
  "",
);
const KEYCHAIN_SERVICE = "com.arclabs.discovery-ai-index.automation";
const KEYCHAIN_ACCOUNT =
  process.env.DISCOVERY_AI_AUTOMATION_ACCOUNT || process.env.USER || process.env.USERNAME || "alexreeder";
const MAX_UPDATES = 25;
const TRANSITION_STATUSES = new Set(["under_review", "verified", "rejected"]);
const UPDATE_ACTIONS = new Set(["transition", "update"]);
const EDITORIAL_FIELDS = [
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

function fail(message) {
  throw new Error(message);
}

async function readToken() {
  const fromEnvironment = process.env.DISCOVERY_AI_AUTOMATION_TOKEN?.trim();
  if (fromEnvironment) return fromEnvironment;
  if (process.platform !== "darwin") {
    fail(
      "No local automation token is available. Set DISCOVERY_AI_AUTOMATION_TOKEN in the local automation environment.",
    );
  }

  try {
    const { stdout } = await execFileAsync(
      "security",
      ["find-generic-password", "-a", KEYCHAIN_ACCOUNT, "-s", KEYCHAIN_SERVICE, "-w"],
      { maxBuffer: 16 * 1024 },
    );
    const token = stdout.trim();
    if (token) return token;
  } catch {
    // Fall through to the actionable error below without printing secret material.
  }

  fail(
    `No Discovery AI Index automation token is stored in the local keychain for ${KEYCHAIN_SERVICE}.`,
  );
}

async function api(path, init = {}) {
  const token = await readToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${SITE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: text.slice(0, 500) };
  }
  if (!response.ok) {
    fail(`Discovery AI Index returned HTTP ${response.status}: ${body?.error || "request failed"}`);
  }
  return body;
}

function asString(value, label, { required = false, max = 12000 } = {}) {
  if (value === undefined || value === null) {
    if (required) fail(`${label} is required.`);
    return undefined;
  }
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a non-empty string.`);
  const normalized = value.trim();
  if (normalized.length > max) fail(`${label} is too long.`);
  return normalized;
}

function normalizeUpdate(update, index) {
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    fail(`Update ${index + 1} must be an object.`);
  }
  const id = asString(update.id, `Update ${index + 1} id`, { required: true, max: 200 });
  const note = asString(update.note, `Update ${index + 1} note`, { required: true, max: 4000 });
  const action = update.action || "transition";
  if (!UPDATE_ACTIONS.has(action)) fail(`Update ${index + 1} action must be transition or update.`);

  const payload = { note };
  if (action === "transition") {
    const status = asString(update.status, `Update ${index + 1} status`, { required: true, max: 40 });
    if (!TRANSITION_STATUSES.has(status)) {
      fail(`Update ${index + 1} has an unsupported transition status.`);
    }
    payload.status = status;
  }

  let fieldCount = 0;
  for (const field of EDITORIAL_FIELDS) {
    const value = asString(update[field], `Update ${index + 1} ${field}`, { max: 12000 });
    if (value !== undefined) {
      payload[field] = value;
      fieldCount += 1;
    }
  }
  if (action === "update" && fieldCount === 0) {
    fail(`Update ${index + 1} must include at least one editorial field.`);
  }

  return {
    id,
    method: action === "update" ? "PATCH" : "POST",
    payload,
  };
}

async function showQueue() {
  const body = await api("/api/automation/queue");
  process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
}

async function applyUpdates(filePath) {
  const raw = JSON.parse(await readFile(filePath, "utf8"));
  const updates = Array.isArray(raw) ? raw : raw?.updates;
  if (!Array.isArray(updates)) fail("The update file must contain an updates array.");
  if (updates.length > MAX_UPDATES) fail(`A single run may apply at most ${MAX_UPDATES} updates.`);

  const results = [];
  for (let index = 0; index < updates.length; index += 1) {
    try {
      const normalized = normalizeUpdate(updates[index], index);
      const body = await api(
        `/api/automation/discoveries/${encodeURIComponent(normalized.id)}/transition`,
        {
          method: normalized.method,
          body: JSON.stringify(normalized.payload),
        },
      );
      results.push({ id: normalized.id, ok: true, result: body });
    } catch (error) {
      results.push({ id: updates[index]?.id || null, ok: false, error: error.message });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  process.stdout.write(
    `${JSON.stringify(
      {
        file: filePath,
        attempted: results.length,
        applied: results.length - failed,
        failed,
        results,
      },
      null,
      2,
    )}\n`,
  );
  if (failed) process.exitCode = 1;
}

const [command, filePath] = process.argv.slice(2);
if (command === "queue") {
  await showQueue();
} else if (command === "apply" && filePath) {
  await applyUpdates(filePath);
} else {
  process.stderr.write(
    "Usage: node scripts/luna-automation.mjs queue | apply <update-json-file>\n",
  );
  process.exitCode = 2;
}
