import { NextRequest, NextResponse } from "next/server";
import { startM3u8dlDownload, getDefaultDownloadDirectories } from "@/lib/m3u8dlManager";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, quality, saveDir, customFilename, threads, referer } = body;

    if (!url || !title) {
      return NextResponse.json(
        { success: false, error: "URL dan Title video wajib diisi." },
        { status: 400 }
      );
    }

    const task = startM3u8dlDownload({
      url,
      title,
      quality,
      saveDir,
      customFilename,
      threads: threads ? parseInt(threads, 10) : 16,
      referer,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memulai download." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const defaultDirs = getDefaultDownloadDirectories();
  return NextResponse.json({
    success: true,
    defaultDirs,
  });
}
