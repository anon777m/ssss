import https from "https";
import http from "http";
import crypto from "crypto";

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  slug: string;
  thumbnail: string;
  duration: string;
  isHD: boolean;
  category?: string;
}

export interface StreamQuality {
  label: string;
  resolution?: string;
  bitrate?: number;
  url: string;
  proxyUrl: string;
  fileSize?: number;
}

export interface VideoDetail {
  id: string;
  title: string;
  slug: string;
  url: string;
  description: string;
  publishDate: string;
  duration: string;
  thumbnail: string;
  embedUrl: string;
  originalDownloadUrl?: string;
  categories: string[];
  tags: string[];
  streams: StreamQuality[];
  masterM3u8?: string;
  proxiedMasterM3u8?: string;
  relatedVideos: VideoItem[];
  playerProvider?: string;
}

export interface VideoListResult {
  items: VideoItem[];
  page: number;
  hasNextPage: boolean;
  totalPages?: number;
  filter: string;
  search?: string;
  category?: string;
  totalFound?: number;
}

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  Referer: "https://www.avtub.net/",
};

// In-Memory Fast Cache for Scraping (TTL 60 detik)
const memoryCache = new Map<string, { body: string; status: number; headers: http.IncomingHttpHeaders; exp: number }>();

/**
 * Fetch HTTP/HTTPS URL with auto redirects, custom headers and memory caching
 */
