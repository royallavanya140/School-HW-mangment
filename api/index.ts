// Bundled by script/build.ts into api/server-app.mjs so Vercel has no ../server dependency
import { createApp } from "./server-app.mjs";

let appPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

/**
 * Vercel serverless handler: all /api/* requests are rewritten to this function.
 * Rewrite sends path as ?path=... (e.g. /api/login -> /api?path=login). We restore req.url so Express routes correctly.
 */
export default async function handler(req: any, res: any): Promise<void> {
  const raw = req.url || "";
  const pathMatch = raw.match(/\?path=([^&]*)(?:&(.*))?/);
  if (pathMatch) {
    const pathSegment = decodeURIComponent((pathMatch[1] || "").replace(/\+/g, " "));
    const rest = pathMatch[2] ? "?" + pathMatch[2] : "";
    req.url = "/api/" + pathSegment + rest;
  }
  const app = await getApp();
  app(req, res);
}
