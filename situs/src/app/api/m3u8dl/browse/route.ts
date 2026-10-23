import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDir = searchParams.get("dir") || process.env.HOME || "/home/dev";

    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ success: false, error: "Direktori tidak ditemukan" }, { status: 404 });
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      return NextResponse.json({ success: false, error: "Bukan sebuah direktori" }, { status: 400 });
    }

    const parentDir = path.dirname(targetDir);
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });

    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({
        name: e.name,
        path: path.join(targetDir, e.name),
      }))
      .slice(0, 100);

    return NextResponse.json({
      success: true,
      current: targetDir,
      parent: parentDir !== targetDir ? parentDir : null,
      folders,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
