import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    const customReferer = searchParams.get("referer");

    if (!targetUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    const parsedTarget = new URL(targetUrl);
    const origin = customReferer
      ? new URL(customReferer).origin
      : `${parsedTarget.protocol}//${parsedTarget.host}`;

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: customReferer || origin + "/",
      Origin: origin,
      Accept: "*/*",
    };

    // Forward range header if present
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const client = parsedTarget.protocol === "https:" ? https : http;

    return new Promise<NextResponse>((resolve) => {
      const req = client.get(
        targetUrl,
        { headers, timeout: 20000 },
        (upstreamRes) => {
          // Handle redirects
          if (
            upstreamRes.statusCode &&
            upstreamRes.statusCode >= 300 &&
            upstreamRes.statusCode < 400 &&
            upstreamRes.headers.location
          ) {
            const redirectUrl = new URL(
              upstreamRes.headers.location,
              targetUrl
            ).href;
            const proxyRedirect = `/api/proxy/hls?url=${encodeURIComponent(
              redirectUrl
            )}&referer=${encodeURIComponent(customReferer || origin)}`;
            return resolve(NextResponse.redirect(proxyRedirect, 302));
          }

          const contentType =
            upstreamRes.headers["content-type"] || "application/octet-stream";
          const isM3U8 =
            targetUrl.includes(".m3u8") ||
            targetUrl.includes(".txt") ||
            contentType.includes("mpegurl") ||
            contentType.includes("vnd.apple.mpegurl");

          if (isM3U8) {
            let body = "";
            upstreamRes.setEncoding("utf8");
            upstreamRes.on("data", (chunk) => (body += chunk));
            upstreamRes.on("end", () => {
              if (body.includes("#EXTM3U")) {
                const rewritten = rewriteM3u8(
                  body,
                  targetUrl,
                  customReferer || origin
                );
                return resolve(
                  new NextResponse(rewritten, {
                    status: upstreamRes.statusCode || 200,
                    headers: {
                      "Content-Type": "application/vnd.apple.mpegurl",
                      "Access-Control-Allow-Origin": "*",
                      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                      "Cache-Control": "no-cache",
                    },
                  })
                );
              }

              return resolve(
                new NextResponse(body, {
                  status: upstreamRes.statusCode || 200,
                  headers: {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                  },
                })
              );
            });
          } else {
            // Binary segment (.ts, .mp4, key, etc.)
            const chunks: Buffer[] = [];
            upstreamRes.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            upstreamRes.on("end", () => {
              const buffer = Buffer.concat(chunks);
              const resHeaders: Record<string, string> = {
                "Content-Type": contentType || "video/mp2t",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Cache-Control": "public, max-age=86400",
              };

              if (upstreamRes.headers["content-range"]) {
                resHeaders["Content-Range"] =
                  upstreamRes.headers["content-range"] as string;
              }
              if (upstreamRes.headers["accept-ranges"]) {
                resHeaders["Accept-Ranges"] =
                  upstreamRes.headers["accept-ranges"] as string;
              }

              return resolve(
                new NextResponse(buffer, {
                  status: upstreamRes.statusCode || 200,
                  headers: resHeaders,
                })
              );
            });
          }
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve(new NextResponse("Upstream gateway timeout", { status: 504 }));
      });

      req.on("error", (err) => {
        resolve(new NextResponse(`Proxy error: ${err.message}`, { status: 502 }));
      });
    });
  } catch (error: any) {
    return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
  }
}

/**
 * Rewrites relative and absolute URLs inside an M3U8 playlist to route via this proxy
 */
function rewriteM3u8(m3u8Content: string, baseM3u8Url: string, referer: string): string {
  const lines = m3u8Content.split(/\r?\n/);
  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) return line;

    // Handle URI attributes in tags like #EXT-X-KEY:METHOD=...,URI="key.php"
    if (trimmed.startsWith("#") && trimmed.includes('URI="')) {
      return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
        const full = new URL(uri, baseM3u8Url).href;
        const proxied = `/api/proxy/hls?url=${encodeURIComponent(
          full
        )}&referer=${encodeURIComponent(referer)}`;
        return `URI="${proxied}"`;
      });
    }

    // Lines starting with # are metadata tags
    if (trimmed.startsWith("#")) {
      return line;
    }

    // Segment or sub-playlist URI line
    try {
      const fullUrl = new URL(trimmed, baseM3u8Url).href;
      return `/api/proxy/hls?url=${encodeURIComponent(
        fullUrl
      )}&referer=${encodeURIComponent(referer)}`;
    } catch {
      return line;
    }
  });

  return rewrittenLines.join("\n");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
