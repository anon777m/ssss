import { NextRequest, NextResponse } from "next/server";
import { fetchVideoList } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const filter = searchParams.get("filter") || "latest";
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const category = searchParams.get("category") || searchParams.get("cat") || "";

    const data = await fetchVideoList({
      page,
      filter,
      search: search || undefined,
      category: category || undefined,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("API /api/videos error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch videos",
        items: [],
        page: 1,
        hasNextPage: false,
      },
      { status: 500 }
    );
  }
}
