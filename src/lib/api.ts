import { NextResponse } from "next/server";

/** Registry responses are public, cacheable and CORS-open — agents consume them directly. */
export function apiJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}

export function apiText(body: string, contentType: string, filename?: string) {
  return new NextResponse(body, {
    headers: {
      "content-type": `${contentType}; charset=utf-8`,
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
      ...(filename ? { "content-disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}

export function apiError(message: string, status: number) {
  return apiJson({ error: message }, { status });
}

/**
 * Parses a `limit` query parameter. A negative or zero value must never reach
 * `Array.slice`, where it silently trims results off the end instead of
 * returning fewer of them.
 */
export function parseLimit(raw: string | null, fallback = 20, max = 100): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}
