import { NextRequest, NextResponse } from "next/server";
import { fetchVideoDetail } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    const target = url || slug || id;
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Missing 'url', 'slug', or 'id' parameter" },
        { status: 400 }
      );
    }

    const video = await fetchVideoDetail(target);

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error: any) {
    console.error("API /api/video/detail error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch video details",
      },
      { status: 500 }
    );
  }
}