export async function curlUrl(
  url: string,
  headers: Record<string, string> = {},
  redirectCount = 0
): Promise<{ body: string; status: number; headers: http.IncomingHttpHeaders }> {
  if (redirectCount > 5) {
    throw new Error("Too many redirects");
  }

  // Check cache for GET requests
  const cacheKey = `${url}_${JSON.stringify(headers)}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() < cached.exp) {
    return { body: cached.body, status: cached.status, headers: cached.headers };
  }

  const mergedHeaders = { ...DEFAULT_HEADERS, ...headers };

  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;

      const req = client.get(
        url,
        {
          headers: mergedHeaders,
          timeout: 12000,
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            const nextUrl = new URL(res.headers.location, url).href;
            return curlUrl(nextUrl, headers, redirectCount + 1)
              .then(resolve)
              .catch(reject);
          }

          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            const result = {
              body: data,
              status: res.statusCode || 200,
              headers: res.headers,
            };
            if (result.status === 200) {
              // Simpan di cache 60 detik
              memoryCache.set(cacheKey, { ...result, exp: Date.now() + 60000 });
              if (memoryCache.size > 200) {
                const firstKey = memoryCache.keys().next().value;
                if (firstKey) memoryCache.delete(firstKey);
              }
            }
            resolve(result);
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Timeout requesting ${url}`));
      });

      req.on("error", (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Parse ISO 8601 duration (e.g. P0DT0H2M25S) or plain string to MM:SS or HH:MM:SS
 */
export function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "00:00";
  if (duration.includes(":")) return duration;

  const match = duration.match(/PT?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return duration;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Clean and unescape HTML text
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .trim();
}

/**
 * Standard Dean Edwards JS Packer unpacker
 */
export function unpackJsPacker(html: string): string | null {
  const match = html.match(
    /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)[\s\S]*?\.split\s*\(\s*['"]\|['"]\s*\)\s*\)\s*\)/
  );
  if (!match) return null;

  try {
    const raw = match[0];
    const openParen = raw.indexOf("(");
    const closeParen = raw.lastIndexOf(")");
    if (openParen === -1 || closeParen === -1) return null;
    const inner = raw.slice(openParen + 1, closeParen);

    const fn = new Function("return (" + inner + ")");
    return fn();
  } catch (err) {
    console.error("Packer unpack failed:", err);
    return null;
  }
}

/**
 * Base64URL helper
 */
function base64urlToBuffer(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64");
}

/**
 * Decrypt YStream / Byse AES-256-GCM payload
 */
export function decryptYStreamPlayback(playback: {
  algorithm?: string;
  iv: string;
  payload: string;
  key_parts?: string[];
  version?: string | number;
}): any {
  if (!playback || !playback.payload || !playback.iv) return null;

  const parts = playback.key_parts || [];
  const versionNum = parseInt(String(playback.version || "1").trim(), 10) || 1;

  // Key pair derivation: [n, 31 - n]
  const p1 = versionNum;
  const p2 = 31 - versionNum;

  const chosenParts: string[] = [];
  if (p1 >= 1 && p1 <= parts.length && parts[p1 - 1]) {
    chosenParts.push(parts[p1 - 1]);
  }
  if (p2 >= 1 && p2 <= parts.length && parts[p2 - 1]) {
    chosenParts.push(parts[p2 - 1]);
  }

  const finalParts = chosenParts.length === 2 ? chosenParts : parts;
  const keyBuf = Buffer.concat(finalParts.map(base64urlToBuffer));
  const iv = base64urlToBuffer(playback.iv);
  const cipherWithTag = base64urlToBuffer(playback.payload);

  if (cipherWithTag.length <= 16) return null;

  const ciphertext = cipherWithTag.subarray(0, cipherWithTag.length - 16);
  const tag = cipherWithTag.subarray(cipherWithTag.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuf, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Parse sub-playlists from master m3u8 content
 */
export async function parseMasterPlaylist(
  masterM3u8Url: string,
  referer: string
): Promise<StreamQuality[]> {
  const streams: StreamQuality[] = [];

  try {
    const res = await curlUrl(masterM3u8Url, {
      Referer: referer,
      Origin: new URL(referer).origin,
    });

    if (res.status === 200 && res.body.includes("#EXTM3U")) {
      const lines = res.body.split(/\r?\n/);
      let currentInfo: { resolution?: string; bandwidth?: number } | null =
        null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#EXT-X-STREAM-INF:")) {
          const resMatch = trimmed.match(/RESOLUTION=(\d+x\d+)/i);
          const bwMatch = trimmed.match(/BANDWIDTH=(\d+)/i);
          currentInfo = {
            resolution: resMatch ? resMatch[1] : undefined,
            bandwidth: bwMatch ? parseInt(bwMatch[1], 10) : undefined,
          };
        } else if (trimmed && !trimmed.startsWith("#") && currentInfo) {
          const fullStreamUrl = new URL(trimmed, masterM3u8Url).href;
          let label = "Auto";
          if (currentInfo.resolution) {
            const height = parseInt(
              currentInfo.resolution.split("x")[1] || "0",
              10
            );
            if (height >= 1000) label = "1080p FHD";
            else if (height >= 700) label = "720p HD";
            else if (height >= 450) label = "480p SD";
            else if (height > 0) label = `${height}p`;
          }

          streams.push({
            label,
            resolution: currentInfo.resolution,
            bitrate: currentInfo.bandwidth,
            url: fullStreamUrl,
            proxyUrl: `/api/proxy/hls?url=${encodeURIComponent(
              fullStreamUrl
            )}&referer=${encodeURIComponent(referer)}`,
          });
          currentInfo = null;
        }
      }
    }
  } catch (err) {
    console.error("Failed to parse sub-playlists of master m3u8:", err);
  }

  return streams;
}

/**
 * Resolve live streams and m3u8 sources from player embed
 */
export async function resolveStreams(embedUrl: string): Promise<{
  masterM3u8?: string;
  streams: StreamQuality[];
  provider: string;
}> {
  const result: {
    masterM3u8?: string;
    streams: StreamQuality[];
    provider: string;
  } = {
    streams: [],
    provider: "Unknown",
  };

  if (!embedUrl) return result;

  try {
    const embedLower = embedUrl.toLowerCase();

    // 1. YSTREAM / BYSE
    if (embedLower.includes("ystream.id") || embedLower.includes("/e/")) {
      result.provider = "YStream (Byse)";
      const codeMatch = embedUrl.match(/\/e\/([a-zA-Z0-9_-]+)/);
      if (codeMatch) {
        const code = codeMatch[1];
        const apiUrl = `https://ystream.id/api/videos/${code}/`;
        const apiRes = await curlUrl(apiUrl, {
          Referer: embedUrl,
          Origin: "https://ystream.id",
        });

        if (apiRes.status === 200) {
          const videoData = JSON.parse(apiRes.body);
          if (videoData.playback) {
            const decrypted = decryptYStreamPlayback(videoData.playback);
            if (decrypted && decrypted.sources && decrypted.sources.length > 0) {
              const mainSource = decrypted.sources[0];
              result.masterM3u8 = mainSource.url;

              // Parse sub playlists from this master stream
              const parsedStreams = await parseMasterPlaylist(
                mainSource.url,
                "https://ystream.id/"
              );

              if (parsedStreams.length > 0) {
                result.streams = parsedStreams;
              } else {
                result.streams.push({
                  label: mainSource.label || "1080p FHD",
                  resolution: mainSource.height
                    ? `${mainSource.height}p`
                    : "1080p",
                  bitrate: mainSource.bitrate_kbps
                    ? mainSource.bitrate_kbps * 1000
                    : undefined,
                  fileSize: mainSource.size_bytes,
                  url: mainSource.url,
                  proxyUrl: `/api/proxy/hls?url=${encodeURIComponent(
                    mainSource.url
                  )}&referer=${encodeURIComponent("https://ystream.id/")}`,
                });
              }
              return result;
            }
          }
        }
      }
    }

    // 2. VSTREAM / MORENCIUS / VIDHIDE / JWPLAYER EMBEDS
    result.provider = "VidHide / VStream";
    const embedRes = await curlUrl(embedUrl, {
      Referer: "https://www.avtub.net/",
    });

    if (embedRes.status === 200) {
      const unpacked = unpackJsPacker(embedRes.body);
      const textToScan = unpacked || embedRes.body;

      // Check var links or var q
      const linkObjMatch = textToScan.match(
        /var\s+(?:links|q)\s*=\s*({[\s\S]*?});/
      );
      let foundM3u8: string | null = null;

      if (linkObjMatch) {
        try {
          // parse keys
          const jsonLike = linkObjMatch[1];
          const hls2 = jsonLike.match(/"hls2"\s*:\s*"([^"]+)"/);
          const hls3 = jsonLike.match(/"hls3"\s*:\s*"([^"]+)"/);
          const hls4 = jsonLike.match(/"hls4"\s*:\s*"([^"]+)"/);

          if (hls2 && hls2[1].includes(".m3u8")) foundM3u8 = hls2[1];
          else if (hls4 && hls4[1].includes(".m3u8")) foundM3u8 = hls4[1];
          else if (hls3 && hls3[1].includes(".m3u8")) foundM3u8 = hls3[1];
        } catch {
          // ignore
        }
      }

      if (!foundM3u8) {
        const m3u8Match = textToScan.match(
          /https?:\/\/[^\s"'\\]+?\.m3u8[^\s"'\\]*/
        );
        if (m3u8Match) {
          foundM3u8 = m3u8Match[0];
        }
      }

      if (foundM3u8) {
        result.masterM3u8 = foundM3u8;
        const embedOrigin = new URL(embedUrl).origin + "/";

        const parsedStreams = await parseMasterPlaylist(
          foundM3u8,
          embedOrigin
        );

        if (parsedStreams.length > 0) {
          result.streams = parsedStreams;
        } else {
          result.streams.push({
            label: "HD Quality",
            url: foundM3u8,
            proxyUrl: `/api/proxy/hls?url=${encodeURIComponent(
              foundM3u8
            )}&referer=${encodeURIComponent(embedOrigin)}`,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error in resolveStreams:", err);
  }

  return result;
}

/**
 * Parse a list of <article> elements from avtub HTML into VideoItem[]
 */
export function parseArticleElements(html: string): VideoItem[] {
  const items: VideoItem[] = [];
  const articleRegex =
    /<article[^>]+class="[^"]*thumb-block[^"]*post-(\d+)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;

  let match: RegExpExecArray | null;
  const seenIds = new Set<string>();

  while ((match = articleRegex.exec(html)) !== null) {
    const postId = match[1];
    if (seenIds.has(postId)) continue;
    seenIds.add(postId);

    const content = match[2];

    // Link and title
    const linkMatch = content.match(/<a[^>]+href="([^"]+)"[^>]*title="([^"]*)"/i) ||
      content.match(/<a[^>]+href="([^"]+)"/i);
    const url = linkMatch ? linkMatch[1] : `https://www.avtub.net/${postId}/`;

    // Title from <span> or title attribute
    let title = "";
    const spanTitle = content.match(/<header class="entry-header"[^>]*>\s*<span>([\s\S]*?)<\/span>/i);
    if (spanTitle) {
      title = decodeHtmlEntities(spanTitle[1].trim());
    } else if (linkMatch && linkMatch[2]) {
      title = decodeHtmlEntities(linkMatch[2].trim());
    } else {
      const altMatch = content.match(/alt="([^"]*)"/i);
      title = altMatch ? decodeHtmlEntities(altMatch[1].trim()) : `Video #${postId}`;
    }

    // Thumbnail
    let thumbnail = "";
    const dataThumb = content.match(/data-main-thumb="([^"]+)"/i);
    const srcThumb = content.match(/<img[^>]+src="([^"]+)"/i);
    if (dataThumb && dataThumb[1]) {
      thumbnail = dataThumb[1];
    } else if (srcThumb && srcThumb[1]) {
      thumbnail = srcThumb[1];
    }

    // Duration
    const durMatch = content.match(/<span class="duration"[^>]*>[\s\S]*?([0-9:]+)<\/span>/i);
    const duration = durMatch ? durMatch[1].trim() : "00:00";

    // HD badge
    const isHD = content.includes('class="hd-video"');

    // Extract slug
    let slug = "";
    try {
      const parsedUrl = new URL(url);
      slug = parsedUrl.pathname.replace(/^\/|\/$/g, "");
    } catch {
      slug = postId;
    }

    items.push({
      id: postId,
      title,
      url,
      slug,
      thumbnail,
      duration,
      isHD,
    });
  }

  return items;
}

/**
 * Fetch video list from avtub.net with pagination, search, category, or filter
 */
export async function fetchVideoList(options: {
  page?: number;
  filter?: "latest" | "popular" | "most-viewed" | string;
  search?: string;
  category?: string;
}): Promise<VideoListResult> {
  const page = Math.max(1, options.page || 1);
  const filter = options.filter || "latest";
  const search = (options.search || "").trim();
  const category = (options.category || "").trim();

  let targetUrl = "https://www.avtub.net/";

  if (search) {
    if (page === 1) {
      targetUrl = `https://www.avtub.net/?s=${encodeURIComponent(search)}`;
    } else {
      targetUrl = `https://www.avtub.net/page/${page}/?s=${encodeURIComponent(search)}`;
    }
  } else if (category) {
    const cleanCat = category.replace(/^category\//, "").replace(/\/$/, "");
    if (page === 1) {
      targetUrl = `https://www.avtub.net/category/${cleanCat}/`;
    } else {
      targetUrl = `https://www.avtub.net/category/${cleanCat}/page/${page}/`;
    }
  } else if (filter && filter !== "home") {
    if (page === 1) {
      targetUrl = `https://www.avtub.net/?filter=${filter}`;
    } else {
      targetUrl = `https://www.avtub.net/page/${page}/?filter=${filter}`;
    }
  } else {
    if (page > 1) {
      targetUrl = `https://www.avtub.net/page/${page}/`;
    }
  }

  const res = await curlUrl(targetUrl);
  if (res.status !== 200) {
    throw new Error(`AVTub request failed with status ${res.status} for ${targetUrl}`);
  }

  const items = parseArticleElements(res.body);

  // Determine pagination
  const hasNextPage =
    res.body.includes(`page/${page + 1}/`) ||
    res.body.includes(`class="inactive">${page + 1}</a>`) ||
    items.length >= 20;

  let totalPages: number | undefined = undefined;
  const pageMatches = Array.from(res.body.matchAll(/page\/(\d+)\//g)).map((m) =>
    parseInt(m[1], 10)
  );
  if (pageMatches.length > 0) {
    totalPages = Math.max(...pageMatches, page);
  }

  return {
    items,
    page,
    hasNextPage,
    totalPages,
    filter,
    search: search || undefined,
    category: category || undefined,
    totalFound: items.length,
  };
}

/**
 * Fetch full video detail, metadata, and live decrypted stream sources
 */
export async function fetchVideoDetail(urlOrSlug: string): Promise<VideoDetail> {
  let targetUrl = urlOrSlug.trim();
  if (!targetUrl.startsWith("http")) {
    const cleanSlug = targetUrl.replace(/^\/|\/$/g, "");
    targetUrl = `https://www.avtub.net/${cleanSlug}/`;
  }

  const res = await curlUrl(targetUrl);
  if (res.status !== 200) {
    throw new Error(`Failed to fetch video page (${res.status}) for ${targetUrl}`);
  }

  const html = res.body;

  // Title
  let title = "";
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const metaNameMatch = html.match(/<meta itemprop="name" content="([^"]*)"/i);
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]*)"/i);
  if (h1Match) {
    title = decodeHtmlEntities(h1Match[1].trim());
  } else if (metaNameMatch) {
    title = decodeHtmlEntities(metaNameMatch[1].trim());
  } else if (ogTitleMatch) {
    title = decodeHtmlEntities(ogTitleMatch[1].trim());
  }

  // ID
  let id = "";
  const postIdMatch = html.match(/<article id="post-(\d+)"/i) || targetUrl.match(/avtub\.net\/(\d+)/);
  if (postIdMatch) {
    id = postIdMatch[1];
  } else {
    id = String(Date.now());
  }

  // Description
  let description = "";
  const descBlockMatch = html.match(/<div class="video-description">([\s\S]*?)<\/div>\s*<\/div>/i);
  const metaDescMatch = html.match(/<meta itemprop="description" content="([^"]*)"/i) ||
    html.match(/<meta name="description" content="([^"]*)"/i);
  if (descBlockMatch) {
    description = decodeHtmlEntities(
      descBlockMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
  } else if (metaDescMatch) {
    description = decodeHtmlEntities(metaDescMatch[1].trim());
  }

  // Publish date
  let publishDate = "";
  const uploadDateMatch = html.match(/<meta itemprop="uploadDate" content="([^"]*)"/i);
  if (uploadDateMatch) {
    publishDate = uploadDateMatch[1];
  }

  // Duration
  let duration = "";
  const metaDurMatch = html.match(/<meta itemprop="duration" content="([^"]*)"/i);
  if (metaDurMatch) {
    duration = formatDuration(metaDurMatch[1]);
  }

  // Thumbnail
  let thumbnail = "";
  const thumbMetaMatch = html.match(/<meta itemprop="thumbnailUrl" content="([^"]*)"/i) ||
    html.match(/<meta property="og:image" content="([^"]*)"/i);
  if (thumbMetaMatch) {
    thumbnail = thumbMetaMatch[1];
  }

  // Embed player iframe
  let embedUrl = "";
  const iframeMatch = html.match(/<IFRAME[^>]+SRC="([^"]+)"/i) ||
    html.match(/<iframe[^>]+src="([^"]+)"/i);
  if (iframeMatch) {
    embedUrl = iframeMatch[1];
  }

  // Original Download URL button
  let originalDownloadUrl: string | undefined = undefined;
  const dlMatch = html.match(/id="tracking-url"[^>]+href="([^"]+)"/i) ||
    html.match(/<a[^>]+class="button"[^>]+href="([^"]+)"[^>]*>[\s\S]*?Download/i);
  if (dlMatch) {
    originalDownloadUrl = dlMatch[1];
  }

  // Categories & Tags
  const categories: string[] = [];
  const catMatches = Array.from(html.matchAll(/\/category\/([a-zA-Z0-9_-]+)/g));
  for (const m of catMatches) {
    const formatted = m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!categories.includes(formatted)) {
      categories.push(formatted);
    }
  }

  const tags: string[] = [];
  const tagMatches = Array.from(html.matchAll(/\/tag\/([a-zA-Z0-9_-]+)/g));
  for (const m of tagMatches) {
    const formatted = m[1].replace(/-/g, " ");
    if (!tags.includes(formatted)) {
      tags.push(formatted);
    }
  }

  // Related videos
  const relatedVideos: VideoItem[] = [];
  const relatedSectionMatch = html.match(/<div class="under-video-block[^"]*">([\s\S]*?)(?:<footer|<\/main)/i);
  if (relatedSectionMatch) {
    relatedVideos.push(...parseArticleElements(relatedSectionMatch[1]));
  }

  // Live Stream Decryption & Resolution
  const streamResult = await resolveStreams(embedUrl);

  const streams = streamResult.streams;
  let masterM3u8 = streamResult.masterM3u8;
  let proxiedMasterM3u8: string | undefined = undefined;

  if (masterM3u8) {
    const origin = embedUrl ? new URL(embedUrl).origin : "https://vstream.id";
    proxiedMasterM3u8 = `/api/proxy/hls?url=${encodeURIComponent(
      masterM3u8
    )}&referer=${encodeURIComponent(origin)}`;
  }

  // Derive clean slug
  let slug = "";
  try {
    slug = new URL(targetUrl).pathname.replace(/^\/|\/$/g, "");
  } catch {
    slug = id;
  }

  return {
    id,
    title: title || `Video #${id}`,
    slug,
    url: targetUrl,
    description,
    publishDate,
    duration,
    thumbnail,
    embedUrl,
    originalDownloadUrl,
    categories,
    tags,
    streams,
    masterM3u8,
    proxiedMasterM3u8,
    relatedVideos,
    playerProvider: streamResult.provider,
  };
}
