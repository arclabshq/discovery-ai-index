#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = path.join(root, "dist", "client", "index.html");
const appRoutes = ["about", "method", "how-it-works"];

if (!existsSync(index)) {
  throw new Error(`Missing Vite build output: ${index}`);
}

for (const route of appRoutes) {
  const routeDirectory = path.join(root, "dist", "client", route);
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(index, path.join(routeDirectory, "index.html"));
}

console.log("Prepared Vercel static routes");
