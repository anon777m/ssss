import { NextRequest, NextResponse } from "next/server";
import https from "https";
import http from "http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "video.m3u8";
    const type = searchParams.get("type") || "m3u8"; // 'm3u8' | 'file'

    if (!streamUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    if (type === "m3u8") {
      // Fetch the m3u8 and return as attachment
      const parsed = new URL(streamUrl);
      const client = parsed.protocol === "https:" ? https : http;

      return new Promise<NextResponse>((resolve) => {
        client.get(
          streamUrl,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Referer: parsed.origin + "/",
            },
          },
          (res) => {
            let data = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, "-");
              resolve(
                new NextResponse(data, {
                  status: 200,
                  headers: {
                    "Content-Disposition": `attachment; filename="${safeFilename}"`,
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                  },
                })
              );
            });
          }
        );
      });
    }

    // Default redirect to stream URL or proxy
    return NextResponse.redirect(streamUrl);
  } catch (error: any) {
    return new NextResponse(`Download error: ${error.message}`, {
      status: 500,
    });
  }
}
