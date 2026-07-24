#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");
const migrations = path.join(root, "db", "migrations");
const appRoutes = ["about", "how-it-works", "for-researchers", "newsroom"];

for (const file of [index, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

// Sites may canonicalize an unknown extensionless path before the Worker fallback runs.
// Physical route entry points keep shared subpage URLs functional in production.
for (const route of appRoutes) {
  const routeDirectory = path.join(dist, "client", route);
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(index, path.join(routeDirectory, "index.html"));
}

const drizzle = path.join(dist, ".openai", "drizzle");
rmSync(drizzle, { force: true, recursive: true });
mkdirSync(drizzle, { recursive: true });
for (const migration of readdirSync(migrations).filter((file) => file.endsWith(".sql")).sort()) {
  copyFileSync(path.join(migrations, migration), path.join(drizzle, migration));
}

console.log("Prepared Sites build with app routes, worker, hosting metadata, and D1 migrations");
