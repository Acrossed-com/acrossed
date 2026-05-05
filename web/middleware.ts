// Middleware does THREE jobs:
//   1) Authenticate dashboard + protected API routes via Clerk.
//   2) Internal-rewrite traffic from <slug>.acrsd.dev (and any custom domain
//      attached to a project) to /p/<slug>.
//   3) Run a SINGLE Acrossed check per visitor session (cookie-gated).
//      After the first check, a cookie prevents further /check calls for the
//      same browser session. This eliminates the usage-inflation loop.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher(["/dashboard(.*)", "/api/projects(.*)", "/api/billing(.*)"]);

const APEX_HOSTS = new Set([
  "acrossed.com",
  "www.acrossed.com",
  "localhost:3001",
  "127.0.0.1:3001",
]);

// Acrossed protection config
const ACROSSED_KEY = process.env.ACROSSED_API_KEY || "";
const ACROSSED_SECRET = process.env.ACROSSED_SIGNING_SECRET || "";
const ACROSSED_URL = process.env.ACROSSED_API_URL || "http://127.0.0.1:4000";

// Cookie name for tracking that we already checked this visitor
const CHECKED_COOKIE = "_ac_checked";
// Cookie TTL: 24 hours (seconds)
const CHECKED_COOKIE_TTL = 86400;

// HMAC-SHA256 using Web Crypto (Edge-compatible)
async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Paths that should NEVER trigger an Acrossed check
const SKIP_PREFIXES = [
  "/_next",
  "/api/",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/p/",
  "/favicon",
  "/robots",
  "/sitemap",
];

// Bot user-agent patterns — never waste a check on crawlers
const BOT_RE = /bot|crawl|spider|slurp|facebook|twitter|whatsapp|telegram|preview|lighthouse|pingdom|uptimerobot|headless|phantom|selenium|curl|wget|python|httpx|axios|node-fetch|go-http|java\//i;

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const path = url.pathname;

  // --- Subdomain routing for <slug>.acrsd.dev ---
  if (host.endsWith(".acrsd.dev") && host !== "acrsd.dev" && host !== "www.acrsd.dev") {
    const slug = host.slice(0, -".acrsd.dev".length);
    if (slug && slug !== "edge" && !path.startsWith("/p/")) {
      const rewrite = url.clone();
      rewrite.pathname = `/p/${slug}`;
      return NextResponse.rewrite(rewrite);
    }
  }

  // --- Custom domain routing ---
  if (!APEX_HOSTS.has(host) && !host.endsWith(".acrossed.com") && !host.endsWith(".acrsd.dev")) {
    if (!path.startsWith("/p/") && !path.startsWith("/_next") && !path.startsWith("/api/")) {
      const rewrite = url.clone();
      rewrite.pathname = `/p/_host`;
      rewrite.searchParams.set("_host", host);
      return NextResponse.rewrite(rewrite);
    }
  }

  // --- Acrossed SDK tracking (OWN site, public pages only, ONCE per session) ---
  const shouldSkip =
    path.includes(".") ||
    SKIP_PREFIXES.some((p) => path.startsWith(p)) ||
    !ACROSSED_KEY ||
    !ACROSSED_SECRET;

  // Only track on apex hosts (our own site). Skip custom domain/subdomain
  // traffic — those are USER projects, not our own dashboard.
  const isOwnSite = APEX_HOSTS.has(host);

  // Check if visitor already has the "checked" cookie
  const alreadyChecked = req.cookies.has(CHECKED_COOKIE);

  // Check for bots
  const ua = req.headers.get("user-agent") ?? "";
  const isBot = BOT_RE.test(ua);

  let response: NextResponse | undefined;

  if (!shouldSkip && isOwnSite && !alreadyChecked && !isBot) {
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      (req.headers.get("x-real-ip") ?? "") ||
      "0.0.0.0";
    const hdrs: Record<string, string> = {};
    req.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
    // Only send minimal headers to avoid sending cookie data back to check
    const payload = {
      ip,
      method: req.method,
      path,
      headers: {
        "user-agent": hdrs["user-agent"] ?? "",
        "accept-language": hdrs["accept-language"] ?? "",
        "referer": hdrs["referer"] ?? "",
      },
      query: Object.fromEntries(url.searchParams),
    };
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    // Fire-and-forget: non-blocking
    hmacSign(ACROSSED_SECRET, `${timestamp}.${body}`)
      .then((signature) =>
        fetch(`${ACROSSED_URL}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Acrossed-Key": ACROSSED_KEY,
            "X-Acrossed-Timestamp": timestamp,
            "X-Acrossed-Signature": signature,
          },
          body,
        }),
      )
      .catch(() => {});

    // Set the dedup cookie so this visitor won't be checked again for 24h
    response = NextResponse.next();
    response.cookies.set(CHECKED_COOKIE, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: CHECKED_COOKIE_TTL,
      path: "/",
    });
  }

  // --- Auth: protect dashboard + API routes ---
  if (isProtected(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", path + url.search);
      return NextResponse.redirect(signIn);
    }
  }

  // Return the response with the cookie if we set one, otherwise just proceed
  return response ?? NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
