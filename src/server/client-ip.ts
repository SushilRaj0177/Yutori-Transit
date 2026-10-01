import "server-only";

/**
 * The caller's address, for rate limiting and one-vote-per-network.
 * `x-forwarded-for` alone can be forged by the client, so on Vercel the
 * platform-set `x-vercel-forwarded-for` / `x-real-ip` take precedence.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
